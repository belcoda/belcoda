export function downloadSampleCsv() {
	const headers = [
		'given_name',
		'family_name',
		'email_address',
		'phone_number',
		'whatsapp_username',
		'subscribed',
		'do_not_contact',
		'address_line_1',
		'address_line_2',
		'locality',
		'region',
		'postcode',
		'country',
		'workplace',
		'position',
		'gender',
		'date_of_birth',
		'preferred_language',
		'external_id',
		'facebook',
		'twitter',
		'instagram',
		'linkedIn',
		'tiktok',
		'website'
	];

	const rows = [
		[
			'John',
			'Doe',
			'john.doe@example.com',
			'+254712345678',
			'johndoe',
			'true',
			'false',
			'123 Main St',
			'Apt 4B',
			'Nairobi',
			'Nairobi County',
			'00100',
			'ke',
			'Acme Corp',
			'Manager',
			'male',
			'1990-01-15',
			'en',
			'EXT001',
			'',
			'',
			'',
			'',
			'',
			''
		],
		[
			'Jane',
			'Smith',
			'jane.smith@example.com',
			'+254787654321',
			'janesmith',
			'true',
			'false',
			'456 Oak Ave',
			'',
			'Mombasa',
			'Mombasa County',
			'80100',
			'ke',
			'Tech Inc',
			'Developer',
			'female',
			'1985-05-20',
			'sw',
			'EXT002',
			'',
			'',
			'',
			'',
			'',
			''
		]
	];

	const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'sample-people-import.csv';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
}
