# Where things live

See `PROJECT_STRUCTURE.md` for the feature → file map (backend controllers/services/entities
and frontend screens/stores). Read it before hunting for where a feature is implemented.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Project was downgraded from SDK 57 to SDK 54 on 2026-08-01 because the Expo Go app on
the App Store only supported up to SDK 54 at the time, blocking physical-device testing.
Re-upgrade to a newer SDK once Expo Go on the App Store catches up — check
https://docs.expo.dev/versions/latest/ vs. what Expo Go actually supports before bumping.
