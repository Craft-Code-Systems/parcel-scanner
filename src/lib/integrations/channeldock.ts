import * as Log from "../logging";
import * as Wrap from "../wrapper";
import * as Interface from '../interfaces';

const f_wrpd_getData = Wrap.f_asyncResp(f_getData);
const f_wrpd_postData = Wrap.f_asyncResp(f_postData);
const f_wrpd_putData = Wrap.f_asyncResp(f_putData);
const f_wrpd_getChannelDockOrders = Wrap.f_asyncResp(f_getChannelDockOrders);
const f_wrpd_updateOrderChannelDock = Wrap.f_asyncResp(f_updateOrderChannelDock);
const f_wrpd_formatChannelDockOrders = Wrap.f_resp(f_formatChannelDockOrders);
const f_wrpd_formatChannelDockProducts = Wrap.f_resp(f_formatChannelDockProducts);
const f_wrpd_formatChannelDockFreight = Wrap.f_resp(f_formatChannelDockFreight);
const f_wrpd_formatOrderBase = Wrap.f_resp(f_formatOrderBase);
const f_wrpd_formatOrderItems = Wrap.f_resp(f_formatOrderItems);
const f_wrpd_formatProductBase = Wrap.f_resp(f_formatProductBase);

const PAGE_NAME: string = "channeldock";



/**
 * Fetches all shipment information from ChannelDock API
 * @param {Interface.ApiParameters} PARAMETERS - The parameters to filter the shipment info on
 * @returns {Promise<any[]>} - The response from the API
 */
export async function f_getShipmentInfo(PARAMETERS: Interface.ApiParameters, env: any): Promise<any[]> {

    // Fetch the shipment data from ChannelDock API
    return (await f_wrpd_getData('shipment', PARAMETERS, env))?.return_value ?? [];
}

/**
 * Function for getting data from ChannelDock API
 * @param {string} ENDPOINT - The ChannelDock API endpoint
 * @param {Interface.ApiParameters} PARAMETERS - The parameters to filter the data on
 * @returns {Promise<any>} - The response from the API
 */
async function f_getData(ENDPOINT: string, PARAMETERS: Interface.ApiParameters, env: any): Promise<any> {
    const HEADERS: Headers = new Headers();
    HEADERS.append("api_key", env.CHANNELDOCK_API_KEY || '');
    HEADERS.append("api_secret", env.CHANNELDOCK_API_SECRET || '');

    const REQUEST_OPTIONS: RequestInit = {
        method: 'GET',
        headers: HEADERS,
        redirect: 'follow'
    };

    let endpoint_paramters = "";
    switch (ENDPOINT) {
        case "orders":
            endpoint_paramters = f_OrderEndpointParamters(PARAMETERS);
            break;
        case "shipment":
            endpoint_paramters = f_ShipmentEndpointParamters(PARAMETERS);
            break;
        case "inventory":
            endpoint_paramters = f_productEndpointParamters(PARAMETERS);
            break;
            case "inbounds":
            endpoint_paramters = f_freightEndpointParamters(PARAMETERS);
        default:
            break;
    }
    
    let results: any[] = [];
    let page = 1;

    const maxPages = 100; // Safety limit to prevent infinite loops
    while (page <= maxPages) {
        const URL = `https://channeldock.com/portal/api/v2/center/${ENDPOINT}?page=${page}&sort_attr=created_at&sort_dir=DESC${endpoint_paramters}`;
        //console.log(URL);
        try{
        const RESPONSE = await fetch(URL, REQUEST_OPTIONS);
        const responseBody = await RESPONSE.text(); // Read the body once
        if (!RESPONSE.ok) {
            Log.f_msg(PAGE_NAME, "f_getData", 'Failed to get data: ' + RESPONSE.statusText + ' (' + RESPONSE.status + ')' + ' Info: ' + responseBody, 2);
            break;
        }
        

        const DATA = JSON.parse(responseBody);
        results = results.concat(DATA.shipments || DATA.orders || DATA.products || DATA.inbounds);
        if (DATA.shipments_count < 10 || DATA.orders_count < 10 || DATA.products_count < 10 || DATA.inbounds_count < 10) {
            break;
        }
        
        page++;
    } catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_getData", "data fetch error: " + ERROR, 2);
        return null;
    }
    }
    return results;
}


