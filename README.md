# UQO-Requests

UQO-Requests est une application web Full-Stack de gestion de demandes.

### Cote utilisateur
- Inscription avec validation client + serveur.
- Connexion JWT.
- Creation d'une demande (`title`, `description`, `type` obligatoires).
- Consultation de ses demandes avec statut, dates de creation et mise a jour.
- Consultation du detail (historique + commentaires).
- Modification uniquement si le statut est `SUBMITTED`.

### Cote gestionnaire
- Consultation de toutes les demandes.
- Changement de statut avec transitions controlees:
  - `SUBMITTED -> IN_PROGRESS`
  - `SUBMITTED -> CLOSED`
  - `IN_PROGRESS -> CLOSED`
- Impossible de revenir a `SUBMITTED` apres `IN_PROGRESS`.
- Ajout de commentaires de traitement.
- Consultation complete des historiques.

### Securite et robustesse
- Permissions par role appliquees cote serveur.
- Validation serveur explicite et messages d'erreur controles.
- Endpoints proteges par JWT.
- CORS configurable par variables d'environnement.

## Architecture finale

```text
request-web-app/
  backend/
    manage.py
    requirements.txt
    requests_api/
      models.py
      serializers.py
      views.py
      permissions.py
      tests.py
    uqo_requests/
      settings.py
      urls.py
  frontend/
    src/
      context/AppContext.jsx
      services/api.js
      pages/
      components/
```

## Choix techniques

- Frontend: React + React Router + Context API + Axios.
- Backend: Django + Django REST Framework + SimpleJWT.
- Base de donnees: PostgreSQL (configuration par variables d'environnement).
- Compatibilite developpement/tests: SQLite possible en mode test local.

## Prerequis

- Node.js 20+
- Python 3.12+
- PostgreSQL 14+

## Installation et execution

### 1) Backend

```bash
cd backend
python -m pip install -r requirements.txt
```

Copier `backend/.env.example` vers un fichier `.env` (ou definir les variables dans l'environnement), puis:

```bash
python manage.py migrate
python manage.py runserver
```

API disponible sur `http://127.0.0.1:8000/api`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible sur `http://localhost:5173`.

## Variables d'environnement

### Backend

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `DB_ENGINE` (`postgresql` par defaut)
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `DATABASE_URL` (optionnel, prioritaire si defini)
- `DJANGO_TEST_USE_SQLITE` (optionnel, `True` par defaut en tests)
- `POSTGRES_CONN_MAX_AGE` (optionnel, defaut `60`)

Notes:
- En production (`DJANGO_DEBUG=False`), `DJANGO_SECRET_KEY` est obligatoire.
- `DATABASE_URL` supporte PostgreSQL et SQLite. Pour PostgreSQL, les options URL (ex: `sslmode=require`) sont prises en charge.

### Frontend

- `VITE_API_BASE_URL` (par defaut `http://localhost:8000/api`)

## Endpoints API principaux

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `GET /api/requests/`
- `POST /api/requests/`
- `GET /api/requests/{id}/`
- `PATCH /api/requests/{id}/`
- `DELETE /api/requests/{id}/`
- `POST /api/requests/{id}/change-status/`
- `GET /api/requests/{id}/comments/`
- `POST /api/requests/{id}/comments/`

## Qualite et verification

Backend:

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Validation PostgreSQL (recommandee pour la remise L3):

```bash
# 1) demarrer PostgreSQL (exemple Docker)
docker run --name uqo-postgres-l3 -e POSTGRES_DB=uqo_requests -e POSTGRES_USER=uqo_requests -e POSTGRES_PASSWORD=uqo_requests -p 5432:5432 -d postgres:16-alpine

# 2) executer les verifications backend avec PostgreSQL
cd backend
set DB_ENGINE=postgresql
set POSTGRES_DB=uqo_requests
set POSTGRES_USER=uqo_requests
set POSTGRES_PASSWORD=uqo_requests
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set DJANGO_TEST_USE_SQLITE=False
python manage.py migrate --noinput
python manage.py check
python manage.py test

# 3) nettoyer le conteneur de test
docker stop uqo-postgres-l3 && docker rm uqo-postgres-l3
```

Si PostgreSQL local n'est pas disponible pour les verifications rapides, utilisez temporairement SQLite:

```bash
DB_ENGINE=sqlite python manage.py makemigrations --check --dry-run
DB_ENGINE=sqlite python manage.py test requests_api
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run test:run
npm run test:coverage
```

## Section bonus (facultative)

Une section bonus au projet integrateur afin de permettre aux equipes qui le souhaitent d'aller plus loin et d'ameliorer leur note.

Cette section, facultative, permet d'obtenir jusqu'a 20 points supplementaires en travaillant sur:

- les tests backend ;
- les tests frontend ;
- l'optimisation de l'application.

Quelques points importants:

- Le bonus est accorde uniquement si le projet principal est fonctionnel.
- Il n'est pas necessaire d'avoir une couverture complete. La pertinence et la qualite du travail seront privilegiees.
- Les elements realises doivent etre clairement identifies dans le depot et expliques dans le `README.md`.

### Bonus actuellement integre dans ce depot

- Tests backend (fichier: `backend/requests_api/tests.py`):
  - couverture des regles critiques API: authentification, permissions, transitions de statut, commentaires, inscription;
  - verification des listings par role (utilisateur vs gestionnaire);
  - verification de la creation d'historique/commentaire lors d'un changement de statut;
  - verification des suppressions selon statut et role.
- Tests frontend (cibles et pertinents):
  - protection des routes (`ProtectedRoute`) ;
  - formulaire d'inscription (`Register`) avec validation client et soumission;
  - page de connexion (`Login`): message post-inscription, redirection par role, gestion des erreurs.
  - fichiers de tests:
    - `frontend/src/components/ProtectedRoute.test.jsx`
    - `frontend/src/pages/Login.test.jsx`
    - `frontend/src/pages/Register.test.jsx`
    - `frontend/src/test/setup.js`
- Optimisation frontend:
  - code splitting par route avec `React.lazy` + `Suspense` ;
  - memoisation de la valeur du `AppContext` et stabilisation des handlers avec `useCallback`;
  - etat `requestsHydrated` pour eviter les faux ecrans "introuvable" pendant le chargement asynchrone;
  - suppression d'un aller-retour API inutile lors de l'ajout d'un commentaire gestionnaire (mise a jour locale immediate, fallback serveur si necessaire).

Commandes de verification du bonus:

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd ../frontend
npm run test:run
npm run test:coverage
```

## Limites connues

- Pas de notifications temps reel.
- Pas de systeme d'attachement de fichiers.
- Pas de pagination/cap sur de tres grands volumes de demandes.

## Repartition du travail 

- Tanjonyavo Ramiandrisoa: implementation backend (modeles, API REST, permissions), integration frontend (parcours utilisateur, formulaires, appels API), qualite/tests (backend + frontend), et documentation finale.
