# NEXORA - Premium Digital Marketplace

Nexora is a production-grade digital marketplace platform with a Flutter-inspired dark-mode user interface. Built with React, TypeScript, Tailwind CSS, and Firebase Firestore/Auth.

## Features Overview

1. **Dual Currency Wallet System**:
   - **Coins**: Standard marketplace currency for game mods, skins, scripts, and arcade tickets.
   - **Diamonds**: Elite rarity crystals for VIP bots, private exploit menus, and developer toolkits.
   - Real-time balance synchronization via Firestore listeners.

2. **Mobile Money Top-Up System**:
   - Configurable packs with exact TSh pricing and Coin/Diamond rewards.
   - Network integrations: **Vodacom M-Pesa**, **Airtel Money**, **HaloPesa**, and **Mixx by Yas**.
   - Interactive payment instruction modal and USSD prompt guides.
   - Proof submission and verification queue.
   - Idempotent, atomic top-up approval preventing double credits.

3. **Atomic Currency Exchange**:
   - Bi-directional currency conversion (`Coins <-> Diamonds`).
   - Live fee calculation with platform fee deduction preview.
   - Atomic Firestore transaction ensuring consistency across balances and the ledger.

4. **Product Catalog with Multi-Image Carousels**:
   - Configurable categories: PC Games, Mobile Games, Bots, Special APKs, Tools, Other digital products.
   - Automatic multi-image carousel slideshows with touch swipe, hover pause, dot indicators, and reduced-motion support.
   - Instant search, category filters, and currency filtering.

5. **Purchases & Protected Digital Downloads**:
   - Atomic check & debit checkout flow.
   - My Digital Library vault with order history and license keys.
   - Server-verified download link delivery preventing URL exposure in client bundles.

6. **Referrals & Promo Codes**:
   - Unique user referral codes and link generation (`?ref=CODE`).
   - Atomic bonus allocation for both parties.
   - Promotional voucher codes (`WELCOME1000`, `NEXORA2026`) with usage limits and replay protection.

7. **Nexus Arcade (Non-Wagering Entertainment)**:
   - **Cyber Runner 2099**: 2D HTML5 canvas obstacle runner.
   - **Reflex Matrix Tap**: Neural reaction latency game.
   - Global leaderboard and cosmetic badges.

8. **Admin Control Chamber**:
   - Revenue and top-up analytics.
   - Top-up review queue with one-click approve/credit and reject workflows.
   - Product catalog editor with multi-image URL management and secret delivery setup.
   - Pack pricing and exchange rate configurations.
   - Append-only audit trail.

## Security & Rules

- **ABAC (Attribute-Based Access Control)**: Enforced via `firestore.rules` and deployed to the Firebase cloud project.
- **Append-Only Financial Ledger**: Every balance mutation is accompanied by a unique `transactions` entry.
- **Role Escalation Protection**: Role checks evaluated against `admins` collection and configured administrator email (`edinareginald81@gmail.com`).

## Running Tests

```bash
npx tsx tests/marketplace.test.ts
```
