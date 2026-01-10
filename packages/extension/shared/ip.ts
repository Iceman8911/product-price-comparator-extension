import * as v from "valibot";

/**
 * Schema for the response from ipapi.co
 */
export const IpapiResponseSchema = v.object({
	/** Autonomous System Number */
	asn: v.string(),
	/** City name */
	city: v.string(),
	/** Continent code (e.g. "AF" for Africa) */
	continent_code: v.string(),
	/** Country code (ISO 2-letter) */
	country: v.string(),
	/** Country area in square kilometers */
	country_area: v.number(),
	/** Country calling code (e.g. "+234") */
	country_calling_code: v.string(),
	/** Capital city of the country */
	country_capital: v.string(),
	/** Country code (ISO 2-letter) */
	country_code: v.string(),
	/** Country code (ISO 3-letter) */
	country_code_iso3: v.string(),
	/** Country name */
	country_name: v.string(),
	/** Country population */
	country_population: v.number(),
	/** Country top-level domain (e.g. ".ng") */
	country_tld: v.string(),
	/** Currency code (e.g. "NGN") */
	currency: v.string(),
	/** Currency name (e.g. "Naira") */
	currency_name: v.string(),
	/** Whether the country is in the EU */
	in_eu: v.boolean(),
	/** IP address */
	ip: v.string(),
	/** Languages spoken in the country (comma-separated) */
	languages: v.string(),
	/** Latitude */
	latitude: v.number(),
	/** Longitude */
	longitude: v.number(),
	/** Network in CIDR notation */
	network: v.string(),
	/** Organization name */
	org: v.string(),
	/** Postal code (nullable) */
	postal: v.nullable(v.string()),
	/** Region name */
	region: v.string(),
	/** Region code */
	region_code: v.string(),
	/** Timezone (e.g. "Africa/Lagos") */
	timezone: v.string(),
	/** UTC offset (e.g. "+0100") */
	utc_offset: v.string(),
	/** IP version (e.g. "IPv4") */
	version: v.string(),
});

type LocationName = { city: string; country: string };

export async function getLocationNameByIP(): Promise<LocationName | null> {
	try {
		const response = await fetch("https://ipapi.co/json/");

		const { city, country_name } = v.parse(
			IpapiResponseSchema,
			await response.json(),
		);
		return { city, country: country_name };
	} catch (e) {
		console.error("GeoIP failed", e);
		return null;
	}
}
