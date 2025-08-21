import { config, chain, publicClient, account, walletClient } from '../config';
import { type Address } from 'viem';
import { abi as quoterAbi } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import { SwapProvider } from '../interfaces/swapProvider';
import { abi as swapRouterAbi } from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import { abi as erc20Abi } from '@uniswap/v2-core/build/ERC20.json';
import {
  UNISWAP_V3_DEFAULT_FEE,
  UNISWAP_V3_MIN_AMOUNT_OUT,
  UNISWAP_V3_SQRT_PRICE_LIMIT,
  getUniswapDeadline,
} from '../constants/uniswap';

export class UniswapProvider implements SwapProvider {
  readonly name = 'Uniswap v3';

  async estimatePrice(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address,
  ): Promise<bigint | undefined> {
    const quotedAmountOut = await publicClient.readContract({
      abi: quoterAbi,
      address: config.contracts.uniswapQuoter as `0x${string}`,
      functionName: 'quoteExactInputSingle',
      args: [tokenIn, tokenOut, config.trading.swapFee, amountIn, 0n],
    });

    return BigInt(quotedAmountOut as string);
  }

  async executeSwap(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address,
  ): Promise<bigint | undefined> {
    // Get balance of output token before swap
    const balanceBefore = (await publicClient.readContract({
      abi: erc20Abi,
      address: tokenOut,
      functionName: 'balanceOf',
      args: [account.address],
    })) as bigint;

    // Approve the router to spend input tokens
    await walletClient.writeContract({
      abi: erc20Abi,
      address: tokenIn,
      functionName: 'approve',
      args: [config.contracts.uniswapRouter as `0x${string}`, amountIn],
    });

    // Execute the swap
    const swapHash = await walletClient.writeContract({
      abi: swapRouterAbi,
      address: config.contracts.uniswapRouter as `0x${string}`,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: UNISWAP_V3_DEFAULT_FEE,
          recipient: account.address,
          deadline: getUniswapDeadline(),
          amountIn,
          amountOutMinimum: UNISWAP_V3_MIN_AMOUNT_OUT,
          sqrtPriceLimitX96: UNISWAP_V3_SQRT_PRICE_LIMIT,
        },
      ],
    });

    // Wait for transaction to be mined
    await publicClient.waitForTransactionReceipt({
      hash: swapHash,
      confirmations: 1,
    });

    // Get balance of output token after swap. Ideally we get this from swap events, this is a simplification that works for now.
    const balanceAfter = (await publicClient.readContract({
      abi: erc20Abi,
      address: tokenOut,
      functionName: 'balanceOf',
      args: [account.address],
    })) as bigint;

    // Return the amount received
    const amountOut = balanceAfter - balanceBefore;
    return amountOut > 0n ? amountOut : undefined;
  }
}
