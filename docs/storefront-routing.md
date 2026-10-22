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

## Limite volontaire et suite

La configuration reste `ssr: false`, sans `prerender`. React Router n'autorise
pas de `loader` serveur sur ces routes dans ce mode. Le lot 1 utilise donc des
`clientLoader` : les donnees sont chargees avant l'affichage de la page, mais
toujours dans le navigateur. Une 404 de loader n'est pas encore une reponse HTTP
404 fournie par l'hebergement statique.

Le lot suivant ajoutera les URLs de prerendu et les loaders de build reutilisant
les services de contenu. Il devra aussi traiter les images S3 durables, les metas,
le sitemap et le remplacement du script HTML historique. Celui-ci n'est pas
utilise par `npm run build:storefront` et ne constitue pas le prerendu natif.

## Verification manuelle

1. Lancer `npm run dev:client-a` avec les outputs du backend de test.
2. Ouvrir directement une fiche publiee, puis sa categorie et un autre produit.
3. Recharger chaque URL : le contenu et les images doivent revenir.
4. Ouvrir un slug inexistant : un message introuvable doit apparaitre.
5. Ouvrir `/admin/products` deconnecte, puis connecte : le guard reste actif.
6. Verifier `/cart`, `/promo/summer` et une URL inconnue.

Les tests de routage utilisent un catalogue simule ; ils ne valident pas Cognito
ou S3 en conditions reelles.
