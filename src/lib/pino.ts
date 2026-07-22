import { dev } from '$app/environment';
import { redactLogArguments } from '$lib/utils/log-redaction';
import pino from 'pino';

const logger = pino({
	level: dev ? 'debug' : 'info',
	hooks: {
		logMethod(inputArgs, method) {
			method.apply(this, redactLogArguments(inputArgs));
		}
	}
});

export default function createChildLogger(file: string) {
	const child = logger.child({ file });
	return child;
}
