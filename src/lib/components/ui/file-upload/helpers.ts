import { v7 as uuidv7 } from 'uuid';

export function getUploadPath(organizationId: string, fileName: string) {
	const dateString = new Date().toLocaleDateString('ja-JP', {
		//japanese dates best for this because they are yyyy/mm/dd so split naturally
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	return `uploads/${organizationId}/${dateString}/${uuidv7()}-${fileName}`;
}

export function getOrgIdFromPath(path: string) {
	return path.split('/')[1];
}
