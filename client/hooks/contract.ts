"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CC6GC6F2AFC6PDO37PYRDP2KL6AH3RQE7VO4RPGDNVW3LNGTIG7ZLDRX";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 *
 * @param method   - The contract method name to invoke
 * @param params   - Array of xdr.ScVal parameters for the method
 * @param caller   - The public key (G...) of the calling account
 * @param sign     - If true, signs via Freighter and submits. If false, only simulates.
 * @returns        The result of the simulation or submission
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    // Read-only call — just return the simulation result
    return simulated;
  }

  // Prepare the transaction with the simulation result
  const prepared = rpc.assembleTransaction(tx, simulated).build();

  // Sign with Freighter
  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  // Poll for confirmation
  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey(); // Use a random keypair for read-only
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValU64(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// Escrow Contract — Contract Methods
// ============================================================

/**
 * Create a new escrow.
 * Calls: create_escrow(client: Address, freelancer: Address, description: String, amount: i128) -> u64
 */
export async function createEscrow(
  caller: string,
  freelancer: string,
  description: string,
  amount: bigint
) {
  return callContract(
    "create_escrow",
    [
      toScValAddress(caller),
      toScValAddress(freelancer),
      toScValString(description),
      toScValI128(amount),
    ],
    caller,
    true
  );
}

/**
 * Accept an escrow (freelancer only).
 * Calls: accept_escrow(caller: Address, escrow_id: u64)
 */
export async function acceptEscrow(caller: string, escrowId: number) {
  return callContract(
    "accept_escrow",
    [toScValAddress(caller), toScValU64(escrowId)],
    caller,
    true
  );
}

/**
 * Submit work (freelancer only).
 * Calls: submit_work(caller: Address, escrow_id: u64)
 */
export async function submitWork(caller: string, escrowId: number) {
  return callContract(
    "submit_work",
    [toScValAddress(caller), toScValU64(escrowId)],
    caller,
    true
  );
}

/**
 * Approve work (client only).
 * Calls: approve_work(caller: Address, escrow_id: u64)
 */
export async function approveWork(caller: string, escrowId: number) {
  return callContract(
    "approve_work",
    [toScValAddress(caller), toScValU64(escrowId)],
    caller,
    true
  );
}

/**
 * Cancel escrow (client only, when Created).
 * Calls: cancel_escrow(caller: Address, escrow_id: u64)
 */
export async function cancelEscrow(caller: string, escrowId: number) {
  return callContract(
    "cancel_escrow",
    [toScValAddress(caller), toScValU64(escrowId)],
    caller,
    true
  );
}

/**
 * Raise a dispute (client or freelancer).
 * Calls: raise_dispute(caller: Address, escrow_id: u64)
 */
export async function raiseDispute(caller: string, escrowId: number) {
  return callContract(
    "raise_dispute",
    [toScValAddress(caller), toScValU64(escrowId)],
    caller,
    true
  );
}

/**
 * Resolve a dispute (client only).
 * Calls: resolve_dispute(caller: Address, escrow_id: u64, client_share: u32)
 */
export async function resolveDispute(
  caller: string,
  escrowId: number,
  clientShare: number
) {
  return callContract(
    "resolve_dispute",
    [
      toScValAddress(caller),
      toScValU64(escrowId),
      toScValU32(clientShare),
    ],
    caller,
    true
  );
}

/**
 * Get a single escrow (read-only).
 * Calls: get_escrow(escrow_id: u64) -> Escrow
 */
export async function getEscrow(escrowId: number, caller?: string) {
  return readContract("get_escrow", [toScValU64(escrowId)], caller);
}

/**
 * Get all escrows (read-only).
 * Calls: get_escrows() -> Vec<Escrow>
 */
export async function getEscrows(caller?: string) {
  return readContract("get_escrows", [], caller);
}

export { nativeToScVal, scValToNative, Address, xdr };
