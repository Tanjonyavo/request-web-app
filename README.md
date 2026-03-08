# UQO-Requests

UQO-Requests est une application web de gestion de demandes internes réalisée dans le cadre du cours INF1743.

L'idee est simple: un utilisateur cree une demande, suit son traitement, et un gestionnaire peut la prendre en charge, changer son statut et ajouter des commentaires.

## Ce que le projet permet

### Cote utilisateur
- creer un compte;
- se connecter;
- creer une demande;
- voir ses demandes;
- modifier/supprimer sa demande tant qu'elle est en `SUBMITTED`.

### Cote gestionnaire
- se connecter;
- voir toutes les demandes;
- changer le statut (`SUBMITTED`, `IN_PROGRESS`, `CLOSED`);
- ajouter des commentaires de traitement.

## Technologies utilisees

- Frontend: React, React Router, Axios, Vite
- Backend: Django, Django REST Framework, JWT (SimpleJWT)
- Base de donnees: SQLite (livrable L2)

## Installation

### 1) Backend

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Si `python` n'est pas reconnu sur Windows, utilise le chemin complet, par exemple:

```bash
C:\Users\ramia\AppData\Local\Programs\Python\Python313\python.exe manage.py runserver
```

Le backend tourne sur `http://127.0.0.1:8000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur `http://localhost:5173`.

## Variables d'environnement

### Backend
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`

### Frontend
- `VITE_API_BASE_URL` (par defaut: `http://localhost:8000/api`)

## API principale

Base URL: `http://localhost:8000/api`

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/refresh/`
- `GET /auth/me/`
- `GET /requests/`
- `POST /requests/`
- `GET /requests/{id}/`
- `PATCH /requests/{id}/`
- `DELETE /requests/{id}/`
- `POST /requests/{id}/change-status/` (gestionnaire)
- `GET /requests/{id}/comments/`
- `POST /requests/{id}/comments/` (gestionnaire)

## Regles metier importantes

- Une nouvelle demande est creee avec le statut `SUBMITTED`.
- L'auteur est associe automatiquement.
- Un utilisateur normal ne voit que ses demandes.
- Un utilisateur ne peut pas modifier une demande deja en traitement.
- Seul un gestionnaire peut changer le statut.

## Verification rapide

Backend:

```bash
python manage.py check
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py migrate --noinput
python manage.py test
```

Frontend:

```bash
npm run lint
npm run build
```

## Admin Django

Pour acceder a l'interface admin:

```bash
cd backend
python manage.py createsuperuser
```

Puis connexion sur `http://127.0.0.1:8000/admin/`.
