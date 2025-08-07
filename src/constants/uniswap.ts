// Uniswap V3 Contract Addresses and Constants

// Contract Addresses (Mainnet)
export const UNISWAP_V3_SWAP_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
export const UNISWAP_V3_QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

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
