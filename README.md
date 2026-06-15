# InterviewOS

InterviewOS is an integrated, production-ready remote interview platform designed for recruiters, hiring managers, and candidates. The platform combines real-time video conferencing, collaborative code editing, interactive chat, scheduling, and isolated, multi-language code execution into a single, unified workspace.

The platform provides a native desktop client via Electron alongside its standard web interface, offering a modern, low-latency, and integrated candidate evaluation environment.

---

## Key Capabilities

* **Real-Time Video Interviews**: Browser-based peer-to-peer audio and video communication powered by WebRTC (via Simple-Peer).
* **Collaborative Code Editor**: Shared IDE environment using the Monaco Editor engine, featuring real-time state synchronization, syntax highlighting, and auto-completion.
* **Isolated Code Execution**: Secure compilation and run execution of multiple programming languages (Go, Python, JavaScript, Java, C/C++) isolated in sandboxed runtime containers using Piston.
* **Recruiter & Candidate Dashboards**: User-specific dashboard for scheduling interviews, reviewing candidate statistics, and writing structured post-interview evaluations.
* **Cross-Platform Desktop Client**: Electron-based application package providing a dedicated desktop wrapper with camera and microphone permissions pre-configured.

---

## System Architecture

The application is built using a decoupled architecture, comprising a single-page Next.js web application, an Electron desktop wrapper, and a high-performance Go (Fiber) API and WebSocket signaling server.

```mermaid
graph TD
    subgraph Client Tier
        UserBrowser[Web Browser / Electron App]
    end

    subgraph Application Tier
        FiberServer[Go/Fiber API Server]
        WebSocketHub[WebSocket Connection Hub]
    end

    subgraph Execution & Caching Tier
        Postgres[(PostgreSQL 15 DB)]
        Redis[(Redis 7 Cache)]
        Piston[Piston Sandbox Runner]
    end

    UserBrowser -- HTTPS / REST APIs --> FiberServer
    UserBrowser -- WebSockets --> WebSocketHub
    FiberServer -- GORM/SQL Queries --> Postgres
    WebSocketHub -- Session Sync --> Redis
    FiberServer -- Code Run Proxy --> Piston
    UserBrowser <== P2P WebRTC Audio/Video ==> UserBrowser
```

### Relational Database Schema (ERD)

The relational database is backed by PostgreSQL. The data models and relationships are defined as follows:

```mermaid
erDiagram
    USERS {
        string id PK
        string email UK
        string name
        string password
        string role
        string avatar
        timestamp created_at
        timestamp updated_at
    }
    INTERVIEWS {
        string id PK
        string title
        string description
        timestamp scheduled_at
        int duration
        string room_id
        string host_id FK
        string candidate_id FK
        string status
        timestamp created_at
        timestamp updated_at
    }
    INTERVIEW_ROOMS {
        string id PK
        string interview_id FK
        string password
        string rtc_token
        timestamp created_at
        timestamp updated_at
    }
    FEEDBACKS {
        string id PK
        string interview_id FK
        int rating
        string comment
        timestamp created_at
        timestamp updated_at
    }
    CODE_SESSIONS {
        string id PK
        string interview_id FK
        string language
        string code
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o{ INTERVIEWS : "hosts"
    USERS ||--o{ INTERVIEWS : "attends"
    INTERVIEWS ||--|| INTERVIEW_ROOMS : "contains"
    INTERVIEWS ||--|| FEEDBACKS : "has"
    INTERVIEWS ||--|| CODE_SESSIONS : "stores"
```

---

## Core System Workflows

