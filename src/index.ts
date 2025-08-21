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

import { container } from './container';
import { ArbitrageService } from './services/arbitrageService';
import { ArbitrageLogger } from './services/arbitrageLogger';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    const logger = new ArbitrageLogger();
    logger.displayEnvironmentInfo();

    // Get dependencies from the container
    const dependencies = container.getDependencies();

    // Create and initialize the arbitrage service
    const arbitrageService = new ArbitrageService(dependencies);
    await arbitrageService.initialize();

    // Start the arbitrage bot
    arbitrageService.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      const stats = arbitrageService.getStats();
      logger.logGracefulShutdown('SIGINT', stats);
      arbitrageService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      const stats = arbitrageService.getStats();
      logger.logGracefulShutdown('SIGTERM', stats);
      arbitrageService.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start arbitrage bot:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
