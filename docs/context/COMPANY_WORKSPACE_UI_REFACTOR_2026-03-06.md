# Company Workspace UI Refactor - 2026-03-06

## Goal
Replace the current form-heavy company workspace with a cleaner read-first layout.

## Scope
- Show company basics and social links in a compact summary view
- Move company editing into a reusable modal component
- Show contacts as cards with edit actions
- Move contact add/edit into a reusable modal component
- Simplify activity creation to a note composer
- Keep the timeline visible and easier to scan

## Approach
1. Extract shared modal and display components under `src/components/company-workspace/`
2. Keep API flows unchanged where possible: company PATCH, person POST/PATCH/DELETE, activity POST
3. Preserve status change handling on company PATCH
4. Reduce noise on the main page; editing happens only inside modals

## Validation
- Run lint in `internal-crm`
- Manually verify load, edit company, add/edit/remove person, add note
