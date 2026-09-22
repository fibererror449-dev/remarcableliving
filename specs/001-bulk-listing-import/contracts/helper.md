# Helper contract — scripts/import-listings.mjs
Resumable Node client for rest.md. Node ≥22, no dependencies. Tests: tests/import-helper.test.mjs.
```
SITE_URL=https://… IMPORT_API_TOKEN=rli_… node scripts/import-listings.mjs listings.json \
  [--validate-only] [--state path]
```

## Environment
- `SITE_URL` — site origin (any path is ignored). https required; plain http only for localhost.
- `IMPORT_API_TOKEN` — admin-issued credential. Sent only as the Bearer header, never printed.
- `IMPORT_RETRY_BASE_MS` — first retry delay, default 500 (tests use 1).

## Input
`{namespace, listings:[…]}`, each listing a REST row (rest.md) with two local conveniences:
- a media item may give `file` instead of `id`: a path relative to the input file (or absolute).
  `caption` and `attribution` pass through. Giving both `file` and `id` is an error.
- `coverFile` instead of `coverId`: must name a file that is also in that listing's `media`.
Files: .jpg .jpeg .png .webp .gif .mp4 .webm .mov (MIME from the extension; the server checks the
bytes), 1 byte–50 MiB, regular files. Listing rules stay on the server; the helper checks only
files, request size and a reference repeated anywhere in the file (the server sees one batch).

## Import run
1. Check every row locally. Failing rows are reported invalid and never uploaded or submitted.
2. Stream each distinct file to POST /api/v1/media, one at a time, unless its content hash is in
   the state file. A server refusal (400/413/415, e.g. a HEIC renamed .jpg) marks only that row
   invalid. Items are rewritten to `{id, caption, attribution}`; `coverFile` becomes `coverId`.
3. Split rows in input order into requests of ≤50 rows and ≤1 MiB UTF-8 JSON.
4. POST each batch with `Idempotency-Key: import-listings:<sha256 of canonical {namespace,
   listings}>`, unless the key is in the state file. Same input → same key, so a retry or a re-run
   without state replays the original result instead of creating revisions.
5. Print one line per listing in input order, then a summary.
Retries: network errors, 429, 502, 503, 504 and 409 `busy`; 5 attempts, delays base×1, 2, 4, 8
(0.5–4 s by default); files are re-streamed. Other failures stop the run.
Changed input produces new keys; rows whose content did not change report `unchanged`.

## --validate-only
Runs step 1, then POST /api/v1/imports/validate per batch. Files are checked locally but not
uploaded: placeholder ids stand in, so a `coverFile` satisfies the cover requirement, but whether
attachments exist is not checked. Nothing is uploaded or saved; state is neither read nor written.

## Output
stdout, one listing per line; `N` is its position in `listings`:
```
uploaded photos/living.png as <media id>
listings[N] <reference>: created|updated|unchanged <SITE_URL>/admin/imports/<draft id>
listings[N] <reference>: invalid — <error>; <error>
listings[N] <reference>: valid (missing for publication: rent, status)      (--validate-only)
Summary: 2 listings — 1 created, 0 updated, 0 unchanged, 1 invalid
Summary: 2 listings — 1 valid, 1 invalid                                    (--validate-only)
```
stderr: retry notices and `import-listings: <reason>`. Listing lines print only when a run
completes; after a failure, re-run to see every result.

## Exit codes
- 0 — run completed. Invalid rows are reported but do not fail it, so valid rows still import;
  check the summary (or grep `: invalid`) to act on them.
- 1 — stopped partway (retries exhausted, credential rejected, unexpected response). Finished
  work is in the state file; fix the cause and re-run.
- 2 — nothing attempted: usage, missing or invalid environment, unreadable or malformed input,
  unusable state file.

## State file
Default `<input>.import-state.json`; `--state path` overrides. Rewritten after every upload and
batch via temporary file + rename, so an interruption never leaves it torn. Holds no credential.
```
{"version":1,"site":"https://…","media":{"<sha256 of bytes>":"<media id>"},
 "imports":{"<idempotency key>":{"id":"…","complete":true,"results":[…]}}}
```
- Tied to one site origin; another site → exit 2 (use `--state` per site).
- Deleting it is safe with the same credential: re-uploads return the same media ids and batches
  replay by key. Uploads and keys are per credential, so keep it when rotating credentials;
  otherwise re-uploaded files get new ids and their listings become new revisions.
- Recorded results are re-printed as they were, not refreshed; read drafts for current state.
