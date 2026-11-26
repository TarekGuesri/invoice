import type { Params } from 'nestjs-pino'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Env } from '../../config/env'

const REQUEST_ID_HEADER = 'x-request-id'

/** Pino levels mapped to Google Cloud Logging severities. */
const SEVERITY: Record<string, string> = {
	trace: 'DEBUG',
	debug: 'DEBUG',
	info: 'INFO',
	warn: 'WARNING',
	error: 'ERROR',
	fatal: 'CRITICAL',
}

function getRequestId(req: IncomingMessage, res: ServerResponse) {
	const incoming = req.headers[REQUEST_ID_HEADER]
	const id =
		typeof incoming === 'string' && incoming.length <= 128
			? incoming
			: randomUUID()
	res.setHeader(REQUEST_ID_HEADER, id)
	return id
}

export function createLoggerParams(
	env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>
): Params {
	const isDev = env.NODE_ENV === 'development'

	return {
		pinoHttp: {
			level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
			genReqId: getRequestId,
			redact: [
				'req.headers.authorization',
				'req.headers.cookie',
				'res.headers["set-cookie"]',
			],
			// Cloud Logging reads `message` and `severity` from JSON lines.
			messageKey: 'message',
			formatters: {
				level: (label) => ({ severity: SEVERITY[label] ?? 'DEFAULT' }),
			},
			transport: isDev
				? {
						target: 'pino-pretty',
						options: { singleLine: true, messageKey: 'message' },
					}
				: undefined,
		},
	}
}
