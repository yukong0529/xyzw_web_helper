# Tower `actId` Cycle Design

## Goal

Update all `towers_getinfo` calls to send a computed `actId` instead of `{}`.

## Confirmed Rules

- Time basis: use the local timezone of the runtime environment.
- Activity cycle: each cycle starts on Friday and ends before the next Friday.
- `actId` source date: use the Friday date at the start of the current cycle.
- `actId` format: `YYMMDD1`.
- Example: for local date `2026-06-26`, `actId` is `2606261`.
- Example: for local date `2026-07-02`, `actId` is still `2606261`.
- Example: for local date `2026-07-03`, `actId` becomes `2607031`.

## Implementation Design

- Add a shared pure function `getTowerActId(date = new Date())`.
- The function finds the Friday that belongs to the current Friday-to-Thursday cycle.
- The function formats that Friday as `YYMMDD1` and returns it as a number.
- Replace existing `towers_getinfo` payloads with `{ actId: getTowerActId() }`.

## Change Scope

- Update the single-query flow in `src/components/cards/SkinChallengeCard.vue`.
- Update the batch tower flow in `src/utils/batch/tasksTower.js`.
- Put the shared helper in a reusable utility file under `src/utils`.

## Error Handling

- The helper should not depend on network state or component state.
- The helper should always derive a valid `actId` from the provided `Date`.
- Existing `towers_getinfo` response handling stays unchanged.

## Testing

- Add a lightweight test script for the helper.
- Cover at least:
  - Friday start date
  - Thursday still using the same cycle
  - Next Friday switching to a new cycle
  - Sunday mapping back to the prior Friday

## Non-Goals

- No change to `towers_start` or `towers_fight`.
- No change to server response parsing.
- No timezone normalization to Beijing time; local runtime time is intentional.
