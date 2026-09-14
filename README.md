# SpendWise — MERN Expense Tracker

SpendWise is a full-stack MERN expense management application with JWT authentication, per-user data isolation, real MongoDB persistence, backend pagination, filters/search, analytics, budgets, recurring transactions, savings goals, attachments, and filtered CSV export.

## Features

- Register, login, logout, JWT-protected API and frontend routes
- Per-user isolation for transactions, accounts, categories, budgets, goals, analytics and exports
- Default accounts and income/expense categories created at registration
- Transaction add/edit/delete with account, category, date, note, recurring settings and optional attachment
- Server-side pagination, combinable filters, sorting and debounced search
- CSV export using the active transaction filters
- Account CRUD with calculated balances and safe delete checks
- Custom income and expense categories
- Dashboard driven by real transaction data
- Recharts analytics for Week / Month / 3 Months / Year
- Overall and category monthly budgets with live progress
- Daily / Weekly / Monthly / Yearly recurring transaction generation with duplicate protection
- Savings goal CRUD and progress tracking
- Responsive desktop/mobile navigation, loading/empty/error states and toast feedback

## Stack

**Frontend:** React 18, Vite, Redux Toolkit, React Router, Tailwind CSS, Recharts, Lucide React, Sonner, Axios, Vitest, React Testing Library.

**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, Zod, Helmet, CORS, express-rate-limit, Multer, Cloudinary (optional), node-cron, Jest, Supertest.

## Structure

```text
expense-tracker/
├── client/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   ├── uploads/
│   ├── .env.example
│   └── package.json
├── package.json
├── README.md
└── vercel.json
```

## Local setup (Windows PowerShell)

```powershell
Set-Location "E:\personal\expense track"

npm install
npm install --prefix server
npm install --prefix client

Copy-Item server\.env.example server\.env -ErrorAction SilentlyContinue
Copy-Item client\.env.example client\.env -ErrorAction SilentlyContinue

npm run dev
```

Frontend: `http://localhost:5173`

Backend health: `http://localhost:5000/api/health`

If port 5000 is already occupied:

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
Get-Process -Id <OwningProcessPID>
Stop-Process -Id <OwningProcessPID> -Force
```

Only stop the process after confirming it is an old SpendWise/Node process.

## Environment variables

### `server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/spendwise
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Cloudinary is optional. When Cloudinary credentials are omitted, development uploads are stored in `server/uploads/`. Use Cloudinary in deployed environments because host-local files can be ephemeral.

## API

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/me` | Current user | Yes |
| GET | `/api/transactions` | Paginated/filtered transactions | Yes |
| POST | `/api/transactions` | Create transaction | Yes |
| GET | `/api/transactions/:id` | Get one transaction | Yes |
| PATCH | `/api/transactions/:id` | Update transaction | Yes |
| DELETE | `/api/transactions/:id` | Delete transaction | Yes |
| POST | `/api/transactions/attachment` | Upload receipt/attachment | Yes |
| GET | `/api/transactions/export` | Filtered CSV export | Yes |
| GET/POST | `/api/accounts` | List/create accounts | Yes |
| GET/PATCH/DELETE | `/api/accounts/:id` | Account operations | Yes |
| GET/POST | `/api/categories` | List/create categories | Yes |
| PATCH/DELETE | `/api/categories/:id` | Category operations | Yes |
| GET | `/api/budgets/current` | Current monthly budget + progress | Yes |
| GET/POST | `/api/budgets` | List/create budgets | Yes |
| PATCH | `/api/budgets/:id` | Update budget | Yes |
| GET/POST | `/api/goals` | List/create savings goals | Yes |
| PATCH/DELETE | `/api/goals/:id` | Goal operations | Yes |
| GET | `/api/analytics/summary` | Summary metrics | Yes |
| GET | `/api/analytics/trends` | Trend data | Yes |
| GET | `/api/analytics/categories` | Category breakdown | Yes |

## Transaction query parameters

`page`, `limit`, `type`, `category`, `account`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `search`, `sort`.

Sort values: `newest`, `oldest`, `highest`, `lowest`.

The CSV export accepts the same active filters (pagination is ignored for export).

## Tests

```powershell
npm --prefix server run test
npm --prefix client run test -- --run
```

The backend suite includes authentication, transaction CRUD, user-isolation checks, CSV export and recurring transaction tests. Frontend tests cover login, transaction entry and API-driven transaction history.

## Production build

```powershell
npm run build
```

## Deployment

### Frontend — Vercel

Deploy `client` as the app root, build with `npm run build`, output `dist`, and set:

```env
VITE_API_URL=https://YOUR-BACKEND.example.com/api
```

### Backend — Render/Railway

Deploy `server`, use `npm start`, configure MongoDB Atlas, set a strong `JWT_SECRET`, set `CLIENT_URL` to the exact frontend origin, and configure Cloudinary for durable attachments.

## Security notes

- User-owned queries always include the authenticated user id.
- Account/category ownership is verified before transaction writes.
- Passwords are bcrypt-hashed and never returned by the API.
- Auth routes are rate-limited.
- Input is validated with Zod and raw request query/body objects are not passed directly into Mongo queries.
- Transaction search escapes regex metacharacters.
- CORS is restricted to `CLIENT_URL`.
- Secrets belong in `.env` files and must not be committed.

## Known production considerations

- Configure Cloudinary for persistent receipt uploads in production.
- A single-process `node-cron` scheduler is suitable for the internship deployment; a queue/scheduler service would be preferable for a horizontally scaled production system.
