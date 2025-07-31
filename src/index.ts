/**
 * Decentralized Finance (DeFi) Arbitrage Bot
 * 
 * This application performs automated arbitrage trading between different DeFi protocols
 * (CDP and Uniswap) to identify and execute profitable trading opportunities.
 * 
 * The bot can operate in two modes:
 * - Mock mode: Uses simulated providers for testing and development
 * - Production mode: Uses real blockchain providers for live trading
 * 
 * @author sebaleoperez
 * @version 1.0.0
 */

import { config } from './config';
import { container } from './container';
import { ArbitrageService } from './services/arbitrageService';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.log("🚀 Starting DeFi Arbitrage Bot...");
    console.log(`📊 Environment: ${config.environment.useMocks ? 'Mock' : 'Production'} mode`);
    
    // Get dependencies from the container
    const dependencies = container.getDependencies();
    
    // Create and initialize the arbitrage service
    const arbitrageService = new ArbitrageService(dependencies);
    await arbitrageService.initialize();
    
    // Start the arbitrage bot
    arbitrageService.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      arbitrageService.stop();
      const stats = arbitrageService.getStats();
      console.log(`📊 Final stats: ${stats.txCount} transactions, ${stats.sessionProfit.toFixed(6)} USDC profit`);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      arbitrageService.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start arbitrage bot:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
