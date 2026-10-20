# LinkPulse

### Short Links. Smart Insights. Enterprise-Grade Safety.

LinkPulse is a full-stack URL shortening and analytics platform that helps users create, manage, track, and protect short links through intelligent redirect rules, campaign management, QR codes, click analytics, bulk imports, and administrative security controls.

🌐 **Live Demo:** https://linkpulse2026.vercel.app/  
💻 **GitHub Repository:** https://github.com/SurajRawatr07/LinkPulse

---

## ✨ Features

### 🔗 Smart Link Management
- Create short URLs with custom aliases.
- Configure expiration dates and click limits.
- Protect links with passwords.
- Enable, disable, and manage short links.
- Configure device-based redirects for mobile, tablet, and desktop.
- Generate downloadable QR codes.
- Organize links using campaigns, folders, and tags.

### 📊 Analytics & Insights
- Track click activity and engagement trends.
- Analyze devices, browsers, operating systems, and referrers.
- View individual link performance.
- Monitor aggregate analytics and campaign statistics.
- Record click events for reporting and analysis.

### 📦 Bulk Link Import
- Import multiple links through CSV files.
- Validate entries before importing.
- Identify invalid URLs and duplicate aliases.
- Review import results before creating links.

### 🛡️ Security & Administration
- Email/password authentication.
- Google Sign-In integration.
- Server-side session management.
- Role-based access control for users and admins.
- Domain safety blocklist.
- Public malicious-link reporting.
- Link moderation and audit logs.
- Password-protected redirects and expiry enforcement.

### 📱 Responsive Design
- Responsive layouts for mobile, tablet, and desktop.
- Dark-themed interface with teal accents.
- Reusable components and consistent styling.
- Interactive analytics dashboards and navigation.

---

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Zustand
- Recharts
- Zod
- Lucide React
- qrcode.react
- PapaParse

### Backend
- Node.js
- Express.js
- TypeScript
- REST API
- Firebase Authentication
- Firebase Admin SDK
- bcryptjs
- ua-parser-js

### Database & ORM
- PostgreSQL
- Google Cloud SQL
- Drizzle ORM
- Drizzle Kit

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A["Visitor / User / Admin"]
    B["React + TypeScript Frontend"]
    C["Authentication & Session Management"]
    D["Express.js REST API"]
    E["Link Management"]
    F["Redirect Engine"]
    G["Analytics & Click Events"]
    H["Admin & Safety Controls"]
    I[("PostgreSQL Database")]
    J["Analytics Dashboard"]
    K["Destination Website"]

    A --> B
    B --> C
    C --> D
    B --> D
    D --> E
    D --> F
    D --> H
    E --> I
    F --> I
    F --> G
    G --> I
    H --> I
    I --> J
    F --> K



🔄 Smart Redirect Workflow
Every short link passes through validation and configured redirect rules before reaching its destination.
#chatgpt-mermaid-_r_1kj_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_1kj_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_1kj_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_1kj_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_1kj_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_1kj_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_1kj_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_1kj_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_1kj_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_1kj_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_1kj_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_1kj_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_1kj_ p{margin:0;}#chatgpt-mermaid-_r_1kj_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_1kj_ .label text,#chatgpt-mermaid-_r_1kj_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .node rect,#chatgpt-mermaid-_r_1kj_ .node circle,#chatgpt-mermaid-_r_1kj_ .node ellipse,#chatgpt-mermaid-_r_1kj_ .node polygon,#chatgpt-mermaid-_r_1kj_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .rough-node .label text,#chatgpt-mermaid-_r_1kj_ .node .label text,#chatgpt-mermaid-_r_1kj_ .image-shape .label,#chatgpt-mermaid-_r_1kj_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_1kj_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .rough-node .label,#chatgpt-mermaid-_r_1kj_ .node .label,#chatgpt-mermaid-_r_1kj_ .image-shape .label,#chatgpt-mermaid-_r_1kj_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_1kj_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_1kj_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_1kj_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_1kj_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_1kj_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_1kj_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_1kj_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_1kj_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_1kj_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_1kj_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_1kj_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_1kj_ .icon-shape,#chatgpt-mermaid-_r_1kj_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_1kj_ .icon-shape p,#chatgpt-mermaid-_r_1kj_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_1kj_ .icon-shape .label rect,#chatgpt-mermaid-_r_1kj_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_1kj_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_1kj_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_1kj_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_1kj_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_1kj_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_1kj_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_1kj_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_1kj_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1kj_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_1kj_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1kj_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_1kj_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_1kj_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_1kj_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_1kj_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .node rect,#chatgpt-mermaid-_r_1kj_ .node circle,#chatgpt-mermaid-_r_1kj_ .node ellipse,#chatgpt-mermaid-_r_1kj_ .node polygon,#chatgpt-mermaid-_r_1kj_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_1kj_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_1kj_ .node.mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_1kj_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_1kj_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_1kj_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Visitor opens short URLFind short codeLink exists?Return 404Link active and domain safe?Block redirectLink expired?Show expired statusClick limit reached?Show limit statusPassword protected?Verify passwordAccess valid?Reject or request passwordApply device targetingRecord click eventHTTP 302 RedirectNoYesNoYesYesNoYesNoYesNoYesNo






