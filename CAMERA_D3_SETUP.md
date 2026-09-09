# CareNest D3 — View Live Camera Feed

## Implementation contract

- Backend: `GET /api/cameras/{cameraId}/live` for authenticated Family users only.
- Access requires an active Family link, accepted D1 consent, and inactive D7 Privacy Mode.
- The backend calls IMOU `deviceOnline` immediately before `getLiveStreamInfo` through the configured regional `/openapi/{method}` transport.
- Only an active HTTPS HLS (`.m3u8`) stream is returned. Responses use `Cache-Control: no-store`.
- Provider credentials, access tokens, verification codes, and IMOU live tokens stay on the backend. Stream URLs are never persisted or logged.
- IMOU documents administrator access tokens as valid for three days and requires renewal on `TK1002`. D3 performs at most one refresh-and-retry per provider operation.
- The mobile app uses Expo SDK 57 `expo-video` with `contentType: 'hls'` and caching disabled. This standard HLS path works in Expo Go; no custom development build or native IMOU SDK is required.
- Retry always calls the backend for a new stream. Leaving, backgrounding, Privacy Mode activation, and player failure clear the URL from memory.

The IMOU documentation does not publish a fixed lifetime for URLs returned by `getLiveStreamInfo`. CareNest therefore treats every URL as sensitive and short-lived, does not expose an invented expiry value, and obtains a new URL after expiry/failure.

## Local configuration

1. Set the IMOU base URL to the regional data center used by the developer account. For Asia/Vietnam deployments, verify that the account belongs to the East Asia data center before using `https://openapi-sg.easy4ip.com:443`.
2. Set AppId and AppSecret only in backend-local environment configuration.
3. Start PostgreSQL and the Spring Boot backend.
4. Start the Expo app with `npm start` and open the Family portal.

## Physical-camera smoke test — pending

Real-camera playback has not been verified because physical IMOU hardware is not available. Complete every item before calling D3 physically verified:

1. Configure the correct IMOU Asia/Vietnam regional URL, AppId, and AppSecret locally; provision and link the physical camera through D2; confirm the camera is online.
2. Open Live View as an actively linked Family member; confirm video appears inside CareNest with the correct label and is current rather than cached/stale.
3. Turn the camera off and confirm the offline state; turn Privacy Mode on and confirm playback stops; turn it off and confirm retry obtains a fresh stream.
4. Revoke/decline consent and confirm blocking; test an unauthorized Family account; allow a stream to expire and confirm retry obtains a new URL.
5. Background/reopen the app and confirm the prior stream is absent; restart the backend and confirm D2 binding remains while the stream regenerates; inspect logs for credentials or complete stream URLs.

## Official references

- IMOU development envelope and regional endpoints: <https://open.imoulife.com/book/http/develop.html>
- IMOU online-state operation: `deviceOnline` in the official HTTP device API.
- IMOU live retrieval: <https://open.imoulife.com/book/http/device/live/getLiveStreamInfo.html>
- IMOU access-token lifetime and refresh: <https://open.imoulife.com/book/http/accessToken.html>
- Expo SDK 57 video: <https://docs.expo.dev/versions/v57.0.0/sdk/video/>
