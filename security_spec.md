# Security Specification for Nearby Exchange

## 1. Data Invariants

- **Users**: Only the owner can write to their profile. Profile must contain `uid` matching `auth.uid`.
- **Activities**: Must have `userId` matching `auth.uid`.
- **MarketItems**: Must have `userId` matching `auth.uid` on create. Owner can update all fields. Buyers/Others can only update specific fields (e.g., status, buyerId, comments).
- **Skills**: Must have `userId` matching `auth.uid` on create.
- **WantedItems**: Must have `userId` matching `auth.uid` on create.

## 2. The "Dirty Dozen" Payloads

1.  **Identity Spoofing (User)**: Authenticated user A tries to update User B's profile.
2.  **Shadow Field Injection**: Creating a MarketItem with an unvalidated field `isVerifiedAdmin: true`.
3.  **Cross-User Activity**: User A tries to create an activity for User B (`userId: "UserB"`).
4.  **Price Poisoning**: Updating MarketItem with a negative price or a $1MB string.
5.  **State Shortcut**: Setting MarketItem status from `AVAILABLE` directly to `SOLD` without a `buyerId`.
6.  **Admin Escalation**: User tries to set their own `role: "admin"` in user profile.
7.  **Unverified Deletion**: User B tries to delete User A's `marketItem`.
8.  **Malformed ID**: Creating a document with ID `/..%2f..%2fantigravity/`.
9.  **Relational Orphan**: Creating a `marketItem` with a non-existent `condoId`.
10. **Timestamp Faking**: Providing a manual `createdAt` in the future instead of `request.time`.
11. **PII Leak**: Unauthenticated user trying to list all user emails (if they were in the profile).
12. **Comment Bomb**: Injecting a massive array of comments into a `marketItem`.

## 3. Test Runner (Draft)

`firestore.rules.test.ts` will verify these are blocked.
(Implementation details omitted for brevity in spec, but will be enforced in rules).
