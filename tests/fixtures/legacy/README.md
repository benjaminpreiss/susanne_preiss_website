# Frozen legacy parity evidence

`html/` is an inert copy of the eleven pre-cutover editorial source documents.
`assets.json` records SHA-256 values for all 122 original image/PDF/SVG/favicon files.
Tests compare current output to this fixed evidence; never refresh it from migrated
output to hide regressions. These files are not production content or executable
application source.

Captured during ticket 08 before retiring root `src/`. Complete source/configuration
is preserved in `.scratch/ticket08/legacy-source.tar.gz` with independently verified
per-file hashes and an archive checksum. Ticket 01's captured public build and rendered
screenshots remain the visual baseline; raw source HTML alone is not visual evidence.
