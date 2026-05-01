# StudyVault Production Deployment Notes

This project keeps development Docker and production-like Docker separate.

## Development

Use the existing compose file when editing code locally:

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- API docs: `http://localhost:8000/api/docs` when `SWAGGER_ENABLED=true`
- Database: `localhost:15432`

## Production-like Docker

Copy the production environment template:

```powershell
copy docker.prod.env.example .env
```

Set these values before starting:

- `DATABASE_PASSWORD`
- `JWT_SECRET` with at least 32 characters
- `PROD_CORS_ORIGIN`
- `PROD_FRONTEND_URL`
- `SMTP_USER` and `SMTP_PASS` if email verification/reset must work
- `GEMINI_API_KEY` if AI summary, Q&A, and embedding indexing must work

Start the production-like stack:

```powershell
docker compose -f docker-compose.prod.yml up --build
```

If the database volume already exists, keep using the same `DATABASE_PASSWORD`.
PostgreSQL only applies `POSTGRES_PASSWORD` when the volume is first created.
To intentionally reset the production-like database, stop the stack and remove
its volumes:

```powershell
docker compose -f docker-compose.prod.yml down -v
```

Services:

- Frontend through Nginx: `http://localhost:8080`
- Backend is reachable through the frontend reverse proxy at `http://localhost:8080/api`
- API docs are disabled by default for production-like runs. Set `SWAGGER_ENABLED=true` only for a private demo environment.
- Backend health check: `http://localhost:8080/api/health`
- Database: `localhost:15433`

## Production Safeguards

When `NODE_ENV=production`, the backend refuses unsafe configuration:

- `JWT_SECRET` cannot be missing, short, or a known development default.
- `CORS_ORIGIN` cannot be `*`.
- `AUTH_RETURN_RESET_TOKEN` cannot be `true`.

## Upload and AI Indexing

Document upload now responds after the file and database record are saved.
Embedding indexing runs in the background. If the AI provider rejects the request
because of quota or an invalid key, the upload still succeeds and the backend logs
the indexing failure.
