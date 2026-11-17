# Panier local

Le panier est sauvegarde par client dans le navigateur. Il ne constitue pas une
commande et ses montants ne doivent jamais etre utilises directement pour creer
un paiement.

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
La verification reste cote navigateur. Le futur checkout devra recalculer et
valider le panier cote serveur, avec taxes, livraison et disponibilites.

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
