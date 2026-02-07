import { v4 as uuidv4 } from 'uuid';
import { getAppState } from '$lib/state.svelte';
const appState = getAppState();
import { env } from '$env/dynamic/public';
const { PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME } = env;
type CropResults = { x: number; y: number; width: number; height: number };
import { get } from '$lib/utils/http';
import { object, string } from 'valibot';
/**
 * Loads a File object into an Image element for use with the Canvas API.
 * @param file The original image File object.
 * @returns A promise that resolves with the loaded HTMLImageElement.
 */
export function loadImageToElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const img = new Image();

		reader.onload = (e) => {
			img.src = e.target?.result as string;
		};

		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load image element.'));
		reader.onerror = () => reject(new Error('Failed to read file.'));

		reader.readAsDataURL(file);
	});
}

/**
 * Draws the cropped area onto a canvas and creates a new File object (Blob).
 * @param imageElement The loaded HTMLImageElement containing the original image.
 * @param cropResults The x, y, width, and height of the crop area.
 * @returns A promise that resolves with the new cropped File object.
 */
export function createCroppedFile(
	imageElement: HTMLImageElement,
	cropResults: CropResults
): Promise<File> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) return reject(new Error('Could not get canvas context.'));

		// Set the canvas dimensions to the size of the cropped area
		canvas.width = cropResults.width;
		canvas.height = cropResults.height;

		// Draw the cropped portion of the image onto the canvas
		ctx.drawImage(
			imageElement,
			cropResults.x,
			cropResults.y, // Source x, y (top-left corner of the crop)
			cropResults.width,
			cropResults.height, // Source width, height
			0,
			0, // Destination x, y
			cropResults.width,
			cropResults.height // Destination width, height
		);

		// Convert the canvas to a Blob and create a File
		canvas.toBlob(
			(blob) => {
				if (!blob) return reject(new Error('Failed to create Blob from canvas.'));
				const newFile = new File([blob], 'cropped-image.png', { type: 'image/png' });
				resolve(newFile);
			},
			'image/png', // Use PNG for quality, can use 'image/jpeg' with quality 0.9
			0.9
		);
	});
}

// --- S3 Upload Helpers ---

/**
 * Gets a signed upload URL from the backend API.
 */
async function getSignedUploadUrl(fileKey: string) {
	const result = await get({
		path: `/api/utils/upload?key=${fileKey}`,
		schema: object({ signedUrl: string() })
	});
	// Add validation here: if (!result.signedUrl) throw new Error(...)
	return result.signedUrl as string;
}

/**
 * Renames the file with a unique key path for S3 storage.
 */
function createS3FileKey(file: File) {
	let fileKey: string;
	// Attempt to use organization ID if available
	try {
		fileKey = `organization/${appState.organizationId}/imageupload/${uuidv4()}-${file.name}`;
	} catch (err) {
		// Fallback to a global key if organization data is missing
		fileKey = `organization/global/imageupload/${uuidv4()}-${file.name}`;
	}
	// Create a new File object with the S3 key as its name
	return {
		fileKey,
		fileToUpload: new File([file], fileKey, { type: file.type })
	};
}

/**
 * Uploads the file directly to the signed S3 URL.
 */
async function uploadToS3(file: File, signedUrl: string, bucketName: string) {
	const response = await fetch(signedUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': file.type
			// S3 often requires specific headers like ACL if you set them on the signed URL
		},
		body: file
	});

	if (!response.ok) {
		throw new Error(`Failed to upload file: ${response.statusText}`);
	}

	// Construct the final public URL
	const uploadedFilePath = new URL(response.url).pathname;
	return `https://${bucketName}.s3.amazonaws.com${uploadedFilePath}`;
}

/**
 * Main function to handle the entire upload process.
 * @param file The File object (e.g., the cropped file).
 * @returns A promise that resolves with the final public image URL.
 */
export async function processAndUploadFile(file: File): Promise<string> {
	const { fileKey, fileToUpload } = createS3FileKey(file);
	const signedUrl = await getSignedUploadUrl(fileKey);
	const finalFileUrl = await uploadToS3(
		fileToUpload,
		signedUrl,
		PUBLIC_AWS_S3_SITE_UPLOADS_BUCKET_NAME
	);
	return finalFileUrl;
}
