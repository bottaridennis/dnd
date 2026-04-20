# Security Specification: D&D 2024 Character Builder

## 1. Data Invariants
- A **User** profile must belong to the authenticated user.
  - Role escalation must be blocked.
- A **Character** must belong to an authenticated user (`userId`).
  - Users can only read, update, or delete characters they own.
  - Characters must have a name, level (1-20), and valid IDs for class, species, and background.
  - The `userId` of a character is immutable after creation.
  - Identifiers must be safe (no script injection in IDs).

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

| ID | Case | Payload Snippet | Expected Result |
|---|---|---|---|
| 1 | Identity Spoofing | `create character { userId: "someone_else_id" }` | `PERMISSION_DENIED` |
| 2 | Privilege Escalation | `update user { role: "admin" }` | `PERMISSION_DENIED` |
| 3 | Orphaned Record | `create character` (without creating user doc) | `PERMISSION_DENIED` |
| 4 | Value Poisoning | `update character { level: 99 }` | `PERMISSION_DENIED` |
| 5 | Resource Exhaustion | `create character { name: "A..." (1MB String) }` | `PERMISSION_DENIED` |
| 6 | ID Injection | `get character/../../secret_collection/doc` | `PERMISSION_DENIED` |
| 7 | Invalid Type | `update character { abilityScores: "high" }` (String vs Map) | `PERMISSION_DENIED` |
| 8 | Partial Update Bypass | `update character { userId: "me" }` (Trying to change owner) | `PERMISSION_DENIED` |
| 9 | Unauthenticated Write | `create character` (No auth token) | `PERMISSION_DENIED` |
| 10 | Unverified Email | `create character` (auth.email_verified == false) | `PERMISSION_DENIED` |
| 11 | Anonymous Access | `read character/123` (isAnonymous == true) | `PERMISSION_DENIED` |
| 12 | System Field Protection | `update character { createdAt: "2020-01-01" }` | `PERMISSION_DENIED` |

## 3. Security Assertions
- `isValidId(id)`: Enforces regex and size on all IDs.
- `isValidCharacter(data)`: Enforces schema, types, and ranges.
- `isOwner(userId)`: Mandates UID match and verified email.
- `affectedKeys().hasOnly()`: Limits update scope for sensitive state changes.
