// Espelho manual dos modelos Pydantic em backend/models/shop.py.
// Nada infere entre Python e TypeScript — mantenha os dois em sincronia na MESMA edição.

export interface Neighborhood {
  name: string;
  surcharge: number;
  prazo: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  badge: string;
}

export type StoreType = "pequeno_negocio" | "loja_ancora";

export interface Store {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  store_type: StoreType;
  tagline: string;
  description: string;
  image_url: string;
  neighborhood: string;
  address: string;
  phone: string;
  rating: number;
  reviews_count: number;
  delivery_fee: number;
  free_delivery_min: number;
  min_order: number;
  pickup_available: boolean;
  opening_hours: string;
  is_open: boolean;
  verified: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  unit: string;
  featured: boolean;
  available: boolean;
  created_at: string;
}

export interface ProductDetail extends Product {
  store: Store | null;
}

export interface OrderItem {
  product_id: string;
  store_id: string;
  store_name: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface ShippingLine {
  store_id: string;
  store_name: string;
  fee: number;
}

export type PaymentMethod = "pix" | "card" | "delivery";

export type OrderStatus =
  | "aguardando_pagamento"
  | "preparando"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export interface Order {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  neighborhood: string;
  address: string;
  pickup: boolean;
  payment_method: PaymentMethod;
  payment_status: "aguardando" | "pago" | "na_entrega";
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping_total: number;
  total: number;
  shipping_breakdown: ShippingLine[];
  pix_txid: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  created_at: string;
  business_name: string;
  owner_name: string;
  phone: string;
  category_id: string;
  neighborhood: string;
  message: string;
}