/**
 * Posts data to ChannelDock API
 * @param {string} ENDPOINT - The ChannelDock API endpoint
 * @param {any[]} DATA - The data to be posted
 * @returns {Promise<any[]>} - The response from the API
 */
async function f_postData(ENDPOINT: string, DATA: any[]): Promise<any[]> {
    const HEADERS = new Headers();
    HEADERS.append("api_key", process.env.CHANNELDOCK_API_KEY || '');
    HEADERS.append("api_secret", process.env.CHANNELDOCK_API_SECRET || '');
    HEADERS.append("Content-Type", "application/json");

    const API_URL = `https://channeldock.com/portal/api/v2/center/${ENDPOINT}`; // Endpoint URL
    let response_result_array: any[] = [];
    for (let i = 0; i < DATA.length; i++) {
        const ORDER = JSON.stringify(DATA[i]);
        const OPTIONS: RequestInit = {
            method: 'POST',
            headers: HEADERS,
            body: ORDER,
        };

        try {
            const RESPONSE = await fetch(API_URL, OPTIONS);
            const RESULT = await RESPONSE.json();
            if (!RESPONSE.ok) {
                throw new Error(`ChannelDock API Error: ${RESPONSE.status} - ${RESULT.message}`);
            }

            response_result_array.push(RESULT);
        } catch (ERROR: any) {
            Log.f_msg(PAGE_NAME, "f_postData", "data post error: " + ERROR, 2);
            return null;
        }
    }

    return response_result_array;
}

async function f_putData(ENDPOINT: string, DATA: any[]): Promise<any[]> {
    const HEADERS = new Headers();
    HEADERS.append("api_key", process.env.CHANNELDOCK_API_KEY || '');
    HEADERS.append("api_secret", process.env.CHANNELDOCK_API_SECRET || '');
    HEADERS.append("Content-Type", "application/json");
    const API_URL = `https://channeldock.com/portal/api/v2/center/${ENDPOINT}`; // Endpoint URL
    let response_result_array: any[] = [];
    for (let i = 0; i < DATA.length; i++) {
        const ORDER = JSON.stringify(DATA[i]);
        const OPTIONS: RequestInit = {
            method: 'PUT',
            headers: HEADERS,
            body: ORDER,
        };

        try {
            const RESPONSE = await fetch(API_URL, OPTIONS);
            const RESULT = await RESPONSE.json();
            
            if (!RESPONSE.ok) {
                throw new Error(`ChannelDock API Error: ${RESPONSE.status} - ${RESULT.message}`);
            }

            response_result_array.push(RESULT);
        } catch (ERROR: any) {
            Log.f_msg(PAGE_NAME, "f_postData", "data post error: " + ERROR, 2);
            return null;
        }
    }

    return response_result_array;
}

/**
 * Fetches order information from ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {Promise<any[]>} - The response to the request
 */
export async function f_getChannelDockOrders(PARAMETERS: any): Promise<any[]> {
    // Retrieve orders from ChannelDock API
    const ORDERS = (await f_wrpd_getData('orders', PARAMETERS))?.return_value ?? [];
    
    // Format the orders and return them
    const FORMATTED_ORDERS = f_wrpd_formatChannelDockOrders(ORDERS)?.return_value ?? [];
    return FORMATTED_ORDERS;
}

/**
 * Builds the endpoint parameters for the GET orders endpoint of the ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {string} - The parameters to be added to the URL
 */
