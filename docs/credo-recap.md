# Credo — Synthèse Produit, Architecture Et Roadmap

Mise à jour : 9 novembre 2026.

Document consolidé à partir des notes, du code local et des validations rapportées dans le projet. Les ressources AWS et les déploiements actuels n’ont pas été audités lors de cette mise à jour. « Réalisé » ne signifie pas « prêt pour la production ».

## État En Bref

- Réalisé : catalogue produits/catégories, images S3, pages publiques, cartes produits MUI, espaces boutique/marchand distincts, pré-rendu natif du catalogue et génération SEO.
- À sécuriser : autorisations marchands côté backend, stockage et frontend.
- À valider sur AWS : règles de routage, fichiers statiques, SEO et configuration de chaque client.
- À développer : rebuild automatique, panier, paiement, commandes, compte client et marketing.


## 1. Vision Produit

Credo est une plateforme de boutiques en ligne white-label pour petites marques et commerces.

Chaque client dispose d’une boutique brandée, d’un domaine dédié, de secrets dédiés et d’une infrastructure AWS isolée. Le coeur du produit reste partagé : catalogue, panier, commandes, checkout, promotions, contenus assistés, analytics simples et workflows marketing.

La promesse commerciale est double :

- boutique visuellement sur mesure pour chaque client ;
- produit mutualisé techniquement dans un seul monorepo.

## 2. Modèle Commercial

L’offre repose sur :

- un prix fixe de création/intégration ;
- un abonnement récurrent pour l’hébergement AWS, OpenAI, gestion, maintenance, mises à jour et exploitation.

Services à valeur ajoutée envisagés :

- analyse GA4 / Google Analytics ;
- campagnes Google Ads ;
- contenu Facebook / Instagram ;
- génération de newsletters ;
- événements marketing ;
- adaptation design de marque ;
- import catalogue ;
- accompagnement à la gestion boutique.

## 3. Décisions D’Architecture Validées

Décision centrale : **1 client = 1 Amplify App AWS**.

Architecture validée :

- 1 monorepo Nx partagé ;
- 1 dossier `amplify/` partagé ;
- 1 app frontend `apps/storefront` ;
- 1 Amplify App AWS par client ;
- 1 backend Gen 2 déployé par app Amplify ;
- configuration client via `CLIENT_ID` et `THEME_ID` ;
- pas de branche Git par client ;
- pas de dossier `amplify/` par client ;
- pas de runtime multi-tenant complexe tant que le modèle `1 client = 1 backend AWS` est conservé.

Ce modèle isole les coûts, données, secrets, domaines, logs et ressources AWS par client, tout en gardant un code commun.

## 4. Shared Vs Client-Specific

**Shared = capacité produit commune**

- catalogue ;
- panier ;
- commandes ;
- checkout Stripe ;
- promotions ;
- workflows IA ;
- analytics simple ;
- webhooks Stripe ;
- schéma canonique ;
- repositories ;
- intégrations Stripe/OpenAI/email/social ;
- scripts de provisioning ;
- documentation d’exploitation.

**Client-specific = identité, config, isolation**

- thème UI ;
- branding ;
- assets ;
- layouts ;
- domaine ;
- devise ;
- langue ;
- canaux activés ;
- style guide ;
- secrets/env vars ;
- tokens sociaux/email ;
- budgets et alertes coûts AWS ;
- mappings d’import spécifiques si nécessaire.

Règle simple : si cela exprime l’identité du client, c’est client-specific. Si cela exprime une capacité produit, c’est shared.

## 5. Structure Et Responsabilités

Structure réellement présente : `apps/storefront`, `libs/shared`, `libs/ui`, `libs/platform-amplify`, `libs/data-access`, `libs/feature`, `libs/themes/*`, `libs/client-config/*`.

- App : bootstrap, configuration, thème, routage React Router et composition.
- Shared : types, constantes et utilitaires.
- UI : composants de présentation réutilisables.
- Platform Amplify : initialisation et accès aux clients Amplify.
- Data access : repositories admin/public, types et pagination.
- Feature : écrans, hooks et règles métier.
- Thèmes/configurations : identité et options propres au client.
- `libs/integrations/*` reste une organisation cible pour Stripe, OpenAI, email et social, pas une capacité déjà livrée.

Règles de dépendance : UI dépend de shared ; data-access peut dépendre de shared/platform ; feature compose UI/data-access/shared ; app assemble les fonctionnalités. UI ne dépend pas des repositories. Éviter les cycles.

