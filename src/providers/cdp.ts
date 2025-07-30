import { config } from '../config';
import { CdpClient } from "@coinbase/cdp-sdk";
import { type Address } from "viem";
import { SwapProvider } from '../interfaces/swapProvider';
import { handleTokenAllowance, waitForReceipt } from '../utils/tokenUtils';
import { validateSwapQuote } from '../utils/swapUtils';

export class CDPProvider implements SwapProvider {
  readonly name = 'CDP';

  // Create a CDP client
  cdp = new CdpClient();

  async estimatePrice(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
    const swapPrice = await this.cdp.evm.getSwapPrice({
      network: config.network.name == "base" ? "base" : "ethereum",
      fromAmount: amountIn, 
      fromToken: tokenIn,
      toToken: tokenOut,
      taker: config.address as Address,
    });

    // Check for liquidity
    if (!swapPrice.liquidityAvailable) {
      console.error("Insufficient liquidity available for this swap.");
      return;
    }

    return swapPrice.toAmount; 
  }

  async executeSwap(amountIn: bigint, tokenIn: Address, tokenInSymbol: string, tokenOut: Address): Promise<bigint | undefined> {
    // Get or create an account to use for the swap
    const ownerAccount = await this.cdp.evm.getOrCreateAccount({ name: config.account_name });

    // Handle token allowance check and approval when sending non-native assets
    await handleTokenAllowance(
        ownerAccount.address as Address, 
        tokenIn,
        tokenInSymbol,
        amountIn
    );

    // STEP 1: Create the swap quote
    const swapQuote = await ownerAccount.quoteSwap({
      network: config.network.name == "base" ? "base" : "ethereum",
      fromToken: tokenIn,
      fromAmount: amountIn,
      toToken: tokenOut,
      slippageBps: config.trading.slippageBps,
    });

    // Check if liquidity is available
    if (!swapQuote.liquidityAvailable) {
      console.log("\n❌ Swap failed: Insufficient liquidity for this swap pair or amount.");
      console.log("Try reducing the swap amount or using a different token pair.");
      return;
    }

    // Validate the swap for any issues
    if (!validateSwapQuote(swapQuote)) {
      console.log("\n❌ Swap validation failed. Aborting execution.");
      return;
    }

    // Option A: Execute using account.swap() with the pre-created quote (RECOMMENDED)
    const result = await ownerAccount.swap({
      swapQuote: swapQuote,
    });

    // Wait for transaction confirmation
    await waitForReceipt(result.transactionHash);

    return swapQuote.toAmount;
  }
}
