# Security Strategy

Security is a first-class architectural concern. This document defines requirements and analysis plans — **no security mechanisms are implemented yet.**

## Threat Context

The system handles:

- Student personal information
- Contact person information
- Student photos (biometric-adjacent media)
- Student signatures (admin-uploaded)
- Administrative operations on registration data

## Security Principles (Verified Requirements)

### Validation

| Principle | Requirement |
|-----------|-------------|
| Server-side validation is authoritative | VERIFIED |
| Client-side validation is UX-only | VERIFIED |
| Never trust client-submitted data | VERIFIED |

### Authentication and Authorization

| Principle | Requirement |
|-----------|-------------|
| Authentication and authorization are separate concerns | VERIFIED |
| Authorization enforced server-side | VERIFIED |
| Students cannot access admin functions | VERIFIED |
| Admin operations explicitly authorized | VERIFIED |
| Auth mechanism | TBD |

### Data and Media Protection

| Principle | Requirement |
|-----------|-------------|
| Photos and signatures are private application data | VERIFIED |
| Sensitive files not publicly exposed by default | VERIFIED |
| File uploads validated by content, type, size, dimensions | VERIFIED |
| Do not rely on file extension alone | VERIFIED |

Media specifications:

| Asset | Validation Targets |
|-------|-------------------|
| Student photo | JPG; 1500×1500 px; max 5 MB |
| Student signature | JPG; 2000×1200 px; white background; max size TBD |

### Application Security

| Principle | Requirement |
|-----------|-------------|
| Parameterized / ORM-safe database queries | VERIFIED |
| CSRF protection where applicable | Consider |
| Session security where applicable | Consider |
| Rate limiting on public registration endpoints | Consider |
| Safe error messages (no internal leakage) | VERIFIED |
| Production config without debug exposure | VERIFIED |
| Auditability for important admin actions | Consider |
| Minimal, maintainable dependencies | VERIFIED |

### Secrets Management

| Principle | Requirement |
|-----------|-------------|
| No secrets in source code | VERIFIED |
| Environment variables or secure secret management | VERIFIED |
| `.env` files gitignored | VERIFIED |

## Security Architecture Areas (TBD)

To be designed after stack selection and threat modeling review:

| Area | Status | Notes |
|------|--------|-------|
| Authentication provider / session model | TBD | |
| Admin role/permission model | TBD | REQUIRES HUMAN CONFIRMATION |
| Media storage access control | TBD | Signed URLs vs app-mediated streaming |
| API authorization middleware | TBD | |
| CSRF strategy | TBD | Depends on frontend/API pattern |
| Rate limiting implementation | TBD | |
| Audit log schema and retention | TBD | |
| Input sanitization / output encoding | TBD | |
| HTTPS / TLS termination | TBD | Deployment concern |
| Dependency vulnerability scanning | TBD | CI concern |

## File Upload Security Plan

When implemented, uploads must:

1. Reject disallowed MIME types after content inspection (magic bytes)
2. Enforce size limits server-side
3. Enforce dimension limits server-side (photo: 1500×1500; signature: 2000×1200)
4. Validate JPG format
5. Strip or reject unexpected metadata if policy requires (TBD)
6. Store outside web-accessible paths by default
7. Serve through authorized endpoints only
8. Generate non-guessable storage identifiers

Camera capture flows must use the same server-side validation as file uploads.

## Registration Endpoint Abuse Prevention

Public student registration is a high-risk surface:

- Rate limiting per IP/session (TBD thresholds)
- Bot/abuse detection (TBD — keep simple initially)
- Registration open/close gate enforced server-side (VERIFIED business requirement)

## Administrative Security

- All admin routes require authentication + authorization
- Soft-delete and restore are privileged operations
- Permanent deletion (if implemented) requires explicit controlled workflow
- Export of bulk data is privileged
- Signature upload is admin-only (VERIFIED)

## Security Analysis Tasks (Next Phases)

| Task | Phase | Status |
|------|-------|--------|
| Legacy auth mechanism review | Legacy analysis | TBD |
| Legacy file storage review | Legacy analysis | TBD |
| Threat model draft | Pre-implementation | TBD |
| Security review checklist for PRs | Pre-implementation | TBD |
| Penetration test scope | Post-implementation | TBD |

## Security Review Workflow

For each significant feature before acceptance:

1. Identify data sensitivity
2. Verify server-side validation coverage
3. Verify authorization checks
4. Review file upload handling (if applicable)
5. Review error handling for information leakage
6. Review dependency additions
7. Document decisions in PR or feature spec

AI-assisted reviews will use prompts in `ai/prompts/` (see strategy doc).

## Documentation Requirement

Security decisions must be documented. Significant decisions go in:

- This document (strategy level)
- Architecture decision log (`docs/architecture/architecture-principles.md`)
- Feature specs (implementation level)

## Non-Goals (This Phase)

- Implementing auth, CSRF, rate limiting, or encryption
- Selecting specific security libraries
- Defining exact audit log fields
