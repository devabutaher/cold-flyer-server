const levels = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4 };
const threshold = levels[process.env.NODE_ENV === "production" ? "info" : "debug"];
const isDev = process.env.NODE_ENV !== "production";

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const levelColors = { fatal: c.red, error: c.red, warn: c.yellow, info: c.green, debug: c.dim };

const logger = {};

for (const [level, num] of Object.entries(levels)) {
  logger[level] = (obj, msg) => {
    if (num > threshold) return;
    const parts = [];
    if (isDev) parts.push(levelColors[level](level));
    if (msg) parts.push(msg);
    if (typeof obj === "object" && obj !== null) {
      if (obj instanceof Error) {
        parts.push(obj.message);
      } else {
        for (const [key, val] of Object.entries(obj)) {
          parts.push(`${key}=${val instanceof Error ? val.message : val}`);
        }
      }
    }
    console.log(parts.join(" | "));
  };
}

module.exports = logger;
