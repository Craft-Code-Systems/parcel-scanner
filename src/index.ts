/**
 * Welcome to Cloudflare Workers!
 * This worker now handles both HTTP fetch requests and scheduled (cron) events.
 */

import * as Log from "./lib/logging";
import * as Wrap from "./lib/wrapper";
import * as Interface from "./lib/interfaces";
import { f_getShipmentInfo } from "./lib/integrations/channeldock";
import * as DHL from "./lib/integrations/dhl";

const PAGE_NAME: string = "index";
const f_wrpd_getShipmentInfo = Wrap.f_asyncResp(f_getShipmentInfo);
const SELLER_IDS = [3477, 1673];

/**
 * Extracted business logic to process shipments.
 * This function can be invoked from both the fetch and scheduled handlers.
 */
async function processShipments(env: any): Promise<string> {
  // Get today's date in format: YYYY-M-D 00:00:00

  for (let i = 0; i < SELLER_IDS.length; i++) {
  
    const now = new Date();
    const TODAY = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 00:00:00`;
    const TOMORROW = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1} 00:00:00`;

    const PARAMETERS: Interface.ApiParameters = {
      seller_id: SELLER_IDS[i],
      start_date: TODAY,
      end_date: TOMORROW,
    };

    const shipmentResponse = await f_wrpd_getShipmentInfo(PARAMETERS, env);
    const SHIPMENT_DATA: any[] = shipmentResponse?.return_value ?? [];

    if (SHIPMENT_DATA.length === 0) {
      Log.f_msg(PAGE_NAME, "f_scan", "No shipments found", 2);
      return "No shipments found";
    }

    // Log in to DHL
    const LOGIN_RESPONSE: string = await DHL.f_login(env);
    const TOKEN: string = LOGIN_RESPONSE[0];
    const COOKIE: string = LOGIN_RESPONSE[1];
    let barcodes: string[] = [];

    try {
      for (let i = 0; i < SHIPMENT_DATA.length; i++) {
        await DHL.f_scan(TOKEN, COOKIE, SHIPMENT_DATA[i].track_and_trace);
        barcodes.push(SHIPMENT_DATA[i].track_and_trace);
      }
    } catch (ERROR: any) {
      Log.f_msg(PAGE_NAME, "f_scan", ERROR, 2);
      // Rethrow so that both scheduled and fetch handlers can handle the error similarly.
      throw new Error("Error in DHL.f_scan: " + ERROR);
    }

    try {
      await DHL.f_handin(TOKEN, COOKIE, env, barcodes);
    } catch (ERROR: any) {
      Log.f_msg(PAGE_NAME, "f_handin", ERROR, 2);
      throw new Error("Error in DHL.f_handin: " + ERROR);
    }
  }
  return "DONE";
}

export default {
  /**
   * HTTP fetch handler – allows you to trigger the worker via an HTTP request.
   */
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      const result = await processShipments(env);
      return new Response(result);
    } catch (e: any) {
      return new Response("ERROR: " + e, { status: 500, statusText: e.toString() });
    }
  },

  /**
   * Scheduled handler – invoked automatically according to your cron schedule.
   * Note: Scheduled events do not return an HTTP response.
   */
  async scheduled(event: any, env: any, ctx: ExecutionContext): Promise<void> {
    try {
      const result = await processShipments(env);
      console.log("Scheduled event completed:", result);
    } catch (e: any) {
      console.error("Scheduled event error:", e);
    }
  },
} satisfies ExportedHandler<Env>;
