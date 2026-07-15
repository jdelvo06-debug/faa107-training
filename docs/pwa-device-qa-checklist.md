# PWA Device and VoiceOver QA Checklist

> **Status: pending human, physical-device execution.** Browser emulation and automated tests do not prove iPhone, Add to Home Screen, or VoiceOver behavior. Do not declare Phase 5 complete until the completed evidence is reviewed.

Use one copy of this checklist for each device and launch mode.

## Test record

- Tester:
- Date/time:
- Build/commit:
- Environment and URL:
- Device/model:
- iOS version:
- Browser/version:
- Mode: Safari / Add to Home Screen (standalone)
- Network used:
- Overall result: Pending / Pass / Pass with findings / Blocked
- Evidence location:

For every failed or blocked check, record severity and evidence. Use **Critical** for a security/data-loss issue, **High** for a blocked primary flow, **Medium** for a significant issue with a workaround, and **Low** for a minor issue.

## Safari, installation, and standalone behavior

| Check | Result | Evidence/notes | Severity if blocked |
| --- | --- | --- | --- |
| Open the app in Safari and complete an online course navigation flow without console-visible or user-visible errors. | Pending | | |
| Add the app to the Home Screen; confirm the installed name and icon are correct and recognizable. | Pending | | |
| Launch from the Home Screen; confirm standalone presentation and a usable initial route. | Pending | | |
| In portrait and landscape, confirm headers, controls, dialogs, and bottom content clear the notch, Dynamic Island, and safe areas. | Pending | | |
| Rotate during a module, quiz, and form flow; confirm content remains usable and no state is lost. | Pending | | |
| Open and dismiss the keyboard on login and other forms; confirm focused fields, errors, submit controls, and dialogs remain visible. | Pending | | |
| Inspect course charts at normal size and with browser zoom; confirm labels, legends, and values remain legible without horizontal page overflow. | Pending | | |

## Offline, reconnect, authentication, and updates

Before going offline, successfully visit `/`, a module, its quiz, and its flashcards while online.

| Check | Result | Evidence/notes | Severity if blocked |
| --- | --- | --- | --- |
| Go offline and reopen previously visited course content; confirm cached content or the deliberate offline fallback appears and clearly says the learner is offline. | Pending | | |
| From the offline fallback, use the offered route back to cached course content when it is available. | Pending | | |
| Confirm offline messaging does not claim that login, account sync, or external resources work offline. | Pending | | |
| Reconnect; confirm navigation recovers, fresh content can load, and browser-local anonymous progress remains intact. | Pending | | |
| Start sign-in from Safari and standalone mode while online; confirm the provider/browser handoff and return path are understandable and do not strand the learner. | Pending | | |
| Attempt login while offline; confirm failure is safe and honest, with no implication that offline authentication is supported. | Pending | | |
| With an update waiting, continue an active study/quiz session; confirm there is no forced reload or interruption. | Pending | | |
| Close and relaunch when safe; confirm the update activates, the app remains usable, and stale cache retirement does not remove current cached content or browser-local progress. | Pending | | |

Offline support covers previously downloaded same-origin shell/course assets only. It does **not** promise offline authentication, cross-device sync, background sync, or offline access to Supabase, OAuth, FAA/eCFR, or other external resources.

## VoiceOver

Run these checks with VoiceOver enabled in both Safari and standalone mode where applicable.

| Check | Result | Evidence/notes | Severity if blocked |
| --- | --- | --- | --- |
| Traverse primary navigation; confirm landmarks, headings, links, current location, menu state, and focus order are understandable. | Pending | | |
| Move through module slides; confirm slide position, headings, instructional content, media alternatives, and previous/next controls are announced in a useful order. | Pending | | |
| Answer a quiz question; confirm the selected state and correct/incorrect feedback are announced and are not conveyed by color alone. | Pending | | |
| Complete or restore an exam and review its results; confirm question status, selected/correct answers, explanations, and review navigation are understandable. | Pending | | |
| Use login; confirm fields, instructions, validation errors, password controls, provider buttons, and submit state have useful names and announcements. | Pending | | |
| Observe signed-in sync status; confirm state changes are announced without trapping focus or repeatedly interrupting study. | Pending | | |
| Open account-progress reset; confirm the destructive consequence, cancel/confirm choices, validation, completion status, and returned focus are clear. | Pending | | |

## Findings and sign-off

| Finding | Severity | Reproduction/evidence | Owner/status |
| --- | --- | --- | --- |
| | | | |

- Blocking findings fixed or explicitly deferred with rationale:
- Human reviewer:
- Review date:
- Phase 5 device/VoiceOver evidence accepted: Yes / No / Pending
