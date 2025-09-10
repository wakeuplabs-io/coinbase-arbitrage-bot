# Coinbase Arbitrage Bot 🚀

A sophisticated TypeScript-based arbitrage trading bot that identifies and executes profitable trades between Coinbase Developer Platform (CDP) and decentralized exchanges (DEX). The bot automatically detects price discrepancies, executes trades when profit thresholds are met, and includes x402 payment integration for premium content access.

---

## 🎥 Explainer Videos

- **Marketing Video**: [Watch here](https://www.youtube.com/watch?v=_MaYqdo5fo0)  
  A clear and accessible introduction to the value and potential of the bot.

- **Technical Video**: [Watch technical walkthrough](https://www.youtube.com/watch?v=HxcdqXHrC2s)  
  Step-by-step explanation of the flow, CDP integration, and how the bot executes arbitrage opportunities.

---

## ✨ Features

- **Automated Arbitrage Detection**: Real-time price monitoring across CDP and DEX platforms
- **Risk Management**: Configurable profit thresholds
- **Smart Trade Execution**: Automated swap execution with comprehensive error handling
- **Session Tracking**: Real-time profit tracking and transaction counting
- **X402 Payment Integration**: Automatic premium content purchases when profit targets are reached
- **Comprehensive Logging**: Detailed transaction logs with profit analytics
- **Mock System**: Full mock implementations for safe testing and development
- **Type Safety**: Built with TypeScript for robust development experience

## 🏗️ Architecture

```
src/
├── config.ts                 # Application configuration
├── container.ts              # Dependency injection container
├── index.ts                  # Application entry point
├── buyers/
│   └── x402FetchBuyer.ts     # X402 payment implementation
├── interfaces/
│   ├── contentPayment.ts     # Payment interface definitions
│   ├── swapProvider.ts       # Swap provider interfaces
│   └── wallet.ts             # Wallet interface definitions
├── mocks/
│   ├── mockCDPProvider.ts    # CDP provider mock
│   ├── mockUniswapProvider.ts # Uniswap provider mock
│   ├── mockPayment.ts        # Payment system mock
│   └── mockWallet.ts         # Wallet mock
├── providers/
│   ├── cdp.ts                # Coinbase Developer Platform integration
│   ├── customDEX.ts          # Custom DEX implementation
│   └── uniswap.ts            # Uniswap integration
├── services/
│   ├── arbitrageLogger.ts    # Comprehensive logging service
│   ├── arbitrageService.ts   # Core arbitrage trading logic
|   └── x402FetchService.ts   # Call x402 protected endpoint
├── utils/
│   ├── logger.ts             # Utility logging functions
│   └── tokenUtils.ts         # Token management utilities
└── wallets/
    └── web3Wallet.ts         # Web3 wallet implementation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- npm or yarn
- TypeScript knowledge
- Coinbase Developer Platform account
- Environment variables configured

### Running

1. **Clone the repository**

   ```bash
   git clone https://github.com/wakeuplabs-io/coinbase-arbitrage-bot.git
   cd coinbase-arbitrage-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run x402 example**

   You may want to run the [x402 example](https://github.com/coinbase/x402/blob/main/examples/typescript/servers/express/README.md) for demoing purchasing when threshold is reached.

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Run the bot**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
NETWORK=base
RPC_URL=https://mainnet.base.org

# Coinbase Developer Platform
CDP_API_KEY=your_cdp_api_key
CDP_PRIVATE_KEY=your_cdp_private_key
ACCOUNT_NAME=your_account_name

# Trading Configuration
MAIN_TOKEN_SYMBOL=USDC
MAIN_TOKEN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
MAIN_TOKEN_DECIMALS=6
SECONDARY_TOKEN_SYMBOL=WETH
SECONDARY_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006
SECONDARY_TOKEN_DECIMALS=18

# Trading Parameters
AMOUNT_IN=10
TARGET_BALANCE_OUT=100
PROFIT_THRESHOLD=0.5
SLIPPAGE_BPS=300
FREQUENCY_MS=5000

# X402 Payment
X402_PAYMENT_URL=https://example.com/premium-content
```

### Trading Parameters

- **`AMOUNT_IN`**: Amount to trade per arbitrage cycle
- **`TARGET_BALANCE_OUT`**: Target profit before stopping and executing x402 payment
- **`PROFIT_THRESHOLD`**: Minimum profit threshold to execute trades
- **`SLIPPAGE_BPS`**: Maximum acceptable slippage in basis points
- **`FREQUENCY_MS`**: Frequency of arbitrage checks in milliseconds

## 🧪 Testing

The project includes a comprehensive test suite with 50+ tests covering all major components.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/services/arbitrageService.test.ts
```

## 🔍 Code Quality & Linting

The project uses ESLint and Prettier to maintain consistent code quality and style.

### Linting Commands

```bash
# Check for linting issues
npm run lint

# Automatically fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run all checks (lint + format + tests)
npm run check
```

### Code Quality Features

- **ESLint**: TypeScript-specific linting with Node.js environment support
- **Prettier**: Consistent code formatting across the project
- **VS Code Integration**: Automatic formatting and linting on save
- **Pre-configured Rules**: Optimized for TypeScript development
- **Test-specific Rules**: Relaxed linting for test files

### Configuration Files

- `eslint.config.js`: ESLint configuration with TypeScript support
- `.prettierrc.json`: Prettier formatting rules
- `.vscode/settings.json`: VS Code editor integration

### Test Structure

```
tests/
├── services/
│   └── arbitrageService.test.ts    # Core arbitrage logic tests
├── utils/
│   └── tokenUtils.test.ts          # Token utility tests
└── mocks/
    ├── mockCDPProvider.test.ts     # CDP mock tests
    └── mockUniswapProvider.test.ts # Uniswap mock tests
```

### Test Coverage

- ✅ Arbitrage opportunity detection
- ✅ Trade execution logic
- ✅ Error handling and recovery
- ✅ Mock provider behavior
- ✅ Utility function validation
- ✅ X402 payment integration
- ✅ Session management

## 🔍 Monitoring & Logging

The bot provides comprehensive logging and monitoring capabilities:

### Real-time Console Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting arbitrage bot...
Getting WETH from CDP...
Getting USDC from DEX...
 07/31, 06:43:50 PM |  1 | CDP → DEX | 10.00 → 11.50 | +15.00% +1.500000 | 1.500000 | 🚀 SWAP EXECUTED
✅ Trade executed successfully! Profit: 1.500000 USDC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Log Files

- **`logs/arbitrage.log`**: Detailed transaction history
- **Console output**: Real-time trading activity
- **Error logs**: Comprehensive error tracking

## 🛡️ Security & Risk Management

### Safety Features

- **Profit Threshold Validation**: Only executes profitable trades
- **Slippage Protection**: Configurable maximum slippage
- **Error Recovery**: Graceful handling of failed transactions
- **Mock Mode**: Safe testing environment
- **Session Limits**: Automatic stopping at profit targets

### Best Practices

1. **Start with Mock Mode**: Test strategies safely
2. **Use Conservative Thresholds**: Start with higher profit requirements
3. **Monitor Gas Costs**: Factor in transaction fees
4. **Regular Balance Checks**: Ensure sufficient funds
5. **Gradual Scaling**: Increase trade sizes progressively

## 🔌 API Integration

### Coinbase Developer Platform

The bot integrates with CDP for:

- Price estimation
- Swap execution
- Account management
- Transaction monitoring

### Decentralized Exchanges

Supports integration with:

- Uniswap V3
- Custom DEX implementations
- Configurable swap providers

### X402 Payment Protocol

Automatic premium content purchases using the x402 protocol when profit targets are achieved.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Run tests**: `npm test`
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 90%
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**Important**: This software is for educational and research purposes. Cryptocurrency trading involves substantial risk of loss. Users are responsible for:

- Understanding the risks involved
- Complying with local regulations
- Managing their own funds securely
- Testing thoroughly before live trading

The authors are not responsible for any financial losses incurred through the use of this software.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/wakeuplabs-io/coinbase-arbitrage-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wakeuplabs-io/coinbase-arbitrage-bot/discussions)

---

Built with ❤️ by [WakeupLabs](https://www.wakeuplabs.io/)