Le catalogue sépare `use-admin-catalog.ts`, règles, validation, formulaires et listes. La couche `storefront-content.ts` est déjà implémentée et réutilisée par le chargement public et le build.

## 6. Thèmes Et Customisation

Le thème peut changer :

- couleurs ;
- typographies ;
- layouts ;
- sections ;
- composants visuels ;
- assets ;
- densité visuelle ;
- tokens UI.

Le thème ne doit pas :

- changer le checkout ;
- changer le modèle de données ;
- contenir de logique métier ;
- appeler directement Stripe/OpenAI ;
- modifier les règles core catalogue/panier/commande.

La bonne approche : points d’extension contrôlés, slots, sections, tokens et variations de composants.

## 7. Périmètre Produit

Pages publiques prévues :

- `/` accueil ;
- `/c/:categorySlug` liste catégorie ;
- `/p/:productSlug` fiche produit ;
- `/promo/:promoSlug` événement promotionnel ;
- `/cart` panier.

Pages client prévues :

- `/account/orders` liste commandes ;
- `/account/orders/:id` fiche commande ;
- `/account/profile` profil/adresse.

Pages admin prévues :

- produits ;
- catégories ;
- événements promotionnels ;
- newsletters ;
- clients ;
- analyse ;
- création produit ;
- création catégorie ;
- création newsletter.

## 8. MVP De Lancement

Le MVP doit inclure :

- boutique brandée par client ;
- auth no-password pour accès marchand ;
- backoffice minimal ;
- CRUD produits/catégories ;
- images produits ;
- slugs propres ;
- pages publiques réelles ;
- panier ;
- checkout Stripe ;
- création commande via webhook ;
- espace client minimal ;
- page promotionnelle ;
- SEO de base ;
- pré-rendu des pages publiques SEO.

Hors MVP :

- publication directe Meta API ;
- création directe Google Ads API ;
- chatbot ;
- analytics avancé propriétaire ;
- segmentation marketing avancée ;
- blog auto-publié ;
- multi-langue complet si cela ralentit le lancement ;
- import catalogue complexe par source exotique.

## 9. PromotionEvent

Le workflow PromotionEvent est central pour le MVP marketing.

Il doit permettre :

- création d’un événement promotionnel ;
- génération d’une page promo indexable ;
- génération d’une newsletter ;
- génération de posts Instagram/Facebook ;
- aide à la rédaction de fiches produits.

Newsletter :

- prévisualisation desktop/mobile ;
- FR/EN à terme ;
- ton de marque ;
- CTA automatique vers la page promo.

Page promo :

- URL propre, ex. `/promo/black-friday-2026` ;
- brandée selon les tokens client ;
- rapide ;
- partageable ;
- SEO-friendly.

Posts sociaux MVP :

- 3 variantes de texte ;
- hashtags ;
- formats court/long ;
- bouton copier.

La publication directe via Meta API est repoussée.

## 10. Assistant Google Ads

Lorsqu’un événement promo est créé, l’assistant peut générer :

- Titre 1, 2, 3 ;
- Description 1, 2 ;
- URL finale ;
- suggestions de mots-clés ;
- budget recommandé ;
- zone géographique ;
- export JSON ;
- contenu copier/coller.

Pour le MVP : génération + validation utilisateur. Pas de création automatique de campagne.

## 11. SEO Et Rendu Statique

Stack installée : React 19, React Router **8.0.1**, Nx 22.5, MUI 7, Amplify Gen 2. Node **24** est utilisé dans le pipeline.

Architecture actuelle : Amplify Hosting statique + pré-rendu natif React Router + backend serverless ; `ssr: false`. L’ancien générateur HTML a été retiré.

- Pré-rendu effectif : fiches produits publiées `/p/:productSlug` et catégories `/c/:categorySlug`.
- Accueil : vraie sélection de six produits maximum, mais chargement côté navigateur ; pas encore un accueil SEO pré-rendu avec son contenu.
- Promotions : contenu de démonstration, pas de workflow PromotionEvent réel ni de pré-rendu promo opérationnel.
- Admin, panier, compte et checkout restent destinés au fonctionnement SPA ; certaines routes ne sont que des placeholders ou restent à créer.

Le build produit HTML et payloads `.data` dans `apps/storefront/dist/client`. Le contenu produit/catégorie est présent sans JavaScript. La navigation client peut ensuite charger les données courantes.

Objectif futur : étendre le pré-rendu à l’accueil et aux promotions lorsqu’ils seront prêts. Pas d’ISR automatique à ce stade.

