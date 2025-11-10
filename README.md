# Turista 🌍

Tourism platform that rewards visits to tourist attractions with unique NFTs and TUR tokens, usable in a marketplace of products and services from local merchants.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Smart Contracts:** Rust + Soroban SDK 22.0.0
- **Blockchain:** Stellar Testnet
- **Wallet:** Freighter
- **Maps:** Google Maps API
- **Styling:** TailwindCSS

## Features

- ✅ Authentication with Freighter Wallet
- 🗺️ Interactive map with tourist attractions
- 📍 Check-in system with geolocation validation
- 🎨 Unique NFTs for each visited place (soulbound)
- 💰 TUR tokens as rewards for check-ins
- 🛒 Marketplace with discounts using TUR
- 👤 User profile with statistics

## Installation

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Stellar CLI 23.1.4+
- Freighter Wallet installed

### Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/turista.git
cd turista
```

2. Install frontend dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and contract addresses
```

4. Compile smart contracts:
```bash
npm run build:contracts
```

5. Start development server:
```bash
npm run dev
```

## Smart Contracts

### CheckinNFT Contract
Handles the minting of unique NFTs for each check-in at tourist attractions.

### TUR Token Contract
Standard SAC fungible token used as reward and for discounts.

### Marketplace Contract
Manages product purchases with XLM or XLM + TUR with discount.

## Development

```bash
# Frontend development
npm run dev

# Build frontend
npm run build

# Compile contracts
npm run build:contracts

# Contract tests
npm run test:contracts
```

## License

MIT
