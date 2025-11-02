# Manār

A full-stack web application built with React, Express, and TypeScript.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express, TypeScript, Node.js
- **Database**: Neon PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)

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

3. Set up environment variables (optional):
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgres_connection_string
PORT=5173
NODE_ENV=development
```

Note: DATABASE_URL is optional in development mode. If not set, the app will run but database functionality will be disabled.

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

## Development

The project uses a monorepo structure with a single package.json. The development server runs both the client and server, with Vite handling hot module replacement for the frontend.

## License

MIT

