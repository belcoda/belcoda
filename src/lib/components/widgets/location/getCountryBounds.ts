import { browser } from '$app/environment';
import { type CountryCode } from '$lib/utils/country';

// [west, south] and [east, north] corners — Mapbox's fitBounds LngLatBoundsLike.
export type CountryBounds = [[number, number], [number, number]];

// Resolve a country's bounding box from its ISO 3166 alpha-2 code via the Mapbox
// Geocoding API, so we can frame a map on the country when geolocation isn't
// available. No coordinate/name lookup tables to maintain: the country name comes
// from the browser's Intl.DisplayNames, and the bbox comes from Mapbox.
export const getCountryBounds = async (
	country: CountryCode,
	accessToken: string
): Promise<CountryBounds | null> => {
	if (!browser || !accessToken) {
		return null;
	}

	// ISO code -> country name (built into the platform, no table to keep in sync).
	// DisplayNames construction/`.of()` can throw (RangeError on a structurally invalid
	// region code, or missing ICU data in some environments) — fall back to the raw code
	// rather than letting that reject this function and break the caller's await.
	let name: string = country;
	try {
		name = new Intl.DisplayNames(['en'], { type: 'region' }).of(country) ?? country;
	} catch {
		// fall back to `country`
	}

	const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
	url.searchParams.set('q', name);
	url.searchParams.set('types', 'country');
	url.searchParams.set('country', country); // constrain results to this country
	url.searchParams.set('limit', '1');
	url.searchParams.set('access_token', accessToken);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			return null;
		}
		const data = await response.json();
		const bbox = data?.features?.[0]?.properties?.bbox;
		// Mapbox returns [minLng, minLat, maxLng, maxLat].
		if (!Array.isArray(bbox) || bbox.length !== 4) {
			return null;
		}
		const [west, south, east, north] = bbox;
		return [
			[west, south],
			[east, north]
		];
	} catch {
		return null;
	}
};
