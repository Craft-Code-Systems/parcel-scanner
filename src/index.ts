/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as Log from "./lib/logging";
import * as Wrap from "./lib/wrapper";
import * as Interface from './lib/interfaces';
import { f_getShipmentInfo } from './lib/integrations/channeldock';
import * as DHL from './lib/integrations/dhl';

const PAGE_NAME: string = "index";

const f_wrpd_getShipmentInfo = Wrap.f_asyncResp(f_getShipmentInfo);

export default {
	async fetch(request, env, ctx): Promise<Response> {
		
		//Get date of today in format 2024-10-22 00:00:00
		const DATA = new Date();
		const TODAY = DATA.getFullYear() + "-" + (DATA.getMonth() + 1) + "-" + (DATA.getDate()) + " 00:00:00";
		const TOMORROW = DATA.getFullYear() + "-" + (DATA.getMonth() + 1) + "-" + (DATA.getDate() + 1) + " 00:00:00";

		const PARAMETERS: Interface.ApiParameters = {
			seller_id:  2952,
			start_date: TODAY,
			end_date: TOMORROW
			// shipment_method: url?.searchParams.get('shipment_method') ?? "",
		};
	
		const SHIPMENT_DATA: any[]  = (await f_wrpd_getShipmentInfo(PARAMETERS, env))?.return_value ?? [];

		if (SHIPMENT_DATA.length == 0) {
			Log.f_msg(PAGE_NAME, "f_scan", "No shipments found", 2);
			return new Response('No shipments found', { status: 404 });
		}

		const LOGIN_RESPONSE: string = await DHL.f_login(env);
		const TOKEN: string = LOGIN_RESPONSE[0];
		const COOKIE: string = LOGIN_RESPONSE[1];
		let barcodes: string[] = [];
try{
		for (let i = 0; i < SHIPMENT_DATA.length; i++) {
			await DHL.f_scan(TOKEN, COOKIE, SHIPMENT_DATA[i].track_and_trace);
			barcodes.push(SHIPMENT_DATA[i].track_and_trace);
		}
	} catch (ERROR: any) {
		Log.f_msg(PAGE_NAME, "f_scan", ERROR, 2);

		const URL = 'https://hooks.slack.com/services/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';
		const DATA = { text: "Parcel Scanner Error: " + ERROR };
		// await fetch(URL, {
		// 	method: 'POST',
		// 	headers: {
		// 	  'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify(DATA)
		//   });


		return new Response("ERROR: " + ERROR, { status: 500, statusText: ERROR });
	}

	try{
		await DHL.f_handin(TOKEN, COOKIE, env, barcodes);
	} catch (ERROR: any) {
		Log.f_msg(PAGE_NAME, "f_handin", ERROR, 2);

		const URL = 'https://hooks.slack.com/services/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';
		const DATA = { text: "Parcel Scanner Error: " + ERROR };
		// await fetch(URL, {
		// 	method: 'POST',
		// 	headers: {
		// 	  'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify(DATA)
		//   });


		return new Response("ERROR: " + ERROR, { status: 500, statusText: ERROR });

	}


		return new Response('DONE');
	},
} satisfies ExportedHandler<Env>;
