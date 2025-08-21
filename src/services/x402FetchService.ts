import { wrapFetchWithPayment } from 'x402-fetch';
import { config } from '../config';
import { privateKeyToAccount } from 'viem/accounts';

// Provides a static helper for performing paid fetch requests via x402.
export class x402FetchService {
  static async fetchWithPayment(url: string): Promise<unknown> {
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);
    const fetchWithPay = wrapFetchWithPayment(fetch, account);
    const response = await fetchWithPay(url, { method: 'GET' });
    return response.json();
  }
}