### 1. WebRTC Signaling & Media Flow
Direct peer-to-peer connection initialization requires direct SDP offers, answers, and ICE candidate exchanges. The Go WebSocket server acts as the secure signaling channel between participants.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Interviewer
    actor Bob as Candidate
    participant WS as WebSocket Hub (Go)

    Alice->>WS: Connects to Room (/ws/:roomId)
    WS-->>Alice: Returns active room list ("room-users")
    Bob->>WS: Connects to Room (/ws/:roomId)
    WS-->>Alice: Broadcasts "peer-joined" (Bob's UserID)
    WS-->>Bob: Returns active room list (Alice's UserID)
    
    Note over Alice,Bob: WebRTC Connection Initiation
    Alice->>WS: Send WebRTC Offer (Target: Bob)
    WS->>Bob: Forward Offer
    Bob->>WS: Send WebRTC Answer (Target: Alice)
    WS->>Alice: Forward Answer
    
    Note over Alice,Bob: ICE Candidate Exchange
    Alice->>WS: Send Ice Candidate
    WS->>Bob: Forward Ice Candidate
    Bob->>WS: Send Ice Candidate
    WS->>Alice: Forward Ice Candidate
    
    Note over Alice,Bob: P2P Audio/Video Stream Established
```

### 2. Sandboxed Code Execution
To ensure the host machine remains safe, candidate-submitted code runs inside an isolated, resource-constrained execution container using the Piston service.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Candidate Browser
    participant API as Go API Server
    participant Piston as Piston Container

    Client->>API: POST /api/interviews/:id/run {language, code}
    API->>API: Map language ID to Piston profiles
    API->>Piston: POST /api/v2/execute {language, files}
    Note over Piston: Runs code inside isolated sandbox with constraints
    Piston-->>API: Returns {stdout, stderr, exitCode}
    API-->>Client: Returns HTTP 200 Run Results
```

---

## Project Directory Structure

```text
├── .github/
│   └── workflows/                    # GitHub Actions CI/CD workflows
│       ├── deploy-backend.yml
│       ├── deploy-frontend.yml
│       └── tests.yml
├── backend/
│   ├── cmd/                          # Entry points
│   ├── internal/                     # Go application packages
│   │   ├── db/                       # GORM Database & Redis handlers
│   │   ├── handlers/                 # REST & WebSocket endpoint logic
│   │   ├── middleware/               # Auth, CORS, & logging middleware
│   │   ├── models/                   # GORM schema structs
│   │   ├── services/                 # Business logic abstractions
│   │   └── utils/                    # JWT & cryptography utilities
│   ├── migrations/                   # SQL migration scripts
│   ├── Dockerfile.dev                # Development Docker configuration
│   ├── Dockerfile.prod               # Production Docker build
│   ├── go.mod                        # Go dependencies list
│   └── main.go                       # Backend server launcher
├── frontend/
│   ├── app/                          # Next.js 14 app directory
│   ├── components/                   # Shared UI components (Interview Room, Monaco Editor)
│   ├── hooks/                        # Custom React Hooks
│   ├── lib/                          # Helper utilities (Axios client, helper funcs)
│   ├── public/                       # Public assets (icons, images)
│   ├── services/                     # Frontend API services wrapper
│   ├── store/                        # Zustand state stores
│   ├── styles/                       # CSS design styles
│   ├── Dockerfile.dev                # Frontend Dev Docker configuration
│   ├── Dockerfile.prod               # Frontend Prod Docker configuration
│   ├── next.config.js                # Next.js properties config
│   └── tailwind.config.ts            # Styling setup
├── electron/
│   ├── main.js                       # Electron main script (Window control)
│   ├── preload.js                    # Preload script (Context isolation)
│   ├── icon.png                      # Application window icon
│   ├── package.json                  # Electron package scripts
│   └── Dockerfile.prod               # Desktop build container
├── diagrams/                         # UML and architecture diagrams
├── docker-compose.yml                # Root docker-compose configuration
├── docker-compose.prod.yml           # Production containers composition
├── Makefile                          # Standard build shortcuts
├── ONE_CLICK_START.bat               # Windows automatic startup utility
├── ONE_CLICK_START.ps1               # PowerShell startup helper
├── STOP_ALL.bat                      # Cleanup services script
├── start-electron.bat                # Standalone desktop app launcher
└── README.md                         # Project documentation
```

---

## Getting Started

### Prerequisites

Before starting, make sure your machine has the following installed:
* **Node.js** (v18 or above)
* **Docker Desktop**
* **NPM** (v9 or above)

---

### Run using the One-Click Scripts (Recommended)

To quickly start the entire application (including databases, caching services, backend APIs, Next.js server, and the Electron Desktop app):

* **On Windows Command Prompt:**
  ```cmd
  ONE_CLICK_START.bat
  ```

* **On Windows PowerShell:**
  ```powershell
  .\ONE_CLICK_START.ps1
  ```

---

### Run Manually

If you prefer to start each component individually:

#### 1. Databases and Sandboxed Runner (Docker)
Ensure Docker Desktop is open and active, then run:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

#### 2. Next.js Frontend Server
Run these commands in a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The web app will be available locally at `http://localhost:3000`.

#### 3. Electron Desktop App
Run these commands in another new terminal window:

* **On Command Prompt (cmd):**
  ```cmd
  cd electron
  npm install
  set ELECTRON_START_URL=http://localhost:3000
  npm start
  ```
* **On PowerShell:**
  ```powershell
  cd electron
  npm install
  $env:ELECTRON_START_URL="http://localhost:3000"
  npm start
  ```

---

## API Catalog

### Authentication Endpoints

| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Creates a user profile (`candidate` or `interviewer`) |
| `POST` | `/api/auth/login` | No | Authenticates credentials and returns a Signed JWT token |
| `POST` | `/api/auth/logout` | Yes | Terminates user sessions |
| `GET` | `/api/auth/me` | Yes | Retrieves current session user payload |

### Interviews & Code Rooms

| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/interviews` | Yes | Retrieves paginated and filtered interview records |
| `POST` | `/api/interviews` | Yes | Schedules a new interview session |
| `GET` | `/api/interviews/:id` | Yes | Retrieves details for a specific interview room |
| `POST` | `/api/rooms/join` | Yes | Validates password/token to enter a room |
| `POST` | `/api/interviews/:id/run` | Yes | Submits written code for compiler execution |

### Feedback & Evaluation

| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interviews/:id/feedback` | Yes | Submits structured evaluations (interviewer only) |
| `GET` | `/api/interviews/:id/feedback` | Yes | Fetches candidate reviews and ratings |
| `POST` | `/api/interviews/:id/evaluation`| Yes | Updates scoring and feedback status |

---

## Security & Optimizations

* **Password Hashing**: Uses `bcrypt` with unique salt parameters to securely store login credentials.
* **Role-Based Security**: API authorization checks enforce strict access control. For example, candidates are denied access to private interviewer feedback fields.
* **Sandbox Security Bounds**: Multi-language compilation uses CPU and memory resource constraints within Docker/Piston to block denial-of-service (DoS) attempts or unauthorized filesystem commands.
* **WebSocket Race-Safety**: Thread-safe channel state modifications are protected using Go's `sync.Mutex` to prevent race conditions on concurrent connection shifts.

---

## License

This project is licensed under the MIT License. See the [LICENSE](file:///c:/interview_help/LICENSE) file for more details.
