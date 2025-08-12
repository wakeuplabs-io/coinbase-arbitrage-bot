import { ContentPayment } from '../interfaces/contentPayment';
import { x402FetchService } from '../services/x402FetchService';

export class x402FetchBuyer implements ContentPayment {
  async buyContent(url: string): Promise<string | undefined> {
    return x402FetchService.fetchWithPayment(url);
  }
}
