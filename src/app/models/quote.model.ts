import { Client } from './client.model';
import { Product } from './product.model';

export interface QuoteProduct {
  prix: number;
  quantity: number;
  id?: number;
  products: number;
  document: number;
  product: Product;
  created_at?: string;
  updated_at?: string;
}

export interface Quote {
  id?: number;
  client_id: number;
  tva: number;
  taxe: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  client?: Client;
  produitsdocuments?: QuoteProduct[];
  reference?: string;
  status?: string;
}

export interface QuoteResponse {
  current_page: number;
  data: Quote[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}