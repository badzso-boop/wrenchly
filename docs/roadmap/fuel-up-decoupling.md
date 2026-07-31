# Decouple fuel-ups from individual trips (tank-to-tank consumption tracking)

Status: planned, not implemented. Affects VEHICLE and BOAT only (the two trip-log item types with
fuel tracking) — BICYCLE/DRONE are untouched.

Today a `TripFuelStop` belongs to exactly one `TripLog`, so a single fill-up can never cover
several already-logged trips (the real-world "drive around for a while on one tank, then fill up
once" case). This phase promotes fuel-ups to a standalone `FuelUp` model (1 trip → 0-or-1 fuel-up,
1 fuel-up → 0..N trips) so consumption gets computed tank-to-tank, matching how it's actually
measured. See the PR description for the full brief, the migration plan for existing data, and the
open questions still needing a decision before implementation starts.
