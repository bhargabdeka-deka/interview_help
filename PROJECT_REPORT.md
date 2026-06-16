# Technical Project Report: InterviewOS
**A Collaborative Real-Time Technical Interview Platform**

---

## 1. Executive Summary

**InterviewOS** is an integrated Web-based platform designed to streamline remote technical assessments for recruiters, interviewers, and candidates. The platform combines:
1. **Real-time collaborative code editing** utilizing the Monaco Editor engine.
2. **Secure multi-peer audio/video rooms** running peer-to-peer over WebRTC.
3. **Sandboxed code execution** for multiple languages (Go, Python, JavaScript, Java, C/C++) isolated via Docker/Piston.
4. **Structured candidate scheduling and feedback workflow** inside a dashboard.

---

## 2. System Architecture

The application adopts a decoupled architecture featuring a single-page frontend application and a high-performance HTTP/WebSocket backend service, orchestrated using Docker Compose.

### Architectural Diagram

![System Architecture](./diagrams/architecture.png)

<details>
<summary>Click to view Mermaid Source Code</summary>

```mermaid
graph TD
    subgraph Client Tier
        WebClient[Web Browser - Next.js App]
        DesktopClient[Electron Desktop App]
    end

    subgraph Application Tier
        FiberServer[Go/Fiber API Server]
        WebSocketHub[WebSocket Connection Hub]
    end

    subgraph Execution & Caching Tier
        Postgres[(PostgreSQL 14 DB)]
        Redis[(Redis 7 Cache)]
        Piston[Piston Sandbox Runner]
    end

    WebClient -- HTTPS / REST APIs --> FiberServer
    DesktopClient -- HTTPS / REST APIs --> FiberServer
    
    WebClient -- WebSockets --> WebSocketHub
    DesktopClient -- WebSockets --> WebSocketHub

    FiberServer -- GORM/SQL Queries --> Postgres
    WebSocketHub -- Session Sync --> Redis
    FiberServer -- Code Run Proxy --> Piston
    
    WebClient <== P2P WebRTC Audio/Video ==> WebClient
    DesktopClient <== P2P WebRTC Audio/Video ==> DesktopClient
    WebClient <== P2P WebRTC Audio/Video ==> DesktopClient
```

</details>

---

## 3. Entity Relationship Diagram (ERD)

The relational schema is backed by PostgreSQL and managed by GORM. Key relationships are illustrated below:

![Entity Relationship Diagram](./diagrams/erd.png)

<details>
<summary>Click to view Mermaid Source Code</summary>

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

</details>

---

## 4. Key Sequences & Workflows

### 4.1. WebRTC Signaling & Connection Setup

Because WebRTC requires direct connection details (SDP offers/answers and ICE candidates) to construct a direct audio/video line, the WebSocket endpoint is used as a signaling channel.

![WebRTC Signaling Sequence](./diagrams/webrtc.png)

