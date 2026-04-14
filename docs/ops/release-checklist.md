# Release Readiness Checklist (C6)

## Automated gates
- [ ] Backend lint/test pass
- [ ] Frontend lint/test/build pass
- [ ] Golden eval workflow pass

## Security gates
- [ ] `STRICT_REAL_PROVIDERS=true` in production
- [ ] `SECRET_ENCRYPTION_KEY` configured
- [ ] Rate-limit settings reviewed for expected load

## Manual QA
- [ ] Login/logout/session-expiry checks
- [ ] Upload -> ASR -> intelligence flow
- [ ] Document processing 4-card output verification
- [ ] Admin RBAC checks

## Rollout controls
- [ ] `rollout_mode` set (`stable` or `canary`)
- [ ] `canary_percentage` validated (if canary)
- [ ] Rollback plan rehearsed in staging
