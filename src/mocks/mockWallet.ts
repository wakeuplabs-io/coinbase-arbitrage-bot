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
import { config } from "../config";
import { parseUnits, formatUnits } from "viem";

/**
 * Mock wallet implementation for testing and development.
 * Maintains token balances in memory without blockchain interaction.
 */
export class MockWallet implements Wallet {
    /** In-memory storage for token balances */
    private balances: Record<string, number> = {};

    constructor() {
        this.initializeBalances();
    }

    /**
     * Initialize wallet with default balances for testing
     */
    private initializeBalances(): void {
        // Initialize with sufficient USDC balance for trading
        const initialAmount = parseUnits(config.trading.amountIn.toString(), 6);
        const initialAmountFormatted = Number(formatUnits(initialAmount, 6));
        
        this.balances[config.tokens.MAIN_TOKEN_ADDRESS] = initialAmountFormatted * 10; // 10x the trading amount
        this.balances[config.tokens.SECONDARY_TOKEN_ADDRESS] = 0; // Start with no WETH
    }

    /**
     * Get the current balance of a token.
     * 
     * @param token - Token address
     * @returns Current balance, or 0 if token not found
     */
    async getBalance(token: string): Promise<number> {
        return this.balances[token] || 0;
    }

}   




