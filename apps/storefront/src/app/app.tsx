import { type SubmitEvent, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import { dataClient } from '@credo/platform-amplify';
import type {
  AdminCatalogProps,
  AdminGuardProps,
  AppProps,
  AuthState,
  CardProps,
  Organization,
  OtpStep,
  Product,
  RoutePlaceholderProps,
  ServerRoutePageProps,
  SignInCardProps,
  ThemeOnlyProps,
} from './app.types';
import { getErrorMessage, resolveRoleFromSession } from './app.utils';

function Card({ title, theme, children }: CardProps) {
  return (
    <section
      style={{
        marginBottom: '1rem',
        padding: '1.1rem',
        borderRadius: 20,
        border: `1px solid ${theme.borderColor}`,
        background: theme.surface,
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.06)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function SignInCard({
  theme,
  otpStep,
  email,
  code,
  error,
  loading,
  onChangeEmail,
  onChangeCode,
  onRequestCode,
  onConfirmCode,
}: SignInCardProps) {
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 0.9rem',
    borderRadius: 14,
    border: `1px solid ${theme.borderColor}`,
    background: 'rgba(255, 255, 255, 0.86)',
    color: theme.textColor,
  } as const;

  const buttonStyle = {
    padding: '0.8rem 1rem',
    borderRadius: 999,
    border: 'none',
    background: theme.accentColor,
    color: theme.accentContrastColor,
    fontFamily: theme.accentFontFamily,
    fontWeight: 700,
    cursor: 'pointer',
  } as const;

  return (
    <Card title="Connexion admin (email OTP)" theme={theme}>
      {otpStep === 'request-code' ? (
        <form onSubmit={onRequestCode} style={{ display: 'grid', gap: 8 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => onChangeEmail(event.target.value)}
            placeholder="you@shop.com"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={buttonStyle}
          >
            {loading ? 'Envoi...' : 'Envoyer un code'}
          </button>
        </form>
      ) : (
        <form onSubmit={onConfirmCode} style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0 }}>
            Un code a été envoyé à <strong>{email}</strong>.
          </p>
          <label htmlFor="otp-code">Code OTP</label>
          <input
            id="otp-code"
            required
            value={code}
            onChange={(event) => onChangeCode(event.target.value)}
            placeholder="123456"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={buttonStyle}
          >
            {loading ? 'Validation...' : 'Valider le code'}
          </button>
        </form>
      )}
      {error && (
        <p style={{ color: 'crimson', marginBottom: 0 }}>Erreur: {error}</p>
      )}
    </Card>
  );
}

function AdminCatalog({ theme, currency }: AdminCatalogProps) {
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

  const inputStyle = {
    padding: '0.75rem 0.9rem',
    borderRadius: 14,
    border: `1px solid ${theme.borderColor}`,
    background: 'rgba(255, 255, 255, 0.86)',
    color: theme.textColor,
  } as const;

  const buttonStyle = {
    padding: '0.8rem 1rem',
    borderRadius: 999,
    border: 'none',
    background: theme.accentColor,
    color: theme.accentContrastColor,
    fontFamily: theme.accentFontFamily,
    fontWeight: 700,
    cursor: 'pointer',
  } as const;

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

  const handleOrganizationSubmit = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = organizationName.trim();
    const slug = organizationSlug.trim().toLowerCase();
    if (!name || !slug) return;

    setError(null);

    try {
      const result = await dataClient.models.Organization.create({
        name,
        slug,
      });
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

  const handleProductSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
        currency,
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
    <>
      <Card title="Catalogue Amplify (Organization + Product)" theme={theme}>
        <p style={{ marginBottom: 0, color: theme.mutedTextColor }}>
          Meme logique metier partagee, variation limitee a la couleur du theme.
        </p>
      </Card>

      <Card title="Ajouter une organisation" theme={theme}>
        <form
          onSubmit={handleOrganizationSubmit}
          style={{ display: 'grid', gap: 8 }}
        >
          <input
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Nom de l'organisation"
            style={inputStyle}
          />
          <input
            value={organizationSlug}
            onChange={(event) => setOrganizationSlug(event.target.value)}
            placeholder="Slug (ex: ma-boutique)"
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Creer l'organisation
          </button>
        </form>
      </Card>

      <Card title="Ajouter un produit" theme={theme}>
        <form
          onSubmit={handleProductSubmit}
          style={{ display: 'grid', gap: 8 }}
        >
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Nom du produit"
            style={inputStyle}
          />
          <input
            value={productDescription}
            onChange={(event) => setProductDescription(event.target.value)}
            placeholder="Description"
            style={inputStyle}
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={productPrice}
            onChange={(event) => setProductPrice(event.target.value)}
            placeholder="Prix"
            style={inputStyle}
          />
          <select
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            style={inputStyle}
          >
            <option value="">Choisir une organisation</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedOrganizationId}
            style={buttonStyle}
          >
            Creer le produit
          </button>
        </form>
      </Card>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'crimson' }}>Erreur: {error}</p>}

      <Card title="Organisations" theme={theme}>
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
      </Card>

      <Card title="Produits" theme={theme}>
        {!loading && products.length === 0 && (
          <p>Aucun produit pour le moment.</p>
        )}
        <ul>
          {products.map((product) => {
            const organization = product.organizationId
              ? organizationsById.get(product.organizationId)
              : undefined;

            return (
              <li key={product.id}>
                {product.name} - {product.price} {product.currency ?? currency}{' '}
                {organization ? `(org: ${organization.name})` : ''}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}

function RoutePlaceholder({ title, details, theme }: RoutePlaceholderProps) {
  return (
    <Card title={title} theme={theme}>
      <p style={{ margin: 0, color: theme.mutedTextColor }}>{details}</p>
    </Card>
  );
}

function CategoryPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Categorie"
      details={`Route publique /c/${params.categorySlug ?? ':categorySlug'}`}
      theme={theme}
    />
  );
}

function ProductPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Produit"
      details={`Route publique /p/${params.productSlug ?? ':productSlug'}`}
      theme={theme}
    />
  );
}

