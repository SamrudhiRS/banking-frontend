# Banking Frontend

Angular single-page application for the [Banking Service](https://github.com/SamrudhiRS/banking-service) REST API.
It lets a bank employee register/log in, manage customers, open accounts, issue credit/debit cards and make deposits or withdrawals.

## Features

- Register and login (HTTP Basic against the Spring Security backend), logout, route guards
- **Dashboard** with totals and the latest transactions
- **Customers**: list, add, edit, delete (form validation matches the backend rules)
- **Accounts**: open saving/current accounts for a customer, view balances
- **Cards**: issue and delete credit and debit cards (card numbers are masked)
- **Transactions**: deposit/withdraw with a credit or debit card, history with filtering; clear message when the balance is insufficient
- Responsive Angular Material layout (side navigation collapses on mobile)

## Tech stack

| Area | Technology |
|------|------------|
| Framework | Angular 18 (standalone components, signals, new control flow `@if` / `@for`) |
| Language | TypeScript 5.5 (strict mode) |
| UI | Angular Material 18 (Material 3 theme), Angular CDK |
| Async / state | RxJS 7, Angular signals |
| Forms | Reactive forms with custom validators |
| HTTP | `HttpClient` with functional interceptors (auth header, global error handling) |
| Routing | Lazy-loaded routes, `CanActivate` guards |
| Testing | Jest 29 + jest-preset-angular, `HttpTestingController` |
| Delivery | Docker (multi-stage, nginx), GitHub Actions CI |

## Project structure

```
src/app
├── core            # models, API services, interceptors, guards, utilities
├── shared          # reusable components (confirm dialog)
└── features        # auth, dashboard, customers, accounts, cards, transactions, shell (layout)
```

## Run locally

Requirements: Node.js 20+ and the backend running on `http://localhost:9096`
(see the [backend repo](https://github.com/SamrudhiRS/banking-service): `mvn spring-boot:run`).

```bash
npm install
npm start
```

Open http://localhost:4200. Requests to `/api` are forwarded to the backend by `proxy.conf.json`, so no CORS setup is needed.
Create a user on the **Register** page, then sign in.

## Tests and build

```bash
npm test          # unit tests (Jest)
npm run build     # production build in dist/
```

## Docker

```bash
docker build -t banking-frontend .
docker run -p 8080:80 -e BACKEND_URL=http://host.docker.internal:9096 banking-frontend
```

nginx serves the app and forwards `/api` to `BACKEND_URL`. To run everything together (database, backend and frontend)
see the full-stack repository.

## Design notes

- **Interceptors**: one adds the `Authorization` header to `/api` calls; another converts backend `ProblemDetail` errors into friendly messages and logs the user out on an expired session (401).
- **Signals** hold UI state (loading flags, lists, totals via `computed`) so components stay small and easy to test.
- **Lazy loading**: every page is loaded on demand to keep the first download small.

## Limitations / next steps

- The backend uses HTTP Basic authentication, so credentials are kept in `sessionStorage`. A production system should use JWT or OAuth 2.0 with refresh tokens.
- Add pagination for long lists, role-based screens (admin vs user) and end-to-end tests (Cypress or Playwright).
