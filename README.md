# CIT 382 Capstone – React Frontend

This project is a React-based frontend for a property management database application originally developed in CIT 381. The application has been rebuilt using **React + Vite + React Router**, with an emphasis on intentional state ownership, predictable data flow, and scalable component structure.

The goal of this capstone is not simply feature replication, but structural clarity — ensuring that the application can grow without becoming fragile.

---

## Architecture Overview

The application follows a clear separation of responsibility:

### App

- Owns shared state (e.g., payments data)
- Owns shared effects (initial data loading)
- Handles route wiring
- Coordinates data passed to pages

### Pages (Route Targets)

- `DashboardPage`
- `ResidentsPage`
- `UnitsPage`
- `PaymentsPage`
- Responsible for rendering full views
- Receive data and callbacks via props

### Reusable Components

- `PaymentForm`
- `Toast`
- Responsible for UI presentation and emitting events upward
- Do not own shared application state

### Services Layer

- API calls are isolated in `services/`
- Handles communication with backend REST endpoints
- Keeps data-fetching logic out of UI components

State is lifted only when necessary and lives in the lowest shared parent that requires it.

---

## Current Functionality

### Dashboard

- High-level summary view
- Resident count
- Unit count
- Unit status breakdown
- Recent payments
- Payment totals (all-time + last 30 days)
- Refresh capability
- Data shared with Payments view

### Residents

- Fetches resident data from backend API
- Search across name, email, phone, and ID
- Sort by name or ID
- Optimistic delete with rollback on failure
- Toast notifications for success/error feedback

### Units

- Read-only unit listing
- Search across multiple fields
- Clickable sortable table headers (ascending/descending)
- Client-side filtering and sorting logic

### Payments

- Ledger-style payment table
- Search functionality
- Create new payment
- Lease ID typeahead with debounced lookup
- Shared payment state with Dashboard
- Refresh functionality

---

## State & Data Flow

- Payments state is owned in `App` and passed to:
  - `DashboardPage`
  - `PaymentsPage`

- Creating a payment in `PaymentsPage` triggers:
  - API call
  - Shared state refresh in `App`
  - Automatic UI update in both views

- Residents and Units manage local view-specific state internally.

The application follows one-way data flow:

Child components request changes.  
Parent components own and update shared state.

---

## Side Effects

The application uses intentional `useEffect` hooks for:

- Initial data loading
- Debounced lease lookup (typeahead)
- Toast auto-dismiss timing

Effects are colocated with the state they synchronize and are not placed in purely presentational components.

---

## Theming

The application includes a **light / dark mode toggle** implemented using CSS variables and a `data-theme` attribute on `<html>`.

All UI elements use theme tokens (e.g., `--panel`, `--border`, `--text`) to ensure consistent rendering across themes.

---

## Technical Focus

This capstone emphasizes:

- Controlled components
- Intentional state ownership
- Shared state lifting only when required
- Separation of pages vs reusable components
- Clear routing structure
- Predictable side effects
- Debounced API interactions
- Optimistic UI updates
- Maintainable CSS variable theming

Styling prioritizes clarity and consistency over heavy visual polish.

---

## Backend

This frontend connects to an existing backend built in **CIT 381** using:

- Node.js
- Express
- MySQL

The backend API is maintained separately and is not included in this repository.

---

## Project Status

The application is structurally stable and designed for extension. Future work may include:

- Edit functionality for payments and residents
- Additional dashboard metrics
- Expanded filtering capabilities
- Mobile adaptation (React Native or similar structure reuse)

The current focus is structural soundness and predictable behavior rather than feature volume.