function PromoPage({ theme }: ThemeOnlyProps) {
  const params = useParams();
  return (
    <RoutePlaceholder
      title="Promo"
      details={`Route publique /promo/${params.promoSlug ?? ':promoSlug'}`}
      theme={theme}
    />
  );
}

function ServerRoutePage({ pathLabel, theme }: ServerRoutePageProps) {
  return (
    <RoutePlaceholder
      title="Route server reservee"
      details={`${pathLabel} doit etre implemente cote backend (function/API), pas dans la SPA.`}
      theme={theme}
    />
  );
}

function AdminGuard({ auth, theme, children, signInNode }: AdminGuardProps) {
  if (auth.status === 'loading') {
    return (
      <RoutePlaceholder
        title="Authentification"
        details="Verification de la session..."
        theme={theme}
      />
    );
  }

  if (auth.status === 'signedOut') {
    return signInNode;
  }

  if (auth.role !== 'MERCHANT') {
    return (
      <RoutePlaceholder
        title="Acces refuse"
        details="Le role MERCHANT est requis pour /admin/*."
        theme={theme}
      />
    );
  }

  return children;
}

export function App({ clientConfig, theme }: AppProps) {
  const location = useLocation();
  const [auth, setAuth] = useState<AuthState>({
    status: 'loading',
    role: null,
    email: null,
  });
  const [otpStep, setOtpStep] = useState<OtpStep>('request-code');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshSession = async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = (session.tokens?.idToken?.payload ?? {}) as Record<
        string,
        unknown
      >;
      const role = resolveRoleFromSession(payload);

      setAuth({
        status: 'signedIn',
        role,
        email: user?.signInDetails?.loginId ?? user?.username ?? null,
      });
    } catch {
      setAuth({
        status: 'signedOut',
        role: null,
        email: null,
      });
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const handleRequestOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await signIn({
        username: email.trim(),
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      });

      const step = result.nextStep.signInStep;

      if (step === 'DONE') {
        await refreshSession();
        return;
      }

      if (step === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
        setOtpStep('confirm-code');
        return;
      }

      setAuthError(`Etape de connexion non supportee: ${step}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de lancer la connexion OTP.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmOtp = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: otpCode.trim(),
      });

      if (result.nextStep.signInStep !== 'DONE') {
        setAuthError(
          `Etape de connexion non finalisee: ${result.nextStep.signInStep}`
        );
        return;
      }

      setOtpCode('');
      setOtpStep('request-code');
      await refreshSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code OTP invalide.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setAuth({
      status: 'signedOut',
      role: null,
      email: null,
    });
    setOtpStep('request-code');
    setOtpCode('');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  const signInNode = (
    <SignInCard
      theme={theme}
      otpStep={otpStep}
      email={email}
      code={otpCode}
      error={authError}
      loading={authLoading}
      onChangeEmail={setEmail}
      onChangeCode={setOtpCode}
      onRequestCode={handleRequestOtp}
      onConfirmCode={handleConfirmOtp}
    />
  );

  return (
    <main
      style={{
        maxWidth: 860,
        margin: '2rem auto',
        padding: '0 1rem 3rem',
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <section
        style={{
          marginBottom: '1rem',
          padding: '1.5rem',
          borderRadius: 28,
          background: theme.background,
          border: `1px solid ${theme.borderColor}`,
          boxShadow: '0 28px 60px rgba(0, 0, 0, 0.08)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: theme.accentFontFamily,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: theme.mutedTextColor,
          }}
        >
          Boutique e-commerce single-tenant
        </p>
        <h1 style={{ margin: '0.4rem 0 0.35rem', fontSize: '2.4rem' }}>
          Credo Storefront
        </h1>
        <p style={{ margin: 0, color: theme.mutedTextColor }}>
          Meme contenu et meme logique metier, seule la palette change selon le
          client.
        </p>
      </section>

      <nav
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <Link to="/">/</Link>
        <Link to="/c/featured">/c/:categorySlug</Link>
        <Link to="/p/demo-product">/p/:productSlug</Link>
        <Link to="/promo/summer">/promo/:promoSlug</Link>
        <Link to="/cart">/cart</Link>
        <Link to="/admin">/admin</Link>
        <Link to="/admin/products">/admin/products</Link>
      </nav>

      <section style={{ marginBottom: '1rem', color: theme.mutedTextColor }}>
        Auth: {auth.status}
        {auth.status === 'signedIn' && (
          <>
            {' '}
            · role={auth.role} · {auth.email}{' '}
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                marginLeft: 8,
                border: `1px solid ${theme.borderColor}`,
                background: theme.surface,
                color: theme.textColor,
                borderRadius: 999,
                padding: '0.3rem 0.7rem',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </>
        )}
      </section>

      {isAdminRoute && auth.status === 'signedOut' ? signInNode : null}

      <Routes>
        <Route
          path="/"
          element={
            <RoutePlaceholder
              title="Home"
              details="Route publique /"
              theme={theme}
            />
          }
        />
        <Route
          path="/c/:categorySlug"
          element={<CategoryPage theme={theme} />}
        />
        <Route path="/p/:productSlug" element={<ProductPage theme={theme} />} />
        <Route path="/promo/:promoSlug" element={<PromoPage theme={theme} />} />
        <Route
          path="/cart"
          element={
            <RoutePlaceholder
              title="Panier"
              details="Route publique /cart"
              theme={theme}
            />
          }
        />

        <Route
          path="/admin"
          element={
            <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
              <RoutePlaceholder
                title="Admin"
                details="Backoffice principal"
                theme={theme}
              />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
              <AdminCatalog theme={theme} currency={clientConfig.currency} />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
              <RoutePlaceholder
                title="Admin Categories"
                details="Gestion des categories"
                theme={theme}
              />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/promos"
          element={
            <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
              <RoutePlaceholder
                title="Admin Promos"
                details="Gestion des promotions"
                theme={theme}
              />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/newsletters"
          element={
            <AdminGuard auth={auth} theme={theme} signInNode={signInNode}>
              <RoutePlaceholder
                title="Admin Newsletters"
                details="Gestion newsletter"
                theme={theme}
              />
            </AdminGuard>
          }
        />

        <Route
          path="/api/stripe/webhook"
          element={
            <ServerRoutePage pathLabel="/api/stripe/webhook" theme={theme} />
          }
        />
        <Route
          path="/api/ai/*"
          element={<ServerRoutePage pathLabel="/api/ai/*" theme={theme} />}
        />

        <Route
          path="*"
          element={
            <RoutePlaceholder
              title="404"
              details="Route inconnue"
              theme={theme}
            />
          }
        />
      </Routes>
    </main>
  );
}

export default App;
