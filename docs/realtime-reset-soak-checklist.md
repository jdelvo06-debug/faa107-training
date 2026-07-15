# Realtime Account-Reset Soak Checklist

> **OBSERVATION EVIDENCE ONLY — NOT THE CORRECTNESS GATE.** Realtime is an accelerator for an already-correct reset. Reset correctness continues to rely on the server-side generation/revision rules and refetch/reload recovery.

This soak is separate from PWA/device acceptance. Do not report a valid result unless the listening context begins with known, synced, visible pre-reset progress.

## Test record

- Tester:
- Date/time:
- Build/commit and environment:
- Observation window selected before the run:
- Account/test identity (non-sensitive label only):
- Listener device/browser/mode:
- Reset device/browser/mode:
- Evidence location:

Do not record access tokens, cookies, OAuth state, secrets, or personal account data in the evidence.

## Preconditions

- [ ] Use two independent contexts signed in to the same test account.
- [ ] In the listener, create or restore identifiable, non-zero course progress.
- [ ] Confirm that progress has synced before the soak; record the module/activity and visible pre-reset value below.
- [ ] Reload or refetch the listener and confirm the same pre-reset value returns from synced state.
- [ ] Keep the listener open and ready to record Realtime event, refetch, and UI timestamps.
- [ ] Confirm clocks and timestamp sources are suitable for comparing both contexts.

Known synced pre-reset progress:

- Module/activity:
- Visible value/status:
- Sync confirmation and evidence:

If this known pre-reset state is missing, stop and label the run **invalid/inconclusive**; do not count it as a pass or failure.

## Procedure

1. Begin recording the listener and note its known pre-reset UI state.
2. From the second signed-in context, initiate and confirm the account-wide progress reset.
3. Record when the reset was submitted and acknowledged.
4. In the listener, record whether and when a Realtime event arrives.
5. Record whether and when the event initiates a refetch, the refetch completes, and the UI reflects the reset.
6. If no automatic update occurs within the predefined observation window, record that result, then manually refetch or reload and record the recovered state.
7. Confirm the second context also reflects reset state after refetch/reload.

## Timing evidence

Use one clock where possible. Use `Not observed` rather than inventing a timestamp.

| Milestone | Timestamp | Elapsed from reset submit | Evidence/notes |
| --- | --- | --- | --- |
| Listener recording started with known synced progress | | | |
| Reset submitted in second context | | 0 ms | |
| Reset RPC/UI acknowledgement received | | | |
| Realtime event received by listener | | | |
| Listener refetch started | | | |
| Listener refetch completed | | | |
| Listener UI reflected reset | | | |
| Manual refetch/reload, if needed | | | |
| Second context confirmed reset state | | | |

## Observation result

- Realtime event observed: Yes / No / Indeterminate
- Automatic listener refetch observed: Yes / No / Indeterminate
- Listener UI updated within the observation window: Yes / No
- Listener recovered after manual refetch/reload: Yes / No / Not needed
- Second context showed reset state after refetch/reload: Yes / No
- Console/network errors:
- Observation classification: Observed as expected / Delayed / Event not observed / Invalid or inconclusive
- Evidence summary:
- Follow-up owner/action:

The correctness gate is the reset state returned by the server-authoritative flow and by refetch/reload recovery. A delivered, delayed, duplicated, or missing Realtime event is useful observation evidence and may justify investigation, but it must not replace or redefine that gate.
