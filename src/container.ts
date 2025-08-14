/**
 * Dependency Injection Container
 *
 * This module provides a centralized way to manage and inject dependencies
 * throughout the application, improving testability and extensibility.
 *
 * @module container
 */

import { config } from './config';
import { SwapProvider } from './interfaces/swapProvider';
import { ContentPayment } from './interfaces/contentPayment';
import { Wallet } from './interfaces/wallet';
import { ArbitrageLogger } from './services/arbitrageLogger';

// Mock implementations
import { MockCDPProvider } from './mocks/mockCDPProvider';
import { MockUniswapProvider } from './mocks/mockUniswapProvider';
import { MockPayment } from './mocks/mockPayment';
import { MockWallet } from './mocks/mockWallet';

// Production implementations
import { CDPProvider } from './providers/cdp';
import { CustomDEXProvider } from './providers/customDEX';
import { x402FetchBuyer } from './buyers/x402FetchBuyer';
import { Web3Wallet } from './wallets/web3Wallet';

/**
 * Application dependencies interface for type safety
 */
export interface AppDependencies {
  cdpProvider: SwapProvider;
  customDEXProvider: SwapProvider;
  buyer: ContentPayment;
  wallet: Wallet;
}

/**
 * Dependency factory interface for creating different implementations
 */
export interface DependencyFactory {
  createCDPProvider(): SwapProvider;
  createCustomDEXProvider(): SwapProvider;
  createBuyer(): ContentPayment;
  createWallet(): Wallet;
}

/**
 * Mock implementation factory for testing and development
 */
export class MockDependencyFactory implements DependencyFactory {
  createCDPProvider(): SwapProvider {
    return new MockCDPProvider();
  }

  createCustomDEXProvider(): SwapProvider {
    return new MockUniswapProvider();
  }

  createBuyer(): ContentPayment {
    return new MockPayment();
  }

  createWallet(): Wallet {
    return new MockWallet();
  }
}

/**
 * Production implementation factory for live trading
 */
export class ProductionDependencyFactory implements DependencyFactory {
  createCDPProvider(): SwapProvider {
    return new CDPProvider();
  }

  createCustomDEXProvider(): SwapProvider {
    return new CustomDEXProvider();
  }

  createBuyer(): ContentPayment {
    return new x402FetchBuyer();
  }

  createWallet(): Wallet {
    return new Web3Wallet();
  }
}

/**
 * Dependency injection container that manages application dependencies
 */
export class Container {
  private factory: DependencyFactory;
  private dependencies: AppDependencies | null = null;

  constructor(factory: DependencyFactory) {
    this.factory = factory;
  }

  /**
   * Get all application dependencies, creating them if necessary
   */
  getDependencies(): AppDependencies {
    if (!this.dependencies) {
      this.dependencies = {
        cdpProvider: this.factory.createCDPProvider(),
        customDEXProvider: this.factory.createCustomDEXProvider(),
        buyer: this.factory.createBuyer(),
        wallet: this.factory.createWallet(),
      };
    }
    return this.dependencies;
  }

  /**
   * Reset dependencies (useful for testing)
   */
  reset(): void {
    this.dependencies = null;
  }

  /**
   * Replace a specific dependency (useful for testing specific components)
   */
  override<K extends keyof AppDependencies>(key: K, implementation: AppDependencies[K]): void {
    if (!this.dependencies) {
      this.dependencies = this.getDependencies();
    }
    this.dependencies[key] = implementation;
  }
}

/**
 * Create and configure the application container based on environment
 */
export function createContainer(): Container {
  const logger = new ArbitrageLogger();
  const factory = config.environment.useMocks
    ? new MockDependencyFactory()
    : new ProductionDependencyFactory();

  const container = new Container(factory);

  // Log which implementations are being used
  const mode = config.environment.useMocks ? 'mock' : 'production';
  logger.logInfo(`Container configured with ${mode} implementations`);

  return container;
}

/**
 * Global container instance
 */
export const container = createContainer();
