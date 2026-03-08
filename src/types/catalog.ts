export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  badge?: string;
}

export interface CatalogPage {
  id: string;
  type: 'cover' | 'toc' | 'products' | 'full-image' | 'text' | 'contact';
  title: string;
  subtitle?: string;
  body?: string;
  products?: CatalogProduct[];
}
