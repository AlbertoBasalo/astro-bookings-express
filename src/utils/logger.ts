type LogLevel = 'INFO' | 'WARN' | 'ERROR';

const VERBOSE = process.env.LOG_VERBOSE !== 'false';

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${context}] ${message}`;
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  if (!VERBOSE && level === 'INFO') {
    return;
  }

  const formattedMessage = formatMessage(level, context, message);
  
  if (data !== undefined) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
}

export const logger = {
  info: (context: string, message: string, data?: unknown) => log('INFO', context, message, data),
  warn: (context: string, message: string, data?: unknown) => log('WARN', context, message, data),
  error: (context: string, message: string, data?: unknown) => log('ERROR', context, message, data),
};
