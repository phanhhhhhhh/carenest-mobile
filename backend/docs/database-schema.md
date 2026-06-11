# CareNest — Database Schema

> **WARNING: Render PostgreSQL Free Tier expires after 90 days.**
> The free instance at render.com will be deleted automatically 90 days after creation.
> Export data with `pg_dump` before expiry. Upgrade to paid tier for production.

---

## ERD (Text)

```
users
 ├─── elderly_profiles  (1:1, user_id → users.id CASCADE)
 ├─── family_links      (M:N bridge, elderly_id → users.id, family_id → users.id CASCADE)
 ├─── medications       (1:N, elderly_id → users.id CASCADE)
 │     └── medication_logs (1:N, medication_id → medications.id CASCADE)
 ├─── health_metrics    (1:N, elderly_id → users.id CASCADE)
 └─── appointments      (1:N, elderly_id → users.id CASCADE)
```

---

## Tables

### `users`
Central identity table for all actors in the system.

| Column     | Type          | Constraints                                   |
|------------|---------------|-----------------------------------------------|
| id         | BIGSERIAL     | PK                                            |
| role       | VARCHAR(20)   | NOT NULL, CHECK IN ('ELDERLY','FAMILY','ADMIN') |
| phone      | VARCHAR(20)   | NOT NULL, UNIQUE                              |
| name       | VARCHAR(100)  | NOT NULL                                      |
| dob        | DATE          | nullable                                      |
| fcm_token  | VARCHAR(255)  | nullable — Firebase push token                |
| created_at | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                        |
| updated_at | TIMESTAMPTZ   | NOT NULL DEFAULT NOW()                        |
| deleted_at | TIMESTAMPTZ   | nullable — soft delete sentinel               |

**Design rationale:** Single table for all roles avoids JOIN complexity in auth. Role is stored as a string enum — changing to a separate `roles` table would be premature for current scope.

---

### `elderly_profiles`
Extended profile for elderly users. Separated from `users` to keep the auth table lean.

| Column             | Type        | Constraints                             |
|--------------------|-------------|-----------------------------------------|
| id                 | BIGSERIAL   | PK                                      |
| user_id            | BIGINT      | NOT NULL, UNIQUE, FK → users.id CASCADE |
| health_conditions  | JSONB       | NOT NULL DEFAULT '[]' — list of strings |
| emergency_contacts | JSONB       | NOT NULL DEFAULT '[]' — EmergencyContact objects |
| notes              | TEXT        | nullable                                |
| created_at         | TIMESTAMPTZ | NOT NULL                                |
| updated_at         | TIMESTAMPTZ | NOT NULL                                |
| deleted_at         | TIMESTAMPTZ | nullable                                |

**JSONB structure:**
```json
// health_conditions
["Tiểu đường type 2", "Tăng huyết áp"]

// emergency_contacts
[{"name": "Nguyễn Thị Lan", "phone": "0912111001", "relationship": "Con gái"}]
```

**Design rationale:** JSONB chosen for emergency_contacts and health_conditions because the structure is simple, queried rarely (not filtered by individual fields), and avoids 2 extra join tables. PostgreSQL JSONB is indexed and supports containment queries if needed later.

---

### `family_links`
Many-to-many bridge between elderly and family members with relationship metadata.

| Column       | Type        | Constraints                               |
|--------------|-------------|-------------------------------------------|
| id           | BIGSERIAL   | PK                                        |
| elderly_id   | BIGINT      | NOT NULL, FK → users.id CASCADE           |
| family_id    | BIGINT      | NOT NULL, FK → users.id CASCADE           |
| relationship | VARCHAR(50) | NOT NULL — "Con gái", "Con trai", etc.    |
| status       | VARCHAR(20) | NOT NULL DEFAULT 'PENDING', CHECK IN ('PENDING','ACTIVE','REVOKED') |
| created_at   | TIMESTAMPTZ | NOT NULL                                  |
| updated_at   | TIMESTAMPTZ | NOT NULL                                  |
| deleted_at   | TIMESTAMPTZ | nullable                                  |
| UNIQUE       |             | (elderly_id, family_id)                   |