function f_OrderEndpointParamters(PARAMTERS: Interface.ApiParameters): string {


    let endpoint_paramters = '';

    // Add the seller id if it is specified
    if (PARAMTERS.seller_id) {
        endpoint_paramters += `&seller_id=${PARAMTERS.seller_id}`;
    }

    // Add the order number if it is specified
    if (PARAMTERS.order_number) {
        endpoint_paramters += `&order_number=${PARAMTERS.order_number}`;
    }

    // Add the order state if it is specified
    if (PARAMTERS.order_status) {
    
        endpoint_paramters += `&order_status=${PARAMTERS.order_status}`;
    }

    // Add the start date if it is specified
    if (PARAMTERS.start_date) {
        endpoint_paramters += `&start_date=${PARAMTERS.start_date}`;
    }

    // Add the end date if it is specified
    if (PARAMTERS.end_date) {
        endpoint_paramters += `&end_date=${PARAMTERS.end_date}`;
    }

    // Add the product id if it is specified
    if (PARAMTERS.product_id) {    
        endpoint_paramters += `&ean=${PARAMTERS.product_id}`;
    }

    // Add the order id if it is specified
    if(PARAMTERS.order_id){
        endpoint_paramters += `&id=${PARAMTERS.order_id}`;
    }
    return endpoint_paramters;

}


/**
 * Builds the endpoint parameters for the GET shipments endpoint of the ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {string} - The parameters to be added to the URL
 */
function f_ShipmentEndpointParamters(PARAMTERS: Interface.ApiParameters): string {

    /**
     * The parameters to be added to the URL
     */
    let endpoint_paramters = '';

    /**
     * Add the seller_id parameter if it is present
     */
    if (PARAMTERS.seller_id) {
        endpoint_paramters += `&seller_id=${PARAMTERS.seller_id}`;
    }

    /**
     * Add the start_date parameter if it is present
     */
    if (PARAMTERS.start_date) {
        endpoint_paramters += `&start_date=${PARAMTERS.start_date}`;
    }

    /**
     * Add the end_date parameter if it is present
     */
    if (PARAMTERS.end_date) {
        endpoint_paramters += `&end_date=${PARAMTERS.end_date}`;
    }

    /**
     * Add the order_id parameter if it is present
     */
    if (PARAMTERS.order_id) {

        endpoint_paramters += `&order_id=${PARAMTERS.order_id}`;
    }

    /**
     * Add the id parameter if it is present
     */
    if(PARAMTERS.shipment_id){
        endpoint_paramters += `&id=${PARAMTERS.shipment_id}`;
    }

    return endpoint_paramters;
}


/**
 * Builds the endpoint parameters for the GET products endpoint of the ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {string} - The parameters to be added to the URL
 */
function f_productEndpointParamters(PARAMTERS: Interface.ApiParameters): string {

    let endpoint_paramters = '';

    // Add the seller id if it is specified
    if (PARAMTERS.seller_id) {
        endpoint_paramters += `&seller_id=${PARAMTERS.seller_id}`;
    }
    // Add the SKU if it is specified
    if (PARAMTERS.product_sku) {
        endpoint_paramters += `&sku=${PARAMTERS.product_sku}`;
    }
    // Add the EAN if it is specified
    if (PARAMTERS.product_ean) {
        endpoint_paramters += `&ean=${PARAMTERS.product_ean}`;
    }
    // Add the product id if it is specified
    if (PARAMTERS.product_id) {
        endpoint_paramters += `&id=${PARAMTERS.product_id}`;
    }

    return endpoint_paramters;
}

/**
 * Builds the endpoint parameters for the GET freight endpoint of the ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {string} - The parameters to be added to the URL
 */
