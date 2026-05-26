import path from 'path';
import type { E2EProject } from './config';
import type { UserRole } from './auth';

export const AUTH_DIR = path.join(import.meta.dirname, '../.auth');

export function authStoragePath(project: E2EProject, role: UserRole): string {
	return path.join(AUTH_DIR, `${project}-${role}.json`);
}

export function ownerStorageState(project: E2EProject): string {
	return authStoragePath(project, 'owner');
}

/** Playwright project names like `settings-3` map to the `settings` org. */
export function e2eProjectFromPlaywrightName(name: string): E2EProject {
	return name.replace(/-\d+$/, '') as E2EProject;
}
