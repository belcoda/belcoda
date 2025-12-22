import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env as privateEnv } from '$env/dynamic/private';
const { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } = privateEnv;
import { env as publicEnv } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_REGION } = publicEnv;

const client = new S3Client({
	region: PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_ACCESS_KEY
	}
});

export async function getSignedPutUrl(
	bucket_name: string,
	file_key: string,
	expires_in_seconds: number = 3600
) {
	const command = new PutObjectCommand({ Bucket: bucket_name, Key: file_key });
	const url = await getSignedUrl(client, command, { expiresIn: expires_in_seconds });
	return url;
}

export async function getObject(
	bucket_name: string,
	file_key: string,
	expires_in_seconds: number = 3600
) {
	const command = new GetObjectCommand({ Bucket: bucket_name, Key: file_key });
	const url = await getSignedUrl(client, command, { expiresIn: expires_in_seconds });
	return url;
}

export async function getCsvFromBucket(bucket_name: string, file_key: string) {
	const command = new GetObjectCommand({ Bucket: bucket_name, Key: file_key });
	const response = await client.send(command);
	const str = await response.Body?.transformToString();
	return str;
}

export async function transferFileToBucket(
	bucket_name: string,
	file_key: string,
	url: string
): Promise<string> {
	const signedPutUrl = await getSignedPutUrl(bucket_name, file_key);
	return await uploadFileToS3(url, signedPutUrl);
}

export async function uploadFileToS3(
	url: string,
	signedPutUrl: string,
	headers?: Record<string, string>
): Promise<string> {
	// Fetch the file from the public URL
	const response = await fetch(url, { headers });
	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.statusText}`);
	}

	const contentType = response.headers.get('content-type') || 'application/octet-stream';
	const fileBuffer = await response.arrayBuffer();

	// Upload to the signed S3 PUT URL
	const s3Response = await fetch(signedPutUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': contentType
		},
		body: fileBuffer
	});

	if (!s3Response.ok) {
		throw new Error(`Failed to upload to S3: ${s3Response.statusText}`);
	}
	const urlWithoutQuery = signedPutUrl.split('?')[0];
	return urlWithoutQuery;
}
