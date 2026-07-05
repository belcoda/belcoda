import pino from 'pino';

const logger = pino({ level: 'debug' });

export default function createChildLogger(file: string) {
	const child = logger.child({ file });
	return child;
}
