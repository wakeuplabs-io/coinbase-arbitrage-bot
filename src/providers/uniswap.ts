import { config } from '../config';
import { mainnet } from 'viem/chains';
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
    const client = createPublicClient({
      chain: mainnet,
      transport: http(config.public_node),
    });

    const quotedAmountOut = await client.readContract({
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
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);

    const client = createWalletClient({
      account,
      chain: mainnet,
      transport: http(config.public_node),
    });

    await client.writeContract({
      abi: erc20Abi,
      address: tokenIn,
      functionName: 'approve',
      args: [config.contracts.uniswapRouter as `0x${string}`, amountIn],
    });

    await client.writeContract({
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

    return 0n;
  }
}
