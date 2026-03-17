# Appointly

A full-stack, multi-vendor service booking and business management platform.

**Business owners** can set up their business profile, manage services, define availability, and handle customer bookings through a comprehensive dashboard.

**Customers** can discover local service providers, browse available services, book appointment and leave reviews.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www/typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Payments**: [Stripe](https://stripe.com/)
- **Email**: [Resend](https://resend.com/)
- **File Uploads**: [UploadThing](https://uploadthing.com/)

## Prerequisites

- [Node.js](https://nodejs.org/)(v18.17 or higher)
- [Docker](https://www.docker.com/)(for PostgreSQL)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/phila-hh/appointly.git
cd appointly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Update .env with your actual credentials.

### 4. Start the database

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Start the development server

```bash
npm run dev
```

Open [https://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start development service with Turbopack |
| `npm run build`        | Build for production                     |
| `npm run start`        | Start production server                  |
| `npm run lint`         | Run ESLint                               |
| `npm run lint:fix`     | Run ESLint with auto-fix                 |
| `npm run format`       | Format all files with Prettier           |
| `npm run format:check` | Check formatting without changes         |

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages and API routes)
├── components/         # React components
│   ├── ui/                  # shadcn/ui base components
│   ├── forms/             # Form components
│   ├── layouts/            # Layout components (navbar, sidebar, footer)
│   └── shared/             # Shared/reusable components
├── lib/                        # Utility functions, database, client, auth config
├── hooks/                    # Custom React hooks
├── types/                     # Typescript type definitions
└── constants/                # App-wide constants
```

## License

This project is for educational purposes.
