# CareNest — Demo Script

Five flagship use cases, in the order that reads best live. Uses the seeded `dev`-profile demo accounts (see README → Demo Data). All passwords: `Demo@1234`.

| Role | Phone | Name |
|---|---|---|
| Elderly | `+84912345001` | John Anderson |
| Family | `+84918111001` | Linda Nguyen (John's daughter) |

Run two devices/simulators side by side — one logged in as John (elderly), one as Linda (family) — so alerts appear live on the family side as they're triggered on the elderly side.

---

## 1. SOS Emergency Alert (UC-14)

**Device:** John Anderson (elderly)

1. On the **Home** tab, tap the red **SOS** button.
2. A 3-second countdown appears — let it run out (don't tap "Cancel"). This debounces accidental taps, worth calling out live.
3. A confirmation alert appears: "Emergency signal has been sent. All family members have been notified."

**Device:** Linda Nguyen (family)

4. On the **Home** tab, open **Cảnh báo gần đây → Xem tất cả**. The new SOS event appears at the top, status **ACTIVE**.
5. A best-effort camera snapshot was captured automatically at trigger time — visible in the **Camera** tab's timeline for John's device.

> **Note:** FCM push isn't configured in this build (see README → Known Limitations), so the alert won't arrive as an OS push banner — it shows up via the in-app alert list and dashboard, which is the reliable path for this demo.

---

## 2. AI Chat (UC-16)

**Device:** John Anderson (elderly)

1. Open the **Chat AI** tab.
2. Type: *"What time do I take my blood pressure medicine?"* and send.
3. The Gemini-backed reply answers using John's actual seeded Amlodipine schedule (8:00 AM) — the API key lives server-side only, nothing in the mobile app touches it.
4. Optionally follow up with *"Can you tell me a story? I feel lonely."* to show the general-companionship intent, not just medication Q&A.

---

## 3. Health Anomaly Alert (UC-6 / threshold + AI analysis)

**Device:** John Anderson (elderly)

1. Open the **Health** tab and log a new **Blood Pressure** reading well outside the normal range (e.g. systolic 175).
2. Submit — this triggers both the threshold check and the Gemini-based anomaly analysis server-side.

**Device:** Linda Nguyen (family)

3. Open the notification bell (top-right on **Home**) — a **Health Alert** notification appears with the AI-generated analysis text attached, not just the raw number.
4. This is backed by a durable in-app record (not just a push), so it's still there after the app is closed and reopened.

---

## 4. Family Dashboard (UC-8, aggregate endpoint)

**Device:** Linda Nguyen (family)

1. Land on the **Home** tab after login — this single screen aggregates John's medication adherence ring, latest vitals (HR/BP/glucose with warning coloring), camera status, recent alerts, and upcoming appointments in one view.
2. Point out the elderly-selector chips at the top if demoing an account linked to more than one elderly user (Linda is only linked to John in the seed data, so this row won't show — mention it's there for multi-elderly families).
3. Tap **Xem tất cả** on the Meds or Appointments section to show drill-down into full detail screens.

---

## 5. Camera (UC-11/UC-12 — snapshot-based, not embedded live video)

**Device:** Linda Nguyen (family)

1. Open the **Camera** tab (or tap the camera card on the dashboard → "Xem").
2. Tap **Snapshot** — captures a fresh still image from John's demo Imou device and adds it to the timeline.
3. Scroll the timeline to show the seeded SOS-triggered snapshot from 4 days ago, tagged **SOS Emergency Snapshot**.

> **Be accurate about scope:** "Live View" opens an external link/app via the real Imou API, not an embedded in-app video player, and needs `IMOU_APP_ID`/`IMOU_APP_SECRET` configured (not set in this build — see README → Known Limitations). Lead with **Snapshot**, which works standalone and is what most of the demo data supports.

---

## Fallback notes if something misbehaves live

- If the backend is unreachable, the app shows a dismissible "No connection" toast rather than crashing or hanging silently — a good moment to point out the offline handling if it happens to trigger.
- If a screen shows an empty state instead of data, it's likely because the demo seed wasn't loaded (`carenest.seed.enabled=true` under the `dev` profile, first boot only — check backend logs for "Seed data created successfully").
