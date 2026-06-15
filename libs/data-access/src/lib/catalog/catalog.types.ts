export type Organization = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type Category = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  organizationId: string | null;
};

export type Product = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean | null;
  published: boolean | null;
  organizationId: string | null;
  categoryId: string | null;
};