🔐 Authentication & Roles
Role	Permissions
Visitor	Open public short links and submit abuse reports
User	Manage owned links, QR codes, campaigns, and analytics
Admin	Manage users and links, moderate suspicious URLs, and maintain the domain blocklist
All protected operations should enforce authorization on the server.

📡 REST API Overview
Method	Endpoint	Description
GET	/api/health	Service health check
POST	/api/v1/auth/register	Register a user
POST	/api/v1/auth/login	User login
POST	/api/v1/auth/google-session	Google authentication session
POST	/api/v1/auth/demo-login	Demo login
GET	/api/v1/auth/me	Current user profile
POST	/api/v1/auth/logout	End session
GET	/api/v1/links	List owned links
POST	/api/v1/links	Create a short link
POST	/api/v1/links/check-alias	Check alias availability
GET	/api/v1/links/:id	Get link details
PATCH	/api/v1/links/:id	Update link settings
DELETE	/api/v1/links/:id	Archive a link
GET	/api/v1/links/:id/analytics	Link analytics
GET	/api/v1/campaigns	List campaigns
POST	/api/v1/campaigns	Create a campaign
GET	/api/v1/analytics/overview	Analytics overview
POST	/api/v1/imports/csv	Import links from CSV
GET	/api/v1/admin/overview	Admin overview
GET	/api/v1/admin/users	List users
GET	/api/v1/admin/links	Manage platform links
GET	/api/v1/admin/blocklist	View blocked domains
POST	/api/v1/admin/blocklist	Add a blocked domain
POST	/api/v1/reports	Report a suspicious link
GET	/r/:code	Resolve a short link

🚀 Getting Started
Prerequisites
- Node.js
- npm
- PostgreSQL database access
- Firebase configuration
1. Clone the Repository
git clone https://github.com/SurajRawatr07/LinkPulse.git
cd LinkPulse


2. Install Dependencies
npm install


3. Configure Environment Variables
Configure the required environment variables using .env.example, if provided.

Never commit database credentials, Firebase private keys, or production secrets to GitHub.
4. Prepare the Database
Run the database migration or setup commands configured in the repository.

If the seed script exists and is configured for the intended database, you can run:
npx tsx server/seed.ts


5. Start the Development Server
npm run dev


6. Build for Production
npm run build
npm run start


Check package.json for the exact available scripts before running commands.

🎬 Hackathon Demo
Scenario 1: Link Creation & Analytics
1. Sign in with an authorized demo account.
2. Open the Create Link page.
3. Enter a destination URL and custom alias.
4. Publish the short link.
5. Generate and copy its QR code.
6. Open the short URL in a new tab.
7. Return to the dashboard and inspect the recorded click analytics.
Scenario 2: Bulk Import & Link Moderation
1. Open the Bulk Import page.
2. Upload a CSV containing valid and invalid entries.
3. Review row-by-row validation results.
4. Import the valid links.
5. Sign in with an authorized demo admin account.
6. Disable a test link.
7. Open the short URL and verify that redirection is blocked.
8. Test the domain blocklist using a controlled test domain.

🔒 Security & Reliability
- Validate URLs and aliases on the server.
- Enforce link ownership and role permissions.
- Apply expiry and click-limit checks before redirecting.
- Use secure session-cookie settings.
- Hash passwords using an appropriate password-hashing algorithm.
- Avoid storing raw IP addresses when anonymized attribution is sufficient.
- Keep secrets in environment variables.
- Test authentication, database connectivity, and redirect failure scenarios before deployment.

🚀 Future Enhancements
- Link risk intelligence and reputation checks.
- Click anomaly detection and suspicious traffic alerts.
- Campaign comparison and downloadable analytics reports.
- Link lifecycle history and change tracking.
- Enhanced workspace collaboration.

👨‍💻 Project Links
Live Website: https://linkpulse2026.vercel.app/
GitHub: https://github.com/SurajRawatr07/LinkPulse
