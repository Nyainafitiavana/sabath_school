# Architecture technique

## 1. Stack

| Couche | Techno |
|---|---|
| Frontend | Next.js 15 (App Router), Redux Toolkit + RTK Query, TailwindCSS v4 |
| Graphiques | Apache ECharts (tree-shaking manuel via `echarts/core`) — dashboard uniquement |
| Icônes | Lucide React |
| Backend | NestJS, Prisma ORM |
| Temps réel | Socket.IO (NestJS Gateway côté serveur, `socket.io-client` côté frontend) |
| Base de données | PostgreSQL |
| Auth | JWT (access token), bcrypt pour les mots de passe |
| Thème | Mode clair / mode sombre — classe CSS `dark` sur `<html>`, persisté en `localStorage` |
| i18n | React Context maison (`lib/i18n.tsx`) — Français (défaut) + Anglais, persisté en `localStorage` |
| Déploiement | Réseau local (LAN) — le PC "source" héberge front + back, les mobiles/tablettes s'y connectent via l'IP locale (ex. `http://192.168.1.x:3000`) |

## 2. Contraintes réseau local

- Le backend NestJS écoute sur `0.0.0.0:3001` (pas `localhost`) pour être
  joignable depuis les autres appareils du réseau.
- CORS backend configuré à `*` en environnement LAN fermé.
- Le frontend Next.js utilise `NEXT_PUBLIC_API_URL` pointant vers l'IP du PC,
  pas `localhost`, pour que les requêtes fonctionnent depuis les téléphones.
- UI mobile-first impérative : le tableau de saisie de l'appel (liste de
  membres) doit être utilisable au doigt, lignes assez hautes, boutons
  Présent/Absent et sélecteur 1/7–7/7 accessibles sans zoom.
  Sur mobile, la vue présences bascule en cartes empilées (pas de tableau
  horizontal scrollable).

## 3. Structure de dossiers (implémentée)

### Backend (NestJS)

```
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    auth/              # login, JWT strategy, guards (JwtAuthGuard, RolesGuard, ClasseAccessGuard)
                       # décorateurs : @CurrentUser, @Roles
    utilisateurs/      # CRUD utilisateurs (membres + responsables + admin)
    registres/         # CRUD registres (années)
    classes/           # CRUD classes ; endpoint utilisateurs-disponibles
    appels/            # CRUD appels ; émet événements WebSocket après chaque écriture
    questions-globales/ # CRUD questions globales (Admin) ; lecture pour tous
    dashboard/         # agrégations stats : GET /dashboard, GET /dashboard/serie
    calendrier/        # utilitaire : GET /calendrier/sabbats?annee=&mois=
    realtime/          # Socket.IO Gateway (/realtime) ; rooms classe:{id} et admin
    prisma/            # PrismaService (module global)
    main.ts            # listen('0.0.0.0', 3001)
```

### Frontend (Next.js App Router)

