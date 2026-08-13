# Premium Oils Website

A React storefront for an edible oils brand with a FastAPI backend and MongoDB data layer.

## Tech stack

- Frontend: React + CRA + CRACO + Tailwind
- Backend: FastAPI
- Database: MongoDB
- Auth: JWT-based user/admin authentication

## Project structure

- [frontend](frontend): customer-facing web app
- [backend](backend): API server and database logic
- [memory](memory): product requirements and planning notes

## Local development

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Environment variables

Copy the example env files and fill in real values before running the app:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

See [frontend/.env.example](frontend/.env.example) and [backend/.env.example](backend/.env.example) for the required variables.

## Deployment

Use a split deployment model for production:

- Frontend: Vercel
- Backend: Render or Railway
- Database: MongoDB Atlas

The frontend app should point to the deployed backend URL with `REACT_APP_BACKEND_URL`.

## Notes

This project was generated from an initial scaffold and is now being prepared for real deployment and production configuration.
