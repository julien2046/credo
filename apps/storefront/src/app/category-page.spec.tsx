import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it } from 'vitest';
import { CategoryPage, type StorefrontProductContent } from '@credo/feature';
import { clientATheme } from '@credo/themes-client-a';

function product(
  title: string,
  price: number,
  inStock: boolean
): StorefrontProductContent {
  return {
    id: title,
    slug: title,
    title,
    summary: '',
    imageUrl: null,
    categorySlug: 'mobilier',
    currency: 'CAD',
    price,
    inStock,
  };
}
const products = [
  product('Table', 120, true),
  product('Banc', 45, false),
  product('Lampe', 9.5, true),
  product('Vase', 9.5, true),
];

function page(items = products, slug = 'mobilier') {
  return (
    <MemoryRouter>
      <CategoryPage
        theme={clientATheme}
        content={{
          category: { id: slug, slug, title: slug, summary: '' },
          products: items,
        }}
      />
    </MemoryRouter>
  );
}
const titles = () =>
  screen.queryAllByRole('heading', { level: 2 }).map((el) => el.textContent);
const toggle = () =>
  fireEvent.click(screen.getByRole('checkbox', { name: 'En stock seulement' }));
const sort = (value: string) =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Trier par prix' }), {
    target: { value },
  });

afterEach(cleanup);

it('combines availability and numeric price order and can restore the catalogue order', () => {
  render(page());
  expect(titles()).toEqual(['Table', 'Banc', 'Lampe', 'Vase']);
  sort('asc');
  expect(titles()).toEqual(['Lampe', 'Vase', 'Banc', 'Table']);
  toggle();
  expect(titles()).toEqual(['Lampe', 'Vase', 'Table']);
  expect(screen.getByRole('status').textContent).toBe('3 produits');
  sort('desc');
  expect(titles()).toEqual(['Table', 'Lampe', 'Vase']);
  toggle();
  expect(titles()).toEqual(['Table', 'Banc', 'Lampe', 'Vase']);
  sort('asc');
  sort('catalog');
  expect(titles()).toEqual(['Table', 'Banc', 'Lampe', 'Vase']);
});

it('can show all products again when no product is in stock', () => {
  render(page([product('Banc', 45, false)]));
  toggle();
  expect(titles()).toEqual([]);
  expect(
    screen.getByText('Aucun produit en stock dans cette catégorie.')
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Afficher tous les produits' })
  );
  expect(titles()).toEqual(['Banc']);
  expect(screen.getByRole('status').textContent).toBe('1 produit');
});

it('starts each category with its original listing and omits controls for an empty catalogue', () => {
  const view = render(page());
  toggle();
  sort('asc');
  view.rerender(page(products, 'maison'));
  expect(titles()).toEqual(['Table', 'Banc', 'Lampe', 'Vase']);
  view.rerender(page([], 'vide'));
  expect(
    screen.getByText(
      'Aucun produit publié dans cette catégorie pour le moment.'
    )
  ).toBeTruthy();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByRole('checkbox')).toBeNull();
});
