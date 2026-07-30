# Phase 5 — fully personalizable Custom domain (drag-and-drop widget builder + log tab)

Status: planned, not implemented. Independent of Phases 1-4 — extends the existing
`CustomDomain`/`CustomDomainField` system directly, doesn't depend on the `ItemReading` engine.
See PR description for the full implementation brief.

**Revised scope (superseded the original, narrower "numeric-only readings via ItemReading" plan):**
this phase now builds a full drag-and-drop, widget-style builder directly on top of the existing
`CustomDomain`/`CustomDomainField` models — 9 field types (not just numbers), a 1-or-2-column
layout with drag reorder, per-field validation config, and a publish → shared store →
import-into-your-own-inventory lifecycle. It extends and modifies the already-implemented
`CustomDomain` feature rather than introducing a parallel system.
