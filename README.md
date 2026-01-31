# Matsu Matcha Dashboard

A full-stack business management dashboard for matcha tea import/distribution operations. Built for managing B2B client relationships, Japanese supplier coordination, inventory tracking, and profitability analytics.

## Features

### Client Management
- Track B2B customers (cafes, restaurants, distributors)
- Manage client-specific pricing and discounts
- View order history and purchasing patterns
- Client profitability analysis

### Supplier Management
- Japanese matcha supplier database
- Lead time tracking (typically 1-2 months)
- Product catalog by grade (competition, ceremonial, premium, cafe, culinary)
- Supplier comparison tools

### Inventory Control
- Real-time stock level monitoring
- Automated reorder alerts
- Warehouse location tracking
- Version control with snapshots for rollback

### Analytics & Profitability
- Revenue and profit dashboards
- Cost breakdown (JPY cost, exchange rate, shipping, import tax)
- Per-client and per-product profitability
- Historical trend analysis

### AI-Powered Insights (MatsuMind)
- Product swap recommendations for profit optimization
- Intelligent reorder suggestions
- Chat-based assistant for business queries

### n8n Workflow Integration
- Pre-built automation workflows
- Notification systems
- Data synchronization

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 + Radix UI components
- Recharts for data visualization
- React Query + tRPC for data fetching
- Wouter for routing

**Backend:**
- Express.js with TypeScript
- tRPC for type-safe API
- Drizzle ORM with MySQL
- OpenAI API for AI features

**Infrastructure:**
- Vite for development and builds
- MySQL 8 database
- Optional Google Sheets integration for live data

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CUSTEDLOL/manusAIProject.git
   cd manusAIProject
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install --legacy-peer-deps
   ```

3. **Set up MySQL database**

   Using Homebrew (Mac):
   ```bash
   brew install mysql
   brew services start mysql
   mysql -u root -p -e "CREATE DATABASE manus_ai;"
   ```

   Using Docker:
   ```bash
   docker run -d --name manus-mysql \
     -e MYSQL_ROOT_PASSWORD=password \
     -e MYSQL_DATABASE=manus_ai \
     -p 3306:3306 \
     mysql:8
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your database URL:
   ```env
   DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/manus_ai
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Seed demo data (optional)**
   ```bash
   node seed-data.mjs
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Open in browser**

   Navigate to http://localhost:3000

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API clients
├── server/                 # Express backend
│   ├── _core/              # Core server modules
│   ├── routers.ts          # tRPC route definitions
│   └── storage.ts          # Database operations
├── drizzle/                # Database schema and migrations
├── shared/                 # Shared types and constants
├── data/                   # CSV data files
└── n8n_workflows/          # Automation workflow exports
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run test` | Run tests |
| `npm run db:push` | Push schema to database |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | No | Secret for JWT authentication |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `GOOGLE_SHEETS_URL` | No | Google Sheets URL for live data sync |

See `.env.example` for all available options.

## Data Model

The system tracks:
- **Suppliers**: Japanese matcha producers with contact info and lead times
- **Products**: Matcha varieties by grade with cost and quality scores
- **Clients**: B2B customers with pricing terms and discounts
- **Inventory**: Stock levels, reorder points, and warehouse locations
- **Orders**: Supplier orders and client deliveries
- **Transactions**: Financial records for profitability tracking

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
