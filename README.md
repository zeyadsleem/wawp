# WAWP - Write Anything, Publish Everywhere

A unified publishing platform that allows users to write content once and publish it to multiple platforms (Medium, Dev.to, Hashnode) from a single dashboard.

## Features

- **Email-based Auth** - Simple login without passwords (MVP)
- **Content Management** - Create, edit, and manage your posts
- **Multi-platform Publishing** - Publish to Medium, Dev.to, and Hashnode simultaneously
- **Dashboard** - View all your posts and their publishing status

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Cloudflare Workers |
| Database | PostgreSQL (NeonDB) |
| Auth | JWT tokens |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- NeonDB account (for database)

### Installation

```bash
npm install
```

### Development

```bash
# Run the worker (backend)
npm run dev

# Run the client (frontend) - in another terminal
npm run dev:client
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Deploy

```bash
# Set your Cloudflare API token
export CLOUDFLARE_API_TOKEN=your_token

# Deploy to Cloudflare Workers
npm run deploy
```

## Environment Variables

Create a `.dev.vars` file for local development:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

## Project Structure

```
wawp/
├── src/
│   ├── client/           # React frontend
│   │   ├── components/   # UI components
│   │   ├── context/      # React context (auth)
│   │   ├── lib/          # API client
│   │   └── pages/        # Page components
│   └── worker/           # Cloudflare Workers API
│       ├── db.ts         # Database utilities
│       ├── auth.ts       # JWT authentication
│       ├── platforms.ts  # Platform publishers
│       └── index.ts      # Main API handler
├── package.json
├── wrangler.toml         # Cloudflare config
└── vite.config.ts        # Vite config
```

## Supported Platforms

- **Medium** - Publish to Medium.com
- **Dev.to** - Publish to Dev.to
- **Hashnode** - Publish to Hashnode

## License

MIT