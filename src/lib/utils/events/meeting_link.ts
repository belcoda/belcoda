type MeetingPlatform = 'zoom' | 'googlemeet' | 'teams';
type MeetingPlatformWithOther = MeetingPlatform | 'other';
export function getMeetingPlatform(link: string | null | undefined): MeetingPlatformWithOther {
	if (!link) return 'other'; // Handle null or undefined links
	const platforms: Record<MeetingPlatform, RegExp> = {
		zoom: /zoom\.us\/j\//,
		googlemeet: /meet\.google\.com\//,
		teams: /teams\.microsoft\.com\//
	};

	for (const [platform, regex] of Object.entries(platforms)) {
		if (regex.test(link)) return platform as MeetingPlatform;
	}

	return 'other'; // Unknown platform
}

import ZoomIcon from '$lib/assets/platforms/zoom.svg';
import GoogleMeetIcon from '$lib/assets/platforms/meets.svg';
import TeamsIcon from '$lib/assets/platforms/teams.svg';
export function getMeetingPlatformLogoUrl(platform: MeetingPlatformWithOther): string | null {
	const logos: Record<MeetingPlatform, string> = {
		zoom: ZoomIcon,
		googlemeet: GoogleMeetIcon,
		teams: TeamsIcon
	};

	return logos[platform as MeetingPlatform] || null; // Fallback logo
}
