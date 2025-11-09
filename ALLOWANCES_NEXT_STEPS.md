# Próximos Pasos - Implementación de Allowances

## 1. Compilar Contratos
```bash
cd contracts
cargo build --target wasm32v1-none --release
stellar contract optimize --wasm target/wasm32v1-none/release/tur_token.wasm
stellar contract optimize --wasm target/wasm32v1-none/release/marketplace.wasm
```

## 2. Ejecutar Tests
```bash
cargo test
```

## 3. Re-deployar en Testnet
- TUR Token (nuevo)
- Marketplace (nuevo)
- Actualizar .env con los nuevos IDs

## 4. Actualizar Frontend
Agregar función de approve antes de la primera compra con descuento
