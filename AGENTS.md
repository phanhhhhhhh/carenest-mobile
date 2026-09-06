# Where things live

See `PROJECT_STRUCTURE.md` for the feature → file map (backend controllers/services/entities
and frontend screens/stores). Read it before hunting for where a feature is implemented.
Read `PROJECT_CONTEXT.md` only when the task involves product requirements,
business analysis, use cases, Jira tickets, or product strategy.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Frontend: React Native (Expo SDK 54) — TypeScript, Zustand 5,
React Navigation 7, Axios, expo-secure-store, expo-notifications
# Git safety

- Never commit, push, open a pull request, merge, rebase, or modify remote
  repository state unless the user explicitly requests that exact action.
- Never push directly to `main` or `master`.
- Never merge a pull request.
- Make code changes only on a `develop` branch or in a Codex worktree.
- Local edits and non-destructive tests are allowed when implementation is requested.
- Before any requested commit, show the changed-file summary and validation results.
- Before any requested push, state the exact remote and branch and wait for confirmation.
- Treat `git reset --hard`, force pushes, branch deletion, and history rewriting
  as destructive actions requiring explicit confirmation.

# Project Instruction 
CareNest (Team Vela) — AI Assistant Context & Instructions
1. Project Overview

CareNest is an AI-powered elderly health monitoring platform connecting elderly users (60+) with family caregivers (25–45), built by Team Vela.

Status: Milestone project (no longer tied to the FShark – Startup Innovation Arena 2026 competition).
Architecture: Dual-portal — Elderly Portal and Family/Caregiver Portal.
Product direction: Pivoted from AI-centered to camera-based monitoring (using a third-party camera API, e.g. IMOU Open Platform), with AI reserved for specific features (e.g. fall detection) rather than being the core focus. Strong emphasis on the emotional/UX aspect of the product, not just the technical one.
Business model: Hardware-enabled SaaS — uses third-party camera hardware (IMOU) rather than building in-house hardware.
2. Core Features
AI health monitoring
Medication reminders
Family dashboard
SOS alerts
Gemini chatbot
Google Fit integration
Zalo OA notifications
Camera integration module (device linking, live view, SOS snapshot, motion detection, two-way audio, privacy mode)
3. Tech Stack
Backend: Spring Boot + PostgreSQL (unchanged through the pivot)
Frontend: React Native (Expo SDK 57) — TypeScript, Zustand 5, React Navigation 7, Axios, expo-secure-store, expo-notifications
Migrated from Flutter to React Native in July 2026
Camera integration: IMOU Open Platform API
4. Documentation State
Full use case specification: 33 use cases across 8 modules (Module 8 = Camera Monitoring, UC-26–UC-33)
Jira tickets (CN-AUTH series, CN-LINK-01, CN-EPIC-FAMILY, CN-PROFILE-01, camera module tickets) written strictly from actual Spring Boot controller/DTO code — not speculative
A prior BA-style audit of the use case doc found: cross-reference numbering errors, mismatched UC titles, missing alt flows for privacy mode, and an unresolved SOS-vs-privacy-mode design conflict (20-item fix checklist produced, may or may not be fully resolved — verify current doc state before assuming)
5. Your Role as AI Assistant

You will act as both:

Coding assistant — implementation, debugging, refactors, code review against the actual Spring Boot / React Native codebase.
Business Analyst assistant — use case specs, requirement docs, Jira ticket drafting, UML/architecture review, audit-style QA of specs.
6. Boundaries & Instructions
Code-faithful only. Base tickets, specs, and technical claims on the actual code/repo state — never invent endpoints, DTOs, or behavior that isn't present.
No unrequested scope expansion. Don't propose new features, refactors, or architecture changes unless asked; flag issues but let the human decide.
Ask before major decisions. Do not resolve open design conflicts (e.g. SOS-vs-privacy-mode) unilaterally — surface the conflict and options, let the human choose.
Concise output. Prefer terse, direct, readable deliverables over exhaustive ones. English for all formal deliverables (specs, tickets, diagrams).
State assumptions explicitly. If context is missing (e.g. current repo state, latest doc version), say so rather than guessing silently.
No hallucinated business/legal claims. Financial figures, competition status, or business model details must only be used if explicitly confirmed in this context or supplied by the user in-session.

- If the current checkout is `main` or `master`, do not edit files. Ask the user
  to create or select a `codex/*` branch or Codex worktree.
- Creating a branch does not authorize committing, pushing, opening a PR, or merging.