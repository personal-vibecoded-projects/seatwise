# Delivery status

The public repository and minimal README bootstrap are committed on `main` at `744da22b826973fae84a734229343cbd388584a1`.

Application work must arrive through real PRs; no merges are authorized. This task currently permits pushes only to its assigned branch and cannot create PRs under Manual access. PR 1 is being prepared there; publishing requires Full access on a subsequent turn. Do not combine all slices into one PR.

| Slice | Scope                                                  | Dependency | Status                                                   |
| ----- | ------------------------------------------------------ | ---------- | -------------------------------------------------------- |
| 1     | Workspace, services, migrations, seed, CI              | Bootstrap  | Implemented; local checks passed; PR publication pending |
| 2     | Login, sessions, tenant authorization                  | 1          | Pending                                                  |
| 3     | Resources and opening hours                            | 2          | Pending                                                  |
| 4     | Atomic bookings, exclusion constraints, idempotency    | 3          | Pending                                                  |
| 5     | Timezone-aware calendar and availability               | 4          | Pending                                                  |
| 6     | Modify/cancel, versions, policy snapshots              | 5          | Pending                                                  |
| 7     | Weekly recurrence and exceptions                       | 6          | Pending                                                  |
| 8     | Exact-window waitlists and promotion                   | 7          | Pending                                                  |
| 9     | Check-in, no-show release, resilient worker            | 8          | Pending                                                  |
| 10    | Occupancy reports and safe CSV                         | 9          | Pending                                                  |
| 11    | Administration and audit history                       | 10         | Pending                                                  |
| 12    | Complete journeys, accessibility, performance, handoff | 11         | Pending                                                  |

Dependent slices branch from their predecessors until merged. PR descriptions must label the dependency, report observed checks, and give a manual demo. Retarget only after a predecessor is merged by explicit authorization. Implementation completion and merge status are separate.
