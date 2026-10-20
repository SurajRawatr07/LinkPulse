
<div align="center">

# ⚡ LinkPulse

### Engineering Every Link. Measuring Every Click.

**A smarter way to shorten, manage, control, and analyze URLs.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-635BFF?style=for-the-badge&logo=vercel&logoColor=white)](https://linkpulse2026.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/SurajRawatr07/LinkPulse)
[![TypeScript](https://img.shields.io/badge/TypeScript-Project-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Create. Control. Track. Understand.**

</div>

---

## 📌 Overview

LinkPulse is a URL shortening and link analytics platform that turns
ordinary URLs into manageable and measurable digital assets.

Traditional URL shorteners primarily focus on making links shorter.
LinkPulse takes the workflow further by bringing link management,
redirect rules, campaigns, QR codes, and click analytics together.

### 🎯 The Problem We Solve

- Long URLs are inconvenient to share.
- Basic shorteners offer limited redirect controls.
- Managing links across multiple campaigns becomes difficult.
- Click counts alone provide limited insight into audience behaviour.
- Expired or misused links require better management.

### 💡 Our Solution

LinkPulse provides one workspace to create short links, configure
their behaviour, organize campaigns, and understand click activity.

**The idea:** Every short link should be more than a redirect. It should
be a manageable record with a destination, rules, and useful analytics.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🔗 Smart Link Management

- Short URL generation
- Custom aliases
- Expiration settings
- Click-limit controls
- Password-protected links
- Device-based redirect rules

</td>
<td width="50%" valign="top">

### 📊 Click Analytics

- Click trends over time
- Device breakdown
- Browser and OS insights
- Referrer information
- Campaign performance views
- Privacy-conscious visitor identification

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🗂️ Campaign Management

- Organize links into campaigns
- Group links using folders
- Add tags for discovery
- Manage links from one workspace
- Associate activity with campaigns

</td>
<td width="50%" valign="top">

### ⚡ Productivity & Administration

- QR code generation
- CSV bulk import
- Centralized dashboard
- Link moderation
- Domain blocklist
- Audit and abuse-management workflows

</td>
</tr>
</table>

> Feature availability depends on the current implementation and deployment.
> Keep only verified features marked as available.

---

## 🚀 What Makes LinkPulse Different?

| Capability | Basic URL Shortener | LinkPulse |
|---|---|---|
| Short URL | Yes | Yes |
| Custom alias | Varies | Configurable |
| Expiration | Varies | Expiry controls |
| Click limits | Often limited | Configurable limits |
| Password protection | Varies | Protected-link workflow |
| Device-based redirects | Uncommon | Configurable routing |
| QR codes | May require another tool | Integrated workflow |
| Bulk link creation | Varies | CSV import workflow |
| Campaign organization | Limited | Campaigns, folders, tags |
| Click analytics | Often basic | Trends and traffic breakdowns |
| Link moderation | Varies | Administrative controls |

### 🌟 Our Core Innovation

**LinkPulse connects link creation, redirect behaviour, organization,
and analytics into one workflow.**

Instead of creating a short URL and forgetting about it, users can
manage its lifecycle and learn from the traffic it receives.

---

## 🏗️ System Architecture

The following diagram explains how the main parts of LinkPulse connect.

```mermaid
flowchart TB
    USER["👤 User"]

    subgraph FRONTEND["1. FRONTEND"]
        UI["React + TypeScript UI"]
        DASH["Dashboard"]
        LINKS["Link Management"]
        CHARTS["Analytics Charts"]
    end

    subgraph BACKEND["2. BACKEND"]
        API["Express REST API"]
        AUTH["Authentication & Permissions"]
        LS["Link Management Service"]
        RE["Redirect Engine"]
        AS["Analytics Service"]
        ADMIN["Admin & Moderation"]
    end

    subgraph DATABASE["3. DATA STORAGE"]
        ORM["Drizzle ORM"]
        DB[("PostgreSQL")]
    end

    USER --> UI
    UI --> DASH
    UI --> LINKS
    UI --> CHARTS

    DASH --> API
    LINKS --> API
    CHARTS --> API

    API --> AUTH
    API --> LS
    API --> AS
    API --> ADMIN

    AUTH --> ORM
    LS --> ORM
    AS --> ORM
    ADMIN --> ORM
    ORM --> DB

    USER -->|"Opens short URL"| RE
    RE -->|"Find link and rules"| DB
    RE -->|"Record click"| AS
    RE -->|"Redirect to destination"| USER

    classDef frontend fill:#EDE9FE,stroke:#7C3AED,color:#312E81
    classDef backend fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A
    classDef storage fill:#D1FAE5,stroke:#059669,color:#064E3B

    class UI,DASH,LINKS,CHARTS frontend
    class API,AUTH,LS,RE,AS,ADMIN backend
    class ORM,DB storage
```

### 🧠 Understand the Architecture

| Component | What it does |
|---|---|
| Frontend | Displays pages, forms, links, and charts. |
| REST API | Receives requests from the frontend. |
| Authentication | Verifies identity and access permissions. |
| Link service | Creates and updates short-link records. |
| Redirect engine | Resolves a short code and evaluates redirect rules. |
| Analytics service | Processes click-related data for reporting. |
| ORM | Connects application code to database operations. |
| PostgreSQL | Stores persistent application records. |

**In simple words:** The frontend is what users see, the backend
handles the logic, and the database stores the information.

---

## 🔄 How LinkPulse Works

This flow explains what happens when a visitor opens a short link.

```mermaid
flowchart TD
    A(["Visitor opens short URL"])
    B["Read short code"]
    C{"Link exists?"}
    D["Return not found"]
    E{"Link active?"}
    F["Reject disabled link"]
    G{"Expired?"}
    H["Reject expired link"]
    I{"Click limit reached?"}
    J["Reject further clicks"]
    K{"Password required?"}
    L["Validate password"]
    M{"Device rule matches?"}
    N["Choose configured destination"]
    O["Choose default destination"]
    P["Record click event"]
    Q(["Redirect to destination"])

    A --> B --> C
    C -- No --> D
    C -- Yes --> E
    E -- No --> F
    E -- Yes --> G
    G -- Yes --> H
    G -- No --> I
    I -- Yes --> J
    I -- No --> K
    K -- Yes --> L
    K -- No --> M
    L --> M
    M -- Yes --> N
    M -- No --> O
    N --> P
    O --> P
    P --> Q
```

### Step-by-step explanation

1. A visitor clicks a LinkPulse short URL.
2. The server reads its unique short code.
3. The application looks up the corresponding link.
4. It checks applicable status, expiry, and usage rules.
5. If required, it validates password access.
6. It selects the destination using configured redirect rules.
7. The click event is recorded for analytics.
8. The visitor is redirected to the destination.

The exact validation order and response behaviour should match the
implemented redirect engine.

---

## 📈 Click Analytics Workflow

LinkPulse turns redirect activity into useful reporting data.

```mermaid
flowchart LR
    A["Visitor clicks link"]
    B["Resolve short code"]
    C["Apply redirect rules"]
    D["Collect permitted event data"]
    E[("Store click event")]
    F["Aggregate metrics"]
    G["Dashboard charts"]
    H["Campaign insights"]

    A --> B --> C --> D --> E --> F
    F --> G
    F --> H
```

### 📊 What Users Can Understand

| Metric | What it tells you |
|---|---|
| Click trends | When traffic increases or decreases. |
| Device breakdown | Which device categories generate clicks. |
| Browser and OS | The browser and operating-system distribution. |
| Referrers | Which sources send visitors. |
| Campaign metrics | How grouped links perform over time. |

Analytics accuracy depends on available request metadata and
privacy settings. Geographic information should not be presented as
precise when it is estimated.

---

## 🧩 Technology Stack

### 🎨 Frontend Technologies

| Technology | Purpose in LinkPulse |
|---|---|
| React | Builds reusable UI components and application pages. |
| TypeScript | Adds types to improve code reliability and maintainability. |
| Vite | Provides the frontend development server and build process. |
| Tailwind CSS | Creates responsive layouts and consistent styling. |
| React Router | Handles navigation between application pages. |
| Zustand | Manages shared client-side state. |
| Recharts | Displays charts and visual analytics. |
| Zod | Validates data against defined schemas. |
| Lucide React | Provides consistent interface icons. |
| qrcode.react | Generates QR-code visuals. |
| Papa Parse | Parses CSV files for bulk import workflows. |

### ⚙️ Backend Technologies

| Technology | Purpose in LinkPulse |
|---|---|
| Node.js | Runs JavaScript on the server. |
| Express | Defines API routes and request middleware. |
| REST API | Connects frontend operations to backend functionality. |
| Firebase Auth | Supports configured sign-in flows. |
| Firebase Admin SDK | Verifies authentication on the trusted server side. |
| bcryptjs | Hashes passwords for safer storage. |
| ua-parser-js | Parses user-agent information for device analytics. |

### 🗄️ Database & Infrastructure

| Technology | Purpose in LinkPulse |
|---|---|
| PostgreSQL | Stores links, users, campaigns, and click records. |
| Google Cloud SQL | Hosts a managed PostgreSQL database when configured. |
| Drizzle ORM | Provides typed database queries. |
| Drizzle Kit | Supports schema migrations and database tooling. |
| Secure session cookies | Carry session information using browser cookie controls. |
| Vercel | Can host the frontend and supported deployment components. |

> Confirm the actual dependencies, configuration, and deployed services
> before describing each technology as active in production.

---

## 🗃️ Database Schema & Data Model

The following conceptual diagram illustrates the main entities.

```mermaid
erDiagram
    USER ||--o{ LINK : creates
    CAMPAIGN ||--o{ LINK : groups
    FOLDER ||--o{ LINK : organizes
    LINK ||--o{ CLICK_EVENT : receives
    USER ||--o{ AUDIT_LOG : performs

    USER {
        string id
        string email
        string role
    }

    LINK {
        string id
        string short_code
        string destination_url
        string status
        datetime expires_at
        int click_limit
    }

    CAMPAIGN {
        string id
        string name
    }

    FOLDER {
        string id
        string name
    }

    CLICK_EVENT {
        string id
        datetime clicked_at
        string device_type
        string referrer
    }

    AUDIT_LOG {
        string id
        string action
        datetime created_at
    }
```

### What does this model mean?

- **User:** Represents an account and its permissions.
- **Link:** Stores the short code, destination, and configured rules.
- **Campaign:** Groups related links for management and analysis.
- **Folder:** Helps organize links.
- **Click event:** Stores information about a recorded interaction.
- **Audit log:** Tracks relevant administrative actions.

This is a conceptual model. Update it to reflect the actual database
schema and relationships in the repository.

---

## 🔌 API Reference

The backend uses versioned REST API routes.

**Base path:** `/api/v1`

| API area | Responsibility |
|---|---|
| Authentication | Sign-in and session-related operations. |
| Links | Create, retrieve, update, and manage links. |
| Redirects | Resolve short codes and evaluate link rules. |
| Analytics | Retrieve click metrics and summaries. |
| Campaigns | Organize and retrieve campaign data. |
| Administration | Manage moderation and administrative operations. |
| Health | Check service availability. |

### Illustrative endpoint structure

```text
GET    /api/v1/health
GET    /api/v1/links
POST   /api/v1/links
GET    /api/v1/links/:id
PATCH  /api/v1/links/:id
DELETE /api/v1/links/:id
GET    /api/v1/analytics
GET    /api/v1/campaigns
POST   /api/v1/campaigns
GET    /r/:code
```

> Verify each endpoint against the actual server route definitions.
> These examples are not a substitute for the implemented API contract.

---

## 🛡️ Security & Access Control

LinkPulse is designed around controlled access to link-management
operations and administrative features.

### Access-control flow

```mermaid
flowchart TD
    A["Incoming request"]
    B{"Authentication required?"}
    C["Continue with permitted public action"]
    D["Verify user identity"]
    E{"Check role and permission"}
    F["Allow permitted user action"]
    G["Allow permitted admin action"]
    H["Reject unauthorized request"]

    A --> B
    B -- No --> C
    B -- Yes --> D --> E
    E -- User access --> F
    E -- Admin access --> G
    E -- Not permitted --> H
```

### Security measures

- Validate input before processing requests.
- Enforce authorization on the server.
- Hash passwords instead of storing plaintext passwords.
- Keep secret keys and credentials out of source control.
- Apply configured expiry and click-limit rules.
- Protect private link operations with appropriate access checks.
- Use moderation and audit logs where implemented.
- Minimize or anonymize sensitive analytics data where appropriate.

---

## 📂 Project Structure

An illustrative structure for the project:

```text
LinkPulse/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── store/
│   ├── types/
│   └── main.tsx
├── server/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── db/
├── docs/
│   └── screenshots/
├── .env.example
├── package.json
├── README.md
└── vite.config.ts
```

This is an example layout, not a verified listing of the current
repository. Replace it with the real directory structure.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js version supported by the project.
- pnpm or the package manager specified by the repository.
- PostgreSQL, if required by the configured backend.
- Firebase project credentials, if authentication uses Firebase.
- Required environment variables.

### Installation

```bash
git clone https://github.com/SurajRawatr07/LinkPulse.git

cd LinkPulse

pnpm install
```

### Environment Variables

Create the environment files required by the application.

Example placeholders:

```env
DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SESSION_SECRET=
```

Use the exact variable names referenced by the source code.

**Never commit real API keys, database passwords, private keys,
or production secrets.**

### Running Locally

Inspect the available package scripts:

```bash
pnpm run
```

Run the frontend and backend using the scripts defined in the project.
Configure the database, authentication provider, and migrations first
if the selected configuration requires them.

---

## 🎯 Demo Workflow

Use this sequence to explain LinkPulse during a hackathon presentation.

```mermaid
flowchart TD
    A["1. Open LinkPulse"]
    B["2. Sign in"]
    C["3. Create a short link"]
    D["4. Configure redirect rules"]
    E["5. Generate and share QR code"]
    F["6. Open the short URL"]
    G["7. Record click activity"]
    H["8. View analytics"]
    I["9. Explore campaign management"]

    A --> B --> C --> D --> E --> F --> G --> H --> I
```

### What the judge should notice

1. **Problem:** Ordinary URLs are difficult to organize and measure.
2. **Solution:** LinkPulse manages the link lifecycle in one workspace.
3. **Engineering:** The frontend, API, redirect logic, and database have distinct responsibilities.
4. **Innovation:** Configurable redirects add control beyond simple shortening.
5. **Analytics:** Recorded clicks can feed reporting and campaign insights.
6. **Trust:** Access control and moderation support safer link management.

Demonstrate only the steps that work in the submitted build.

---

## 🧪 Testing

Test the key user journeys before presenting the project.

- [ ] Create a short link.
- [ ] Open the short URL and verify the destination.
- [ ] Test custom aliases.
- [ ] Test expiry behaviour.
- [ ] Test click-limit behaviour.
- [ ] Test password-protected links.
- [ ] Test device-routing rules.
- [ ] Verify click events and analytics.
- [ ] Test invalid or missing short codes.
- [ ] Check unauthorized administrative requests.
- [ ] Verify responsive layouts on mobile and desktop.

Use the test scripts configured in `package.json`. Do not claim a
test suite passes until it has actually been executed.

---

## 🛣️ Roadmap

Potential improvements for future releases:

- [ ] Export analytics reports.
- [ ] Compare campaign performance side by side.
- [ ] Detect unusual click patterns.
- [ ] Monitor broken destination URLs.
- [ ] Add scheduled link activation and deactivation.
- [ ] Add API-key management and developer documentation.
- [ ] Introduce configurable analytics retention.
- [ ] Expand automated redirect-rule tests.

These are roadmap ideas, not claims about currently implemented features.

---

## 🤝 Contributing

Contributions can improve LinkPulse's reliability, usability,
documentation, and testing.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the relevant tests and checks.
5. Open a pull request describing the change.

For substantial changes, open an issue first to discuss the proposal.

---

## 🔒 Security Policy

Do not publish passwords, access tokens, private keys, or database
credentials in issues or pull requests.

Report vulnerabilities privately to the repository maintainer when
a private reporting channel is available.

---

## 📄 License

Add the license that actually applies to this repository. If no license
has been selected, do not imply that the project is open-source under
a particular license.

---

## 👨‍💻 Author

**Suraj Rawat**

- GitHub: [@SurajRawatr07](https://github.com/SurajRawatr07)
- LinkedIn: [Suraj Rawat](https://www.linkedin.com/in/suraj-rawat-30513b340/)
- Live Project: [LinkPulse](https://linkpulse2026.vercel.app/)

---

<div align="center">

### ⚡ LinkPulse

**Create smarter links. Understand every click.**

[Live Demo](https://linkpulse2026.vercel.app/) ·
[GitHub Repository](https://github.com/SurajRawatr07/LinkPulse)

</div>
