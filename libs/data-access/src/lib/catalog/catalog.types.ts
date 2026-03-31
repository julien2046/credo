export type Organization = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type Product = {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  inStock: boolean | null;
  organizationId: string | null;
};
