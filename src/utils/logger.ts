/**
 * Logging Utility
 * 
 * Provides centralized logging functionality that outputs to both
 * console and a persistent log file for debugging and monitoring.
 * 
 * @module logger
 */

import fs from 'fs';
import path from 'path';

/** Directory path for log files */
const logDir = path.resolve(__dirname, '..', 'logs');
/** Full path to the arbitrage log file */
const logFilePath = path.join(logDir, 'arbitrage.log');

// Create the logs folder if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log a message with timestamp to both console and file.
 * 
 * @param message - The message to log
 */
export const log = (message: string) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  fs.appendFileSync(logFilePath, fullMessage + '\n');
};
