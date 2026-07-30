# Phase 6 — fully personalizable "Custom" tab (drag-and-drop widget builder)

Status: planned, not implemented. Independent of Phases 1-5 (new schema, doesn't touch
`ItemReading`/`TripLog`), though it makes Phase 5 (`plan/phase-5-custom-readings`, PR #12) largely
redundant once shipped — see the PR description's "Relationship to Phase 5" section before
starting either.

Lets a user build their own fully custom, widget-style data-entry form (like arranging home-screen
widgets) for a custom item type's logging tab — any field type, any layout, drag-to-reorder,
per-field validation rules, and an optional publish-to-a-shared-store flow so others can import a
finished template into their own inventory. See the PR description for the full schema, UX, and
validation design.
