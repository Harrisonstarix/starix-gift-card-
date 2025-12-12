# Starix - Crypto Gift Card Platform

Send crypto gifts without the awkward "what's your wallet address" conversation. Pick a value, choose a card design, pay with any crypto, share the code. Recipient picks whatever token they want.

Live at: https://starix.uswc.xyz

## What This Does

You load up a gift card with crypto. Could be $5, could be $500. Pick from 50+ card designs - BMW cars, iPhones, occasion cards, whatever fits the vibe. Pay with BTC, ETH, SOL, MON, or 200+ other tokens.

You get a code like `STARIX-4E2Y-RPKV-D97C`. Send that to whoever. They sign up, enter the code, pick their preferred crypto, drop their wallet address, and boom - funds hit their wallet in about 3 minutes.

## The Stack

- **Next.js 16** - App router, server actions, TypeScript everywhere
- **Supabase** - Auth, database, the whole backend
- **SideShift.ai** - Handles crypto swaps across chains
- **Resend** - Email notifications
- **Tailwind CSS v4** - Styling
- **Vercel** - Hosting

## Supported Chains

Treasury sits on Monad but users can pay and redeem on:
- Bitcoin, Ethereum, Solana
- BSC, Polygon, Arbitrum, Base
- Avalanche, Optimism, Monad
- And like 200+ other tokens through SideShift

## How It Works

### Buying a Card
1. User picks card value and design
2. Chooses which crypto to pay with
3. We create a SideShift shift to convert their payment to treasury token
4. Payment confirms, card activates, user gets the code

### Redeeming
1. Recipient creates account (yeah they need one, not optional)
2. Enters the gift card code
3. Picks which crypto they want to receive
4. Drops their wallet address
5. We shift from treasury to their chosen token
6. Funds land in their wallet

### Admin Dashboard
- Real-time stats and charts
- View all cards, users, transactions, redemptions
- Bulk status update - paste 50 codes, change status, done
- Email notifications on everything - purchases, redemptions, failures

## Environment Variables

\`\`\`
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SideShift
SIDESHIFT_SECRET=
SIDESHIFT_AFFILIATE_ID=

# Treasury
TREASURY_PRIVATE_KEY=

# Email
RESEND_API_KEY=
ADMIN_EMAIL=
FROM_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=
\`\`\`

## Database Tables

- `users` - accounts with balances
- `gift_cards` - codes, values, designs, status
- `transactions` - deposits, purchases
- `redemptions` - who redeemed what and when
- `admin_settings` - fees, treasury config
- `admin_notifications` - everything that happens

## Card Statuses

- `pending` - created, waiting for payment
- `active` - paid and ready to redeem
- `redeemed` - someone claimed it
- `expired` - timed out
- `cancelled` - manually 

## Running Locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Hit `localhost:3000`. You'll need all the env vars set up and a Supabase project with the right tables.

## Known Things

- Cards need manual status update if payment confirms but activation fails
- Recovery route was removed - admin handles stuck cards manually now
- Email images need absolute URLs or they break
- SideShift quotes expire fast, don't sit on them

Built for the hackathon. Actually works. Try it.
