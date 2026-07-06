# Cahier des charges — Application de gestion de l'École du Sabat

## 1. Contexte

L'École du Sabat est le département de l'église adventiste chargé de l'étude
biblique hebdomadaire. Chaque semaine (du samedi au vendredi), une leçon est
étudiée. Chaque samedi matin, chaque classe (répartition par tranche d'âge)
effectue un **Registre** (appel de présence + suivi d'étude + statistiques
d'activités).

L'application doit numériser ce processus : gestion des classes, des membres,
des appels hebdomadaires, et un tableau de bord de suivi.

## 2. Objectifs

- Remplacer le registre papier par une application web responsive.
- Permettre à un responsable de classe de faire l'appel depuis un mobile
  connecté au réseau local (l'app est servie depuis un PC/serveur local, les
  appareils s'y connectent via l'IP du PC).
- Donner à l'administrateur une vue d'ensemble (dashboard) de toutes les
  classes, tous trimestres confondus.
- Conserver un historique par année (un **Registre** = une année).

## 3. Acteurs et rôles

Tous les acteurs sont modélisés comme un **unique type Utilisateur**, distingué
par un champ `role` :

| Rôle | Description | Accès | Appartenance classe |
|---|---|---|---|
| **ADMIN** | Gère l'ensemble de l'application | Toutes les classes, tous les registres, CRUD complet, dashboard global | Aucune (transversal) |
| **RESPONSABLE** | Responsable d'une classe | Uniquement sa classe : faire l'appel, consulter l'historique et le dashboard de sa classe | **1 classe** (une seule) |
| **MEMBRE** | Personne inscrite dans une classe | Aucun accès à l'application (pas de login) | **1 classe** (une seule) |

Règles clés :
- **1 Responsable = 1 classe.** Un utilisateur avec le rôle Responsable est
  rattaché à une seule classe (celle dont il a la charge).
- **1 classe = plusieurs Responsables possibles.** Une classe peut avoir
  plusieurs responsables en parallèle.
- **Le responsable fait partie de sa propre classe.** Lors de l'appel, les
  responsables apparaissent dans la liste de présence au même titre que les
  membres simples (ils sont aussi comptés/présents/notés sur leur étude de
  la leçon).
- Seuls **ADMIN** et **RESPONSABLE** disposent d'un compte de connexion
  (email + mot de passe) ; un **MEMBRE** n'a qu'une fiche (nom, prénom,
  contact) sans accès à l'application.

## 4. Fonctionnalités principales

### 4.1 Authentification
- Login (email + mot de passe) pour Admin et Responsables uniquement.
- JWT, gestion de session, changement de mot de passe.

### 4.2 Gestion des Registres (années)
- CRUD Registre : un registre = une année civile.
- À la création, année courante proposée par défaut.
- Un registre contient plusieurs Classes (créées manuellement chaque année,
  pas de duplication automatique d'une année à l'autre).

### 4.3 Gestion des Classes (CRUD, Admin uniquement)
- Nom, description/tranche d'âge, registre (année) de rattachement.
- Affectation d'un ou plusieurs **responsables** : select des Utilisateurs
  ayant le rôle Responsable **et sans classe déjà affectée** (puisqu'un
  responsable n'a qu'une seule classe), ou promotion d'un membre simple en
  responsable de cette classe.
- Ajout de **membres** à la classe : un utilisateur (membre ou responsable)
  déjà affecté à une classe n'apparaît plus dans le select (contrainte
  1 utilisateur = 1 classe, quel que soit son rôle).

### 4.4 Gestion des Membres et Responsables
- Une seule fiche **Utilisateur** pour tous : nom, prénom, rôle
  (ADMIN / RESPONSABLE / MEMBRE), classe d'affectation, et email/mot de
  passe uniquement si Admin ou Responsable.
- CRUD par l'Admin. Le responsable ne modifie pas l'affectation des
  utilisateurs de sa classe (réservé à l'Admin) — il consulte la liste de
  sa classe (y compris lui-même) pour faire l'appel.

### 4.5 Faire l'appel (Registre hebdomadaire)
Étapes pour démarrer un appel :
1. Sélection de la **classe** (implicite pour un responsable connecté à une
   seule classe, à choisir si plusieurs).
2. Sélection du **trimestre** (1 à 4).
3. Sélection du **mois** du trimestre.
4. Sélection du **Sabbat du mois** : Sabbat 1, 2, 3, 4, et Sabbat 5 si le mois
   compte 5 samedis.

Contenu de l'appel :
- Tableau listant chaque membre de la classe avec, par ligne :
  - Présent / Absent (toggle)
  - Fréquence d'étude de la leçon : 1/7 à 7/7 (désactivée si absent)
- Questions globales (fixes, communes à toute l'application), remplies une
  fois pour l'ensemble de la classe à la fin de l'appel, ex :
  - Nombre de bonnes actions faites (*Firy ny nanao asa soa*)
  - Nombre de conférences bibliques faites (*Firy ny nanao conférence
    ara-baiboly*)
  - Nombre de dons/partages faits (*Firy no nizara fanapiana*)
  - etc. (liste définie via CRUD Admin ou seed)

Un appel peut être créé, puis **repris/modifié** plus tard (ex : sabbat non
fait à temps à cause d'une conférence imprévue) — statut `NON_FAIT` /
`FAIT`, modifiable tant que nécessaire.

### 4.6 Gestion des Questions Globales (CRUD, Admin uniquement)
- La liste des questions globales est gérée entièrement par l'Admin via un
  écran dédié (CRUD complet : créer, modifier, réordonner, supprimer).
- Chaque question possède un **code** unique (identifiant technique), un
  **libellé** affiché dans l'appel, et un **ordre** d'affichage.
- La suppression d'une question entraîne la suppression en cascade de toutes
  les réponses existantes dans les appels.
- Un seed initial fournit les questions de départ ; elles peuvent ensuite être
  modifiées par l'Admin sans toucher au code.

### 4.7 Dashboard
Filtres disponibles : **Année** (obligatoire), **Trimestre**, **Mois**,
**Sabbat**, et **Classe** (Admin uniquement) :
- KPIs : nombre de classes suivies, total membres, taux d'apprentissage moyen,
  meilleure classe.
- Graphique de tendance : évolution mensuelle ou par sabbat du taux global.
- Taux d'apprentissage par classe (graphique camembert **ECharts**).
- Top 5 des classes avec le meilleur taux d'apprentissage (barres horizontales).
- Totaux généraux par question globale (toutes classes confondues).
- Tableau détaillé par classe : membres, présents, absents, 7/7, taux présence,
  taux absence, taux apprentissage.

L'Admin voit le dashboard global (toutes classes). Le Responsable voit un
dashboard limité à sa propre classe.

## 5. Contraintes techniques

- **Frontend** : Next.js (App Router) + Redux Toolkit (RTK Query) + TailwindCSS v4,
  responsive mobile-first (utilisation prévue sur smartphone connecté au réseau local).
- **Backend** : NestJS + Prisma (PostgreSQL).
- **Temps réel** : Socket.IO — le dashboard et la liste des appels se rafraîchissent
  automatiquement sans rechargement.
- **Thème** : mode clair / mode sombre (bascule dans la barre de navigation),
  persisté en localStorage.
- **Internationalisation** : interface disponible en **Français** (défaut) et
  **Anglais**, sélectable depuis la barre de navigation, persisté en localStorage.
- **Performance** : états de chargement (skeleton animé) sur tous les écrans
  pendant le chargement des données.
- Application servie en local (PC/serveur), accès des mobiles via l'IP locale
  du PC — pas de dépendance à une connexion internet.

## 6. Hors périmètre (à ce stade)

- Notifications push / SMS.
- Application mobile native (le responsive web suffit).
- Gestion multi-églises (une seule église cible pour l'instant).
- Duplication automatique des classes/membres d'une année sur l'autre.
