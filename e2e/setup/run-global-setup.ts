import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const { runE2eGlobalSetup } = await import('./global-setup');

await runE2eGlobalSetup();
