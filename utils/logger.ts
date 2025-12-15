
const LOG_PREFIX = '[Bé Vui Học]';

// Một logger đơn giản để có thể mở rộng sau này (ví dụ: gửi log tới server)
export const logger = {
  log: (...args: any[]) => {
    console.log(LOG_PREFIX, ...args);
  },
  info: (...args: any[]) => {
    console.info(`${LOG_PREFIX} [INFO]`, ...args);
  },
  warn: (...args: any[]) => {
    console.warn(`${LOG_PREFIX} [WARN]`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`${LOG_PREFIX} [ERROR]`, ...args);
  },
};