**Design rationale:** Status enum prevents orphan links — family requests start as PENDING and must be approved (ACTIVE) before family member can view data.

---

### `medications`
Prescribed medication records for an elderly person.

| Column        | Type          | Constraints                       |
|---------------|---------------|-----------------------------------|
| id            | BIGSERIAL     | PK                                |
| elderly_id    | BIGINT        | NOT NULL, FK → users.id CASCADE   |
| name          | VARCHAR(100)  | NOT NULL                          |
| dosage        | VARCHAR(100)  | NOT NULL — e.g. "500mg"           |
| schedule      | JSONB         | NOT NULL DEFAULT '{}' — MedicationSchedule |
| next_dose_time| TIMESTAMPTZ   | nullable — updated by scheduler   |
| instructions  | TEXT          | nullable                          |
| created_at    | TIMESTAMPTZ   | NOT NULL                          |
| updated_at    | TIMESTAMPTZ   | NOT NULL                          |
| deleted_at    | TIMESTAMPTZ   | nullable                          |

**JSONB structure:**
```json
{
  "frequency": "TWICE_DAILY",
  "times": ["07:30", "19:30"],
  "daysOfWeek": null
}
```

**Design rationale:** `next_dose_time` is a denormalized computed field updated by the medication scheduler. This enables a simple index scan instead of computing next dose from schedule at query time — critical for high-frequency scheduler queries.

---

### `medication_logs`
Append-only audit log of medication dose events.

| Column        | Type        | Constraints                               |
|---------------|-------------|-------------------------------------------|
| id            | BIGSERIAL   | PK                                        |
| medication_id | BIGINT      | NOT NULL, FK → medications.id CASCADE     |
| taken_at      | TIMESTAMPTZ | NOT NULL                                  |
| status        | VARCHAR(20) | NOT NULL, CHECK IN ('TAKEN','MISSED','SKIPPED') |
| notes         | TEXT        | nullable                                  |
| created_at    | TIMESTAMPTZ | NOT NULL                                  |
| updated_at    | TIMESTAMPTZ | NOT NULL                                  |

**Design rationale:** No `deleted_at` — logs are immutable audit records. Deletion is not a valid operation on medication history.

---

### `health_metrics`
Time-series health readings (blood pressure, heart rate, glucose, etc.)

| Column          | Type           | Constraints                           |
|-----------------|----------------|---------------------------------------|
| id              | BIGSERIAL      | PK                                    |
| elderly_id      | BIGINT         | NOT NULL, FK → users.id CASCADE       |
| type            | VARCHAR(30)    | NOT NULL, CHECK IN ('BLOOD_PRESSURE','HEART_RATE','BLOOD_GLUCOSE','WEIGHT','TEMPERATURE','SPO2') |
| value           | DECIMAL(10,2)  | NOT NULL — primary reading            |
| value_secondary | DECIMAL(10,2)  | nullable — diastolic for blood pressure |
| unit            | VARCHAR(20)    | NOT NULL — mmHg, bpm, mmol/L, etc.   |
| recorded_at     | TIMESTAMPTZ    | NOT NULL                              |
| notes           | TEXT           | nullable                              |
| created_at      | TIMESTAMPTZ    | NOT NULL                              |
| updated_at      | TIMESTAMPTZ    | NOT NULL                              |
| deleted_at      | TIMESTAMPTZ    | nullable                              |

**Design rationale:** `value_secondary` for blood pressure diastolic avoids a separate table while keeping a clean schema. Type-checked at DB level via CHECK constraint.

---

### `appointments`
Scheduled medical appointments for elderly patients.

