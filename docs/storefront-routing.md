# Routage du storefront

## Lot 1 : routes et chargement du catalogue

`apps/storefront/src/routes.ts` declare un layout commun et quatre branches :

- `/` : accueil.
- `/p/:productSlug` : module produit avec `clientLoader`.
- `/c/:categorySlug` : module categorie avec `clientLoader`.
- `*` : routes dynamiques existantes (admin, promo, panier et 404).

`App` compose le theme, la session et la navigation, puis affiche un `Outlet`.
Le contexte de cet outlet fournit la session et le formulaire de connexion aux
routes dynamiques. Le chargement du catalogue public ne depend pas de la session.

Les modules produit/categorie appellent `loadProductPage` / `loadCategoryPage`
dans `libs/feature/src/lib/routing/storefront-content-loaders.ts`. Ces fonctions
utilisent le service de contenu existant et signalent les contenus absents par une
reponse 404. Une panne backend reste une erreur distincte. Les composants dans
`libs/feature/src/lib/catalog` recoivent leurs donnees par props, sans fetch ni
effet de chargement.

`storefront-runtime.ts` initialise Amplify avant l'execution des loaders, meme
lors d'une ouverture directe sur une fiche produit. Le backend reste celui de
`amplify_outputs.json`.

## Lot 2 : prerendu natif du catalogue

`npm run build:storefront` prepare un instantane du catalogue public puis lance
le build React Router. Les nouvelles requetes `listPublicCategoryPage` et
`listPublicProductPage` parcourent toutes les pages, y compris les pages vides
apres filtrage. Le navigateur utilise aussi ces requetes paginees.

Les loaders des modules `product.prerender.tsx` et `category.prerender.tsx`
reutilisent les services de contenu avec une source de donnees injectee depuis
`catalog-build.server.ts`. Le snapshot est temporaire, unique pour ce build et
supprime ensuite. Il n'est pas publie comme fichier catalogue complet.

React Router produit un HTML et un payload `.data` pour chaque slug public dans
`apps/storefront/dist/client`. Les routes vides gardent leur module client :
un catalogue vide reste compilable. La configuration reste `ssr: false` ; aucun
serveur de rendu n'est necessaire en production. Apres hydratation, les
`clientLoader` chargent les donnees courantes lors des navigations.

Les images S3 des produits publies sont telechargees au build avec les droits
de lecture invite Amplify, puis copiees sous `catalog-assets/<hash>.<extension>`.
Le HTML utilise ces fichiers durables, pas des liens S3 signes expirants. Le
bucket n'est pas rendu public. Formats acceptes : PNG, JPEG, WebP, GIF, AVIF,
maximum 20 Mio par image. Les URLs HTTPS externes restent externes ; leur
disponibilite depend de leur hebergeur. Les URLs manifestement signees sont
refusees. Un echec de lecture catalogue/image fait echouer le build.

Les slugs invalides ou dupliques et les references categorie incoherentes font
egalement echouer le build. Les brouillons ne sont pas prerendus. Prix, stock,
modifications et retraits restent ceux du dernier build dans le HTML : publier
un produit ne declenche pas encore automatiquement un rebuild.

L'ancien script de generation HTML est retire. `prerender:storefront` et
`build:storefront:ssg` sont des alias du meme build natif.

## Tester avec la sandbox

Deployer d'abord les nouvelles requetes backend et conserver les outputs du
meme client que les variables du frontend :

```sh
npx ampx sandbox --profile julie-credo --identifier client-a --once
CLIENT_ID=client-a THEME_ID=client-a npm run build:storefront
npm run preview:storefront
```

La preview statique est disponible sur `http://localhost:4300`. Ouvrir directement
`/p/<slug-publie>` et `/c/<slug-categorie>`, desactiver JavaScript et recharger :
texte et images doivent etre presents. Reactiver JavaScript pour tester la
navigation, un slug inconnu, le panier et le guard admin. Publier une nouvelle
fiche puis reconstruire pour verifier l'ajout du fichier HTML.

`npm run dev:client-a` reste le serveur de developpement avec chargement live ;
il ne permet pas de valider les fichiers statiques du build.

Pour un test hors ligne, sans donnees AWS ni images S3 :

```sh
STOREFRONT_PRERENDER_SNAPSHOT=apps/storefront/tests/fixtures/catalog.json CLIENT_ID=client-a THEME_ID=client-a npm run build:storefront
```

Cette fixture produit `/p/chaise-test` et `/c/mobilier-test`, pas le brouillon.
Ne pas definir cette variable dans le deploiement reel.
Elle valide le rendu initial uniquement : la navigation client utilise toujours
le backend des outputs. Ces outputs doivent inclure les nouvelles requetes
paginees, ce qui necessite un deploiement ou une regeneration apres deploiement.

## Lot 3 : SEO et hebergement

