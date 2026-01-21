# AstroBookings 

> Express with TypeScript version

A fictional space travel booking system used during training sessions and demos.

A **backend API** for offering bookings to launches in rockets.

- Launches are scheduled for specific rockets with pricing and minimum passenger thresholds.
- Rockets have limited seats; launch requests validate against rocket capacity.
- Launch status lifecycle: scheduled → confirmed → successful, or cancellation/suspension paths.
- A customer will be identified by their email address, having a name, and phone number.
- One customer can book multiple seats on a launch, but cannot exceed the available seats.
- Customers will be billed upon booking, and payments will be processed through a mock gateway.

> The system is designed for demonstration and training purposes. 
> > Not for production use; no security nor db needed at initial stage.

---

- [Repository at GitHub](https://github.com/AIDDbot/astro-bookings-express)
- Default branch: `main`

- **Author**: [Alberto Basalo](https://albertobasalo.dev)
- **Ai Code Academy en Español**: [AI code Academy](https://aicode.academy)
- **Socials**:
  - [X](https://x.com/albertobasalo)
  - [LinkedIn](https://www.linkedin.com/in/albertobasalo/)
  - [GitHub](https://github.com/albertobasalo)

---

**Node + TypeScript Setup**
- **Files:** See [package.json](package.json), [tsconfig.json](tsconfig.json), and [src/index.ts](src/index.ts).
- **Dev server:** Starts with `tsx` and serves JSON on `/`.
- **Scripts:** `dev`, `build`, `start`, `typecheck` defined in [package.json](package.json).

**Quickstart**
- **Install:**

```bash
npm install
```

- **Run dev:**

```bash
npm run dev
```

- **Build:**

```bash
npm run build
```

- **Start (built app):**

```bash
npm run start
```

- **Type-check only:**

```bash
npm run typecheck
```

The server listens on `http://localhost:3000` and responds with a small JSON payload. Configure the port via `PORT` env var.
