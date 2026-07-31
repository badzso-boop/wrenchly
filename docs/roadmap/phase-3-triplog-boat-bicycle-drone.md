# Phase 3 — extend the TripLog system to BOAT, BICYCLE, DRONE

Status: planned, not implemented. Independent of Phases 1/2 (touches the `trip` domain, not
`reading`) — can be built in parallel. See PR description for the full implementation brief.

Loosens the existing vehicle trip-log system's item-type gate and adds a handful of nullable,
domain-specific columns so BOAT ("Voyage Log"), BICYCLE ("Ride Log"), and DRONE ("Flight Log") get
the same depth as VEHICLE's trip log, without a parallel schema.
