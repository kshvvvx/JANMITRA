const { createLogger, format, transports } = require('winston');
const path = require('path');
const { combine, timestamp, printf, colorize, json } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  defaultMeta: { service: 'janmitra-api' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to `combined.log`
    new transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 5,
    })
  ],
  exitOnError: false
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      logFormat
    )
  }));
}

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
