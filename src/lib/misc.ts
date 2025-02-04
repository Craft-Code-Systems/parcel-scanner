import * as Log from "./logging";
const PAGE_NAME: string = "misc";

// Get date and time like 01-01-2023 12:00:00
export function f_getDateAndTime(): string | null {
    try {
        const DATE = new Date();
        const YEAR = DATE.getFullYear();
        const MONTH = String(DATE.getMonth() + 1).padStart(2, "0");
        const DAY = String(DATE.getDate()).padStart(2, "0");
        const HOURS = String(DATE.getHours()).padStart(2, "0");
        const MINUTES = String(DATE.getMinutes()).padStart(2, "0");
        const SECONDS = String(DATE.getSeconds()).padStart(2, "0");
        const DATE_FORMATTED = `${DAY}-${MONTH}-${YEAR}_${HOURS}:${MINUTES}:${SECONDS}`;
        return DATE_FORMATTED;
    } catch (ERROR: any) {
        Log.f_msg(PAGE_NAME, "f_getDateAndTime", "Not able to get date and time: " + ERROR, 3);
        return null;
    }
}

export const HEADERS = {
    'Access-Control-Allow-Origin': '*', // Replace '*' with the client origin in production
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true', // Needed if credentials like cookies or tokens are sent
};
