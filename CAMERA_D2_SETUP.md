# D2 — Link Camera: IMOU setup and hardware smoke test

## Implementation boundary

D2 links an IMOU device to an elderly profile after active D1 camera consent. The backend:

1. obtains an administrator `accessToken`;
2. calls `checkDeviceBindOrNot` and rejects devices owned by another IMOU account;
3. calls `bindDevice` only for an unbound device, then confirms ownership again;
4. calls `deviceOnline` and persists the returned online/offline state;
5. calls `listDeviceAbility` and exposes the supported capabilities.

The local camera row is written only after IMOU confirms ownership. A successful bind response alone
never marks a camera online. Automated tests use local HTTP fixtures and never call IMOU.

This work covers D2 only. It does not verify or add live playback, snapshots, motion processing,
two-way audio, or other later camera use cases.

## Backend configuration

Keep these values in a local environment file or secret manager. Never prefix them with
`EXPO_PUBLIC_`, place them in React Native code, or commit their real values.

```dotenv
IMOU_ENABLED=true
IMOU_API_BASE_URL=https://openapi-sg.easy4ip.com:443
IMOU_APP_ID=your-developer-app-id
IMOU_APP_SECRET=your-developer-app-secret
```

The URL above is IMOU's East Asia endpoint and is the expected choice for an Asia/Vietnam account.
Confirm the account's data center in the IMOU Open Platform console; use its regional endpoint if it
differs. The backend appends `/openapi/{method}`.

The optional device security/verification code is submitted for one link request only. CareNest does
not persist it. IMOU documents that `bindDevice.code` may be blank only when the device has neither an
Auth capability nor a printed six-digit security code.

## Stable D2 errors

| Code | HTTP | Meaning |
|---|---:|---|
| `CAMERA_CONSENT_REQUIRED` | 409 | D1 consent is not accepted |
| `CAMERA_ALREADY_LINKED` | 409 | The serial already exists locally, including a concurrent request |
| `IMOU_BOUND_TO_ANOTHER_ACCOUNT` | 409 | IMOU reports the device belongs to another account |
| `IMOU_INVALID_DEVICE_CODE` | 422 | The verification code or initialized device password is invalid |
| `IMOU_UNSUPPORTED_BINDING_FLOW` | 422 | This model/firmware requires IMOU client-SDK setup |
| `IMOU_INVALID_CREDENTIALS` | 502 | The configured AppId/AppSecret or access token is invalid |
| `IMOU_BINDING_NOT_CONFIRMED` | 502 | IMOU did not confirm ownership after the bind operation |
| `IMOU_PROVIDER_REJECTED` | 502 | IMOU rejected the operation for another provider reason |
| `IMOU_UNAVAILABLE` | 503 | IMOU is disabled, unreachable, rate-limited, or temporarily unavailable |

Do not log request bodies for these operations: they can contain the access token or device code.

## Newer-device SDK constraint

IMOU states that newer devices or upgraded firmware may require its mobile client SDK for network
configuration and initialization before HTTP `bindDevice` can succeed. CareNest reports that case as
`IMOU_UNSUPPORTED_BINDING_FLOW`; it does not pretend the device was linked.

As of 2026-09-09, the Android OpenSDK archive returned by IMOU's official download endpoint had MD5
`2da4663afc7f3c9421c91667473a888a`, while IMOU's resource page advertised
`bb235c5522ae7fded11ef55d7eec6926`. The unverified binary is not included in this repository. Native
SDK provisioning must remain pending until IMOU publishes a matching/verifiable artifact. Do not
work around this by embedding AppSecret or an administrator access token in the mobile application.

## Physical-camera smoke test — pending

Do not mark this checklist complete until real hardware is available.

- [ ] Configure the correct IMOU Asia/Vietnam data-center URL.
- [ ] Configure AppId and AppSecret locally on the backend.
- [ ] Factory-reset and provision the physical camera if required.
- [ ] Record the device serial number and security code without committing them.
- [ ] Check the device's binding status.
- [ ] Bind the device through CareNest.
- [ ] Confirm the device appears in both Family and Elderly camera views.
- [ ] Confirm CareNest's online/offline state matches the physical camera.
- [ ] Restart the backend and confirm the local binding persists.
- [ ] Confirm a second link attempt is idempotent at IMOU or rejected locally as already linked.
- [ ] Confirm a different elderly profile cannot claim the same device.

Record the camera model, firmware version, IMOU data center, result, and date outside source control.
Physical end-to-end verification is currently **pending**.