function f_freightEndpointParamters(PARAMTERS: Interface.ApiParameters): string {
    /**
     * The parameters to be added to the URL
     */
    let endpoint_paramters = '';

    /**
     * Add the seller_id parameter if it is present
     */
    if (PARAMTERS.seller_id) {
        endpoint_paramters += `&seller_id=${PARAMTERS.seller_id}`;
    }

    /**
     * Add the type parameter if it is present
     */
    if (PARAMTERS.shipment_type) {
        endpoint_paramters += `&delivery_type=${PARAMTERS.shipment_type}`;
    }

    /**
     * Add the status parameter if it is present
     */
    if (PARAMTERS.shipment_status) {
        endpoint_paramters += `&status=${PARAMTERS.shipment_status}`;
    }

    /**
     * Add the shipment_id parameter if it is present
     */
    if (PARAMTERS.shipment_id) {
        endpoint_paramters += `&id=${PARAMTERS.shipment_id}`;
    }

    return endpoint_paramters;
}
    


/**
 * Fetches product information from ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {Promise<any[]>} - The response to the request
 */
export async function f_getChannelDockProducts(PARAMETERS: any): Promise<any[]> {
    // Get the products from the ChannelDock API.
    const PRODUCTS = (await f_wrpd_getData('inventory', PARAMETERS))?.return_value ?? [];
    
    // Format the products and return them.
    const FORMATTED_PRODUCTS = f_wrpd_formatChannelDockProducts(PRODUCTS)?.return_value ?? [];
    return FORMATTED_PRODUCTS;
}

/**
 * Retrieves freight information from ChannelDock API.
 * @param {Interface.ApiParameters} PARAMETERS - The parameters of the request
 * @returns {Promise<any[]>} - The response to the request
 */
export async function f_getFreight(PARAMETERS: any): Promise<any> {
    // Retrieve the freight from the ChannelDock API.
    const FREIGHT = {inbounds: (await f_wrpd_getData('inbounds', PARAMETERS))?.return_value ?? []};

    return FREIGHT;
}


/**
 * Retrieves the Shopify order ID associated with a given ChannelDock order number.
 * @param {string} order_number - The ChannelDock order number.
 * @returns {Promise<string | { status: string; error: any }>} - The Shopify order ID or an error message.
 */
export async function f_getShopifyOrderId(order_number: string): Promise<string | { status: string; error: any }> {
    const PARAMETERS = {order_id: order_number};
    const DATA = (await f_wrpd_getChannelDockOrders(PARAMETERS))?.return_value ?? [];
    if (!DATA || !DATA[0] || !DATA[0].ext_order_comment || !DATA[0].ext_order_comment.includes("METHODE:")) {
        Log.f_msg(PAGE_NAME, "f_getShopifyOrderId", "Data not found or invalid format", 2);
        return { status: "ERROR", error: "Data not found or invalid format" };
    } else {
        // Parse the Shopify order ID from the ext_order_comment field
        const ORDER_COMMENT = DATA[0].ext_order_comment;
        try {
            // The Shopify order ID is the first 13 characters of the ext_order_comment field
            const shopify_order_id = ORDER_COMMENT.substring(0, 13);
            return shopify_order_id;
        } catch (ERROR) {
            Log.f_msg(PAGE_NAME, "f_getShopifyOrderId", ERROR, 2);
            return { status: "ERROR", error: ERROR };
        }
    }
}



/**
 * Creates an order at ChannelDock.
 * @param {any[]} ORDER_DATA - The order data to be posted.
 * @returns {Promise<{ status: string; response?: any[]; message?: string }>} - The response to the request.
 */
export async function f_createOrderChannelDock(ORDER_DATA: any[]): Promise<{ status: string; response?: any[]; message?: string }> {
    // Post the order to the ChannelDock API.
    return (await f_wrpd_postData('orders', ORDER_DATA))?.return_value ?? {};
}

/**
 * Creates a product at ChannelDock.
 * @param {any[]} PRODUCT_DATA - The product data to be posted.
 * @returns {Promise<{ status: string; response?: any[]; message?: string }>} - The response to the request.
 */
export async function f_createProductChannelDock(PRODUCT_DATA: any[]): Promise<{ status: string; response?: any[]; message?: string }> {
    // Post the product to the ChannelDock API.
    return (await f_wrpd_postData('products', PRODUCT_DATA))?.return_value ?? {};
}

