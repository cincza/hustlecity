# Online Architecture

## Stack

### Client

- Expo React Native
- TanStack Query lub podobna warstwa danych
- React Navigation
- secure storage dla tokenow

### Server

- Node.js
- Fastify albo Express
- WebSocket / Socket.IO dla chatu i eventow
- background jobs dla tickow ekonomii

### Database

- PostgreSQL
- Redis do kolejek, cache i cooldownow

### Admin / Ops

- panel admina web
- logowanie zdarzen
- feature flags

## Core Backend Domains

### Identity

- accounts
- sessions
- device history
- banned flags

### Player

- profile
- stats
- currencies
- cooldowns
- archetype
- hospital / jail state

### Combat

- heists
- PvP
- fightclub
- bounty
- protection

### Economy

- market prices
- businesses
- factories
- products
- transactions
- clubs
- dealers
- banking

### Social

- gangs
- invites
- contacts
- messages
- leaderboards

## Suggested API Areas

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `POST /heists/:id/execute`
- `POST /bank/deposit`
- `POST /bank/withdraw`
- `GET /market`
- `POST /market/buy`
- `POST /market/sell`
- `GET /businesses`
- `POST /businesses/:id/buy`
- `GET /factories`
- `POST /factories/:id/buy`
- `POST /factories/:id/order-supplies`
- `POST /gangs`
- `POST /gangs/:id/join`
- `POST /fightclub/:targetId/challenge`

## Database Model Draft

### accounts

- id
- email
- username
- password_hash
- created_at
- status

### players

- id
- account_id
- display_name
- avatar_url
- rank
- level
- respect
- heat
- hp
- energy
- cash_wallet
- cash_bank
- attack
- defense
- charisma
- stamina
- archetype
- protection_level
- hospital_until
- jail_until
- created_at

### player_items

- id
- player_id
- item_type
- item_id
- quantity
- equipped

### player_vehicles

- id
- player_id
- vehicle_id
- garage_slot
- tuning_level

### businesses

- id
- slug
- name
- unlock_respect
- buy_price
- base_income
- upkeep_cost

### player_businesses

- id
- player_id
- business_id
- level
- security_level
- last_collected_at

### clubs

- id
- slug
- name
- unlock_respect
- buy_price
- base_income

### player_clubs

- id
- player_id
- club_id
- level
- product_focus
- security_level

### factories

- id
- slug
- name
- unlock_respect
- buy_price
- base_duration_seconds
- storage_limit

### factory_recipes

- id
- factory_id
- output_item_id
- duration_seconds

### supply_items

- id
- slug
- name
- category
- base_price

### factory_orders

- id
- player_factory_id
- supply_item_id
- quantity
- price_total
- eta_at
- status

### gangs

- id
- name
- tag
- owner_player_id
- level
- vault_balance
- territory_score

### gang_members

- id
- gang_id
- player_id
- role
- joined_at

### bounties

- id
- target_player_id
- issuer_player_id
- amount
- created_at
- claimed_at

### protections

- id
- player_id
- protector_type
- strength
- expires_at

### heist_definitions

- id
- slug
- name
- unlock_respect
- energy_cost
- min_reward
- max_reward
- base_success
- heat_gain

### heist_runs

- id
- player_id
- heist_id
- result
- reward
- damage
- created_at

### transactions

- id
- player_id
- type
- amount
- currency
- source
- created_at

## Tick Strategy

Nie wszystko musi liczyc sie co sekunde.
Lepszy model:

- akcje natychmiastowe liczone przy request
- dochody pasywne naliczane leniwie przy odczycie lub collect
- background jobs tylko dla rzeczy wspolnych i globalnych

To zmniejsza koszty backendu.

## Production Phases

### Phase 1

- auth
- profile
- heists
- bank
- market
- businesses

### Phase 2

- factories
- gangs
- fightclub
- vehicles

### Phase 3

- racing
- live chat
- gang wars
- seasons
- admin panel
