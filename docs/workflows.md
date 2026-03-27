# Peptide Command Center -- Workflows

Visual workflow diagrams for every major flow in the application.

---

## 1. Mixing Workflow

The two-tier reconstitution protocol. An admin reconstitutes a master vial from
powder, then fills individual 3 mL pens from that master.

```mermaid
flowchart TD
    A[Admin selects peptide and enters vial mg + BAC water mL] --> B[System calculates master concentration: mg / mL]
    B --> C[INSERT master_vials row with remaining_ml = total_ml]
    C --> D[Admin selects master vial to fill pen from]
    D --> E[Admin enters mL drawn from master + mL fresh BAC water]
    E --> F[System calculates pen mg_content: master concentration * mL drawn]
    F --> G[System calculates pen concentration: mg_content / total pen mL]
    G --> H[System subtracts mL drawn from master remaining_ml]
    H --> I{master remaining_ml = 0?}
    I -- Yes --> J[Mark master as depleted]
    I -- No --> K[Master stays active]
    J --> L[INSERT pens row]
    K --> L
    L --> M[Admin assigns pen to user via assigned_to]
    M --> N[Dashboard shows pen with concentration and units per dose]
```

---

## 2. Authentication Flow

From app launch to a fully-subscribed realtime dashboard.

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Supabase Auth
    participant Database

    User->>App: Open application
    App->>Supabase Auth: Check existing session (getSession)
    alt Session exists
        Supabase Auth-->>App: Return session + user
        App->>Database: SELECT * FROM profiles WHERE id = user.id
        Database-->>App: Profile row
        App->>App: setupRealtime subscriptions
        App->>User: Render Dashboard
    else No session
        Supabase Auth-->>App: null session
        App->>User: Show Auth screen (login / signup)
        alt Signup
            User->>App: Enter display name, email, password
            App->>Supabase Auth: signUp(email, password)
            Supabase Auth-->>App: New user object
            App->>Database: INSERT INTO profiles (id, display_name, defaults...)
            Database-->>App: New profile row
        else Login
            User->>App: Enter email, password
            App->>Supabase Auth: signInWithPassword(email, password)
            Supabase Auth-->>App: Session + user
        end
        App->>App: onAuthStateChange fires
        App->>Database: SELECT * FROM profiles WHERE id = user.id
        Database-->>App: Profile row
        App->>App: setupRealtime subscriptions
        App->>User: Render Dashboard
    end
