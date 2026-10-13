<div align="center">

# 🌾 Village Analytics AI Agent

### *Ask your village data anything. Get safe, accurate, human-readable answers.*

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?logo=google&logoColor=white)
![Database](https://img.shields.io/badge/database-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</div>

---

## 📖 Overview

**Village Analytics AI Agent** is a secure, natural-language-driven analytics agent for rural and village development. It lets non-technical users ask questions in plain English about **socio-economic, agricultural, demographic, and infrastructure** data, and receive clear, well-structured answers without writing a single line of SQL.

Under the hood, the agent uses **Google Gemini** to translate questions into SQL. Every generated query then passes through a strict **read-only safety layer** before it ever touches the database. Raw results are synthesized into friendly, actionable responses.

**Who is this for?**

- 🏛️ **Village administrators & panchayat officials** who need quick insights for planning.
- 🧑‍🌾 **NGOs & development workers** tracking resources, families, and households.
- 📊 **Researchers & policy analysts** exploring demographic and agricultural trends.
- 👩‍💻 **Developers** building safe, LLM-powered data applications.

---

## ✨ Key Features

- 🗣️ **Natural Language Querying**: Ask questions like *"Which houses lack clean drinking water?"* and get answers instantly.
- 🛡️ **SQL Injection & Destructive Command Prevention**: Every query is validated; `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, and similar statements are blocked.
- 🔒 **Guaranteed Read-Only Execution**: Only validated `SELECT` queries ever reach the database.
- 🧠 **Multi-Modal Response Synthesis**: Combines raw data and AI reasoning into text summaries, tables, and structured output suitable for UI rendering (including map views).
- 🧩 **Schema-Aware Prompting**: The AI is given live schema context, so generated SQL matches your actual tables and columns.
- 🧱 **End-to-End Type Safety**: Strongly-typed request/response contracts across the entire pipeline using TypeScript.
- 🗄️ **Flexible Database Support**: Works with PostgreSQL (production) or SQLite (local development) via Prisma.
- 🖥️ **Full-Stack Ready**: Ships with a React front end (dashboard, families, houses, people, resources, AI assistant, and map views).

---

## 🏗️ Architecture / Project Structure

### Repository Layout

```text
village_data_analytics/
├── prisma/
│   └── schema.prisma            # Database schema & models
├── server/
│   ├── ai/
│   │   ├── answer-query.ts      # 🚪 Main entry point for user prompts
│   │   ├── system-prompt.ts     # 📜 System prompts, rules & output schemas
│   │   ├── schema-context.ts    # 🗺️ Injects DB schema context into the prompt
│   │   ├── gemini.ts            # 🤖 Google Gemini API client
│   │   ├── sql-safety.ts        # 🛡️ SQL validator (read-only enforcement)
│   │   ├── executor.ts          # ⚙️ Executes validated SQL queries
│   │   ├── response-assembler.ts# 🧪 Builds user-friendly responses
│   │   └── types.ts             # 🧱 TypeScript interfaces & schemas
│   ├── auth/
│   │   └── auth.service.ts      # Authentication logic
│   ├── db/
│   │   └── prisma.ts            # Prisma client instance
│   └── routes/
│       └── api.ts               # REST API routes
├── src/
│   ├── components/
│   │   ├── ai/                  # AIResponseRenderer.tsx
│   │   ├── layout/              # Header, MainLayout, Sidebar
│   │   ├── map/                 # VillageMapView.tsx
│   │   └── ui/                  # Badge, ConfirmDialog, Modal, Pagination
│   ├── context/                 # AuthContext.tsx
│   ├── lib/                     # api.ts (client helpers)
│   ├── types/                   # Shared front-end types
│   ├── views/                   # Dashboard, Families, Houses, People,
│   │                            # Resources, Login, AIAssistant views
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
└── package.json
```

### Core AI Components

| 📁 File | 🎯 Responsibility |
|:--------|:------------------|
| `answer-query.ts` | Main orchestrator. Receives the user's prompt and coordinates the full pipeline from LLM call to final response. |
| `system-prompt.ts` | Defines system instructions, behavioral rules, and the expected structured output schema for the AI. |
| `schema-context.ts` | Provides the model with up-to-date database schema information so generated SQL is accurate. |
| `gemini.ts` | Handles all communication with Google's Gemini API (requests, retries, and response parsing). |
| `sql-safety.ts` | Validates generated SQL and blocks malicious or destructive commands (`DROP`, `DELETE`, `UPDATE`, etc.). |
| `executor.ts` | Executes validated, read-only SQL queries against the database and returns raw rows. |
| `response-assembler.ts` | Merges raw database output and AI reasoning into a polished, user-friendly response. |
| `types.ts` | Central TypeScript interfaces, data models, and request/response schemas. |

---

## 🔄 System Flow Diagram

```text
┌──────────────────────┐
│  👤 User Question     │   "Which families don't have access to clean water?"
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  🚪 answer-query.ts   │   Entry point: validates input, starts pipeline
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  📜 system-prompt.ts  │   Builds prompt + rules + 🗺️ schema-context.ts
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  🤖 gemini.ts         │   Gemini generates SQL + reasoning (structured JSON)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  🛡️ sql-safety.ts     │   Validates SQL: SELECT-only, no dangerous keywords
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     │            │
  ✅ Safe      ❌ Unsafe
     │            │
     ▼            ▼
┌──────────┐  ┌──────────────────────┐
│ ⚙️ executor│  │ 🚫 Rejected with a    │
│   .ts     │  │    safe error message │
└────┬─────┘  └──────────────────────┘
     │
     ▼
┌──────────────────────┐
│ 🧪 response-assembler │   Raw rows + AI reasoning → friendly answer
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  📊 Final Response    │   Text summary + table/map-ready structured data
└──────────────────────┘
```

---

## 📋 Prerequisites & Environment Variables

### Prerequisites

| Tool | Version | Notes |
|:-----|:--------|:------|
| **Node.js** | `v18+` | Required runtime |
| **npm** (or Bun) | latest | Package manager |
| **PostgreSQL** | `v13+` | Recommended for production |
| **SQLite** | any | Optional, great for local development |
| **Gemini API Key** | n/a | Get one from [Google AI Studio](https://aistudio.google.com/) |

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|:---------|:--------:|:------------|:--------|
| `GEMINI_API_KEY` | ✅ | API key for Google Gemini | `AIzaSy...` |
| `DATABASE_URL` | ✅ | Database connection string | `postgresql://user:pass@localhost:5432/village_db` |

> 💡 **SQLite alternative:** `DATABASE_URL="file:./dev.db"`

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 🚀 Installation & Setup

**1. Clone the repository**

```bash
git clone https://github.com/<your-username>/village_data_analytics.git
cd village_data_analytics
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and DATABASE_URL
```

**4. Set up the database (Prisma)**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

**5. Build the project**

```bash
npm run build
```

**6. Start the application**

```bash
npm start
```

The app will be available at **http://localhost:3000** (or the port configured in your environment).

> 🛠️ **Development mode:** use `npm run dev` for hot-reloading during development.

---

## 💡 Usage & Example Workflow

### Step 1️⃣: The user asks a question

> **"Which families in the village don't have access to clean drinking water?"**

### Step 2️⃣: Gemini generates a SQL query

The AI receives the question, system rules, and schema context, then returns structured output including the SQL:

```sql
SELECT
  f.id          AS family_id,
  f.head_name   AS family_head,
  h.house_number,
  h.water_source
FROM "Family" f
JOIN "House" h ON h.family_id = f.id
WHERE h.has_clean_water = false
ORDER BY h.house_number
LIMIT 100;
```

### Step 3️⃣: The SQL passes through the safety layer

`sql-safety.ts` confirms the query:

- ✅ Starts with `SELECT`
- ✅ Contains no forbidden keywords (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, etc.)
- ✅ Is a single statement (no stacked queries)

### Step 4️⃣: The query is executed (read-only)

`executor.ts` runs the validated query and returns raw rows:

| family_id | family_head   | house_number | water_source  |
|:---------:|:--------------|:------------:|:--------------|
| 12        | Afzal Ansari  | H-014        | Open well     |
| 27        | Muhammad Ashraf     | H-031        | River         |
| 41        | Javid Khan    | H-058        | Hand pump     |

### Step 5️⃣: The response is assembled

`response-assembler.ts` combines the data with AI reasoning into a friendly answer:

> **💧 Water Access Summary**
>
> **3 families** currently lack access to clean drinking water:
>
> - **Afzal Ansari** (House H-014) relies on an open well
> - **Muhammad Ashraf** (House H-031) relies on a river
> - **Javid Khan** (House H-058) relies on a hand pump
>
> **Insight:** Two of the three households depend on unprotected natural sources, which may pose a health risk. Prioritizing these homes for piped water or filtration would have the highest impact.


## 🔐 Security Standards

Security is a first-class concern, since LLM-generated SQL is **untrusted input**. `sql-safety.ts` acts as a strict gatekeeper between the AI and the database.

### 🛡️ Defense-in-Depth Measures

| Layer | Protection |
|:------|:-----------|
| **Statement Allow-listing** | Only queries beginning with `SELECT` (or read-only `WITH ... SELECT` CTEs) are permitted. |
| **Keyword Deny-listing** | Blocks `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `EXEC`, and similar. |
| **Single-Statement Enforcement** | Rejects stacked queries (e.g., `SELECT 1; DROP TABLE users;`) by blocking multiple statements and stray semicolons. |
| **Comment Stripping** | Removes `--` and `/* */` comments that could be used to hide malicious payloads. |
| **Result Limiting** | Enforces sensible `LIMIT` bounds to prevent resource exhaustion. |
| **Fail-Closed Behavior** | If validation is ambiguous or fails, the query is **rejected**, never executed. |

### ✅ Read-Only Guarantee

1. The AI's output is **never** executed directly.
2. Every query must pass `sql-safety.ts` before reaching `executor.ts`.
3. `executor.ts` only accepts queries that have been marked as validated.
4. Rejected queries return a safe, generic error message with no internal details leaked.

### 🏆 Recommended Hardening

For maximum protection in production, also:

- Connect using a **read-only database user** (`GRANT SELECT` only).
- Store secrets in a secure secrets manager, never in source control.
- Enable rate limiting on the API routes.
- Log all rejected queries for auditing.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 Village Analytics AI Agent Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ❤️ for rural and village development**

⭐ If you find this project useful, please consider giving it a star!

</div>