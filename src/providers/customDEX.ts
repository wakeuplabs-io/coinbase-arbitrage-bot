import { SwapProvider } from '../interfaces/swapProvider';
import { type Address } from "viem";
import { CDPProvider } from './cdp';

const PRICE_MARKUP_MULTIPLIER = 1.1;

export class CustomDEXProvider implements SwapProvider {

      private cdpProvider = new CDPProvider();
   
      async estimatePrice(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
        
        const estimation = await this.cdpProvider.estimatePrice(amountIn, tokenIn, tokenOut);

        // Drop coin with 30% chance for price opportunity
        if (estimation === undefined) {
          return undefined;
        }
        if (Math.random() < 0.30) {
          return BigInt(Math.floor(Number(estimation) * PRICE_MARKUP_MULTIPLIER));
        }
    
        return estimation; 
      }
    
      async executeSwap(amountIn: bigint, tokenIn: Address, tokenInSymbol: string, tokenOut: Address): Promise<bigint | undefined> {
        const incrementedAmountIn = BigInt(Math.ceil(Number(amountIn) * PRICE_MARKUP_MULTIPLIER));
        return this.cdpProvider.executeSwap(incrementedAmountIn, tokenIn, tokenInSymbol, tokenOut);
      }
    
    readonly name = 'Custom DEX';
}