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

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string | null;
  imageUrl: string | null;
  inStock: boolean | null;
  organizationId: string;
  categoryId: string | null;
};