```
frontend/
  app/
    layout.tsx               # root layout : Redux Provider, script thème (anti-flash)
    login/
      page.tsx               # écran de connexion
    (admin)/
      layout.tsx             # AdminLayout : auth guard, LanguageProvider, Sidebar + Topbar
      dashboard/
        page.tsx
      registres/
        page.tsx
      classes/
        page.tsx
      utilisateurs/
        page.tsx
      appels/
        page.tsx             # liste + filtre classe
        nouveau/
          page.tsx           # création appel (sélection contexte)
        [id]/
          page.tsx           # saisie présences + questions + save/markDone
      questions-globales/
        page.tsx             # CRUD questions (Admin)
  components/
    layout/
      Sidebar.tsx            # sidebar gradient, nav traduite, collapse desktop, drawer mobile
      Topbar.tsx             # titre page, toggle thème, toggle langue (FR/EN)
    ui/
      Button.tsx
      Card.tsx
      Modal.tsx
      Select.tsx             # select searchable, groupé, sous-label
      Badge.tsx              # StatusBadge (FAIT/NON_FAIT), RoleBadge (ADMIN/RESPONSABLE/MEMBRE)
      Skeleton.tsx           # bloc animate-pulse réutilisable
      StatCard.tsx           # carte KPI dashboard
    charts/
      EChartsWrapper.tsx     # initialisation ECharts tree-shaking (tous composants déclarés)
      ClassePieChart.tsx     # camembert taux apprentissage par classe
      Top5Chart.tsx          # barres horizontales top 5 classes
      TrendChart.tsx         # courbe évolution taux global
  lib/
    i18n.tsx                 # LanguageProvider, useT() hook, getMoisLabel(), getSabbatLabel()
    useTheme.ts              # hook toggle dark/light, persistance localStorage
    utils.ts                 # cn(), formatDate(), MOIS_LABELS, SABBAT_LABELS
    hooks.ts                 # useAppDispatch, useAppSelector typés
    socket.ts                # singleton socket.io-client (connectSocket, disconnectSocket)
  store/
    index.ts                 # configureStore RTK
    api/
      authApi.ts
      registresApi.ts
      classesApi.ts
      utilisateursApi.ts
      appelsApi.ts           # inclut aussi useGetSabbatsQuery (GET /calendrier/sabbats)
      questionsApi.ts
      dashboardApi.ts        # useGetDashboardQuery + useGetDashboardSerieQuery
    slices/
      authSlice.ts           # token JWT, user connecté
      uiSlice.ts             # sidebarOpen, mobileMenuOpen
```

## 4. Endpoints API principaux (NestJS)

### Authentification
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Login, retourne `{ access_token, user }` |
| GET | `/auth/me` | AUTH | Profil utilisateur connecté |

### Registres
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/registres` | ADMIN | Liste des registres (avec `_count.classes`) |
| POST | `/registres` | ADMIN | Créer un registre (année) |
| DELETE | `/registres/:id` | ADMIN | Supprimer (cascade classes + appels) |

### Classes
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/classes?registreId=` | ADMIN, RESPONSABLE | Liste des classes filtrée |
| POST | `/classes` | ADMIN | Créer une classe |
| PATCH | `/classes/:id` | ADMIN | Modifier une classe |
| DELETE | `/classes/:id` | ADMIN | Supprimer (cascade utilisateurs + appels) |
| GET | `/classes/:id/utilisateurs-disponibles` | ADMIN | Utilisateurs sans classe (pour affectation) |

### Utilisateurs
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/utilisateurs?classeId=&role=` | ADMIN | Liste filtrée |
| POST | `/utilisateurs` | ADMIN | Créer |
| PATCH | `/utilisateurs/:id` | ADMIN | Modifier |
| DELETE | `/utilisateurs/:id` | ADMIN | Supprimer |

### Calendrier
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/calendrier/sabbats?annee=&mois=` | tous (AUTH) | Sabbats du mois (4 ou 5) avec leur date réelle |

### Appels
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/appels?classeId=&trimestre=&mois=&sabbat=` | ADMIN, RESPONSABLE | Liste filtrée |
| POST | `/appels` | ADMIN, RESPONSABLE | Créer (retourne erreur avec `existingId` si doublon) |
| GET | `/appels/:id` | ADMIN, RESPONSABLE | Détail (presences + reponses + utilisateurs) |
| PATCH | `/appels/:id` | ADMIN, RESPONSABLE | Enregistrer présences + réponses + statut |
| DELETE | `/appels/:id` | ADMIN, RESPONSABLE | Supprimer (cascade presences + reponses) |

### Questions globales
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/questions-globales` | tous (AUTH) | Liste ordonnée |
| POST | `/questions-globales` | ADMIN | Créer |
| PATCH | `/questions-globales/:id` | ADMIN | Modifier |
| DELETE | `/questions-globales/:id` | ADMIN | Supprimer (cascade reponses) |

### Dashboard
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| GET | `/dashboard?annee=&trimestre=&mois=&sabbat=&classeId=` | ADMIN (global), RESPONSABLE (sa classe) | Statistiques agrégées par classe |
| GET | `/dashboard/serie?annee=&trimestre=&mois=&sabbat=&classeId=` | ADMIN, RESPONSABLE | Série temporelle pour graphique de tendance |

