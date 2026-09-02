# Neta Mobile accessibility and responsiveness baseline

Last updated: 2026-07-29

This baseline is mandatory in every feature phase. Phase 20 is the final
whole-app regression audit, not the first accessibility pass.

## Implemented foundation

- `Screen` respects safe areas and gives form screens keyboard-aware scrolling.
- iOS supports interactive keyboard dismissal; Android uses native `resize`.
- `TextField` exposes its visible label as the accessibility label, associates
  inline errors, reports invalid state and announces errors.
- Invalid forms announce a summary and focus the first invalid field.
- Buttons and segmented/filter controls use at least 48 dp touch targets.
- Selected, disabled, busy, heading, alert, radio and progress states use native
  accessibility semantics.
- Client and project searches wait 350 ms and ignore stale responses.
- Light/dark semantic colors have automated foreground contrast tests.
- The shared screen announces a global offline banner without hiding content.
- Cached dashboard reads expose their saved time and stale state.
- A static release gate rejects disabled font scaling, legacy Touchable controls
  and Pressable controls without an accessibility role.

## Required per-screen acceptance

- Complete the screen with VoiceOver on iOS and TalkBack on Android.
- Traverse in a logical order without traps, duplicate labels or unlabeled actions.
- Test system font at default and maximum accessibility size; content must wrap,
  remain readable and keep every action reachable.
- Focus every input on a small phone. The field, its label/error and submit path
  must remain reachable above the keyboard in portrait and landscape.
- Verify external keyboard next/previous/submit order where the platform exposes it.
- Verify 48 dp targets, light/dark mode, increased contrast, reduced motion and
  screen rotation.
- Verify loading, empty, error, offline, disabled and selected states without
  relying on color alone.
- Use virtualized lists with cursor pagination before a list can grow beyond one
  bounded server page. Avoid synchronous work in render and unbounded images.

## Current verification status

Static TypeScript/lint checks, unit tests and the accessibility source gate cover
the code-level baseline. The VoiceOver/TalkBack, maximum font,
small-device keyboard and rotation matrix requires simulator or physical-device
interaction and remains a release gate. It must not be marked passed from code
inspection alone.
