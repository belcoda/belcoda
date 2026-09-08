import { browser } from '$app/environment';

export const getLocation = async () => {
	if (!browser) {
		return null;
	}

	try {
		return await new Promise<GeolocationPosition>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, {
				timeout: 5000, // 5 seconds timeout
				maximumAge: 60000, // 1 minute cache
				enableHighAccuracy: false // don't need high accuracy
			});
		});
	} catch {
		// Permission denied, timeout, or unavailable — caller falls back to the country.
		return null;
	}
};
