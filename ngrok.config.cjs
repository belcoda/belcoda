const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load .env variables
dotenv.config();
const command = `ngrok http --domain=${process.env.PUBLIC_NGROK_DOMAIN} 5173 --authtoken ${process.env.NGROK_AUTHTOKEN}`;

try {
	console.log(
		`Running: NGROK for domain ${process.env.PUBLIC_NGROK_DOMAIN} on port 5173 with provided authtoken`
	);
	execSync(command, { stdio: 'inherit' });
} catch (error) {
	console.error(`Error: ${error.message}`);
	process.exit(1);
}
