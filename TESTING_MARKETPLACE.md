# 🧪 Guía de Pruebas - Marketplace con Descuento

## ✅ Cambios Realizados

### Problema identificado:
El servicio de marketplace NO estaba llamando al contrato marketplace. Hacía:
- Pago directo de XLM al merchant (sin división 99-1%)
- Burn de TUR en transacción separada

### Solución implementada:
Ahora el servicio llama correctamente a `purchase_with_discount` del contrato marketplace que:
- ✅ Divide el pago: 99% merchant / 1% platform
- ✅ Quema los tokens TUR
- ✅ Todo en una sola transacción atómica

## 🔍 Validaciones Previas (CLI)

### 1. Verificar balance de TUR del buyer
```bash
stellar contract invoke \
  --id CDRNMKTU6S2G6MK2PLDEYRCEFPOUNRVTSHQGB22E7LYAZ7I5PXFTFABG \
  --source SAVDHGLZNYKURNA3UXCXPU3CWEENRCEWFXKKD6ZTIW4DZSNL3E76NBHA \
  --network testnet \
  -- balance \
  --id <BUYER_ADDRESS>
```

### 2. Verificar balance de XLM del buyer
```bash
stellar account balance <BUYER_ADDRESS> --network testnet
```

### 3. Probar compra con descuento (CLI)
```bash
stellar contract invoke \
  --id CAGH6ECDNYH5FURDCC467PWOH5Q5EUK5NAZ7REHTCOAQZ7ACN72PM3ZZ \
  --source <BUYER_SECRET_KEY> \
  --network testnet \
  -- purchase_with_discount \
  --buyer <BUYER_ADDRESS> \
  --merchant <MERCHANT_ADDRESS> \
  --total_amount_xlm 10000000 \
  --amount_tur 50000000000
```

**Nota:** Los montos están en unidades raw (7 decimales):
- `10000000` = 1 XLM
- `50000000000` = 5000 TUR

### 4. Verificar balances después de la compra

**Platform (debe tener 1% del XLM):**
```bash
stellar account balance <PLATFORM_ADDRESS> --network testnet
```

**Merchant (debe tener 99% del XLM):**
```bash
stellar account balance <MERCHANT_ADDRESS> --network testnet
```

**Buyer TUR (debe haber disminuido):**
```bash
stellar contract invoke \
  --id CDRNMKTU6S2G6MK2PLDEYRCEFPOUNRVTSHQGB22E7LYAZ7I5PXFTFABG \
  --source SAVDHGLZNYKURNA3UXCXPU3CWEENRCEWFXKKD6ZTIW4DZSNL3E76NBHA \
  --network testnet \
  -- balance \
  --id <BUYER_ADDRESS>
```

## 🌐 Pruebas en Frontend

### 1. Reiniciar el servidor
```bash
npm run dev
```

### 2. Conectar wallet y verificar balances
- Ir a Marketplace
- Conectar wallet
- Verificar que se muestren los balances de XLM y TUR

### 3. Realizar compra con descuento
- Seleccionar un producto
- Elegir "Pagar con descuento TUR"
- Ingresar cantidad de TUR a quemar
- Confirmar transacción en la wallet
- Verificar el toast de éxito con link al explorer

### 4. Verificar en Stellar Expert
- Click en "Ver detalles ↗️" del toast
- Verificar en el explorer que:
  - La transacción llamó a `purchase_with_discount`
  - Se emitió el evento con los montos correctos
  - Los balances se actualizaron

## 📊 Qué Verificar

### En el contrato (eventos):
```
PurchaseEvent {
  buyer: <buyer_address>,
  merchant: <merchant_address>,
  total_xlm: <monto_total>,
  merchant_xlm: <99%_del_total>,
  platform_fee: <1%_del_total>,
  amount_tur_burned: <tur_quemado>,
  timestamp: <timestamp>
}
```

### En los balances:
- **Platform**: Debe incrementar en 1% del monto XLM
- **Merchant**: Debe incrementar en 99% del monto XLM
- **Buyer XLM**: Debe disminuir en el monto total
- **Buyer TUR**: Debe disminuir en el monto quemado

## 🐛 Troubleshooting

### Error: "Simulation failed"
- Verificar que el buyer tenga suficiente XLM y TUR
- Verificar que las direcciones sean válidas
- Verificar que el contrato marketplace esté inicializado

### Error: "Insufficient funds"
- El buyer no tiene suficiente balance de XLM o TUR
- Mintear más tokens si es necesario

### No se ve la división 99-1%
- Verificar que estés usando la función correcta (`purchase_with_discount`)
- Revisar los logs de la consola del navegador
- Verificar en Stellar Expert que se llamó al contrato marketplace

## 📝 Notas Importantes

1. **Conversión de decimales**: El frontend multiplica por 1e7 antes de enviar al contrato
2. **Transacción atómica**: Todo sucede en una sola transacción, si algo falla, todo se revierte
3. **Eventos**: El contrato emite eventos que puedes ver en Stellar Expert
4. **Platform address**: Es la dirección configurada en la inicialización del marketplace
