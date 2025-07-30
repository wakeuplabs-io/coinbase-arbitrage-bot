import { Address } from "viem";
import { SwapProvider } from "../interfaces/swapProvider";


export class MockUniswapProvider implements SwapProvider {
    estimatePrice(amountIn: bigint, tokenIn: string, tokenOut: string): Promise<bigint | undefined> {
        // Simulate a random price estimation between 1.01 and 1.05 times the input amount
        const randomFactor = 1.01 + Math.random() * 0.04;
        const estimatedPrice = BigInt(Math.round(Number(amountIn) * randomFactor));
        return Promise.resolve(estimatedPrice);
    }
    executeSwap(amountIn: bigint, tokenIn: Address, tokenInSymbol: string, tokenOut: Address): Promise<bigint | undefined> {
        return Promise.resolve(0n);
    }
    estimateGasFee(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
        return Promise.resolve(0n);
    }
    readonly name = 'MockCDP';
}