/**
 * Creates a freight at ChannelDock.
 * @param {any[]} FREIGHT_DATA - The freight data to be posted.
 * @returns {Promise<{ status: string; response?: any[]; message?: string }>} - The response to the request.
 */
export async function f_createFreight(FREIGHT_DATA: any[]): Promise<{ status: string; response?: any[]; message?: string }> {
    // Post the freight to the ChannelDock API.
    return (await f_wrpd_postData('inbounds', [FREIGHT_DATA]))?.return_value ?? {};
}

export async function f_updateFreight(FREIGHT_DATA: any[]): Promise<{ status: string; response?: any[]; message?: string }> {
    // Post the freight to the ChannelDock API.
    return (await f_wrpd_putData('inbounds', [FREIGHT_DATA]))?.return_value ?? {};
}



/**
 * Updates a freight at ChannelDock.
 * @param {number} ID - The freight ID.
 * @param {number} PALLETS - The number of pallets.
 * @param {number} BOXES - The number of boxes.
 * @param {string} DELIVERY_DATE - The delivery date.
 * @param {string} DESCRIPTION_EXTRA - The extra description.
 * @param {string} STATUS - The status.
 * @param {any} PRODUCTS - The products.
 * @returns {Promise<{ status: string; response?: any[]; message?: string }>} - The response to the request.
 */

/**
 * Updates a product at ChannelDock.
 * @param {number} PRODUCT_ID - The product ID.
 * @param {number} STOCK - The stock quantity.
 * @param {number} WEIGHT - The weight.
 * @param {number} X_SIZE - The x dimension.
 * @param {number} Y_SIZE - The y dimension.
 * @param {number} Z_SIZE - The z dimension.
 * @param {string} SKU - The SKU.
 * @param {string} REF - The reference.
 * @returns {Promise<{ status: string; response?: any[]; message?: string }>} - The response to the request.
 */
export async function f_updateProductChannelDock(
    PRODUCT_ID: number, STOCK: number, WEIGHT: number, X_SIZE: number, Y_SIZE: number, Z_SIZE: number, SKU: string, REF: string
): Promise<{ status: string; response?: any[]; message?: string }> {
    const PRODUCT_DATA = [{
        "product_id": PRODUCT_ID,
        "stock": STOCK,
        "weight": WEIGHT,
        "x_size": X_SIZE,
        "y_size": Y_SIZE,
        "z_size": Z_SIZE,
        "sku": SKU,
        "ref": REF
     }]

    return (await f_wrpd_postData('inventory', PRODUCT_DATA))?.return_value ?? {};
}

/**
 * Formats an array of orders for posting to ChannelDock.
 * @param {any[]} ORDERS - The orders to format.
 * @returns {any[]} - The formatted orders.
 */
export function f_formatChannelDockOrders(ORDERS: any[]) {
    try {
        if (!Array.isArray(ORDERS)) {
            Log.f_msg(PAGE_NAME, "f_formatChannelDockOrders", "error: Invalid orders data structure", 2);
            return null;
        }

        // Format each order
        const FORMATTED_ORDERS = ORDERS.map(order => f_wrpd_formatOrderBase(order)?.return_value ?? {});

        // Iterate over all orders and ensure the products array is initialized
        FORMATTED_ORDERS.forEach((order) => {
            if (!Array.isArray(order.order_products)) {
                order.order_products = [];
            }
        });

        return FORMATTED_ORDERS
    } catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatChannelDockOrders", "error: " + ERROR, 2);
        return null;
    }
}

/**
 * Formats an array of products for posting to ChannelDock.
 * @param {any[]} PRODUCTS - The products to format.
 * @returns {any[]} - The formatted products.
 */
