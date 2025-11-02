# Manār (منار)

Un'applicazione full-stack per la ricerca, lettura e traduzione di testi arabi dalla biblioteca Shamela.ws, con traduzioni AI tramite Gemini.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Node.js
- **Database**: Neon PostgreSQL (free tier) con Drizzle ORM
- **Authentication**: Google OAuth 2.0 e Apple Sign-In
- **AI Translation**: Google Gemini API
- **Text Source**: Shamela.ws API per ricerca testi arabi
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
# Database (Neon PostgreSQL - free tier: https://neon.tech)
DATABASE_URL=postgresql://user:password@host/database

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback

# Apple Sign-In (optional)
APPLE_CLIENT_ID=your_apple_client_id
APPLE_REDIRECT_URI=http://localhost:5173/api/auth/apple/callback

# Google Gemini API
GOOGLE_AI_API_KEY=your_gemini_api_key

# Shamela.ws API (optional)
SHAMELA_API_URL=https://shamela.ws/api
SHAMELA_API_KEY=your_shamela_api_key

# Session Secret
SESSION_SECRET=your-random-secret-key-change-in-production

# Server
PORT=5173
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build both client and server for production
- `npm run preview` - Preview production build locally
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
.
├── client/          # React frontend application
│   ├── public/      # Static assets
│   └── src/         # Source files
│       ├── components/  # React components
│       ├── pages/       # Page components
│       └── lib/         # Utility functions
├── server/          # Express backend application
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API routes
│   └── vite.ts      # Vite SSR configuration
├── shared/          # Shared code between client and server
│   └── schema.ts    # Database schema definitions
└── public/          # Build output for production

```

## Features

- 🔍 **Ricerca avanzata**: Ricerca full-text nei testi di Shamela con filtri per autore, categoria, epoca
- 📖 **Lettura testi**: Visualizzazione integrale dei testi arabi originali
- 🤖 **Traduzione AI**: Traduzione contestuale tramite Google Gemini API con caching locale
- 📚 **Segnalibri**: Salva e gestisci i tuoi segnalibri
- 📊 **Cronologia lettura**: Traccia il tuo progresso di lettura
- 🔐 **Autenticazione**: Login con Google e Apple

## Database Setup

### Neon PostgreSQL (Consigliato - Free Tier)

1. Vai su [Neon.tech](https://neon.tech)
2. Crea un account gratuito
3. Crea un nuovo progetto
4. Copia la connection string e aggiungila a `.env` come `DATABASE_URL`

**Free Tier include:**
- 0.5 GB storage
- Database PostgreSQL completo
- Perfect per progetti personali

## Deployment su Vercel

1. Installa Vercel CLI: `npm i -g vercel`
2. Esegui `vercel` nella root del progetto
3. Configura le variabili d'ambiente su Vercel Dashboard
4. Il progetto sarà deployato automaticamente

**Note per Vercel:**
- Assicurati che tutte le variabili d'ambiente siano configurate
- Il database Neon funziona perfettamente con Vercel
- Le API routes sono automaticamente esposte su `/api/*`

## Development

Il progetto usa una struttura monorepo con un singolo package.json. Il server di sviluppo esegue sia client che server, con Vite che gestisce l'hot module replacement per il frontend.

## License

MIT