<details>
<summary>Click to view Mermaid Source Code</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Interviewer
    actor Bob as Candidate
    participant WS as WebSocket Hub (Go)

    Alice->>WS: Connects to Room (/ws/:roomId)
    WS-->>Alice: Returns list of existing users ("room-users")
    Bob->>WS: Connects to Room (/ws/:roomId)
    WS-->>Alice: Broadcasts "peer-joined" (Bob's UserID)
    WS-->>Bob: Returns room users list (Alice's UserID)
    Note over Alice,Bob: WebRTC Initiation
    Alice->>WS: Send WebRTC Offer (Target: Bob)
    WS->>Bob: Forward Offer
    Bob->>WS: Send WebRTC Answer (Target: Alice)
    WS->>Alice: Forward Answer
    Note over Alice,Bob: Exchange ICE Candidates
    Alice->>WS: Send Ice Candidate
    WS->>Bob: Forward Ice Candidate
    Bob->>WS: Send Ice Candidate
    WS->>Alice: Forward Ice Candidate
    Note over Alice,Bob: Direct P2P Media Stream Established
```

</details>

### 4.2. Code Execution Flow

The platform executes code in real time without putting the host node at risk by executing it inside an isolated sandbox using the Piston library.

![Code Execution Sequence](./diagrams/code_execution.png)

<details>
<summary>Click to view Mermaid Source Code</summary>

```mermaid
sequenceDiagram
    autonumber
    actor Client as Candidate Browser
    participant API as Go API Server
    participant DB as Postgres
    participant Piston as Piston Container

    Client->>API: POST /api/interviews/:id/run {language, code}
    API->>API: Map IDE Language to Piston Language Name
    API->>Piston: POST /api/v2/execute {language, files: [code]}
    Note over Piston: Runs code inside an isolated, resource-constrained container
    Piston-->>API: Returns {stdout, stderr, exitCode}
    API-->>Client: Returns HTTP/200 Sandbox Results
```

</details>

---

## 5. Docker Orchestration Flow & Container Lifecycle

The application uses **Docker Compose** to run the complete environment. This standardizes deployment, isolates service operations, and protects host environments.

### 5.1. Why Use Docker in InterviewOS?
* **Zero Host Dependencies**: Developers and administrators do not need to install complex local compilers (like GCC or Go), PostgreSQL servers, or Redis databases on the host machine.
* **Isolated Sandbox Execution**: To prevent security compromises from candidates submitting malicious code (e.g., reading local credentials or calling system utilities), the code execution engine runs inside the isolated `interviewos_piston` container with resource limits and restricted privileges.
* **Dependency Health Monitoring**: Containers synchronize startup using docker health checks. The `backend` container waits for both `postgres` and `redis` to pass health checks (`pg_isready` and `redis-cli ping`) before launching, preventing database connection timeouts.

### 5.2. Docker Compose Containers Catalog
* **`interviewos_postgres` (Port 5432)**: relational database storing users, interviews, and code sessions.
* **`interviewos_redis` (Port 6379)**: cache store used for session validations.
* **`interviewos_backend` (Port 8080)**: custom Dockerfile building the Go backend executable and running the Fiber WebSocket signaling hub.
* **`interviewos_piston` (Port 2000)**: multi-language execution engine exposing REST endpoints to build and execute code blocks.
* **`interviewos_frontend` (Port 3000)**: Next.js dev server rendering the application web interface.

### 5.3. Container Network Interaction Flow

![Docker Orchestration Flow](./diagrams/docker_orchestration.png)

<details>
<summary>Click to view Mermaid Source Code</summary>

```mermaid
graph TD
    subgraph Host OS [Host Operating System]
        subgraph Docker Engine [Docker Compose Network]
            postgres[Container: interviewos_postgres]
            redis[Container: interviewos_redis]
            piston[Container: interviewos_piston]
            backend[Container: interviewos_backend]
            frontend[Container: interviewos_frontend]
        end
    end

    User([Interviewer / Candidate]) -->|Port 3000| frontend
    frontend -->|Port 8080| backend
    backend -->|Port 5432| postgres
    backend -->|Port 6379| redis
    backend -->|Port 2000| piston
```

</details>

---

## 6. API Reference Catalog

### 5.1. Authentication
* **`POST /api/auth/register`**: Creates user accounts with roles (`candidate`, `interviewer`).
* **`POST /api/auth/login`**: Issues Signed JWT tokens.
* **`POST /api/auth/logout`**: Authenticated logout.
* **`GET /api/auth/me`**: Returns the current session user payload.

### 5.2. Interview Schedules & Rooms
* **`GET /api/interviews`**: Fetch all scheduled interviews (supports pagination and filtering).
* **`POST /api/interviews`**: Plan and schedule a new interview event.
* **`GET /api/interviews/:id`**: Fetch deep associations for an interview (host details, candidate details).
* **`POST /api/rooms/join`**: Validate room password to gain access to WebSocket room.
* **`POST /api/interviews/:id/run`**: Send written code for sandboxed remote compilation and execution.

### 5.3. WebSocket Live Room signaling (wss://...)
* `webrtc-offer` / `webrtc-answer` / `webrtc-ice`: Signaling packets forwarded directly using target recipient fields.
* `chat-sync`: Synchronize messages between the participants.
* `code-sync`: Synchronize lines of code within Monaco Editor. Saves to PostgreSQL on changes using a background goroutine.

---

## 7. Security & Optimizations

1. **Password Hashing**: Uses `golang.org/x/crypto/bcrypt` to securely store passwords with unique salt values.
2. **Access Control**: Handlers utilize JWT authorization parsed from HTTP Bearer headers to enforce database-level access checks (e.g., Candidates cannot view interviewer feedback notes).
3. **Execution Sandbox**: Multi-language support runs in containerized environments with memory and CPU boundaries to prevent denial-of-service (DoS) loops or host compromise.
4. **WebSocket Mutex Locking**: Room creation and active client registration use synchronization mutexes (`sync.Mutex`) to prevent data race conditions on simultaneous disconnects or connects.

---

## 8. Authentication & Authorization Flow (JWT)

This sequence illustrates the stateless authentication flow used to secure API endpoints across the platform.

<details open>
<summary>View Diagram</summary>

```mermaid
sequenceDiagram
    autonumber
    actor User as Client
    participant API as Auth API
    participant DB as PostgreSQL

    User->>API: POST /api/auth/login {email, password}
    API->>DB: Query User by Email
    DB-->>API: Return User Record & Hashed Password
    API->>API: Verify bcrypt(password)
    API->>API: Generate Signed JWT Token
    API-->>User: HTTP 200 {token, user_details}
    
    Note over User,API: Subsequent Authenticated Requests
    User->>API: GET /api/interviews (Header: Bearer Token)
    API->>API: Validate JWT Signature
    API->>DB: Fetch User's Interviews
    DB-->>API: Return Records
    API-->>User: HTTP 200 JSON Data
```

</details>

---

## 9. Frontend Component Architecture

The Next.js frontend is heavily modularized. Complex states in the interview room are managed via Zustand to prevent unnecessary re-renders of the video and code panels.

<details open>
<summary>View Diagram</summary>

```mermaid
graph TD
    Root[Next.js App Router] --> DashboardPage[Dashboard Page]
    Root --> InterviewPage[Interview Room Page]
    
    DashboardPage --> SchedMod[Scheduling Modal]
    DashboardPage --> HistList[History List]
    DashboardPage --> Stats[Analytics Stats]
    
    InterviewPage --> RoomProvider[Zustand Room State]
    RoomProvider --> VideoPanel[WebRTC Video Grid]
    RoomProvider --> EditorPanel[Monaco Code Editor]
    RoomProvider --> ChatPanel[WebSocket Chat]
    RoomProvider --> Controls[Media Controls]
    
    EditorPanel --> PistonAPI[Piston Execution API]
    VideoPanel --> SimplePeer[Simple-Peer WebRTC Engine]
```

</details>

---

## 10. Interview Lifecycle State Machine

The state diagram below illustrates the life cycle of an interview record within the system, tracking its transition from scheduled to fully evaluated.

<details open>
<summary>View Diagram</summary>

```mermaid
stateDiagram-v2
    [*] --> Scheduled: HR Creates Interview
    Scheduled --> Active: Host Joins Room
    Active --> Ongoing: Candidate Joins Room
    Ongoing --> Completed: Host Ends Interview
    Completed --> Evaluated: Host Submits Feedback
    Evaluated --> [*]
```

</details>

