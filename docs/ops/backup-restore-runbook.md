# Backup, Restore, and DR Runbook

## Scope
- Primary DB: SQLite/PostgreSQL (environment dependent)
- Artifacts: uploaded files, generated exports, audit logs

## Backup
1. Stop write-heavy jobs or enable maintenance mode.
2. Database backup:
   - SQLite: copy `backend/verbasense.db` atomically.
   - PostgreSQL: `pg_dump --format=custom --file backup.dump $DATABASE_URL`.
3. Export artifacts storage bucket/folder snapshot.
4. Store backups in immutable timestamped location.

## Restore
1. Validate backup checksum.
2. Restore DB to staging first.
3. Run smoke tests: auth login, upload, documents/process, admin/users.
4. Restore production with approved maintenance window.

## Disaster Recovery Targets
- RPO target: 15 minutes
- RTO target: 60 minutes

## DR Drill Checklist
- Simulate DB loss in staging
- Restore latest backup
- Validate API health and critical flows
- Record restore duration and gaps
