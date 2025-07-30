import { Address, createPublicClient, http } from "viem";
import { Wallet } from "../interfaces/wallet";
import { abi as erc20Abi } from '@uniswap/v2-core/build/ERC20.json';
import { base, mainnet } from 'viem/chains';
import { config } from '../config';

export class Web3Wallet implements Wallet {
    async getBalance(token: Address): Promise<number> {
        const client = createPublicClient({
            chain: config.network.name === "base" ? base: mainnet,
            transport: http()
        });
        const balance = await client.readContract({
            abi: erc20Abi,
            address: token,
            functionName: 'balanceOf',
            args: [config.address]
        });
        return Number(balance);
    }
}



