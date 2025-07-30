import { config } from '../config';
import { mainnet } from 'viem/chains';
import { createWalletClient, createPublicClient,http, type Address } from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { abi as quoterAbi } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import { SwapProvider } from '../interfaces/swapProvider';
import { abi as swapRouterAbi } from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import { abi as erc20Abi } from '@uniswap/v2-core/build/ERC20.json';

// Data (Mainnet)
const SWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const FEE = 3000;
const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
const amountOutMin = 0n;

export class UniswapProvider implements SwapProvider {
  readonly name = 'Uniswap v3';

  async estimateGasFee(
    amountIn: bigint,
    tokenIn: Address,
    tokenOut: Address
  ): Promise<bigint | undefined> {
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(config.public_node),
    });

    const gasPrice = await publicClient.getGasPrice();
    const gasEstimate = 180_000n;
    const estimatedFee = gasPrice * gasEstimate;

    return BigInt(estimatedFee);
  }

  async estimatePrice(amountIn: bigint, tokenIn: Address, tokenOut: Address): Promise<bigint | undefined> {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(config.public_node),
    });
    
    const quotedAmountOut = await client.readContract({
      abi: quoterAbi,
      address: QUOTER_ADDRESS,
      functionName: 'quoteExactInputSingle',
      args: [tokenIn, tokenOut, config.trading.swapFee, amountIn, 0n],
    });

    return BigInt(quotedAmountOut as string);
  }

  async executeSwap(
    amountIn: bigint,
    tokenIn: Address,
    tokenInSymbol: string, 
    tokenOut: Address
  ): Promise<bigint | undefined> {
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);

    const client = createWalletClient({
      account,
      chain: mainnet,
      transport: http(config.public_node),
    });

    // Step 1: Approve WETH to the router
    await client.writeContract({
      abi: erc20Abi,
      address: tokenIn,
      functionName: 'approve',
      args: [SWAP_ROUTER, amountIn],
    });

    // Step 2: Execute the swap
    await client.writeContract({
      abi: swapRouterAbi,
      address: SWAP_ROUTER,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: FEE,
        recipient: account.address,
        deadline,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0n
      }],
    });

    return;
  }
}