## 12. Données Pour Le Pré-rendu

Le build utilise déjà le catalogue backend, et non un JSON versionné comme source métier principale.

1. Lire le catalogue public via les requêtes paginées `listPublicCategoryPage` et `listPublicProductPage`.
2. Créer un snapshot temporaire propre au build.
3. Valider slugs, doublons et relations catégorie/produit.
4. Télécharger les images S3 nécessaires et les copier sous `catalog-assets/`.
5. Générer le HTML et les payloads React Router, puis supprimer le snapshot temporaire.

Les brouillons sont exclus. Les images copiées dans le site statique n’utilisent pas de liens signés expirants. Les images HTTPS externes restent dépendantes de leur hébergeur. Un échec de lecture catalogue/image ou des données invalides font échouer le build.

Une fixture JSON reste disponible pour les tests hors ligne. Elle n’est pas destinée au déploiement réel.

## 13. Rebuild Après Modification

**Non implémenté actuellement.** Enregistrer ou publier un produit ne lance pas encore de rebuild Amplify.

Après modification, le site statique conserve le contenu du dernier build. Un produit peut être visible en navigation client alors que son URL directe renvoie encore 404 avant reconstruction.

Flux cible : modification publique pertinente → événement serveur → regroupement des changements → Lambda → webhook Amplify Hosting ou StartJob → build et déploiement.

Il faudra traiter publication, modification d’un produit publié, dépublication, suppression, changements de catégories et de slugs. Ne pas se limiter à vérifier `published = true`, ni reconstruire à chaque frappe ou sauvegarde de brouillon. Prévoir regroupement, déduplication, reprise sur erreur et suivi du résultat.

Les triggers Cognito concernent l’authentification, pas la publication produit. DynamoDB Streams ou une émission explicite d’événements restent des options à choisir.

