# Orphan Service Decommission Log

Date: 2026-07-30
Host: `instance-hulya`

## FPV tools listener on port 3003

Finding:

- Port `3003` was publicly listening on the production host.
- The listener was a non-Docker `python3 transcript_api.py` process running from `/home/ubuntu/fpv-tools`.
- The current FPVLovers repository does not reference port `3003`; YouTube transcript handling uses the application code path instead.
- No systemd service was found for this listener.

Action:

- The orphan process was stopped with `SIGTERM`.
- No files were deleted.
- No FPVLovers application container, database, Coolify service, or environment variable was changed.

Verification:

- `ss` showed no remaining listener on port `3003`.
- The FPVLovers web container remained healthy.
- Production smoke passed 7/7 checks after the stop.

Policy:

- Do not restart this service publicly unless it is brought under source control, has an owner, has authentication/rate limiting, and is documented in the deployment runbook.
