# Personal Finance App

A fully responsive, modern personal finance dashboard built with React, Vite, TypeScript, and Tailwind CSS. This application allows users to track their finances, manage budgets, keep tabs on recurring bills, and set aside money into saving "pots" without needing a backend server—all data is persisted locally in the browser using `localStorage`.

## Features

- **Authentication System:** Simple signup and login flow.
- **Overview Dashboard:** A high-level view of your finances, including total balances, income, expenses, and quick summaries of pots, budgets, and bills.
- **Transactions Management:** View, search, filter, and sort past transactions. Add new transactions (income or expense) that dynamically update your overall balances.
- **Budgets:** Set spending limits for different categories (e.g., Entertainment, Groceries). Visualise spending progress via an interactive Recharts Pie chart.
- **Pots (Savings Goals):** Create savings goals. Add and withdraw money from these pots to track savings separately from your main balance.
- **Recurring Bills:** Keep track of monthly recurring bills, view paid/upcoming statuses, and sort by date or amount.

## Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using utility classes and custom color tokens)
- **Routing**: `react-router`
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks + LocalStorage (`src/utils/financeStorage.ts`)

## Getting Started

### Prerequisites

You will need [Bun](https://bun.sh/) installed on your system (or npm/yarn/pnpm).

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd personal-finance
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Build for production:
   ```bash
   bun run build
   ```

## Architecture & Design Rules

- **Strict TypeScript:** No `any` types. Interfaces and explicit return types are enforced.
- **Mobile-First Design:** The application is built to be fully responsive, scaling gracefully from mobile phones to large desktop screens using Tailwind's `lg:` prefixes.
- **Component-Driven:** UI elements are cleanly separated. `App.tsx` handles pure routing, while logic lives inside specific page and layout components (`src/components/`).
- **Custom Theming:** Utilizes a strict set of design tokens (e.g. `--color-grey-900`, `--color-beige-500`) defined via Tailwind `@theme` in `index.css`.

## License

This project is licensed under the MIT License.
