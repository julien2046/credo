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

## Limites et lot suivant

L'accueil, les promos, le panier, le compte et l'admin restent dynamiques dans ce
lot. Les metas SEO completes, canonical, JSON-LD, sitemap, robots et le rebuild
automatique restent a traiter. Une 404 client n'est pas encore une 404 HTTP
configuree sur l'hebergement.

Amplify doit publier `apps/storefront/dist/client` et servir les fichiers
prerendus avant le fallback SPA. Une regle globale qui reecrit toutes les URLs
vers `index.html` peut masquer le prerendu : verifier les regles d'hebergement
avant validation en production. Aucun changement AWS n'est realise par les
tests locaux. Les tests simules ne remplacent pas un test Cognito/S3 reel.

## Verification manuelle

1. Lancer `npm run dev:client-a` avec les outputs du backend de test.
2. Ouvrir directement une fiche publiee, puis sa categorie et un autre produit.
3. Recharger chaque URL : le contenu et les images doivent revenir.
4. Ouvrir un slug inexistant : un message introuvable doit apparaitre.
5. Ouvrir `/admin/products` deconnecte, puis connecte : le guard reste actif.
6. Verifier `/cart`, `/promo/summer` et une URL inconnue.

Les tests de routage utilisent un catalogue simule ; ils ne valident pas Cognito
ou S3 en conditions reelles.
