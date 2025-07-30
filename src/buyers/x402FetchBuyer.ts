import { ContentPayment } from '../interfaces/contentPayment';
import { wrapFetchWithPayment } from "x402-fetch";
import { config } from '../config';
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createWalletClient, http } from "viem";

export class x402FetchBuyer implements ContentPayment {
    async buyContent(url: string): Promise<string | undefined> {
        const account = privateKeyToAccount(config.privateKey as `0x${string}`);
        // Wrap the fetch function with payment handling using just the account
        const fetchWithPay = wrapFetchWithPayment(fetch, account);
        // Make a request that may require payment
        const response = await fetchWithPay(url, {
            method: "GET",
        });
        const data = await response.json();
        return data; // Assuming the response contains a 'content' field
    }
}