/**
 * Content Payment Interface
 *
 * Defines the contract for implementations that can purchase premium content
 * using micropayment protocols like x402.
 *
 * @interface ContentPayment
 */

/**
 * Interface for content payment implementations supporting micropayments.
 */
export interface ContentPayment {
  /**
   * Purchase premium content from a given URL using micropayments.
   *
   * @param url - The URL of the premium content to purchase
   * @returns Promise resolving to the content data, or undefined if purchase fails
   */
  buyContent(url: string): Promise<string | undefined>;
}
