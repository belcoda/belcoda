import { customType } from 'drizzle-orm/pg-core';

/**
 * Application-facing shape for a geographic point.
 *
 * IMPORTANT: this uses PostGIS / GeoJSON axis order, which is longitude-first —
 * NOT latitude-first:
 *   - `x` is the longitude
 *   - `y` is the latitude
 *
 * It deliberately matches the object shape produced by Drizzle's built-in
 * `geometry(name, { mode: 'xy' })`, so application code can treat a
 * `geographyPoint` column exactly like the previous geometry column.
 */
export type PointXY = { x: number; y: number };

/** The only SRID this column type supports: WGS 84 lon/lat. */
const SRID = 4326;

/**
 * Parse the hex-encoded EWKB that PostgreSQL returns when a geometry/geography
 * column is selected (postgres.js hands the value back as a hex string).
 *
 * Handles a 2D POINT written in either byte order, with or without the
 * embedded-SRID flag that geography values carry.
 */
function parsePointEWKB(hex: string): PointXY {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	const view = new DataView(bytes.buffer);
	let offset = 0;

	const littleEndian = view.getUint8(offset) === 1;
	offset += 1;

	const geomType = view.getUint32(offset, littleEndian);
	offset += 4;

	// 0x20000000 flags an embedded 4-byte SRID we can skip over.
	if (geomType & 0x20000000) {
		offset += 4;
	}

	// The low 16 bits identify the geometry type; 1 === Point.
	if ((geomType & 0xffff) !== 1) {
		throw new Error(`Expected a POINT geography, received geometry type ${geomType & 0xffff}`);
	}

	const x = view.getFloat64(offset, littleEndian);
	const y = view.getFloat64(offset + 8, littleEndian);
	return { x, y };
}

/**
 * Reusable Drizzle column type for a PostGIS `geography(Point, 4326)` column.
 *
 * - Stored in PostgreSQL as `geography(Point,4326)`.
 * - Exposed to application code as an ergonomic `{ x: longitude, y: latitude }`.
 * - Serialises to EWKT (`SRID=4326;POINT(lon lat)`) on write — assignment-cast
 *   to `geography` by PostgreSQL — and parses the hex EWKB it returns on read.
 *
 * Pair it with a GiST index for spatial queries, e.g.
 *   index('event_location_gist').using('gist', table.location)
 */
export const geographyPoint = customType<{
	data: PointXY;
	driverData: string;
}>({
	dataType() {
		return `geography(Point,${SRID})`;
	},
	toDriver(value: PointXY): string {
		// x = longitude, y = latitude — do NOT swap the axes.
		return `SRID=${SRID};POINT(${value.x} ${value.y})`;
	},
	fromDriver(value: string): PointXY {
		return parsePointEWKB(value);
	}
});
