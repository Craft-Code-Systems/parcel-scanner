export interface ApiParameters{
    seller_id?: number;
    order_number?: string;
    order_status?: string;
    order_id?: number;
    start_date?: string;
    end_date?: string;
    product_id?: number;
    product_ean?: string;
    product_sku?: string;
    shipment_id?: number;
    shipment_status?: string;
    shipment_type?: string;
    shipment_method?: string;
    shop?: string;
    shop_name?: string;
}

export interface Seller{
    seller_name: string;
    ext_cdk_seller_id: number;
    seller_company: string;
    seller_sender_id_sendcloud: number;
    seller_sender_id_qls: number;
    seller_sender_id_myparcel: number;
    api_access_token_bol: string;
    api_key_bol: string;
    api_secret_bol: string;

}

export interface SellerData{
    sellers: Seller[];
}


export interface FreightProduct {
    ext_cdk_product_id: number; // External ChannelDock product ID
    product_ean: string; // Product EAN code
    product_sku: string; // Product SKU
    product_qty: number; // Quantity of the product
    product_stocked: number; // Stocked status of the product
}

export interface Freight {
    ext_cdk_seller_id: number; // External ChannelDock seller ID
    ext_cdk_freight_id: number; // External ChannelDock freight ID
    freight_reference: string; // Reference for the freight
    freight_comment: string; // Comment about the freight
    freight_pallets_qty: number; // Quantity of pallets
    freight_box_qty: number; // Quantity of boxes
    freight_date_delivery: string; // Delivery date in YYYY-MM-DD format
    freight_date_created: string; // Creation date in YYYY-MM-DD HH:mm:ss format
    freight_date_stocked: string; // Stocked date in YYYY-MM-DD HH:mm:ss format
    freight_ext_cdk_supplier_id: number; // External ChannelDock supplier ID
    freight_status: string; // Status of the freight
    freight_products: FreightProduct[]; // List of products in the freight
}

export interface FreightData {
    freight: Freight[]; // List of freights
}
export interface ErrorResponse {
    ERROR: string; // Detailed error message
    code: number; // Error code (e.g., 0 for general errors)
}

export interface ErrorWithStatus {
    error: ErrorResponse; // Error details
    status: number; // HTTP status code (e.g., 500)
}

export interface ChannelDockItem {
    ean: string;
    amount: number;
    is_stocked: number;
    ext_cdk_product_id?: number;
    sku?: string;
  }
  
  export interface ChannelDockInbound {
    id?: number;
    inbound_id?: number;
    seller_id: number;
    ref: string;
    status: string;
    delivery_date: string;
    extra_description: string;
    pallets: number;
    boxes: number;
    stocked_at: string;
    created_at: string;
    supplier_id: number;
    items: ChannelDockItem[];
  }


  export interface ChannelDockInboundData {
    inbounds: ChannelDockInbound[];
  }

  export interface OrderPage {
    ext_cdk_order_id: number;
    ext_plt_order_id: string;
    platform_name: string;
    order_create_date: Date;
    order_ship_date: Date;
    order_scan_date: Date;
    order_status: string;
    consumer_country_code: string;
    consumer_firstname: string;
    consumer_lastname: string;
    consumer_country_flag: string;
    order_transporter_image: string;
    order_transporter_name: string;
  }
  
  export interface OrderPageData{
    orders: OrderPage[];
  }

  export interface Transporter {
    name: string;
    image: string;
  }

  export interface OrderModal {
    ext_cdk_order_id: number;
    ext_plt_order_id: string;
    platform_name: string;
    order_create_date: Date;
    order_ship_date: Date;
    order_scan_date: Date;
    order_status: string;
    consumer_country_code: string;
    consumer_firstname: string;
    consumer_lastname: string;
    consumer_city: string;
    consumer_postal_code: string;
    consumer_street: string;
    consumer_house_number: number;
    consumer_house_number_ext: string;
    consumer_phone: string;
    consumer_email: string;
    order_price: number;
    order_transporter_image: string;
    order_transporter_name: string;
    order_items: OrderItems[];
  }

  export interface OrderItems {
    ext_cdk_product_id: number;
    product_ean: string;
    product_sku: string;
    product_qty: number;
    product_reference: string;
    product_name: string;
    product_image: string;
    product_price: number;
    product_weight: number;
    product_width: number;
    product_height: number;
    product_length: number;
    order_delivery_date: Date;
    order_cancellation_req: number;
    product_status: string;
    label_id: string;
    fulfillment_status: number;
  }

  
  export interface OrderModalData{
    orders: OrderModal[];
  }

  export interface fedexLabelCost{
    country: string;
    parcel_type: string;
    weight: number;
    cost: number;
    qty: number;
    order_id: number;
    tnt: string;
  }

  export interface fedexTotalLabelCost{
    country: string;
    parcel_type: string;
    weight: number;
    cost: number;
    qty: number;
  }

  export interface fedexLabels{
    openLabels: fedexLabelCost[];
    closedLabels: fedexLabelCost[];
    closed_labels_cost: fedexTotalLabelCost;
  }

