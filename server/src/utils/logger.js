const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (msg, ...args) => {
    console.log(`[${formatTimestamp()}] [INFO] ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`[${formatTimestamp()}] [WARN] ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`[${formatTimestamp()}] [ERROR] ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${formatTimestamp()}] [DEBUG] ${msg}`, ...args);
    }
  },
};

export default logger;
