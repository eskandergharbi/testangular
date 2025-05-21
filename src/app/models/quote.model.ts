import { Client } from './client.model';
import { Product } from './product.model';

// In your quote.model.ts
export interface QuoteProduct {
  id?: number;
  products: number;
  document?: number;
  product?: Product;
  quantity: number;  // Make quantity required
  prix: number;
}

export interface Quote {
  id?: number;
  client_id: number;
  tva: number;
  taxe: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  reference?: string;
  produitsdocuments?: QuoteProduct[];  // Ensure this matches the API response
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