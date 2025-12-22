import pino from 'pino';

const logger = pino({ level: 'debug' });

export default function (file: string) {
	const child = logger.child({ file });
	return child;
}
