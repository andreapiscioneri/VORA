type LogContext = Record<string, unknown>

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: string
  context?: LogContext
  error?: { name: string; message: string; stack?: string }
}

function serializeError(error: unknown): LogEntry['error'] {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { name: 'UnknownError', message: String(error) }
}

// One JSON line per event on stdout/stderr — this is the format nearly
// every log drain (Datadog, Better Stack, Sentry's own log-forwarding
// integration, a plain `docker logs | jq`) expects, so wiring a real
// aggregator later is a matter of pointing it at this process's output,
// not rewriting call sites. Swapping in the actual Sentry SDK (once a DSN
// exists — see .env.example) is additive too: `error()` below is the one
// place that would also call `Sentry.captureException(error, { extra:
// context })`, so every current call site upgrades automatically without
// being touched again.
function write(level: LogEntry['level'], message: string, context?: LogContext, error?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && Object.keys(context).length ? { context } : {}),
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  }
  const line = JSON.stringify(entry)

  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext, error?: unknown) => write('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: unknown) => write('error', message, context, error),
}
