# CareNest — Demo Day Checklist

Run through this fresh, start to finish, before the demo. See `DEMO_SCRIPT.md` for the actual walkthrough script and `README.md` → Known Limitations for scope boundaries (FCM push, Imou live-view, payment/Google Fit OAuth are not live in this build).

## 1. Start Docker (Postgres)

```
docker compose up -d
```

Confirm the container is healthy:

```
docker ps --filter name=carenest_db
```

## 2. Start the backend

Use the **`dev`** profile — not `local`. `dev` sets `server.port=8082` (what the mobile app's `EXPO_PUBLIC_API_BASE_URL` points at) and `carenest.seed.enabled=true`. `local` doesn't set a port and would silently fall back to Spring Boot's default `8080`, breaking every API call.

```
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.jvmArguments="-XX:TieredStopAtLevel=1"
```

Watch the boot log for `Seed data created successfully` — only prints on first boot against an empty DB. If the volume already has data from a previous run, seeding is skipped (that's expected, not an error).

**JVM crash mitigation**: during testing, the backend crashed 3 times with a native JVM access violation (`exit code -1073741819`, no `hs_err_pid*.log` produced) after 18–70 minutes of uptime — looked like environment-level JIT/Windows flakiness, not an app bug. The `-XX:TieredStopAtLevel=1` flag above (disables C2 JIT) is a common workaround for this exact crash class. **Have someone ready to restart the backend if it happens again mid-demo** — same command, it comes back up in ~10 seconds and existing data survives (only the Docker volume reset below wipes data).

## 3. Start the frontend

```
npx expo start
```

- Android emulator: API base URL should resolve to `http://10.0.2.2:8082/api`.
- Real device: use your machine's LAN IP (`http://<your-ip>:8082/api`), same Wi-Fi as the backend host.
- Check `.env` (copied from `.env.example`) has `EXPO_PUBLIC_API_BASE_URL` set correctly for whichever target you're using.

## 4. Confirm backend health

```
curl http://localhost:8082/actuator/health
```

Expect `{"status":"UP"}`.

## 5. Confirm demo accounts exist

Login via the app (or `curl`) with either phone or email (the login screen has a Số điện thoại/Email toggle):

| Role | Phone | Email | Password |
|---|---|---|---|
| Elderly | `+84912345001` (John Anderson) | `john.anderson@test.com` | `Demo@1234` |
| Family | `+84918111001` (Linda Nguyen) | `linda.nguyen@test.com` | `Demo@1234` |

If login fails with "user not found," the seeder didn't run — check the backend log for seeder errors, or force a fresh reseed:

```
docker compose down -v && docker compose up -d
```

then restart the backend (step 2). This wipes all data and reseeds from scratch — only do this if data actually looks wrong/missing, not routinely.

## 6. Walk through the flows in order (see DEMO_SCRIPT.md — now fully in Vietnamese — for the full script)

1. **Login & Dashboard** — both accounts land on a dashboard with real data.
2. **Add medication** — John adds one, it appears in the list immediately.
3. **Health reading + anomaly alert** — John logs an out-of-range BP reading → Linda gets a Health Alert notification.
4. **SOS Emergency Alert** — John triggers SOS → Linda sees it in Cảnh báo gần đây, can acknowledge it.
5. **AI Chat** — John asks about his medication schedule, gets a Gemini reply in Vietnamese (voice input is a UI stub — don't demo it).
6. **Camera** — Linda takes a Snapshot, sees the seeded SOS snapshot in the timeline.

## Known gaps (don't be surprised live)

- No FCM push — alerts land in the in-app notification list/dashboard, not as an OS push banner.
- Imou live-view needs `IMOU_APP_ID`/`IMOU_APP_SECRET` (not set) — lead with Snapshot instead.
- Payment (VNPay/MoMo) and Google Fit need sandbox credentials not present in this build.

## If something looks broken

- Blank/loading-forever dashboard → check the backend is actually reachable at the URL the app is using (most common demo-day failure: wrong profile → wrong port, or wrong LAN IP for a real device).
- Empty screens with no data → seed didn't run; see step 5.
- Any API failure should show a toast, not a silent hang — if you see a spinner that never resolves, that's a real bug, not expected behavior; check backend logs.
