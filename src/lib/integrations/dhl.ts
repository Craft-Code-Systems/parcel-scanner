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


    // const options = {
    //     method: 'POST',
    //     headers: {
    //       cookie: 'X-AUTH-TOKEN=eyJ1c2VySWQiOiJkMmMxZGM3Yi0wNDAwLTRhNTMtYmRkYS05MmNiNGY2NzY0YWIiLCJuYW1lIjp7ImZpcnN0TmFtZSI6Ikluc3RhbnRwYWNrIiwibGFzdE5hbWUiOiJTUCJ9LCJlbWFpbCI6ImluZm9AaW5zdGFudHBhY2submwiLCJyb2xlcyI6WyJBcGlHYXRld2F5VXNlciIsIlNlcnZpY2Vwb2ludE1hbmFnZXIiLCJTaGlwbWVudHNNYW5hZ2VyVXNlciIsIlVzZXIiXSwicGFyY2VsU2hvcFBzZktleSI6Ik5MLTQxOTEwMSIsInBhcmNlbFNob3BTZXJ2aWNlcyI6WyJjb25zdW1lci1pbnRlcnZlbnRpb25zIiwiZmlyc3RtaWxlIiwibGFzdG1pbGUiLCJvdGMiLCJwcmludGxlc3MiLCJzcGEiXSwiaXNzdWVkQXQiOjE3Mzg2NTk0ODQ3NTUsImV4cGlyZXNBdCI6MTc0NjQzNTQ4NDc1NSwib3JpZ2luIjoiZGhsIiwidXNlclR5cGUiOiJwYXJjZWxTaG9wIn07MTE4MTEzLTQ4MjkyMDQ5NTYzNS0xMTczNi0zNTIwLTkzLTQyNzYzMzE0LTEwNDcwLTU5LTMyLTI1LTMxLTExODE4MjUxNjMzNjU0MC0yNjMx; XSRF-TOKEN=-2310315-10514118-83-89-32-9749-1115241-1-126-4212066-1771-106-1036865-119114-318911619-73; X-MIGRATED-TO-HOST=; _cfuvid=XkBsTTSsuiJo1iX4NQ2BD5NThw39FAPQHGbawP17Xuk-1738663701693-0.0.1.1-604800000',
    //       'Content-Type': 'application/json',
    //       'User-Agent': 'insomnia/10.3.0',
    //       'x-xsrf-token': '-2310315-10514118-83-89-32-9749-1115241-1-126-4212066-1771-106-1036865-119114-318911619-73'
    //     },
    //     body: '{"barcode":"JVGL06213730001221178493"}'
    //   };
      
    //   await fetch('https://my.dhlecommerce.nl/servicepoint-api/customer/hand-in/validate', options)
    //     .then(response => response.json())
    //     .then(response => console.log("response: ", response))
    //     .catch(err => console.error("error", err));

    const RESULT = (await f_wrpd_postData('servicepoint-api/customer/hand-in/validate', DATA, TOKEN, COOKIE)).return_value ;

    if (RESULT[0].key){
        Log.f_msg(PAGE_NAME, "f_scan", RESULT[0].key, 1);
        return null;
    } else {
        return RESULT[0];
    }

}