```

---

## 3. Daily User Flow

Everything a user does from opening the dashboard through completing their day.

```mermaid
flowchart TD
    A[User opens Dashboard] --> B[Parallel data fetch]
    B --> B1[Fetch today's daily_log or create empty one]
    B --> B2[Fetch assigned pens WHERE assigned_to = user.id AND depleted = false]
    B --> B3[Fetch active master_vials for reference]
    B --> B4[Fetch recent weight history for loss rate calculation]
    B --> B5[Calculate weekly loss rate from weight history]

    B1 --> C[Determine day of week]
    B2 --> C
    B3 --> C
    B4 --> C
    B5 --> C

    C --> D{Morning or Evening shot day?}
    D -- "Mon / Tue / Thu / Sat" --> E[Morning Shot Window]
    D -- "Wed / Fri / Sun" --> F[Evening Shot Window]

    E --> G[Show active peptide schedule with unit counts per pen]
    F --> G

    G --> H[User logs each injection as done with units]
    H --> I[UPDATE daily_logs SET shots = updated JSONB]

    I --> J[User enters daily macros: calories, protein, fiber, water]
    J --> K[UPDATE daily_logs SET calories, protein, fiber, water]

    K --> L[User enters morning weight]
    L --> M[UPDATE daily_logs SET weight]

    M --> N[User marks workout complete with optional notes]
    N --> O[UPDATE daily_logs SET workout = updated JSONB]

    O --> P{All targets met?}
    P -- Yes --> Q[Show celebration / streak indicator]
    P -- No --> R[Show remaining targets summary]
```

---

## 4. Admin Lab Flow

The Lab screen is the admin's workbench for all mixing, inventory, and
configuration tasks.

```mermaid
flowchart TD
    A[Admin navigates to Lab screen] --> B{Select Lab section}

    B --> C1[Calculator]
    B --> C2[Reconstitute Master Vial]
    B --> C3[Fill Pen from Master]
    B --> C4[Active Masters and Pens]
    B --> C5[User Doses]
    B --> C6[Inventory]
    B --> C7[Peptide Types]

    C1 --> D1[Enter mg + mL and preview concentration, no DB write]

    C2 --> D2[Select peptide, enter total_mg, total_ml, mixed_date]
    D2 --> D2a[INSERT INTO master_vials]
    D2a --> D2b[Realtime pushes new master to all clients]

    C3 --> D3[Select active master, enter mL drawn + fresh BAC water, assign user]
    D3 --> D3a[INSERT INTO pens]
    D3a --> D3b[UPDATE master_vials SET remaining_ml = remaining_ml - mL drawn]
    D3b --> D3c[Realtime pushes pen and updated master to all clients]

    C4 --> D4[View and manage active masters and pens]
    D4 --> D4a[Toggle depleted, delete expired rows]

    C5 --> D5[View and update each user's current_doses JSONB]
    D5 --> D5a[UPDATE profiles SET current_doses]

    C6 --> D6[Adjust supply counts]
    D6 --> D6a[UPDATE inventory SET count]
    D6a --> D6b[Realtime pushes updated count to all clients]

    C7 --> D7[Add or remove peptide types]
    D7 --> D7a[INSERT or DELETE peptide_types]
    D7a --> D7b[Realtime pushes change to all clients]
```

---

## 5. Real-time Sync

How changes made by the admin propagate instantly to all connected clients.

```mermaid
sequenceDiagram
    actor Admin
    participant AdminApp as Admin Client
    participant Supabase as Supabase DB + Realtime
    participant UserApp as User Client
    actor User

    Admin->>AdminApp: Update vial, pen, inventory, or peptide type
    AdminApp->>Supabase: INSERT / UPDATE / DELETE
    Supabase-->>Supabase: Write committed, trigger realtime event

    par Broadcast to Admin Client
        Supabase-->>AdminApp: Realtime change event (table, eventType, new row)
        AdminApp->>AdminApp: If on Lab screen, reload section with scroll preservation
    and Broadcast to User Client
        Supabase-->>UserApp: Realtime change event (table, eventType, new row)
        UserApp->>UserApp: If on Dashboard, re-fetch affected data and re-render
    end

    Note over AdminApp,UserApp: Only tables in supabase_realtime publication fire events:<br/>master_vials, pens, mixed_vials, inventory, peptide_types
```

---

## 6. Safety Rules Logic

All automated safety checks that run when the dashboard loads or when weight
data changes.

```mermaid
flowchart TD
    A[Dashboard loads or weight updated] --> B[Fetch latest weight and recent weight history]
    B --> C[Calculate weekly loss rate in lbs per week]

    C --> D{User weight under 150 lbs AND loss rate > 2 lbs/week?}
    D -- Yes --> E["GAUNT CHECK: Warning -- Losing too fast. Suggest +150 kcal."]
    D -- No --> F[Skip Gaunt Check]

    E --> G{Loss rate > user warning_threshold?}
    F --> G
    G -- Yes --> H["OVER-LOSS WARNING: Exceeds per-user threshold. Risk of muscle wasting."]
    G -- No --> I[No over-loss alert]

    H --> J[Check vial and pen expiry]
    I --> J

    J --> K{Days since mixed_date or filled_date}
    K -- "25-27 days" --> L["AMBER WARNING: Approaching 28-day expiry"]
    K -- "28+ days" --> M["RED ALERT: EXPIRED -- REPLACE (pulsing)"]
    K -- "Under 25 days" --> N[No expiry alert]

    L --> O[Enforce One Shot Window]
    M --> O
    N --> O

    O --> P{What day of the week is it?}
    P -- "Mon / Tue / Thu / Sat" --> Q[Morning window ONLY -- evening schedule hidden]
    P -- "Wed / Fri / Sun" --> R[Evening window ONLY -- morning schedule hidden]

    Q --> S[Render active schedule with safety badges]
    R --> S

    S --> T{Stall Check: 3 consecutive weeks with < 0.5% loss, 100% shot compliance, protein floor met?}
    T -- Yes --> U["METABOLIC STALL DETECTED: Suggest incremental dose increase"]
    T -- No --> V[No stall alert]
```
