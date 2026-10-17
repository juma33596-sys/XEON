# Nexora Security Specification & Data Invariants

## 1. Core Invariants
1. **Wallet Balance Authority**: Wallets cannot be modified directly by client requests. Balances are strictly updated atomically through authenticated, server-side validated transactions with associated ledger entries.
2. **Catalog Integrity**: Only verified administrators can publish, update, or archive products. Public users can only read published products.
3. **Protected Downloads**: Download URLs and license keys stored in `productSecrets` can never be queried publicly. They are exclusively accessible to administrators or delivered to users who have a confirmed completed `order` for that exact product.
4. **Append-Only Ledger**: Financial transactions are immutable once written. Every balance change must have a corresponding transaction record referencing an order, top-up, exchange, or authorized reward.
5. **Role Escalation Protection**: Users cannot modify their `role`, `isAdmin`, or privilege flags on their own user profiles. Administrator status is verified via `admins` collection document or the configured owner email `edinareginald81@gmail.com`.
6. **Top-Up State Guard**: Top-ups must be initiated in `pending` status. Only admins can transition status to `approved`, `rejected`, or `cancelled`. Duplicate approvals are rejected.
7. **Exchange Boundary**: Currency exchange rates and fees are read from authoritative system documents (`exchangeRates/current`). Clients cannot supply custom exchange ratios or override conversion math.
8. **Redemption Limits**: Redeem codes cannot be claimed multiple times by the same user or beyond their `maxUses` limit.

## 2. The "Dirty Dozen" Threat Payloads
1. **Ghost Field Escalation**: User registers or updates profile injecting `role: "admin"` or `isAdmin: true`.
2. **Client Wallet Injection**: Malicious client issues `setDoc(doc(db, "wallets", uid), { coins: 999999999 })`.
3. **Price Tampering**: Checkout sends modified price `pricePaid: 0` for a premium 50,000 coin bot.
4. **Direct Top-Up Approval**: Regular user calls `updateDoc(doc(db, "topups", id), { status: "approved" })` to self-credit currency.
5. **Download URL Scraping**: Unauthenticated or unauthorized user performs `getDocs(collection(db, "productSecrets"))`.
6. **Double Spending Exchange**: Client submits multiple simultaneous exchange transactions to drain coin balance before deduction registers.
7. **Negative Currency Exchange**: User requests to exchange `-5000` coins to generate positive diamond credits.
8. **Orphaned Ledger Entry**: Client attempts direct write to `transactions` collection without atomic batch deduction.
9. **Junk ID Denial of Wallet**: Malicious payload targeting document paths with 2KB string keys to inflate storage and index overhead.
10. **Product Hijack**: Non-admin user issues `deleteDoc(doc(db, "products", "prod_123"))`.
11. **Redeem Replay Attack**: Malicious script loops 50 times attempting to claim single-use voucher code.
12. **Unverified Email Spoof**: Client signs in with an unverified email claiming admin domain to bypass checks.
