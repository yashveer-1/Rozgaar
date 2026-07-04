# SHRAMIK LENS

AI-powered digital livelihood passports for India's informal workforce.

## Run locally

```bash
cp server/.env.example server/.env
npm install
npm run dev
```

The worker portal runs at `http://localhost:5173` and the API at `http://localhost:5000`.

For production deployments, wire the frontend and backend as follows:
- Frontend: `https://rozgaar-client-ten.vercel.app`
- Backend: `https://rozgaar-vyxw.onrender.com`
- Set `VITE_API_URL=https://rozgaar-vyxw.onrender.com/api` in the Vercel environment.
- Set `CLIENT_URL=https://rozgaar-client-ten.vercel.app` in the Render environment.

Before starting, open `server/.env` and replace `<db_password>` in `MONGODB_URI`
with the password for the `ys748477_db_user` MongoDB Atlas user. If the password
contains reserved URL characters such as `@`, `:`, `/`, or `#`, URL-encode it.
Also replace both JWT secret placeholders with long, random values.

## Architecture

- `client` — React 19, Vite, Tailwind CSS, React Query, Framer Motion and Recharts
- `server` — Express, MongoDB/Mongoose, JWT access + refresh tokens, Socket.IO
- Optional services — Gemini, Cloudinary and OCR credentials are configured through environment variables

The UI includes interactive worker dashboard, income analytics, digital passport with QR verification, document vault, AI-ranked jobs, scheme guidance, growth recommendations and an AI assistant.
