/**
 * Mock Wallet Implementation
 * 
 * A mock wallet implementation for testing that maintains an in-memory
 * record of token balances without interacting with any blockchain.
 * 
 * @class MockWallet
 * @implements {Wallet}
 */

import { Wallet } from "../interfaces/wallet";

/**
 * Mock wallet implementation for testing and development.
 * Maintains token balances in memory without blockchain interaction.
 */
export class MockWallet implements Wallet {
    /** In-memory storage for token balances */
    private balances: Record<string, number> = {};

    /**
     * Get the current balance of a token.
     * 
     * @param token - Token symbol or identifier
     * @returns Current balance, or 0 if token not found
     */
    async getBalance(token: string): Promise<number> {
        return this.balances[token] || 0;
    }

    /**
     * Add amount to the balance of a specific token.
     * 
     * @param token - Token symbol or identifier
     * @param amount - Amount to add to the balance
     */
    async addToBalance(token: string, amount: number) {
        this.balances[token] = await this.getBalance(token) + amount;
    }
}   




