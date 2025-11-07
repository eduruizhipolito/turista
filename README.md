# Turista 🌍

Plataforma de turismo que recompensa visitas a lugares turísticos con NFTs únicos y tokens TUR, utilizables en un marketplace de productos y servicios locales.

## Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite
- **Smart Contracts:** Rust + Soroban SDK 22.0.0
- **Blockchain:** Stellar Testnet
- **Wallet:** Freighter
- **Maps:** Google Maps API
- **Styling:** TailwindCSS

## Características

- ✅ Autenticación con Freighter Wallet
- 🗺️ Mapa interactivo con lugares turísticos
- 📍 Sistema de check-in con validación de geolocalización
- 🎨 NFTs únicos por cada lugar visitado (soulbound)
- 💰 Tokens TUR como recompensa por check-ins
- 🛒 Marketplace con descuentos usando TUR
- 👤 Perfil de usuario con estadísticas

## Instalación

### Prerequisitos

- Node.js 18+
- Rust 1.70+
- Stellar CLI 23.1.4+
- Freighter Wallet instalado

### Setup

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/turista.git
cd turista
```

2. Instalar dependencias del frontend:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus API keys y contract addresses
```

4. Compilar smart contracts:
```bash
npm run build:contracts
```

5. Iniciar servidor de desarrollo:
```bash
npm run dev
```

## Smart Contracts

### CheckinNFT Contract
Maneja el minteo de NFTs únicos por cada check-in en lugares turísticos.

### TUR Token Contract
Token fungible estándar SAC usado como recompensa y para descuentos.

### Marketplace Contract
Gestiona compras de productos con XLM o XLM + TUR con descuento.

## Desarrollo

```bash
# Desarrollo frontend
npm run dev

# Build frontend
npm run build

# Compilar contratos
npm run build:contracts

# Tests de contratos
npm run test:contracts
```

## Licencia

MIT
