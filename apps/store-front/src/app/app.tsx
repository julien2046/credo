import { type FormEvent, useEffect, useState } from 'react';
import { dataClient } from '@org/platform-amplify';

type Organization = {
  id: string;
  name: string | null;
  slug: string | null;
};

type Product = {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  inStock: boolean | null;
  organizationId: string | null;
};

const getErrorMessage = (errors: unknown) => {
  if (!Array.isArray(errors) || errors.length === 0) return null;

  return errors
    .map((item) =>
      typeof item === 'object' && item && 'message' in item
        ? String((item as { message?: string }).message ?? 'Unknown error')
        : 'Unknown error'
    )
    .join(', ');
};

export function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);

    const [orgResult, productResult] = await Promise.all([
      dataClient.models.Organization.list(),
      dataClient.models.Product.list(),
    ]);

    const orgErrors = getErrorMessage(orgResult?.errors);
    const productErrors = getErrorMessage(productResult?.errors);
    const nextError = [orgErrors, productErrors].filter(Boolean).join(', ');

    if (nextError) {
      setError(nextError);
      return;
    }

    const nextOrganizations = Array.isArray(orgResult?.data)
      ? (orgResult.data as Organization[])
      : [];
    const nextProducts = Array.isArray(productResult?.data)
      ? (productResult.data as Product[])
      : [];

    setOrganizations(nextOrganizations);
    setProducts(nextProducts);
    setSelectedOrganizationId((current) => {
      if (
        current &&
        nextOrganizations.some((organization) => organization.id === current)
      ) {
        return current;
      }

      return nextOrganizations[0]?.id ?? '';
    });
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleOrganizationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = organizationName.trim();
    const slug = organizationSlug.trim().toLowerCase();
    if (!name || !slug) return;

    setError(null);

    try {
      const result = await dataClient.models.Organization.create({ name, slug });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setOrganizationName('');
      setOrganizationSlug('');
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save organization';
      setError(message);
    }
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = productName.trim();
    const description = productDescription.trim();
    const price = Number(productPrice);

    if (!name || !selectedOrganizationId || Number.isNaN(price)) return;

    setError(null);

    try {
      const result = await dataClient.models.Product.create({
        name,
        price,
        organizationId: selectedOrganizationId,
        ...(description ? { description } : {}),
      });
      const message = getErrorMessage(result?.errors);

      if (message) {
        setError(message);
        return;
      }

      setProductName('');
      setProductDescription('');
      setProductPrice('');
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save product';
      setError(message);
    }
  };

  const organizationsById = new Map(
    organizations.map((organization) => [organization.id, organization])
  );

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Test Amplify Data (Organization + Product)</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Ajouter une organisation</h2>
        <form onSubmit={handleOrganizationSubmit} style={{ display: 'grid', gap: 8 }}>
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Nom de l'organisation"
            style={{ padding: '0.6rem' }}
          />
          <input
            value={organizationSlug}
            onChange={(event) => setOrganizationSlug(event.target.value)}
            placeholder="Slug (ex: ma-boutique)"
            style={{ padding: '0.6rem' }}
          />
          <button type="submit">Créer l'organisation</button>
        </form>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Ajouter un produit</h2>
        <form onSubmit={handleProductSubmit} style={{ display: 'grid', gap: 8 }}>
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Nom du produit"
            style={{ padding: '0.6rem' }}
          />
          <input
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
            placeholder="Description"
            style={{ padding: '0.6rem' }}
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={productPrice}
            onChange={(event) => setProductPrice(event.target.value)}
            placeholder="Prix"
            style={{ padding: '0.6rem' }}
          />
          <select
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            style={{ padding: '0.6rem' }}
          >
            <option value="">Choisir une organisation</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!selectedOrganizationId}>
            Créer le produit
          </button>
        </form>
      </section>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'crimson' }}>Erreur: {error}</p>}

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Organisations</h2>
        {!loading && organizations.length === 0 && (
          <p>Aucune organisation pour le moment.</p>
        )}
        <ul>
          {organizations.map((organization) => (
            <li key={organization.id}>
              {organization.name} ({organization.slug})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Produits</h2>
        {!loading && products.length === 0 && <p>Aucun produit pour le moment.</p>}
        <ul>
          {products.map((product) => {
            const organization = product.organizationId
              ? organizationsById.get(product.organizationId)
              : undefined;

            return (
              <li key={product.id}>
                {product.name} - {product.price} {product.currency ?? 'EUR'}{' '}
                {organization ? `(org: ${organization.name})` : ''}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

export default App;
