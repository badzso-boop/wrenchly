# Phase 5 — user-defined readings for CUSTOM domains

Status: planned, not implemented. Lowest priority of the initiative — depends on Phase 1
(`ItemReading` engine) being merged. See PR description for the full implementation brief.

Extends the existing `CustomDomain`/`CustomDomainField` user-defined-profile system so users can
also mark which of their custom NUMBER fields are loggable-over-time metrics, then reuses the
`ItemReading` engine from Phase 1 with user-authored field definitions instead of a hardcoded
`READING_METRICS` registry entry.
