# Phase 4 — PrintJob log for PRINTER_3D

Status: planned, not implemented. Independent of the other phases (new, standalone model). See PR
description for the full implementation brief.

A print job doesn't fit the `ItemReading` ("log a number") or `TripLog` ("trip/session") patterns
cleanly — this phase adds one small, genuinely new model plus its own domain and UI, and finally
wires up the `Printer3dProfile.totalPrints`/`totalPrintHours`/`filamentConsumedG` counters that
have existed on the schema since the first migration but have never been incremented anywhere.
