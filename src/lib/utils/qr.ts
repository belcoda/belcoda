/**
 * QR Code generation utilities
 */

export interface QRCodeOptions {
	size?: number;
	errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
}

/**
 * Generate a QR code as a data URL using the qr package
 * @param text - Text to encode in the QR code
 * @param options - QR code generation options
 * @returns Promise<string> - Data URL of the generated QR code
 */
export async function generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
	const { size = 200, errorCorrectionLevel = 'medium' } = options;

	const QR = await import('qr');

	// Generate QR code matrix - need to specify format as second argument
	const qr = QR.default(text, 'raw', { ecc: errorCorrectionLevel });

	// Create canvas
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not get canvas context');

	const cellSize = size / qr.length;
	canvas.width = size;
	canvas.height = size;

	// Fill background white
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, size, size);

	// Draw QR code
	ctx.fillStyle = '#000000';
	for (let row = 0; row < qr.length; row++) {
		for (let col = 0; col < qr[row].length; col++) {
			if (qr[row][col]) {
				ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
			}
		}
	}

	return canvas.toDataURL();
}

/**
 * Generate a QR code for WhatsApp sharing
 * @param url - WhatsApp URL to encode
 * @returns Promise<string> - Data URL of the generated QR code
 */
export async function generateWhatsAppQRCode(url: string): Promise<string> {
	return generateQRCode(url, { size: 200, errorCorrectionLevel: 'medium' });
}
