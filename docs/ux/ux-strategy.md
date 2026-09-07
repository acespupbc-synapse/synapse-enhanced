# UX Strategy

UX/UI principles and planning for ACES Synapse Enhanced. **No UI is implemented in this phase.**

## Design Goals

The new UI should substantially improve on the legacy system while preserving required business behavior.

| Priority | Goal |
|----------|------|
| High | Student registration wizard — primary user-facing surface |
| High | Photo capture and preview experience |
| High | Live student ID preview |
| High | Clear personal vs contact person address separation |
| Medium | Admin panel information density and efficiency |
| Medium | Search, filter, sort usability |
| Medium | Accessibility and responsive design |
| Medium | Validation feedback and error states |

## Principles

- **Clean visual hierarchy** — reduce cognitive load
- **Modern design** — contemporary patterns; not legacy reproduction
- **Accessibility** — WCAG-oriented practices (specific level TBD)
- **Responsive design** — mobile-first for student registration
- **Progress visibility** — multi-step wizard shows clear progress
- **Prevent accidental data loss** — warn before navigation away from dirty forms
- **Clear validation feedback** — inline client hints; authoritative server messages
- **Consistent component design** — shared design system (TBD)
- **Good camera experience** — device camera integration for photo capture
- **Clear ID preview** — student sees approximate final ID during registration

## Student Registration Wizard

### Verified Requirements

- Multi-step wizard
- Client-side validation for UX
- Photo capture (camera) and upload
- Photo preview before submission
- Live student ID preview

### TBD (Requires Legacy Analysis + Human Review)

- Exact wizard steps and order
- Field grouping per step
- Copy, labels, help text
- Student ID preview layout and data shown
- Confirmation/success screen
- Behavior when registration is closed
- Footer content and credentials (REQUIRES VERIFICATION from legacy)

### Proposed Analysis-Driven Step Structure (Placeholder)

Do not treat as final:

1. Personal information — TBD fields
2. Personal address — separate entity (VERIFIED)
3. Contact person — TBD fields
4. Contact person address — separate entity (VERIFIED)
5. Photo capture/upload — VERIFIED
6. Review and submit — VERIFIED

Finalize after legacy workflow analysis and human review.

## Address UX Requirement

Personal address and contact person address must be **visually and structurally distinct**:

- Separate form sections
- Clear headings (e.g., "Your Address" vs "Contact Person's Address")
- No collapsed generic address component without explicit labeling

Exact fields: TBD after data analysis.

## Administrative Panel

### Verified Capabilities to Support

- View all registrations with search/filter/sort
- View and edit individual records
- Photo and signature management
- Course, section, academic year management
- Group by academic year
- Open/close registration
- Soft-delete, recycle bin, restore

### UX Considerations

- Efficient dense tables with accessible sorting/filtering
- Clear academic year context switcher
- Obvious registration open/closed status
- Destructive actions (delete) with confirmation
- Restore from recycle bin clearly surfaced
- Bulk operations: TBD

Admin authentication UI: TBD.

## Media UX

### Student Photo (Registration)

- Camera capture option on supported devices
- File upload fallback
- Crop/resize guidance for 1500×1500 JPG (TBD — client-side assist only)
- Preview before submit
- Clear error for wrong format/size/dimensions

### Student Signature (Admin)

- Admin upload only
- Preview after upload
- White background requirement communicated in UI
- 2000×1200 dimension guidance

## Exports UX

Admin-triggered export to CSV, XLSX, PDF:

- Clear format selection
- Scope selection (academic year, filters) — TBD
- Progress/feedback for long exports — TBD
- Download handling

## Legacy UI Reference

Document legacy UI behavior in `docs/legacy/legacy-ui-reference.md` during analysis.

Use for:

- Content that must carry forward (footer, ID layout)
- Workflow completeness checks

Do **not** use for:

- Visual design replication
- Information architecture binding

## Accessibility

- Keyboard navigation for wizard and admin tables
- Screen reader labels for form fields and errors
- Sufficient color contrast
- Focus management across wizard steps
- Specific WCAG target level: TBD

## Design System / Stack

| Item | Status |
|------|--------|
| UI framework | TBD |
| Component library | TBD |
| Design tokens / theme | TBD |
| Icon set | TBD |

## UX Deliverables (Future Phases)

| Deliverable | Phase | Status |
|-------------|-------|--------|
| User flow diagrams | Post-analysis | TBD |
| Wireframes — registration wizard | Post-analysis | TBD |
| Wireframes — admin panel | Post-analysis | TBD |
| Student ID preview spec | Post-analysis | TBD |
| Component inventory | Pre-implementation | TBD |

## Evaluation

UX acceptance will consider:

- Successful wizard completion on mobile and desktop
- Photo capture success rate (qualitative/testing)
- Address section clarity (user testing TBD)
- Admin task efficiency for common operations

See [Testing Strategy](../testing/testing-strategy.md) for E2E wizard test plan.