## 5. Sécurité / autorisations

- Guard NestJS `RolesGuard` basé sur `role` du JWT (`ADMIN` / `RESPONSABLE`).
- Guard supplémentaire `ClasseAccessGuard` : pour un `RESPONSABLE`, vérifie
  que la `classeId` demandée correspond à sa propre `classeId` (champ direct
  sur l'utilisateur) avant d'autoriser lecture/écriture sur `/classes/:id`,
  `/appels`, `/dashboard`.
- Les routes de gestion des Utilisateurs, Classes, Registres et Questions
  (CRUD structurel) sont réservées à `ADMIN`.
- `ValidationPipe` global avec `whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true`.

## 6. Calcul des taux et du dashboard

- **Taux d'apprentissage d'une classe** = moyenne de
  `frequenceApprentissage / 7` sur les `Presence` où `present = true` et
  `frequenceApprentissage IS NOT NULL`, filtrée par les filtres actifs.
- **Top 5 classes** = tri décroissant sur ce taux moyen, limite 5.
- **Totaux par question globale** = `SUM(valeur)` sur `ReponseQuestionGlobale`
  groupé par `questionId`, filtré par les filtres actifs.
- **Série temporelle** (`/dashboard/serie`) : agrégation par mois (si pas de
  filtre mois) ou par sabbat (si mois sélectionné) — retourne des points
  `{ label, taux }` pour le graphique de tendance.
- Toutes ces agrégations sont calculées **côté backend** pour éviter de
  renvoyer toutes les lignes brutes.

## 7. Temps réel (Socket.IO)

### 7.1 Backend — Gateway NestJS

- Module `RealtimeGateway` (`@WebSocketGateway`) sur namespace `/realtime`.
- Les services (`AppelsService`) émettent via le gateway **après** chaque
  écriture réussie en base.

Événements émis :

| Événement | Déclenché quand | Payload |
|---|---|---|
| `appel:created` | Nouvel appel créé | `{ appelId, classeId, trimestre, mois, sabbat }` |
| `appel:updated` | Présences / réponses enregistrées, statut changé | `{ appelId, classeId, statut }` |
| `appel:deleted` | Appel supprimé | `{ appelId, classeId }` |
| `dashboard:refresh` | Après tout `appel:*` | `{ classeId }` |

- Rooms : `classe:{id}` (rejointe par le responsable à la connexion),
  `admin` (rejointe par les comptes Admin).

### 7.2 Frontend — intégration Redux

- Singleton `socket.io-client` initialisé dans `lib/socket.ts` après login.
- À la réception d'un événement → `api.util.invalidateTags(...)` via RTK Query
  pour forcer un refetch propre.
- Dashboard et liste des appels se rafraîchissent automatiquement.
- Reconnexion automatique gérée par `socket.io-client` (important en Wi-Fi
  local où les téléphones peuvent perdre puis retrouver le signal).

## 8. UI — Thème et internationalisation

### 8.1 Mode sombre
- Classe CSS `dark` posée sur `<html>` via un script inline dans le root
  layout (avant hydratation, pour éviter le flash).
- Persisté en `localStorage` (clé `theme`).
- Toggle dans le `Topbar` (icône Soleil / Lune).
- TailwindCSS v4 avec `@custom-variant dark (&:where(.dark, .dark *))`.

### 8.2 Internationalisation
- Système maison dans `lib/i18n.tsx` : deux objets de traduction `fr` et `en`,
  `LanguageProvider` (React Context), hook `useT()` renvoyant `{ lang, setLang, t }`.
- Fonction `t('section.key')` avec fallback sur le français.
- Fonctions helpers : `getMoisLabel(mois, lang)` (via `Intl.DateTimeFormat`),
  `getSabbatLabel(sabbat, lang)`.
- Langue persistée en `localStorage` (clé `lang`), défaut `fr`.
- Toggle FR/EN dans le `Topbar`.
- `LanguageProvider` positionné dans `app/(admin)/layout.tsx` (wraps toute
  l'interface authentifiée).
