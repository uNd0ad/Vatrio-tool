# Vatrio Tool — Data Dictionary & Database Schema Documentation

This document describes the PostgreSQL database schema managed via Supabase migrations for Vatrio Tool.

---

## 1. `public.listings`
Primary table storing active and archived scraped property listings.

| Column Name | Type | Nullable | Description / Constraints |
|---|---|---|---|
| `id` | `uuid` | NO | Primary key (`gen_random_uuid()`) |
| `title` | `text` | NO | Title of listing |
| `price` | `numeric` | YES | Listing price (`price >= 0`) |
| `currency` | `text` | NO | Default `'EUR'`, allowed `'EUR'`, `'RON'`, `'USD'`, `'GBP'` |
| `location` | `text` | YES | Location string as published by the portal, normalized |
| `neighborhood` | `text` | YES | Canonical Timisoara neighborhood resolved by the crawler parser from `ListaCartiereTM.txt`; null when no confident match |
| `surface_sqm` | `numeric` | YES | Property surface area in square meters |
| `rooms` | `integer` | YES | Number of rooms parsed from title/card text, `rooms > 0 and rooms <= 20` (garsoniera counts as 1) |
| `parse_warnings` | `text[]` | NO | Parser warning slugs for data-quality triage (e.g. `neighborhood_unresolved`, `price_per_sqm`), default `{}` |
| `url` | `text` | NO | Direct portal URL |
| `external_id` | `text` | YES | Portal specific external ID |
| `source_portal` | `text` | YES | Source site identifier (`storia`, `imobiliare`, `olx`) |
| `crawl_run_id` | `uuid` | YES | Associated crawler execution run ID |
| `property_type` | `text` | NO | Canonical property type (`apartment`, `house`, `land`, `commercial`, `office`, `garage`, `other`) |
| `transaction_type` | `text` | NO | Canonical transaction (`sale` vs `rent`) |
| `seller_type` | `text` | NO | Canonical seller classification (`owner`, `agency`, `developer`) |
| `status` | `text` | NO | Status enum (`new`, `contacted`, `refused`, `closed`) |
| `latitude` | `double precision` | YES | Latitude coordinate (-90 to 90) |
| `longitude` | `double precision` | YES | Longitude coordinate (-180 to 180) |
| `days_on_market` | `integer` | NO | Calculated non-negative days active |
| `first_seen_at` | `timestamptz` | NO | Timestamp when first detected |
| `last_seen_at` | `timestamptz` | NO | Timestamp when last scraped |
| `deleted_at` | `timestamptz` | YES | Soft-deletion timestamp for inactive/removed listings |
| `created_at` | `timestamptz` | NO | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | Auto-updated timestamp via trigger |

---

## 2. `public.listing_price_history`
Tracks historic price changes over time for listings.

| Column Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | NO | Primary key |
| `listing_id` | `uuid` | NO | Foreign key referencing `public.listings(id)` ON DELETE CASCADE |
| `old_price` | `numeric` | YES | Previous price |
| `new_price` | `numeric` | NO | Updated price |
| `changed_at` | `timestamptz` | NO | Timestamp of price update |

---

## 3. `public.listing_photos`
Stores multiple photo URLs per property listing.

| Column Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | NO | Primary key |
| `listing_id` | `uuid` | NO | Foreign key referencing `public.listings(id)` ON DELETE CASCADE |
| `url` | `text` | NO | Image storage or CDN URL |
| `display_order` | `integer` | NO | Display sorting sequence |
| `is_primary` | `boolean` | NO | Flag indicating cover image |
| `created_at` | `timestamptz` | NO | Creation timestamp |

---

## 4. `public.listing_snapshots`
Immutable historical JSON snapshots recorded before updates.

| Column Name | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | NO | Primary key |
| `listing_id` | `uuid` | NO | Foreign key referencing `public.listings(id)` ON DELETE CASCADE |
| `snapshot_data` | `jsonb` | NO | Full JSON representation of previous listing state |
| `created_at` | `timestamptz` | NO | Snapshot timestamp |
