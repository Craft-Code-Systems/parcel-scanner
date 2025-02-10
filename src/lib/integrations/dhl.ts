import * as Log from "../logging";
import * as Wrap from "../wrapper";
import * as Interface from '../interfaces';

const PAGE_NAME: string = "dhl";
const f_wrpd_postData = Wrap.f_asyncResp(f_postData);

/**
 * Posts data to the DHL API
 */
async function f_postData(
  ENDPOINT: string, 
  DATA: any[], 
  TOKEN: string, 
  COOKIES: string
): Promise<any[] | null> {
  const HEADERS = {
    cookie: COOKIES,
    'Content-Type': 'application/json',
    'x-xsrf-token': TOKEN
  };

  const API_URL = `https://my.dhlecommerce.nl/${ENDPOINT}`;
  const ORDER = JSON.stringify(DATA);
  const OPTIONS: RequestInit = {
    method: 'POST',
    headers: HEADERS,
    body: ORDER
  };

  console.log("API_URL: ", API_URL);
  console.log("OPTIONS: ", JSON.stringify(OPTIONS));

  try {
    const RESPONSE: Response = await fetch(API_URL, OPTIONS);
    const RESULT: any = await RESPONSE.text();
    const RESULT_COOKIES = RESPONSE.headers.get('set-cookie');
    console.log("RESULT: ", RESPONSE);
    if (!RESPONSE.ok) {
      Log.f_msg(PAGE_NAME, "f_postData", "DHL API Error: " + RESPONSE.status + " - " + RESULT, 2);
      return [RESULT];
    }
    return [RESULT, RESULT_COOKIES];
  } catch (ERROR: any) {
    Log.f_msg(PAGE_NAME, "f_postData", "data post error: " + ERROR, 2);
    return null;
  }
}

/**
 * Parses a concatenated cookie header string into an object mapping cookie names to their values.
 */
function parseCookieHeader(cookieHeader: string): Record<string, string> {
  // Split on commas that are followed by optional whitespace and a token that looks like a cookie name.
  const cookieStrings = cookieHeader.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
  const cookies: Record<string, string> = {};
  for (const cookieStr of cookieStrings) {
    // Get the first part before any ";" which is the "name=value" pair.
    const [nameValue] = cookieStr.split(';');
    const eqIndex = nameValue.indexOf('=');
    if (eqIndex > 0) {
      const name = nameValue.substring(0, eqIndex).trim();
      const value = nameValue.substring(eqIndex + 1).trim();
      cookies[name] = value;
    }
  }
  return cookies;
}

/**
 * Extracts a cookie value from a cookie header string.
 */
function getCookieValueFromHeader(cookieHeader: string, cookieName: string): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[cookieName] || null;
}

/**
 * Rebuilds a Cookie header string from a parsed cookie object.
 */
function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export async function f_login(env: any): Promise<[string | null, Record<string, string>] | null> {
  const DATA = {
    "email": env.DHL_EMAIL,
    "password": env.DHL_PASSWORD
  };
  // Pass an empty cookie string to login.
  const RESULT = (await f_wrpd_postData('api/user/login', DATA, '', '')).return_value;
  if (RESULT[0].key) {
    Log.f_msg(PAGE_NAME, "f_login", RESULT[0].key, 1);
    return null;
  } else {
    // RESULT[1] contains the combined cookie string.
    const cookieHeader = RESULT[1];
    // Parse the cookie string into an object.
    const parsedCookies = parseCookieHeader(cookieHeader);
    const xsrfToken = parsedCookies["XSRF-TOKEN"] || null;
    console.log("TOKEN: ", xsrfToken);
    console.log("PARSED_COOKIES: ", parsedCookies);
    return [xsrfToken, parsedCookies];
  }
}

export async function f_scan(TOKEN: string, COOKIE: Record<string, string>, BARCODE: string): Promise<any> {
  const DATA = { "barcode": BARCODE };
  // Rebuild the Cookie header from the parsed cookie object.
  const cookieHeader = buildCookieHeader(COOKIE);
  const RESULT = (await f_wrpd_postData('servicepoint-api/customer/hand-in/validate', DATA, TOKEN, cookieHeader)).return_value;
  if (RESULT[0].key) {
    Log.f_msg(PAGE_NAME, "f_scan", RESULT[0].key, 1);
    return null;
  } else {
    return RESULT[0];
  }
}

export async function f_handin(TOKEN: string, COOKIE: Record<string, string>, env: any, BARCODES: string[]): Promise<any> {
  const DATA = {
    "shipper": {
      "countryCode": "",
      "postalCode": "",
      "houseNumber": "",
      "houseNumberSuffix": "",
      "street": "",
      "city": "",
      "suburb": "",
      "additionalAddressLine": ""
    },
    "parcels": BARCODES.map((BARCODE: string) => ({
      "id": crypto.randomUUID(),
      "parcelKind": "Standard",
      "receiverName": "",
      "barcode": BARCODE
    })),
    "receipt": {
      "email": env.DHL_EMAIL_SCAN
    }
  };

  const cookieHeader = buildCookieHeader(COOKIE);
  const RESULT = (await f_wrpd_postData('servicepoint-api/customer/hand-in', DATA, TOKEN, cookieHeader)).return_value;
  if (RESULT[0].key) {
    Log.f_msg(PAGE_NAME, "f_handin", RESULT[0].key, 1);
    return null;
  } else {
    return RESULT[0];
  }
}
