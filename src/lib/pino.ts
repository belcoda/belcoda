import { dev } from '$app/environment';
import pino from 'pino';

const logger = pino({ level: dev ? 'debug' : 'info' });

export default function createChildLogger(file: string) {
	const child = logger.child({ file });
	return child;
}
