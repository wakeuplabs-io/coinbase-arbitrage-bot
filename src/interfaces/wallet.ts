import { Address } from "viem";
/**
 * Wallet Interface
 * 
 * Defines the contract for wallet implementations that can manage
 * token balances and interact with blockchain networks.
 * 
 * @interface Wallet
 */

/**
 * Interface for wallet implementations supporting token balance management.
 */
export interface Wallet {
  /**
   * Get the current balance of a specific token.
   * 
   * @param token - The token address
   * @returns The current balance as a number
   */
  getBalance(token: Address): Promise<number>;
}