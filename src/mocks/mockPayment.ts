import { ContentPayment } from "../interfaces/contentPayment";

export class MockPayment implements ContentPayment {
    
    async buyContent(url: string): Promise<string | undefined> {
        // Simulate a successful payment process
        console.log(`Processing payment for content at ${url}`);
        return `Payment successful for content at ${url}`;
    }

}