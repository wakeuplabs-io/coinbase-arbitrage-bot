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
   * @param token - The token symbol or identifier
   * @returns The current balance as a number
   */
  getBalance(token: Address): Promise<number>;
  
  /**
   * Add to the balance of a specific token (optional for production wallets).
   * This method is primarily used in mock implementations for testing.
   * 
   * @param token - The token symbol or identifier
   * @param amount - The amount to add to the balance
   */
  addToBalance?(token: Address, amount: number): void;
}