Les modules de routes exportent `meta` et utilisent les fonctions pures de
`src/app/seo/catalog-seo.ts`. Les produits et categories ont un titre, une
description et, si le domaine est configure, une URL canonique absolue sans
parametres. Les produits ont egalement un JSON-LD `Product` / `Offer` avec prix,
devise, disponibilite et image lorsqu'elle existe. Aucun avis ou marque fabricant
n'est invente. React Router serialise et echappe le JSON-LD.

L'accueil et les promos sont encore des placeholders : ils restent `noindex`,
comme l'admin, le compte, le panier, le checkout et les pages d'erreur.
Seules les routes catalogue prerendues sont incluses dans le sitemap de production.

Configuration publique, specifique a chaque deploiement :

| Variable | Valeur | Comportement |
| --- | --- | --- |
| `VITE_SITE_URL` | Origine HTTPS reelle de la boutique | Sans chemin, query ou fragment ; jamais derivee de `domainLabel` |
| `VITE_SEO_INDEXABLE` | `false` ou absente | Toutes les pages en noindex, sitemap vide |
| `VITE_SEO_INDEXABLE` | `true` | Catalogue indexable ; URL HTTPS obligatoire |

Definir ces variables dans Amplify pour chaque branche. En local, elles peuvent
etre passees dans la commande ou dans les fichiers Vite de `apps/storefront`.
Elles sont publiques et compilees dans le frontend : ne jamais y mettre un secret.
Le build et le frontend utilisent la meme configuration normalisee.

Le build genere `sitemap.xml`, `robots.txt` et `404.html` dans `dist/client`.
Le sitemap ne contient que les slugs publies de ce build, pas les brouillons,
routes privees ou fausses dates `lastmod`. `robots.txt` laisse lire les pages pour
que les moteurs voient `noindex` ; ce n'est pas une protection d'acces. Les
donnees privees doivent toujours etre protegees par le backend.

### Regles Amplify a appliquer manuellement

Dans Hosting > Rewrites and redirects, utiliser le contenu de
`apps/storefront/amplify-custom-rules.json` pour les regles de routage de l'app.
Conserver les redirections de domaines/metier necessaires apres examen, mais
retirer l'ancienne regle SPA globale `200 -> /index.html` si elle existe.
Ce fichier n'est pas applique automatiquement par `amplify.yml`.

La premiere regle sert le shell SPA uniquement pour admin/account/cart/checkout/
promo. La derniere renvoie `404.html` avec un statut HTTP 404 quand le fichier
demande n'existe pas. Les fichiers catalogue, `.data`, images, sitemap et robots
doivent etre servis normalement. Amplify gere les repertoires `index.html` via
ses clean URLs ; verifier aussi les URLs avec slash final apres deploiement.

La preview locale reproduit cette distinction. Un nouveau produit publie apres
le build peut etre visible en navigation client, mais son acces direct reste
404 tant que le site n'est pas reconstruit. Les suppressions et les changements
de prix/stock dans le HTML demandent egalement un rebuild.

### Verification SEO

Pour tester les balises sans autoriser l'indexation, remplacer le domaine
d'exemple par celui de la boutique (le domaine d'exemple suffit pour un test local) :

```sh
CLIENT_ID=client-a THEME_ID=client-a VITE_SITE_URL=https://boutique.example VITE_SEO_INDEXABLE=false npm run build:storefront
npm run preview:storefront
```

1. Lire le code source d'une fiche et d'une categorie : un seul titre, une seule
   description, une seule canonical, et un JSON-LD uniquement sur le produit.
2. Verifier `/sitemap.xml` : vide en mode test. Refaire le build avec `true` en
   local pour verifier les URLs absolues, puis remettre `false` pour une demo.
3. Verifier `/robots.txt` et l'absence de brouillons dans le sitemap de production.
4. Verifier qu'une URL `/p/inexistant` et un fichier absent renvoient HTTP 404,
   tandis que `/admin/products` reste HTTP 200 avec connexion obligatoire.
5. Apres deploiement, refaire ces controles sur le domaine Amplify et le domaine
   canonique. Ne passer une boutique reelle a `true` qu'apres validation du contenu.

L'application des regles AWS et leur validation en production restent manuelles.
Le prochain lot concerne le rebuild automatique apres changement du catalogue.

References : [React Router Meta](https://reactrouter.com/how-to/meta) et
[Amplify redirects/clean URLs](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html).

## Verification manuelle

1. Lancer `npm run dev:client-a` avec les outputs du backend de test.
2. Ouvrir directement une fiche publiee, puis sa categorie et un autre produit.
3. Recharger chaque URL : le contenu et les images doivent revenir.
4. Ouvrir un slug inexistant : un message introuvable doit apparaitre.
5. Ouvrir `/admin/products` deconnecte, puis connecte : le guard reste actif.
6. Verifier `/cart`, `/promo/summer` et une URL inconnue.

Les tests de routage utilisent un catalogue simule ; ils ne valident pas Cognito
ou S3 en conditions reelles.
