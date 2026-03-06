# Homepage UI Refactor - 2026-03-06

## Goal
Simplify the CRM homepage so the company table becomes the primary workspace instead of competing with large side panels and manual filter controls.

## Changes
- moved company creation from the inline left column into the reusable `CompanyEditorModal`
- removed the low-value stat badges from the header and replaced them with a simpler action bar
- made search auto-apply with a debounce instead of requiring an Apply button
- made status and priority filters auto-apply on change
- widened the list into a single full-width workspace surface
- surfaced Instagram and website links directly in each company row for faster outreach workflows
- condensed follow-up and pipeline context into compact summary chips and lightweight follow-up panels
- extended company search to match `instagramHandle` and `instagramUrl`

## Rationale
The main job of the homepage is to help move through companies quickly. The previous layout split attention between an inline creation form, several large summary blocks, and a table that did not expose the most important outreach links. The refactor makes the table dominant, reduces visual noise, and keeps add/edit flows available without taking permanent screen space.
