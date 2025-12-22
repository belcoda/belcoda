import { object } from 'valibot';
import * as v from 'valibot';

export const loginSchema = object({
	email: v.string(),
	password: v.string()
});

