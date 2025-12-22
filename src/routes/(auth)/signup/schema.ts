import { pipe, object, check } from 'valibot';
import { shortString, email, password } from '$lib/schema/helpers';

export const signupSchema = pipe(
	object({
		name: shortString,
		email: email,
		password: password,
		confirmPassword: password
	}),
	check((input) => input.password === input.confirmPassword, 'Passwords do not match')
);
