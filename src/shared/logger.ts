type LogFields = Record<string, unknown>;

function write(
  level: 'info' | 'warn' | 'error',
  message: string,
  fields?: LogFields,
): void {
  process.stdout.write(
    `${JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...fields,
    })}\n`,
  );
}

export type Logger = {
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
};

export const logger: Logger = {
  info(message: string, fields?: LogFields): void {
    write('info', message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    write('warn', message, fields);
  },
  error(message: string, fields?: LogFields): void {
    write('error', message, fields);
  },
};
