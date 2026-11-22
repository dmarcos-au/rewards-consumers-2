type Fields = Record<string, unknown>;

export interface Logger {
  info(message: string, fields?: Fields): void;
  warn(message: string, fields?: Fields): void;
  error(message: string, fields?: Fields): void;
}

function write(severity: string, message: string, fields: Fields = {}): void {
  // Cloud Logging reads one JSON object per line as a structured log entry.
  console.log(JSON.stringify({ severity, message, ...fields }));
}

export const logger: Logger = {
  info: (message, fields) => write("INFO", message, fields),
  warn: (message, fields) => write("WARNING", message, fields),
  error: (message, fields) => write("ERROR", message, fields),
};
