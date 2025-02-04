import * as Log from "../logging";
import * as Wrap from "../wrapper";
import * as Interface from '../interfaces';


const PAGE_NAME: string = "dhl";

const f_wrpd_postData = Wrap.f_asyncResp(f_postData);

/**
 * Posts data to ChannelDock API
 * @param {string} ENDPOINT - The ChannelDock API endpoint
 * @param {any[]} DATA - The data to be posted
 * @returns {Promise<any[]>} - The response from the API
 */
async function f_postData(ENDPOINT: string, DATA: any[], TOKEN: string, COOKIES: string): Promise<any[] | null> {
    const HEADERS = {
        cookie: COOKIES,
        'Content-Type': 'application/json',
        'x-xsrf-token': TOKEN
    };

    const API_URL = `https://my.dhlecommerce.nl/${ENDPOINT}`; // Endpoint URL
        const ORDER = JSON.stringify(DATA);
        const OPTIONS: RequestInit = {
            method: 'POST',
            headers: HEADERS,
            body: ORDER,
        };
        console.log("API_URL: ", API_URL);
        console.log("OPTIONS: ", JSON.stringify(OPTIONS));

        try {
            const RESPONSE: Response = await fetch(API_URL, OPTIONS);
            const RESULT: any = await RESPONSE.text();
            const RESULT_COOKIES = RESPONSE.headers.get('set-cookie');
            console.log("RESULT: ", RESPONSE);
            if (!RESPONSE.ok) {
                Log.f_msg(PAGE_NAME, "f_postData", "DHL API Error: " + RESPONSE.status + " - " + RESULT.message, 2);
                return [RESULT];
            }
            return [RESULT, RESULT_COOKIES];

        } catch (ERROR: any) {
            Log.f_msg(PAGE_NAME, "f_postData", "data post error: " + ERROR, 2);
            return null;
        }
}

/**
 * Extracts the value of a cookie from a full Set-Cookie header string.
 *
 * @param setCookieHeader - The full cookie header string.
 * @param cookieName - The name of the cookie to extract.
 * @returns The value of the cookie if found, or null if not found.
 */
function getCookieValueFromHeader(setCookieHeader: string, cookieName: string): string | null {
    // Create a regular expression that matches "cookieName=<value>"
    const regex = new RegExp(`${cookieName}=([^;]+)`);
    const match = setCookieHeader.match(regex);
    return match ? match[1] : null;
  }


export async function f_login(env: any): Promise<any> {
    const DATA = {
        "email": env.DHL_EMAIL,
        "password": env.DHL_PASSWORD
    };
    const RESULT = (await f_wrpd_postData('api/user/login', DATA, '')).return_value ;
    if (RESULT[0].key){
        Log.f_msg(PAGE_NAME, "f_login", RESULT[0].key, 1);
        return null;
    } else {
        // get x-xsrf-token from cookie
        const TOKEN = getCookieValueFromHeader(RESULT[1], "XSRF-TOKEN");
        console.log("TOKEN: ", TOKEN);
        return [TOKEN,RESULT[1]];
    }

}

export async function f_scan(TOKEN: string, COOKIE: string, BARCODE: string): Promise<any> {

    const DATA = {
        "barcode": BARCODE
    };

    const RESULT = (await f_wrpd_postData('servicepoint-api/customer/hand-in/validate', DATA, TOKEN, COOKIE)).return_value ;

    if (RESULT[0].key){
        Log.f_msg(PAGE_NAME, "f_scan", RESULT[0].key, 1);
        return null;
    } else {
        return RESULT[0];
    }

}

// https://my.dhlecommerce.nl/servicepoint-api/package/info

// {"barcode":"JVGL06290308000132094552"}

// {
//     "shipper": {
//         "name": "Mewave NL",
//         "address": {
//             "street": "DE RING",
//             "houseNumber": "36",
//             "houseNumberAddition": null,
//             "postalCode": "5261LM",
//             "city": "VUGHT",
//             "country": "NL"
//         },
//         "email": null
//     },
//     "receiver": {
//         "name": "Lisa Killian",
//         "address": {
//             "street": "Gaffel",
//             "houseNumber": "37",
//             "houseNumberAddition": null,
//             "postalCode": "3863VZ",
//             "city": "Nijkerk",
//             "country": "NL"
//         },
//         "notificationMethod": {
//             "email": "lili-an96@hotmail.com"
//         }
//     }
// }


export async function f_handin(TOKEN: string, COOKIE: string, env: any, BARCODES: string[]): Promise<any> {

    // {
    //     "shipper": {
    //         "countryCode": "",
    //         "postalCode": "",
    //         "houseNumber": "",
    //         "houseNumberSuffix": "",
    //         "street": "",
    //         "city": "",
    //         "suburb": "",
    //         "additionalAddressLine": ""
    //     },
    //     "parcels": [
    //         {
    //             "id": "c51b69fc-b8c7-4e7c-9e42-658f7b339cb9",
    //             "parcelKind": "Standard",
    //             "receiverName": "Lisa Killian",
    //             "barcode": "JVGL06290308000132094552"
    //         }
    //     ],
    //     "receipt": {
    //         "email": "ship@instantpack.nl"
    //     }
    // }


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
        "parcels": BARCODES.map((BARCODE: string) => {
            return {
                "id": crypto.randomUUID(),
                "parcelKind": "Standard",
                "receiverName": "",
                "barcode": BARCODE
            }
        }),
        "receipt": {
            "email": env.DHL_EMAIL
        }
    };

    const RESULT = (await f_wrpd_postData('https://my.dhlecommerce.nl/servicepoint-api/customer/hand-in', DATA, TOKEN, COOKIE)).return_value ;

    if (RESULT[0].key){
        Log.f_msg(PAGE_NAME, "f_scan", RESULT[0].key, 1);
        return null;
    } else {
        return RESULT[0];
    }

}