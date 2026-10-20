<div align="center">

# ⚡ LinkPulse

### Engineering Every Link. Measuring Every Click.

**More than a URL shortener — a smarter way to create, control, track, and understand every link.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20LinkPulse-635BFF?style=for-the-badge&logo=vercel&logoColor=white)](https://linkpulse2026.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/SurajRawatr07/LinkPulse)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

[Overview](#-overview) ·
[Features](#-key-features) ·
[Architecture](#-system-architecture) ·
[Tech Stack](#-technology-stack--what-each-tool-does) ·
[Setup](#-getting-started)

</div>

---

## 📌 Overview

LinkPulse is a link management and analytics platform designed to
turn ordinary URLs into trackable, manageable, and measurable links.

Instead of simply shortening a URL, LinkPulse brings link creation,
redirect controls, campaigns, QR codes, and click analytics into
one unified workspace.

### The problem

- Long URLs are difficult to share and manage.
- Basic shorteners provide limited control over redirects.
- Campaign links become difficult to organize.
- Click counts alone do not explain audience behaviour.
- Expired, suspicious, or misused links need better controls.

### Our approach

**Create → Configure → Share → Track → Understand → Improve**

LinkPulse connects the complete link lifecycle in one workflow.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🔗 Smart Link Management

- Short URLs with generated aliases
- Custom short-link aliases
- Link expiry configuration
- Click-limit controls
- Password-protected links
- Device-based redirect rules

</td>
<td width="50%" valign="top">

### 📊 Click Analytics

- Click trends over time
- Referrer analysis
- Browser and operating-system insights
- Device breakdown
- Geographic insights, where available
- Anonymized IP-based identification

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🗂️ Campaign Workspace

- Organize links into campaigns
- Group links using folders
- Add tags for easier discovery
- Manage multiple links centrally
- Track campaign-related activity

</td>
<td width="50%" valign="top">

### ⚙️ Productivity Tools

- QR code generation
- CSV-based bulk link import
- Centralized dashboard
- Responsive interface
- Link moderation and administration

</td>
</tr>
</table>

> **Implementation note:** Keep only the features that are currently
> implemented and working in the submitted build. Mark incomplete
> functionality as planned rather than claiming it is live.

---

## 🚀 What Makes LinkPulse Different?

| Capability | Basic Shortener | LinkPulse Approach |
|---|---|---|
| Short URLs | ✓ | ✓ |
| Custom aliases | Sometimes | Configurable aliases |
| Expiration controls | Limited | Expiry and click limits |
| Password protection | Varies | Protected-link workflow |
| Device targeting | Rare | Device-based redirect rules |
| QR codes | Often separate | Integrated link workflow |
| Bulk creation | Limited | CSV import workflow |
| Campaign organization | Limited | Campaigns, folders and tags |
| Click analytics | Basic counts | Device, browser, referrer and trends |
| Administration | Varies | Moderation and abuse controls |

### The core differentiator

**A short URL is not the end product. The link becomes a manageable
record with its own destination, rules, campaign context, and click data.**

This makes LinkPulse useful for marketing campaigns, student projects,
event registrations, portfolios, product launches, and shared resources.

---

## 🖥️ Product Preview

<!-- Add real screenshots from your repository. -->
<!-- Suggested files: docs/screenshots/dashboard.png -->
<!-- Suggested files: docs/screenshots/create-link.png -->
<!-- Suggested files: docs/screenshots/analytics.png -->

<div align="center">

| Dashboard | Link Management |
|---|---|
| <!-- Replace with a real screenshot --> | <!-- Replace with a real screenshot --> |
| `docs/screenshots/dashboard.png` | `docs/screenshots/links.png` |

| Analytics | QR / Campaign Workflow |
|---|---|
| <!-- Replace with a real screenshot --> | <!-- Replace with a real screenshot --> |
| `docs/screenshots/analytics.png` | `docs/screenshots/campaigns.png` |

</div>

> To display images on GitHub, replace the placeholders above with
> actual committed image files and use Markdown image syntax:
>
> `![Dashboard](docs/screenshots/dashboard.png)`

---

## 🏗️ System Architecture

The architecture follows a client-server model.

The frontend handles the user interface. The API handles application
requests. Authentication verifies identity, the database stores
persistent records, and the redirect engine applies link rules before
sending visitors to their destinations.

```mermaid
flowchart TB
    U["👤 User / Visitor"]

    subgraph CLIENT["1. CLIENT LAYER"]
        UI["React + TypeScript"]
        DASH["Dashboard"]
        CREATE["Create & Manage Links"]
        REPORTS["Analytics & Campaigns"]
    end

    subgraph API["2. APPLICATION LAYER"]
        ROUTER["Express REST API"]
        AUTH["Authentication & Access Control"]
        LINK["Link Management Service"]
        REDIRECT["Redirect Engine"]
        ANALYTICS["Click Analytics Service"]
        ADMIN["Administration & Moderation"]
    end

    subgraph DATA["3. DATA LAYER"]
        DB[("PostgreSQL Database")]
        ORM["Drizzle ORM"]
    end

    U --> UI
    UI --> DASH
    UI --> CREATE
    UI --> REPORTS

    DASH --> ROUTER
    CREATE --> ROUTER
    REPORTS --> ROUTER

    ROUTER --> AUTH
    ROUTER --> LINK
    ROUTER --> ANALYTICS
    ROUTER --> ADMIN

    LINK --> ORM
    AUTH --> ORM
    ANALYTICS --> ORM
    ADMIN --> ORM
    ORM --> DB

    U -->|"Opens short URL"| REDIRECT
    REDIRECT -->|"Resolve link & apply rules"| ORM
    REDIRECT -->|"Record click event"| ANALYTICS
    REDIRECT -->|"302 / 301 redirect"| U

    classDef client fill:#EDE9FE,stroke:#7C3AED,color:#312E81
    classDef api fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A
    classDef data fill:#D1FAE5,stroke:#059669,color:#064E3B

    class UI,DASH,CREATE,REPORTS client
    class ROUTER,AUTH,LINK,REDIRECT,ANALYTICS,ADMIN api
    class DB,ORM data
