# CIT 382 Capstone – React Frontend

This project is a React-based frontend for a property management database application originally developed in CIT 381. The purpose of this capstone is to rebuild and improve the frontend using **React + Vite**, with an emphasis on clear state management, predictable data flow, and scalable component structure.

The project is being developed incrementally over the course of the term. Rather than attempting a full rewrite up front, core functionality is rebuilt step-by-step with a focus on maintainability and alignment with course concepts.

---

## Current Functionality

The application currently includes the following views, managed using state-based view selection (no routing yet):

### Dashboard

- High-level overview of system data
- Summary metrics for residents, units, and payments
- Unit status breakdown
- Recent payment activity
- Read-only, data-driven UI

### Residents

- Fetches resident data from an existing Express API
- Search and sort functionality
- Delete functionality with optimistic UI updates
- Fully state-driven UI

### Units

- Read-only list of all units
- Search functionality
- Clickable table headers to sort by column (ascending/descending)
- Standard table behavior consistent with common web applications

### Payments

- Ledger-style view of payments
- Displays payment date/time in a user-friendly format
- Supports adding new payments
- No edit or delete functionality by design

---

## Technical Focus

This project emphasizes:

- Controlled React components
- State-driven UI updates
- One-way data flow
- View-based layout using application state
- Separation of concerns between views and shared utilities
- Client-side formatting and presentation logic
- Incremental complexity rather than premature abstraction

Styling and layout are intentionally simple but consistent, prioritizing usability and clarity over heavy visual polish.

---

## Backend

This frontend connects to an existing backend built in **CIT 381** using:

- Node.js
- Express
- MySQL

The backend API is maintained separately and is **not included** in this repository. All data fetching is done via existing REST endpoints exposed by that server.

---

## Project Status

This project is a work in progress and will continue to evolve throughout the term. The current implementation focuses on establishing a strong structural foundation that can be extended safely as additional features are introduced.
