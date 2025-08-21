// Uniswap V3 Contract Addresses and Constants

// Trading Constants
export const UNISWAP_V3_DEFAULT_FEE = 3000; // 0.3% fee tier
export const UNISWAP_V3_DEADLINE_OFFSET = 60 * 20; // 20 minutes in seconds

// Swap Parameters
export const UNISWAP_V3_MIN_AMOUNT_OUT = 0n;
export const UNISWAP_V3_SQRT_PRICE_LIMIT = 0n;

// Helper function to calculate deadline
export const getUniswapDeadline = (): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + UNISWAP_V3_DEADLINE_OFFSET);
};
