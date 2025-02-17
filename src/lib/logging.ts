import * as Misc from "./misc";
// import { browser } from '$app/environment';

let log_mode: number = 1;

// Sends a log message to the console and optionally triggers a modal or API logging.
export async function f_msg(
  LOG_PAGE: string,
  LOG_FUNCTION?: string | number,
  LOG_MESSAGE?: string | number,
  LOG_TYPE?: number
) {
  let system_os: string = "UNKNOWN";
  let system_browser: string = "UNKNOWN";

  // try {
  //   if (browser) {
  //     // Get user's operating system (only OS name)
  //     system_os = window.navigator.platform;
  //     // Get user's browser
  //     system_browser = window.navigator.appCodeName;
  //   }
  // } catch {
  //   // Defaults are already set
  // }

  // Create log message
  const LOG_MSG_SHORT: string = `[${LOG_PAGE}]_[${LOG_FUNCTION}]_msg: ${LOG_MESSAGE}`;
  const LOG_MSG_LONG: string = `${Misc.f_getDateAndTime()}_${system_os}_${system_browser}_${LOG_MSG_SHORT}`;

  switch (LOG_TYPE) {
    case 1:
      console.log(LOG_MSG_SHORT);
      break;
    case 2:
      console.error(LOG_MSG_LONG);
      f_watchDog(LOG_MSG_SHORT);
      break;
    case 3:
      console.error(LOG_MSG_LONG);
      f_watchDog(LOG_MSG_SHORT);
      break;
    case 4:
      console.warn(LOG_MSG_SHORT);
      break;
    default:
      console.log(LOG_MSG_SHORT);
      break;
  }

  await f_apiLogging(LOG_MSG_LONG, LOG_TYPE ?? 0, log_mode);
}

// Sends the log message to an API endpoint if certain conditions are met.
async function f_apiLogging(LOG_MSG_LONG: string, LOG_TYPE: number, LOG_MODE: number) {
  try {
    // Check which log mode is set
    if (LOG_TYPE === 2 || (LOG_TYPE === 1 && LOG_MODE === 1) || LOG_TYPE === 3) {
      // Create log object
      const LOG_OBJECT = {
        log_data: LOG_MSG_LONG,
        log_mode: LOG_TYPE,
      };
    //   const RESPONSE = await f_wrapped_postToApi("v0/logging", LOG_OBJECT);
    //   if (RESPONSE.error) {
    //     console.error(RESPONSE.error);
    //   }
    }
  } catch (ERROR) {
    console.error(ERROR);
  }
}

async function f_watchDog(MESSAGE){
      const slackURL =
        "https://hooks.slack.com/services/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";
      const payload = { text: MESSAGE };
      await fetch(slackURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
}
