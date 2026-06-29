# SHRAMIK LENS

AI-powered digital livelihood passports for India's informal workforce.

## Run locally

```bash
cp server/.env.example server/.env
npm install
npm run dev
```

The worker portal runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Architecture

- `client` — React 19, Vite, Tailwind CSS, React Query, Framer Motion and Recharts
- `server` — Express, MongoDB/Mongoose, JWT access + refresh tokens, Socket.IO
- Optional services — Gemini, Cloudinary and OCR credentials are configured through environment variables

The UI includes interactive worker dashboard, income analytics, digital passport with QR verification, document vault, AI-ranked jobs, scheme guidance, growth recommendations and an AI assistant.
