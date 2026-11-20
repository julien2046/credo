# Panier local

Le panier est sauvegarde par client dans le navigateur. Il ne constitue pas une
commande et ses montants ne doivent jamais etre utilises directement pour creer
un paiement.

## Livraison de demonstration

Un panier verifie dont tous les articles sont disponibles donne acces a
`/checkout`. La page reverifie le catalogue avant de proposer une estimation.
Les deux clients de demonstration ont un forfait de **9,95 $ CA**, configurable
avec `delivery.quebecFlatRateCents` dans leur configuration respective. Sans
configuration valide en CAD, la livraison est desactivee.

Le formulaire verifie le courriel, les champs requis et le code postal. Seuls les
codes du Quebec sont acceptes (G, H, J, selon les
[directives de Postes Canada](https://www.canadapost-postescanada.ca/scp/fr/soutien/sujet/directives-adressage/codes-postaux.page)).
Cela ne confirme pas que l'adresse existe. Le total est une estimation avant
taxes. Le serveur reçoit les identifiants, les quantités et le code postal
pour l'estimation. Le nom, le courriel et l'adresse ne sont transmis au
serveur puis à Stripe qu'au clic sur « Payer en mode test ». La boutique
ne les conserve pas dans le panier local.

## Verification du catalogue

A chaque ouverture du panier, les produits publics sont relus via la requete
paginee existante. Le bouton "Actualiser le panier" relance cette verification.

- Les prix, noms et slugs sont actualises ; les quantites sont conservees.
- Un changement de prix est signale avec l'ancien montant.
- Les produits absents, invalides ou dans une autre devise restent visibles,
  mais sont exclus du sous-total et leurs quantites ne sont plus modifiables.
- Les produits en rupture sont egalement exclus du sous-total.
- Une panne reseau conserve le panier et affiche un total non confirme.
- Une suppression pendant la verification n'est pas annulee par sa reponse.
- Les indicateurs de disponibilite sauvegardes ne sont pas consideres comme
  verifies lors du rechargement de l'application.

Le stock actuel est un indicateur disponible/rupture, pas une quantite reservee.
La limite de 99 unites par ligne est une limite d'interface, pas un stock garanti.
Au checkout, le serveur relit la table Product du client, en lecture cohérente,
une fois pour l'estimation et une seconde fois avant Stripe. Il refuse les
lignes en double, non publiées, en rupture, hors CAD ou invalides. Il accepte
1 à 50 produits distincts et 1 à 99 unités par ligne. Les prix et le forfait
proviennent uniquement du catalogue et de la configuration serveur du client.

## Tester Stripe Checkout pour client-a

Depuis la racine, enregistrer une **clé secrète Stripe de test** (`sk_test_...`)
à l'invite, jamais dans le code, un fichier public, une variable `VITE_*` ou le chat :

```sh
npx ampx sandbox secret set STRIPE_TEST_SECRET_KEY --profile julie-credo --identifier client-a
```

Terminal 1 : lancer le backend de test de ce même client. L'origine est celle
de la boutique à laquelle Stripe doit revenir, sans chemin ni paramètres :

```sh
CLIENT_ID=client-a CHECKOUT_RETURN_ORIGIN=http://localhost:4200 npx ampx sandbox --profile julie-credo --identifier client-a
```

Terminal 2 : après la mise à jour de `amplify_outputs.json`, lancer ou relancer
`npm run dev:client-a` et ouvrir [la boutique](http://localhost:4200).

1. Ajouter deux unités d'un produit publié à 25 $ CA. Remplir la livraison avec des données fictives et le code postal H2X 1Y4. L'estimation attendue est de 59,95 $ CA, livraison incluse, hors taxes.
2. Après l'estimation, modifier le prix dans un autre onglet marchand. « Payer en mode test » doit demander une nouvelle estimation **sans** ouvrir Stripe. Passer le produit en rupture doit aussi empêcher le paiement.
3. Rendre le produit disponible, refaire l'estimation et ouvrir Stripe. Comparer les lignes et le total. Annuler : retour à la boutique, panier intact.
4. Refaire le parcours avec une [carte de test Stripe](https://docs.stripe.com/testing). Vérifier le résultat dans l'environnement de test Stripe. Le retour à la boutique ne confirme aucun paiement et ne crée aucune commande.

Sans `CHECKOUT_RETURN_ORIGIN`, le devis fonctionne pour un `CLIENT_ID`
configuré mais le bouton Stripe reste masqué. En hébergement de test,
utiliser une origine HTTPS et un secret Amplify propres à la branche :
[gestion des secrets](https://docs.amplify.aws/react/build-a-backend/functions/environment-variables-and-secrets/).
Le navigateur utilise les opérations AppSync `quoteCheckout` et
`startTestCheckout`, pas une route React ni une clé Stripe.
Les tentatives répétées d'une même validation utilisent une
[clé d'idempotence Stripe](https://docs.stripe.com/api/idempotent_requests).

**Limites :** test uniquement, pas de réservation de stock, de taxes, de
webhook ni de commande. Avant la vente réelle : restreindre les mutations
catalogue aux marchands, limiter les tentatives, valider zone/tarifs/taxes
et traiter les confirmations Stripe signées de façon idempotente.

Test automatisé du calcul et du passage à Stripe (sans réseau ni secret) :

```sh
npm exec -- nx run @credo/amplify-backend:test
```

## Test manuel en sandbox

1. Ajouter un produit publie et disponible depuis sa fiche.
2. Ouvrir le panier ; verifier la quantite et le sous-total.
3. Dans un autre onglet admin, modifier le prix du produit.
4. Actualiser le panier : nouveau prix et avertissement doivent apparaitre.
5. Passer le produit en rupture puis actualiser : la ligne reste presente,
   les quantites sont bloquees et le produit est exclu du sous-total.
6. Remettre en stock et actualiser : la ligne redevient disponible.
7. Depublier le produit et actualiser : il devient indisponible.
8. Couper le reseau puis actualiser : le panier doit rester intact avec un
   avertissement. Retablir le reseau et reessayer.
9. Retirer toutes les lignes : le panier vide propose de continuer les achats.

Ne pas utiliser des donnees de production pour ces tests.
