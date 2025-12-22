import * as jose from 'jose';
import { env } from '$env/dynamic/private';

function must<T>(val: T) {
	if (!val) {
		throw new Error('Expected value to be defined');
	}
	return val;
}

export async function createJwt(userId: string) {
	const secret = new TextEncoder().encode(must(env.ZERO_AUTH_SECRET));
	const jwt = await new jose.SignJWT()
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setSubject(userId)
		.setExpirationTime('14days')
		.sign(secret);

	return jwt;
}
