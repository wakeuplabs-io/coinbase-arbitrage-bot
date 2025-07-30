import { config } from '../config';
import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, erc20Abi, encodeFunctionData, type Address } from "viem";
import { base, mainnet } from "viem/chains";

// Create a shared viem public client for transaction monitoring
export const publicClient = createPublicClient({
  chain: config.network.name === "base" ? base : mainnet,
  transport: http(),
});

/**
 * Waits for the transaction receipt of a given transaction hash.
 *
 * @param transactionHash - The hash of the transaction to wait for.
 * @returns A promise that resolves to the transaction receipt once it is available.
 */
export async function waitForReceipt(transactionHash: string) {
    return await publicClient.waitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });
}

/**
 * Check token allowance for the Permit2 contract
 * @param owner - The token owner's address
 * @param token - The token contract address
 * @param symbol - The token symbol for logging
 * @returns The current allowance
 */
export async function getAllowance(
  owner: Address, 
  token: Address,
  symbol: string
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, config.contracts.permit2 as Address],
    });
    
    return allowance;
  } catch (error) {
    console.error("Error checking allowance:", error);
    return BigInt(0);
  }
}

/**
 * Handle approval for token allowance if needed
 * This is necessary when swapping ERC20 tokens (not native ETH)
 * The Permit2 contract needs approval to move tokens on your behalf
 * @param ownerAddress - The token owner's address
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The address allowed to spend the tokens
 * @param amount - The amount to approve
 * @param cdpClient - The CDP client instance
 * @returns The transaction receipt
 */
export async function approveTokenAllowance(
  ownerAddress: Address, 
  tokenAddress: Address, 
  spenderAddress: Address, 
  amount: bigint,
  cdpClient: CdpClient
) {
  // Encode the approve function call
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress, amount]
  });
  
  // Send the approve transaction
  const txResult = await cdpClient.evm.sendTransaction({
    address: ownerAddress,
    network: "base",
    transaction: {
      to: tokenAddress,
      data,
      value: BigInt(0),
    },
  });
  
  // Wait for approval transaction to be confirmed
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txResult.transactionHash,
  });
  
  return receipt;
}

/**
 * Handles token allowance check and approval if needed
 * @param ownerAddress - The address of the token owner
 * @param tokenAddress - The address of the token to be sent
 * @param tokenSymbol - The symbol of the token (e.g., WETH, USDC)
 * @param fromAmount - The amount to be sent
 * @param cdpClient - The CDP client instance
 * @returns A promise that resolves when allowance is sufficient
 */
export async function handleTokenAllowance(
  ownerAddress: Address, 
  tokenAddress: Address,
  tokenSymbol: string,
  fromAmount: bigint
): Promise<void> {

  const cdp = new CdpClient();

  // Check allowance before attempting the swap
  const currentAllowance = await getAllowance(
    ownerAddress, 
    tokenAddress,
    tokenSymbol
  );

  // If allowance is insufficient, approve tokens
  if (currentAllowance < fromAmount) {
    // Set the allowance to the required amount
    await approveTokenAllowance(
      ownerAddress,
      tokenAddress,
      config.contracts.permit2 as Address,
      fromAmount,
      cdp
    );
  }
}