export function f_formatChannelDockProducts(PRODUCTS: any[]) {
    try {
        if (!Array.isArray(PRODUCTS)) {
            Log.f_msg(PAGE_NAME, "f_formatChannelDockProducts", "error: Invalid products data structure", 2);
            return null;
        }

        // Format each order
        const FORMATTED_PRODUCTS = PRODUCTS.map(product => f_wrpd_formatProductBase(product)?.return_value ?? {});

        // Iterate over all products and ensure the products array is initialized
        FORMATTED_PRODUCTS.forEach((product) => {
            if (!Array.isArray(product.products)) {
                product.products = [];
            }
        });

        return FORMATTED_PRODUCTS
    } catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatChannelDockProducts", "error: " + ERROR, 2);
        return null;
    }
}

/**
 * Formats an array of freight objects for posting to ChannelDock.
 * @param {any[]} FREIGHT - The freight objects to format.
 * @returns {any[]} - The formatted freight objects.
 */
export function f_formatChannelDockFreight(FREIGHT: any[]) {
    try {
        if (!Array.isArray(FREIGHT)) {
            Log.f_msg(PAGE_NAME, "f_formatChannelDockFreight", "error: Invalid freight data structure", 2);
            return null;
        }

        // Format each freight object
        const FORMATTED_FREIGHT = FREIGHT.map(freight => f_wrpd_formatFreightBase(freight)?.return_value ?? {});


        return FORMATTED_FREIGHT
    } catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatChannelDockFreight", "error: " + ERROR, 2);
        return null;
    }
}


/**
 * Formats a ChannelDock order object into a custom structure.
 * @param {any} ORDER - The order data to format.
 * @returns {any} - The formatted order object.
 */