| Column     | Type          | Constraints                               |
|------------|---------------|-------------------------------------------|
| id         | BIGSERIAL     | PK                                        |
| elderly_id | BIGINT        | NOT NULL, FK → users.id CASCADE           |
| doctor     | VARCHAR(100)  | NOT NULL                                  |
| specialty  | VARCHAR(100)  | nullable                                  |
| location   | VARCHAR(200)  | NOT NULL                                  |
| datetime   | TIMESTAMPTZ   | NOT NULL                                  |
| notes      | TEXT          | nullable                                  |
| status     | VARCHAR(20)   | NOT NULL DEFAULT 'SCHEDULED', CHECK IN ('SCHEDULED','COMPLETED','CANCELLED','MISSED') |
| created_at | TIMESTAMPTZ   | NOT NULL                                  |
| updated_at | TIMESTAMPTZ   | NOT NULL                                  |
| deleted_at | TIMESTAMPTZ   | nullable                                  |

---

## Indexes

| Index name                              | Table            | Columns                            | Type    | Purpose                                    |
|-----------------------------------------|------------------|------------------------------------|---------|--------------------------------------------|
| `idx_medications_next_dose_time`        | medications      | next_dose_time WHERE deleted_at IS NULL | Partial | Medication reminder scheduler — find overdue doses |
| `idx_medications_elderly_id`            | medications      | elderly_id WHERE deleted_at IS NULL | Partial | List medications per elderly               |
| `idx_health_metrics_elderly_recorded`   | health_metrics   | (elderly_id, type, recorded_at DESC) WHERE deleted_at IS NULL | Composite partial | Dashboard date-range charts per metric type |
| `idx_medication_logs_medication_taken`  | medication_logs  | (medication_id, taken_at DESC)     | Composite | Adherence history per medication           |
| `idx_appointments_elderly_datetime`     | appointments     | (elderly_id, datetime) WHERE deleted_at IS NULL | Composite partial | Upcoming appointments view                |
| `idx_family_links_elderly_id`           | family_links     | elderly_id WHERE deleted_at IS NULL | Partial | Find family members for an elderly         |
| `idx_family_links_family_id`            | family_links     | family_id WHERE deleted_at IS NULL | Partial | Find elderly linked to a family member    |
| `idx_users_deleted_at`                  | users            | deleted_at WHERE deleted_at IS NOT NULL | Partial | Efficient soft-delete maintenance queries  |

**Design rationale for partial indexes:** All hot-path indexes exclude soft-deleted rows (`WHERE deleted_at IS NULL`). This keeps index size proportional to active data, not historical data.

---

## N+1 Query Prevention

All `@ManyToOne` and `@OneToOne` associations use `FetchType.LAZY`. Hot-path queries that traverse associations use `JOIN FETCH` explicitly:

- `MedicationRepository.findAllOverdueMedications` — JOIN FETCH m.elderly (scheduler sends push to elderly's FCM token)
- `FamilyLinkRepository.findAllFamilyByElderlyIdAndStatus` — JOIN FETCH fl.family
- `FamilyLinkRepository.findAllElderlyByFamilyIdAndStatus` — JOIN FETCH fl.elderly
- `AppointmentRepository.findUpcomingForFamilyMember` — joins through FamilyLink

---

## Rollback Scripts

Manual rollback scripts are in `src/main/resources/db/rollback/`. They are **not** executed by Flyway Community automatically. To roll back:

```bash
# Run in reverse order (8 → 1)
psql $DATABASE_URL -f src/main/resources/db/rollback/R8__drop_indexes.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R7__drop_appointments.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R6__drop_health_metrics.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R5__drop_medication_logs.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R4__drop_medications.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R3__drop_family_links.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R2__drop_elderly_profiles.sql
psql $DATABASE_URL -f src/main/resources/db/rollback/R1__drop_users.sql
```

---

## ⚠️ Render PostgreSQL Free Tier — 90-Day Expiry

Render's free PostgreSQL instance is **automatically deleted 90 days after creation**. Before expiry:

1. Run `pg_dump $DATABASE_URL > carenest_backup_$(date +%Y%m%d).sql`
2. Either upgrade to paid tier ($7/month) or migrate to another provider
3. Set a calendar reminder 80 days from database creation date

The `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` environment variables are read from the environment and must be set in Render's service config.
