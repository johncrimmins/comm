### Epic 4 — App Lifecycle (Background/Foreground)

Outcome
- App transitions between background/foreground without breaking messaging flow.
- Presence and listeners behave correctly with minimal overhead.

Scope
- Pause non-critical work when backgrounded; resume listeners on foreground.
- Update lightweight presence (`users/{uid}.lastActiveAt, online`) if enabled.
- Ensure navigation-driven listener detach/attach remains robust across lifecycle.

Acceptance
- Background → foreground: active conversation resumes live updates within ~1s.
- No duplicate listeners; no memory leaks; consistent presence where applicable.