function f_formatOrderBase(ORDER: any) {
    try{
        // Create a formatted order object from the given data
        const LINE_ITEMS_FORMATTED = f_wrpd_formatOrderItems(ORDER)?.return_value ?? [];
        return {
            ext_cdk_order_id: ORDER.id,
            ext_plt_order_id: ORDER.order_id,
            order_create_date: ORDER.order_date,
            order_update_date: ORDER.updated_at,
            order_ship_date: ORDER.ship_on_date || "0000-00-00 00:00:00",
            order_weight: (ORDER.total_weight / 1000).toFixed(2),
            order_status: ORDER.financial_status,
            order_products: LINE_ITEMS_FORMATTED,  // Only set once here
            platform_name: ORDER.channel_name,
            consumer_zip_code: ORDER.shipping_zip_code,
            consumer_city: ORDER.shipping_city,
            consumer_firstname: ORDER.shipping_first_name,
            consumer_email: ORDER.shipping_email,
            consumer_phone: ORDER.shipping_phone_number,
            consumer_street: ORDER.shipping_street,
            consumer_house_number: ORDER.shipping_house_number,
            consumer_state: ORDER.shipping_region || "",
            consumer_house_number_ex: ORDER.shipping_house_number_ext || "",
            consumer_company_name: ORDER.shipping_company || "",
            consumer_lastname: ORDER.shipping_last_name,
            ext_cdk_seller_id: ORDER.seller_id,
            consumer_country_code: ORDER.shipping_country_code,
            ext_shipping_method: ORDER.shipping_service,
            ext_order_comment: ORDER.extra_comment
        };
    }catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatOrderBase", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}


/**
 * Formats the order items of an order.
 * @param {any} ORDER - The order data to format.
 * @returns {any} - An array of formatted order items.
 */
function f_formatOrderItems(ORDER: any): any {
    try {
        // Map the order items to a formatted array
        const LINE_ITEMS = ORDER.order_products.map((item: any) => ({
            ext_cdk_order_id: ORDER.id,
            ext_cdk_product_id: item.id,
            ext_cdk_item_id: item.id,
            product_ean: item.ean,
            product_sku: item.product.sku || "",
            product_name: item.title,
            product_qty: item.quantity,
            order_delivery_date: item.delivery_period || "0000-00-00 00:00:00",
            product_status: item.is_shipped || 0,
            order_cancellation_req: item.cancellation_request || 0,
            label_id: item.shipment_label_id || null,
            fulfillment_status: item.fulfillment_status || "default"
        }));
        return LINE_ITEMS;
    } catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatOrderItems", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}


/**
 * Formats a ChannelDock product object into a custom structure.
 * @param {any} PRODUCT - The product data to format.
 * @returns {any} - The formatted product object.
 */
function f_formatProductBase(PRODUCT: any) {
    try{
        // Create a formatted product object from the given data
        return {
            ext_cdk_seller_id: PRODUCT.seller_id, // The seller ID from ChannelDock
            ext_cdk_product_id: PRODUCT.id, // The product ID from ChannelDock
            product_ean: PRODUCT.ean, // The EAN of the product
            product_sku: PRODUCT.sku, // The SKU of the product
            product_name: PRODUCT.title, // The name of the product
            product_qty: PRODUCT.stock, // The current stock of the product
            product_weight: PRODUCT.weight, // The weight of the product
            product_width: PRODUCT.x_size, // The width of the product
            product_height: PRODUCT.y_size, // The height of the product
            product_length: PRODUCT.z_size, // The length of the product
            product_ref: PRODUCT.product_reference, // The product reference
            product_image: PRODUCT.img_url // The URL of the product image
        };
    }catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatProductBase", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}


/**
 * Formats a ChannelDock freight item into a custom structure.
 * @param {any} FREIGHT - The ChannelDock freight item to format.
 * @returns {any} - The formatted ChannelDock freight item.
 */
function f_formatFreightBase(FREIGHT: any) {
    try{
        // Create a formatted freight object from the given data
        const PRODUCTS = f_wrpd_formatFreightItems(FREIGHT.items)?.return_value ?? {};
        return {
            ext_cdk_seller_id: FREIGHT.seller_id, 
            ext_cdk_freight_id: FREIGHT.id, 
            freight_reference: FREIGHT.ref || "", 
            freight_comment: FREIGHT.extra_description || "",
            freight_pallets_qty: FREIGHT.pallets || 0,
            freight_box_qty: FREIGHT.boxes || 0,
            freight_date_delivery: FREIGHT.delivery_date || "0000-00-00 00:00:00",
            freight_date_created: FREIGHT.created_at || "0000-00-00 00:00:00",
            freight_date_stocked: FREIGHT.stocked_at || "0000-00-00 00:00:00",
            freight_ext_cdk_supplier_id: FREIGHT.supplier_id,
            freight_products: PRODUCTS
        };
    }catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatFreightBase", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}


/**
 * Formats an array of ChannelDock freight items into a custom structure.
 * @param {any[]} FREIGHT_ITEMS - The array of ChannelDock freight items to format.
 * @returns {any[]} - The formatted array of ChannelDock freight items.
 */
function f_formatFreightItems(FREIGHT_ITEMS: any[]) {
    try{
        return FREIGHT_ITEMS.map((item: any) => ({
            ext_cdk_product_id: item.product_id,
            product_ean: item.ean,
            product_sku: item.sku || "",
            product_qty: item.amount,
            product_stocked: item.stocked
        }));
    }catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_formatFreightItems", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}

export async function f_updateOrderChannelDock(CD_ORDER_ID: any, TNT: any, CARRIER: any, TNT_URL: any, PRODUCTS: any) {
    try{
        const ORDER_FORMATTED = [
            {
              orders: [
                {
                  order_id: CD_ORDER_ID,
                  track_and_trace: TNT,
                  carrier: CARRIER,
                  track_and_trace_url: TNT_URL,
                  order_products: PRODUCTS.map((product: { product_id: number }) => ({
                    id: product.product_id,
                  })),
                },
              ],
            },
          ];
        const POST_RESPONSE = (await f_wrpd_postData('shipment', ORDER_FORMATTED))?.return_value ?? {};
        return POST_RESPONSE;
    }catch (ERROR) {
        Log.f_msg(PAGE_NAME, "f_updateOrderChannelDock", "An error occurred during formatting: " + ERROR, 2);
        return null;
    }
}




