import { config } from '../config';
import { CdpClient } from "@coinbase/cdp-sdk";
import { type Address } from "viem";
import { SwapProvider } from '../interfaces/swapProvider';
import { handleTokenAllowance, waitForReceipt } from '../utils/tokenUtils';
import { validateSwapQuote } from '../utils/swapUtils';

export class CDPProvider implements SwapProvider {
  readonly name = 'CDP';

  cdp = new CdpClient();

  async estimatePrice(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
    const swapPrice = await this.cdp.evm.getSwapPrice({
      network: config.network.name == "base" ? "base" : "ethereum",
      fromAmount: amountIn, 
      fromToken: tokenIn,
      toToken: tokenOut,
      taker: config.address as Address,
    });

    if (!swapPrice.liquidityAvailable) {
      console.error("Insufficient liquidity available for this swap.");
      return;
    }

    return swapPrice.toAmount; 
  }

  async executeSwap(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
    const ownerAccount = await this.cdp.evm.getOrCreateAccount({ name: config.account_name });

    await handleTokenAllowance(
        ownerAccount.address as Address, 
        tokenIn,
        amountIn
    );

    const swapQuote = await ownerAccount.quoteSwap({
      network: config.network.name == "base" ? "base" : "ethereum",
      fromToken: tokenIn,
      fromAmount: amountIn,
      toToken: tokenOut,
      slippageBps: config.trading.slippageBps,
    });

    if (!swapQuote.liquidityAvailable) {
      console.log("\n❌ Swap failed: Insufficient liquidity for this swap pair or amount.");
      console.log("Try reducing the swap amount or using a different token pair.");
      return;
    }

    if (!validateSwapQuote(swapQuote)) {
      console.log("\n❌ Swap validation failed. Aborting execution.");
      return;
    }

    const result = await ownerAccount.swap({
      swapQuote: swapQuote,
    });

    await waitForReceipt(result.transactionHash);

    return swapQuote.toAmount;
  }
}
