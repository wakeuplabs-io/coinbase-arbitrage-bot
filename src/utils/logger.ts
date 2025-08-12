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

/** Supported log levels */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'EVENT' | 'DEBUG';

const levelEmoji: Record<LogLevel, string> = {
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  EVENT: '🚀',
  DEBUG: '🐞',
};

const write = (level: LogLevel, message: string) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
  const fileLine = `[${timestamp}] [${level}] ${message}`;
  const consoleLine = `${levelEmoji[level]} ${message}`;
  switch (level) {
    case 'WARN':
      console.warn(consoleLine);
      break;
    case 'ERROR':
      console.error(consoleLine);
      break;
    default:
      console.log(consoleLine);
  }
  fs.appendFileSync(logFilePath, fileLine + '\n');
};

export const log = (message: string) => write('INFO', message); // backward compatibility
export const info = (message: string) => write('INFO', message);
export const warn = (message: string) => write('WARN', message);
export const success = (message: string) => write('SUCCESS', message);
export const event = (message: string) => write('EVENT', message);
export const debug = (message: string) => write('DEBUG', message);
export const error = (message: string, err?: unknown) => {
  if (err) {
    const details = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
    write('ERROR', `${message} | ${details}`);
  } else {
    write('ERROR', message);
  }
};

export const block = (title: string, lines: string[]) => {
  event(title);
  lines.forEach((l) => info(l));
};

export const Logger = { log, info, warn, success, event, debug, error, block };
