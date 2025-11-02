# Manār (منار)

Un'applicazione full-stack per la ricerca, lettura e traduzione di testi arabi dalla biblioteca Shamela.ws, con traduzioni AI tramite Gemini. Interfaccia moderna ispirata a OpenAI.com.

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express, TypeScript, Node.js
- **Database:** Neon PostgreSQL (free tier) con Drizzle ORM
- **State Management:** TanStack Query (React Query)
- **Authentication:** Google OAuth 2.0, Apple Sign-In
- **AI Translation:** Google Gemini API
- **Text Source:** Shamela.ws API
- **Deployment:** Vercel

---

## 🛠️ Features

- 🔍 **Ricerca avanzata:** ricerca full-text con filtri per autore, categoria, epoca
- 📖 **Lettura testi arabi:** visualizzazione integrale
- 🤖 **Traduzione AI:** contestuale via Gemini API, caching locale
- 📚 **Segnalibri:** salva e gestisci i tuoi riferimenti
- 📊 **Cronologia:** traccia il tuo progresso di lettura
- 🔐 **Autenticazione:** login con Google, Apple

---

## 🏁 Getting Started

### Prerequisiti

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installazione

1. **Clona la repository**
    ```
    git clone https://github.com/stevemaster478/Manar.git
    cd Manar
    ```
2. **Installa le dipendenze**
    ```
    npm install
    ```
3. **Configura le variabili d'ambiente**
    Crea un file `.env` nella root del progetto:

    ```
    # Database Neon (https://neon.tech)
    DATABASE_URL=postgresql://user:password@host/database

    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback

    # Apple Sign-In (facoltativo)
    APPLE_CLIENT_ID=your_apple_client_id
    APPLE_REDIRECT_URI=http://localhost:5173/api/auth/apple/callback

    # Gemini API
    GOOGLE_AI_API_KEY=your_gemini_api_key

    # Shamela.ws API
    SHAMELA_API_URL=https://shamela.ws/api
    SHAMELA_API_KEY=your_shamela_api_key

    # Segreto di sessione
    SESSION_SECRET=your-random-secret-key-change-in-production

    # Server
    PORT=5173
    NODE_ENV=development
    ```

4. **Avvia il server di sviluppo**
    ```
    npm run dev
    ```
    L'app sarà disponibile su `http://localhost:5173`

---

## 🗂️ Project Structure

<pre>
.
├── client/             # React frontend
│   ├── public/         # Static assets
│   └── src/            # Source code
│       ├── components/ # UI components
│       ├── pages/      # Pages
│       └── lib/        # Utility functions
├── server/             # Backend Express
│   ├── index.ts        # Main server file
│   ├── routes.ts       # API routes
│   └── vite.ts         # Vite SSR config
├── shared/             # Shared logic
│   └── schema.ts       # DB schema
└── public/             # Build output
</pre>

---

## 📦 Scripts Utili

- `npm run dev` — Sviluppo con hot reload (client & server)
- `npm run build` — Build per produzione
- `npm run preview` — Preview build produzione localmente
- `npm run typecheck` — TypeScript type checking

---

## 🗄️ Database Setup (Neon.tech • Free Tier consigliato)

1. Crea un account su [Neon](https://neon.tech)
2. Crea progetto e copia la connection string (`DATABASE_URL`)

---

## 🚢 Deployment su Vercel

1. Installa Vercel CLI
    `npm i -g vercel`

3. Esegui `vercel` nella root  
4. Configura le variabili ambiente nella dashboard Vercel  
5. Deploy automatico ogni push

**Note:**  
- Database Neon compatibile con Vercel  
- Le API di backend sono esposte su `/api/*`

---

## 👨‍💻 Sviluppo

- Struttura monorepo con un unico `package.json`
- Vite gestisce l'HMR sul frontend
- Hot reload automatico per un flusso rapido

---

## 📖 License

MIT

---

> Manār — App mobile Android/iOS per consultare i testi Shamela.ws, ricerca avanzata e traduzione AI contestuale in italiano. Interfaccia moderna ispirata a OpenAI.com.
