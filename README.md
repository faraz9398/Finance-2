# AI Smart Expense Manager & Money Coach

A two-tier personal finance web application with AI-powered expense categorisation and personalised money coaching tips.

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI and OPENAI_API_KEY
npm install
npm start                  # runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # or leave as-is for dev (Vite proxy handles /api)
npm install
npm run dev               # runs on http://localhost:3000
```

---

## Project Structure

```
finance 2/
├── backend/
│   ├── server.js           # Express entry point
│   ├── .env                # MONGODB_URI, OPENAI_API_KEY, PORT
│   ├── models/
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   └── Subscription.js
│   └── routes/
│       ├── transactions.js  # POST /api/transactions/upload
│       ├── dashboard.js     # GET  /api/dashboard
│       ├── budgets.js       # GET + PUT /api/budgets
│       ├── subscriptions.js # GET /api/subscriptions
│       ├── insights.js      # GET /api/insights
│       ├── forecast.js      # GET /api/forecast
│       └── coach.js         # GET /api/coach
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx          # Layout + routing
        ├── Dashboard.jsx    # Charts + category breakdown
        ├── Upload.jsx       # CSV upload with PapaParse
        ├── Budgets.jsx      # Set monthly budgets
        ├── Subscriptions.jsx
        ├── Insights.jsx     # Month-over-month analysis
        ├── Forecast.jsx     # Next-month prediction
        └── Coach.jsx        # AI money tips
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transactions/upload` | Parse + categorise transactions |
| GET  | `/api/dashboard?month=YYYY-MM` | Totals, categories, alerts |
| GET  | `/api/budgets?month=YYYY-MM` | Retrieve budget |
| PUT  | `/api/budgets` | Set/update budget |
| GET  | `/api/subscriptions` | Recurring payments |
| GET  | `/api/insights?month=YYYY-MM` | Month-over-month |
| GET  | `/api/forecast` | Next-month prediction |
| GET  | `/api/coach` | AI saving tips |

---

## Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/expense-manager
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://your-backend.onrender.com  # leave blank in dev (Vite proxy)
```

---

## Notes

- **No Gemini key?** The app works fully with a built-in keyword/rule-based fallback for both categorisation and coaching tips. Get a free key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
- **Categories**: Food, Transport, Shopping, Bills, Entertainment, Subscriptions, Other.
- **Months** are stored as `"YYYY-MM"` strings throughout.
- **Subscription detection**: transactions with the same (merchant, amount) appearing in ≥ 2 different months are flagged as recurring.