Références conservées des notes :
- [Webhook Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/create-incoming-webhook.html)
- [API StartJob](https://docs.aws.amazon.com/amplify/latest/APIReference/API_StartJob.html)

## 14. SEO Implémenté Et Validation

Déjà codé : titres et descriptions produit/catégorie, canonical si domaine configuré, JSON-LD Product/Offer sur les produits, sitemap, robots et page 404. Prix, devise, disponibilité et image proviennent du catalogue.

Configuration publique par déploiement :
- `VITE_SITE_URL` : origine HTTPS réelle, sans chemin.
- `VITE_SEO_INDEXABLE=false` ou absent : noindex et sitemap vide.
- `VITE_SEO_INDEXABLE=true` : catalogue indexable, URL HTTPS obligatoire.

Seules les routes catalogue pré-rendues sont incluses dans le sitemap. Accueil, promotions de démonstration et espaces privés restent noindex. Ne pas activer l’indexation d’une sandbox.

Le fichier `apps/storefront/amplify-custom-rules.json` doit être appliqué manuellement dans Amplify. Le pipeline ne l’applique pas. Il distingue routes SPA et fichiers statiques, avec de vraies réponses HTTP 404. Vérifier le comportement après déploiement, notamment les URL directes et les slashs finaux.

À poursuivre : pré-rendu de l’accueil, qualité éditoriale, images/performance mobile et contrôle SEO sur le domaine réel. Le prix et le stock du HTML restent ceux du build ; une API dédiée de stock temps réel est encore une intention, pas une fonctionnalité livrée.

Procédure détaillée : [Routage et SEO](storefront-routing.md).

## 15. Paiement, Commandes Et Compte Client

**À développer.** Le panier actuel est un placeholder ; Stripe et les commandes ne sont pas implémentés.

Parcours cible : panier avec quantités → validation serveur des produits/prix/disponibilités → paiement Stripe → webhook signé → confirmation de la commande payée.

Le choix Checkout Session ou PaymentIntent reste à trancher. PaymentIntent était envisagé pour davantage de contrôle ; il ne constitue pas une décision d’intégration déjà réalisée.

Exigences : ne jamais faire confiance aux montants client, vérifier la signature du webhook, rendre le traitement idempotent pour éviter les doublons, gérer les paiements échoués ou différés. Une commande en attente peut exister avant paiement ; elle ne passe en PAID qu’après confirmation fiable.

Les endpoints `/api/checkout/...`, `/api/stripe/webhook`, `/api/openai/...` et une éventuelle API de stock doivent être de vrais endpoints backend, pas de simples routes React.

Compte client prévu : `/account/orders`, `/account/orders/:id`, `/account/profile`. Autoriser l’accès par identité authentifiée/propriétaire. Pour une commande invitée, un email saisi seul ne suffit pas : prévoir un lien signé ou une vérification de possession.

## 16. Auth Et Sécurité

État actuel :

- auth passwordless téléphone/SMS OTP en place ;
- création de compte ;
- confirmation ;
- connexion ;
- logout ;
- challenge Cognito géré ;
- modèles métier accessibles aux utilisateurs authentifiés ; requêtes publiques dédiées pour le catalogue ;
- tout utilisateur authentifié peut accéder au backoffice.

Ce fonctionnement reste réservé aux tests, pas à la production. La séparation visuelle frontoffice/backoffice n’est pas une séparation de permissions.

Le stockage autorise actuellement la lecture invitée des images catalogue et l’écriture/suppression aux utilisateurs authentifiés. Ce périmètre doit être réexaminé avec les rôles marchands ; ne pas considérer les images de brouillons comme confidentielles.

À durcir avant production :

- normalisation téléphone E.164 ;
- validation formats ambigus ;
- renvoi du code OTP ;
- meilleurs messages d’erreur Cognito ;
- séparation admin/client ;
- RBAC `MERCHANT` / `CUSTOMER` ;
- groupes Cognito, claims custom ou invitation marchand ;
- tests signup/signin/guard/erreurs ;
- permissions backend plus fines ;
- config Cognito/SNS propre ;
- surveillance coûts SMS.

Sécurité minimum :

- validation Zod sur toutes les API ;
- RBAC admin/client ;
- signature Stripe webhook obligatoire ;
- recalcul serveur des prix ;
- rate limiting sur routes sensibles, surtout IA ;
- permissions plus strictes que `authenticated`.

## 17. Import Catalogue

Le core attend un format canonique unique :

- `Product`
- `Category`
- etc.

Les importeurs adaptent vers ce format.

Pour commencer : CSV canonique strict.

Si un client a un CSV particulier : adapter client-specific. Le core ne bouge pas.

## 18. Fonctionnalités Réalisées

**Catalogue**
- Création, lecture, modification et suppression de produits/catégories.
- Création de boutiques/organisations ; associations entre boutiques, catégories et produits.
- Slugs et validation, contrôles de doublons et de cohérence, protection de catégories utilisées.
- Publication/dépublication, disponibilité et prix.
- Upload d’images S3, aperçu et progression.
- Hooks, règles métier et repositories séparés des composants de présentation.

**Boutique publique**
- Branding client et navigation MUI avec catégories réelles.
- Accueil avec sélection de six produits maximum.
- Cartes réutilisées sur accueil/catégories : image, nom, prix, disponibilité et lien produit.
- Pages produit/catégorie reliées aux données publiques.
- États vides, erreurs et contenu introuvable.
- Pré-rendu et SEO du catalogue effectivement implémentés.

**Backoffice**
- Bouton « Espace marchand » depuis la boutique et « Voir la boutique » au retour.
- Menu admin distinct, rubrique active et déconnexion.
- Tableau de bord avec accès Produits et Catégories.
- Listes séparées par rubrique ; formulaires de création ouverts à la demande.
- Auth SMS fonctionnelle et guard de connexion, mais pas encore de rôle marchand obligatoire.

**Validation**
Le CRUD et le HTML statique ont été testés par l’utilisateur lors des étapes précédentes. Dernière validation automatisée rapportée : 51 tests storefront + 12 tests feature, lint et TypeScript réussis. Ce chiffre n’est pas un audit exhaustif du repo ni une nouvelle exécution aujourd’hui ; Cognito/S3/AWS nécessitent des tests réels.

## 19. Clients Et Déploiements

Le modèle a été validé avec client-a et client-b, même repo et configurations différentes. Les notes rapportent également une recréation des apps et un build réussi sous Node 24.

Identifiants historiques à conserver, **à vérifier dans AWS avant réutilisation** :
- `d10o4lkezlw9qp` : client-a.
- `d37xt7px3n337u` : client-b.

Aucune vérification de leur existence ni de leur dernière version déployée n’a été effectuée pour ce récap. Des modifications locales ne prouvent pas un déploiement AWS.

## 20. Runbook Nouveau Client Amplify

Pré-requis :

- créer `libs/client-config/<client-id>` ;
- créer `libs/themes/<client-id>` ;
- enregistrer config + thème dans `apps/storefront/src/app/storefront-bootstrap.ts` ;
- vérifier que l’app lit `CLIENT_ID` et `THEME_ID`.

Étapes :

1. Créer la config client.
2. Créer le thème client.
3. Enregistrer config/thème dans le bootstrap.
4. Créer une nouvelle Amplify App.
5. Connecter le repo GitHub.
6. Branche : `main` ou release.
7. Monorepo root : `apps/storefront`.
8. Backend Gen 2 : oui.
9. Choisir un service role valide.
10. Ajouter variables d’environnement.
11. Utiliser le fichier `amplify.yml` actuel du repo, pas l’ancien build Vite direct.
12. Déployer.
13. Vérifier branding + endpoint AppSync.
14. Configurer domaine custom et certificat.
15. Appliquer les règles de routage `apps/storefront/amplify-custom-rules.json`.
16. Définir `VITE_SITE_URL` et garder `VITE_SEO_INDEXABLE=false` jusqu’à validation.
17. Vérifier HTML, images, canonical, sitemap et statuts HTTP sur le domaine déployé.

Variables requises :

```text
AMPLIFY_MONOREPO_APP_ROOT=apps/storefront
CLIENT_ID=<client-id>
THEME_ID=<theme-id>
```

À ajouter selon client :

- `STRIPE_*`
- `OPENAI_*`
- config email
- tokens social
- autres secrets métier.

Conserver les secrets côté backend dans le mécanisme de secrets approprié ; ne jamais les exposer dans les variables publiques Vite. Utiliser un rôle de déploiement aux droits nécessaires et configurer tags, budgets et alertes par client.

## 21. Pipeline Actuel

Source de vérité : `amplify.yml` dans le repo.

```yaml
version: 1
applications:
  - appRoot: apps/storefront
    backend:
      phases:
        build:
          commands:
            - nvm install 24
            - nvm use 24
            - node --version
            - npm ci --include=optional --cache .npm
            - npm install --no-save @parcel/watcher-linux-x64-glibc@2.5.6
            - node -e "require('@parcel/watcher'); console.log('parcel watcher OK')"
            - npx ampx pipeline-deploy --branch "$AWS_BRANCH" --app-id "$AWS_APP_ID"
    frontend:
      buildPath: /
      phases:
        build:
          commands:
            - nvm use 24
            - npm install --no-save @rollup/rollup-linux-x64-gnu
            - node -e "require('@rollup/rollup-linux-x64-gnu'); console.log('rollup native OK')"
            - npm run build:storefront
      artifacts:
        baseDirectory: apps/storefront/dist/client
        files:
          - '**/*'
      cache:
        paths:
          - .npm/**/*
```

Différences importantes avec les anciennes notes : Node 24 explicite, appel de `npm run build:storefront` au lieu de Vite directement, artefacts dans `apps/storefront/dist/client`, cache npm seulement. Les installations de dépendances natives restent des contournements présents dans le pipeline, à réévaluer lors des mises à jour.

Ne pas remplacer ce pipeline par l’ancien buildspec.

## 22. Commandes Principales

Depuis la racine du repo, avec Node 24.

**Développement : terminal 1, backend sandbox**
```bash
npx ampx sandbox --profile julie-credo --identifier client-a
```

**Terminal 2, frontend**
```bash
npm run dev:client-a
```

Boutique : http://localhost:4200/ ; administration : http://localhost:4200/admin. Garder les deux terminaux ouverts ; Ctrl+C arrête le processus, pas les ressources AWS.

**Build et aperçu statique**
```bash
CLIENT_ID=client-a THEME_ID=client-a npm run build:storefront
npm run preview:storefront
```

Aperçu : http://localhost:4300/. Reconstruire pour voir les changements dans le HTML. Le dev live ne valide pas le pré-rendu.

**Test SEO sans indexation**
```bash
CLIENT_ID=client-a THEME_ID=client-a VITE_SITE_URL=https://boutique.example VITE_SEO_INDEXABLE=false npm run build:storefront
```

**Build avec fixture**
```bash
STOREFRONT_PRERENDER_SNAPSHOT=apps/storefront/tests/fixtures/catalog.json CLIENT_ID=client-a THEME_ID=client-a npm run build:storefront
```
Le rendu initial utilise la fixture ; la navigation client utilise encore le backend configuré. Ne pas définir cette variable en production.

**Vérifications locales**
```bash
npm exec -- nx run-many -t test lint typecheck -p @credo/storefront @credo/feature
npm exec -- nx sync
```

`nx sync` sert à resynchroniser les références si Nx le demande. En cas de difficulté avec le daemon ou les watchers :
```bash
CHOKIDAR_USEPOLLING=1 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npm exec -- nx run-many -t test lint typecheck -p @credo/storefront @credo/feature
```

**Client B**
Arrêter la sandbox et le serveur A, puis :
```bash
npx ampx sandbox --profile julie-credo --identifier client-b
```
Dans l’autre terminal :
```bash
npm run dev:client-b
```

Changer CLIENT_ID/THEME_ID ne change pas le backend : celui-ci vient de `amplify_outputs.json`. Un seul fichier outputs est actif à la fois.

**Backend déployé sans sandbox**
```bash
npx ampx generate outputs --app-id <APP_ID_VERIFIE> --branch main --format json --out-dir .
npm run dev:client-a
```
Remplacer l’identifiant et sélectionner le bon profil AWS. Attention : l’app locale peut alors écrire dans ce backend déployé ; privilégier un environnement de test.

**Sandbox sans surveillance**
```bash
npx ampx sandbox --profile julie-credo --identifier client-a --once
```

**Suppression volontaire d’une sandbox**
```bash
npx ampx sandbox delete --profile julie-credo --identifier client-a
```
Opération destructive sur les ressources de cette sandbox ; ne pas utiliser pour simplement arrêter le développement.

## 23. Analytics Et Marketing Post-MVP

Extensions possibles :

- blog / actualités + auto-publication réseaux ;
- newsletter automatisée après achat ;
- chatbot réservation/FAQ ;
- génération ou repost d’avis clients ;
- calendrier éditorial ;
- publication programmée ;
- personnalisation / segmentation ;
- analytics reporting intégré.

Pour le MVP : commencer simple avec GA4, génération de drafts, copier/exporter.

## 24. Roadmap Actualisée

1. Stabilisation : tester les nouveaux écrans admin et boutique, puis renforcer l’accès marchand et les permissions backend/storage.
2. Publication/SEO : valider l’hébergement Amplify, automatiser les rebuilds pertinents, ajouter le pré-rendu de l’accueil.
3. Vente : panier persistant, quantités, paiement Stripe, commandes, compte client.
4. Marketing : PromotionEvent, page promo pré-rendue, bannière, newsletter avec prévisualisation.
5. Services complémentaires : import CSV strict, GA4 simple, drafts IA produit/newsletter/posts.
6. Extensions : exports Ads, publication sociale assistée puis intégrations avancées selon les besoins.

Les anciens jalons mensuels ne sont plus un calendrier d’engagement. Les replanifier selon les tests et les priorités commerciales.

## 25. Décisions À Figer

- RBAC : adopter au minimum `MERCHANT` et `CUSTOMER` avant prod.
- SEO : pré-rendre uniquement les pages publiques.
- Import : commencer par CSV canonique strict.
- Social/Ads : génération de drafts + copier/exporter, pas publication directe.
- Analytics : GA4 simple au départ.
- Langues : commencer par `fr-CA`, prévoir `en-CA` ensuite.

## 26. Prochaines Actions

1. Tester le parcours marchand complet dans la sandbox : création, édition, images, publication, dépublication, suppression et navigation.
2. Mettre une véritable autorisation marchand côté données, stockage et frontend ; vérifier qu’un client connecté ne peut pas administrer.
3. Vérifier le déploiement statique AWS, les règles de routage, les images et le SEO sur le domaine cible.
4. Concevoir puis implémenter le regroupement des changements et le rebuild automatique.
5. Pré-rendre le contenu de l’accueil pour éviter que sa sélection dépende uniquement du navigateur.
6. Commencer le panier, puis choisir et intégrer le parcours Stripe.
7. Ajouter commandes et espace client, puis PromotionEvent et les outils marketing.

Le catalogue de base n’est plus à démarrer. Les prochaines étapes portent sur sa sécurité, sa publication fiable et le parcours d’achat.

## Résumé Final

Credo dispose maintenant d’un catalogue fonctionnel, d’une boutique avec cartes produits, d’un backoffice distinct et d’un pré-rendu natif produit/catégorie avec les fichiers SEO.

La plateforme n’est pas encore une boutique transactionnelle prête pour la production : rôles marchands, validation du déploiement, rebuild automatique, panier, paiement et commandes restent à traiter.

La vision reste inchangée : un produit partagé, une identité par client et des déploiements AWS séparés. Le socle catalogue est là ; il faut maintenant sécuriser l’administration et fiabiliser la mise en ligne avant d’ouvrir la vente.
