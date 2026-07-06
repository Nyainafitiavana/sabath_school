# Spécifications fonctionnelles — Écrans & parcours

## 0. Interface commune (layout)

### Barre de navigation supérieure (Topbar)
- Titre de la page courante.
- **Toggle langue** (FR / EN) — bascule la langue de toute l'interface,
  persisté en `localStorage`.
- **Toggle thème** (Soleil / Lune) — bascule entre mode clair et mode sombre,
  persisté en `localStorage`.

### Sidebar
- Gradient indigo → violet en mode clair, indigo profond → slate en mode sombre.
- Navigation : Dashboard, Registres, Classes, Utilisateurs, Appels, Questions globales.
- Réduite à des icônes (mode collapse) sur desktop, drawer plein écran sur mobile.
- Affiche le nom et rôle de l'utilisateur connecté + bouton de déconnexion.
- Pour un `RESPONSABLE` : seuls Dashboard et Appels sont visibles.

### États de chargement
- Skeleton animé (`animate-pulse`) sur tous les écrans pendant le chargement
  des données — pas de spinner global, chaque zone a son propre skeleton
  calé sur la mise en page attendue.

## 1. Écran : Login
- Champs : email, mot de passe.
- Redirection selon rôle :
  - `ADMIN` → Dashboard global.
  - `RESPONSABLE` → Dashboard de sa classe.

## 2. Écran : Dashboard

### Filtres
- **Année** (obligatoire, sélecteur — années avec des registres existants,
  défaut = année courante ou la plus récente).
- **Trimestre** (1-4, optionnel — "Tous les trimestres").
- **Mois** (optionnel, restreint aux mois du trimestre sélectionné).
- **Sabbat** (optionnel — "Tous les sabbats").
- **Classe** (Admin uniquement, optionnel — "Toutes les classes").

### Blocs d'affichage
- **4 KPI cards** : Classes suivies, Total membres, Taux moyen, Top classe.
- **Graphique de tendance** (ECharts `LineChart`) : évolution mensuelle ou
  par sabbat (selon le filtre mois) du taux global d'apprentissage.
- **Camembert** (ECharts `PieChart`) : taux d'apprentissage par classe.
- **Barres horizontales** (ECharts `BarChart`) : Top 5 classes.
- **Totaux questions globales** : une carte chiffrée par question.
- **Tableau détaillé** par classe : membres, présents, absents, 7/7,
  taux présence, taux absence, taux apprentissage — trié par taux décroissant.

### Temps réel
- Dès qu'un appel est créé, modifié ou supprimé (par n'importe quel
  responsable connecté), le dashboard se rafraîchit automatiquement via
  l'événement Socket.IO `dashboard:refresh`.

## 3. Écran : Gestion des Registres (ADMIN)

- Liste des registres existants (années) en grille de cartes.
- Chaque carte : année, nombre de classes, date de création, lien vers classes.
- Bouton "Nouveau registre" → modal avec champ année (défaut = année courante).
- Suppression avec modal de confirmation (cascade classes + appels).

## 4. Écran : Gestion des Classes (ADMIN)

- Filtre par registre (tous / un registre spécifique).
- Grille de cartes : nom, description, registre, compteur membres, lien "Gérer →".
- CRUD : modal de création/modification (nom, description, registre).
- Suppression avec modal de confirmation.

## 5. Écran : Gestion des Utilisateurs (ADMIN)

- Liste en tableau filtrable par **classe** et par **rôle**.
- Colonnes : Nom, Rôle (badge coloré), Classe, Email, Contact.
- CRUD via modal :
  - Création : prénom, nom, rôle, classe (si RESPONSABLE/MEMBRE), email + mdp
    (si ADMIN/RESPONSABLE), contact.
  - Modification : mêmes champs — mot de passe optionnel (vide = inchangé).
- Suppression avec modal de confirmation.

## 6. Écran : Nouvel Appel

### Sélection du contexte
- **Classe** : select des classes existantes (auto-sélectionnée et non-modifiable
  pour un `RESPONSABLE` qui n'a qu'une classe).
- **Trimestre** (1-4).
- **Mois** (restreint aux 3 mois du trimestre choisi).
- **Sabbat** : calculé automatiquement via `GET /calendrier/sabbats` après
  sélection du mois — affiche Sabbat 1 à 4 (ou 5) avec la date réelle du samedi
  (ex. "Sabbat 2 — 12 juillet").

### Conflit (doublon)
- Si l'appel pour cette combinaison existe déjà : bannière amber avec message
  et bouton "Ouvrir l'appel existant" → redirection directe vers l'appel.
  Pas de création forcée possible.

### Bouton de création
- Actif uniquement quand les 4 champs sont remplis.
- Après création → redirection vers l'écran de saisie de l'appel.

## 7. Écran : Saisie d'un appel (appels/[id])

### En-tête
- Bouton Retour, badge statut (FAIT / NON FAIT), bouton supprimer.
- Info-ligne : Classe, Trimestre, Mois, Sabbat.

### Présences
- Compteur "X/N présents" affiché en temps réel.
- **Desktop** : tableau avec colonnes Membre / Présence (bouton toggle) /
  Fréquence (7 boutons 1-7, désactivés si absent).
- **Mobile** : cartes empilées par membre — toggle Présent/Absent + sélecteur
  de fréquence en dessous.

### Questions globales
- Une ligne par question : libellé + compteur −/+ (valeur ≥ 0).

### Barre d'actions
- **Fixe en bas sur mobile**, statique sur desktop.
- Bouton "Enregistrer" (statut inchangé) + bouton "Marquer comme FAIT".
- Chaque bouton ouvre un modal de confirmation avant enregistrement.
- Après enregistrement réussi : indicateur "✓ Enregistré" temporaire.

### Suppression
- Modal de confirmation → suppression + redirection vers la liste des appels.

## 8. Écran : Liste des appels (ADMIN + RESPONSABLE)

- Tableau : Classe, Trimestre, Mois, Sabbat, Statut, Membres, actions.
- Filtre par classe (Admin uniquement).
- Clic sur ligne → écran de saisie de l'appel.
- Suppression inline (icône poubelle) avec modal de confirmation.
- Liste mise à jour en temps réel (Socket.IO `appel:created/updated/deleted`).

## 9. Écran : Questions globales (ADMIN)

- Liste ordonnée des questions (icône de poignée, numéro, libellé, code).
- **Créer** : modal — code (identifiant unique, obligatoire), libellé
  (obligatoire), ordre (optionnel, entier, défaut = fin de liste).
- **Modifier** : même modal pré-rempli.
- **Supprimer** : modal de confirmation — avertissement que les réponses
  existantes dans tous les appels seront supprimées.

## 10. Responsive / usage terrain

- Le cas d'usage principal est **un responsable, un téléphone, en réseau
  local**, pendant l'appel du samedi matin. Les écrans "Saisie d'appel"
  (tableau nominal + questions globales) sont prioritaires en mobile-first :
  gros boutons tactiles, barre d'actions fixe en bas, vue présences en
  cartes (pas en tableau scrollable horizontalement).
- Les écrans de gestion (Classes, Membres, Registres, Questions) sont
  utilisés principalement par l'Admin sur PC, mais restent fonctionnels
  sur mobile.
- La sidebar passe en drawer plein écran sur mobile (icône hamburger dans
  le Topbar).
