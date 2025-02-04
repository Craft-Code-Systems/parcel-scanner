import * as Log from "./logging";
const PAGE_NAME: string = "wrapper";

// Wraps an async function and handles its response.
export function f_asyncResp(FUNCTION: (...args: any[]) => Promise<any>) {
    return async function(...args: any[]) {
      try {
        const RESULT = await FUNCTION(...args);
        // Check if result is not null, undefined, or an empty array
        if (RESULT === null || RESULT === undefined || RESULT.length === 0) {
          Log.f_msg(PAGE_NAME, FUNCTION.name, "Result is null, undefined or empty", 2);
          return { status: "error", error: `An unexpected error occurred at function: [${FUNCTION.name}] With args: ${args}` };
        }
        return { status: "success", return_value: RESULT };
      } catch (ERROR: any) {
        Log.f_msg(PAGE_NAME, FUNCTION.name, ERROR, 2);
        return { status: "error", error: ERROR.message || `An unexpected error occurred at function: [${FUNCTION.name}] With args: ${args}` };
      }
    };
  }
  
  // Wraps a synchronous function and handles its response.
  export function f_resp(FUNCTION: (...args: any[]) => any) {
    return function(...args: any[]) {
      try {
        const RESULT = FUNCTION(...args);
        if (RESULT === null || RESULT === undefined || RESULT.length === 0) {
          Log.f_msg(PAGE_NAME, FUNCTION.name, "Result is null, undefined or empty", 2);
          return { status: "error", error: `An unexpected error occurred at function: [${FUNCTION.name}] With args: ${args}` };
        }
        return { status: "success", return_value: RESULT };
      } catch (ERROR: any) {
        Log.f_msg(PAGE_NAME, FUNCTION.name, ERROR, 2);
        return { status: "error", error: ERROR.message || `An unexpected error occurred at function: [${FUNCTION.name}] With args: ${args}` };
      }
    };
  }