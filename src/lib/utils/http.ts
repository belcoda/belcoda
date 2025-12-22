import { env as publicEnv } from '$env/dynamic/public';
import { type GenericSchema, parse } from 'valibot';
export async function get<T>({
	path,
	schema
}: {
	path: `/${string}`;
	schema: GenericSchema<unknown, T>;
}): Promise<T> {
	const response = await fetch(`${publicEnv.PUBLIC_HOST}${path}`, {
		credentials: 'include',
		headers: {
			'content-type': 'application/json'
		}
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const json = await response.json();
	const parsed = parse(schema, json);
	return parsed;
}

export async function post<T>({
	path,
	schema,
	body
}: {
	path: `/${string}`;
	schema: GenericSchema<unknown, T>;
	body: Record<string, unknown>;
}): Promise<T> {
	const response = await fetch(`${publicEnv.PUBLIC_HOST}${path}`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const json = await response.json();
	const parsed = parse(schema, json);
	return parsed;
}
