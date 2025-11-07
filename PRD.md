# Product Requirements Document (PRD)
# Turistas - Tourism NFT Platform on Stellar

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Tiempo de desarrollo:** 48 horas  
**Target:** Scaffold Stellar Hackathon

---

## INFORMACIÓN DEL PROYECTO

**Nombre:** Turista 
**Descripción:** Plataforma de turismo que recompensa visitas a lugares turísticos con NFTs únicos y tokens TUR, utilizables en un marketplace de productos y servicios locales.

**Stack Tecnológico:**
- Frontend: React + TypeScript + Vite (Scaffold Stellar)
- Smart Contracts: Rust + Soroban
- Blockchain: Stellar Testnet
- Wallet: Freighter
- Maps: Google Maps API
- Deploy: Railway/Vercel

---

## 1. REQUERIMIENTOS FUNCIONALES

### RF-001: Autenticación con Freighter Wallet
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como usuario, quiero conectar mi wallet Freighter para interactuar con la plataforma.

**Criterios de Aceptación:**
- CA-001.1: La aplicación muestra un botón "Conectar Wallet" en el header
- CA-001.2: Al hacer clic, se abre el popup de Freighter
- CA-001.3: Tras conectar, se muestra la dirección pública del usuario (formato: GXXX...XXXX)
- CA-001.4: El estado de conexión persiste durante la sesión
- CA-001.5: Si Freighter no está instalado, mostrar mensaje: "Instala Freighter para continuar"
- CA-001.6: Botón "Desconectar" debe cerrar la sesión

**Dependencias:**
- Freighter instalado en navegador
- @stellar/freighter-api o Stellar Wallet Kit

**Supuestos:**
- Usuario ya tiene Freighter instalado
- Wallet del usuario tiene fondos XLM (>2 XLM) para fees

---

### RF-002: Visualización de Mapa Interactivo
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como usuario, quiero ver un mapa con los lugares turísticos disponibles para check-in.

**Criterios de Aceptación:**
- CA-002.1: La página principal muestra un mapa de Google Maps centrado en Cusco
- CA-002.2: El mapa muestra 2 marcadores (pins):
  - Pin 1: Plaza de Armas de Cusco
  - Pin 2: Qoricancha (Templo del Sol)
- CA-002.3: Al hacer clic en un pin, muestra info:
  - Nombre del lugar
  - Descripción corta (1-2 líneas)
  - Botón "Hacer Check-in"
  - Estado: "Disponible" o "Ya visitado" (si ya hizo check-in)
- CA-002.4: Los pines usan iconos personalizados (color verde si disponible, gris si ya visitado)
- CA-002.5: El mapa permite zoom y pan

**Datos hardcodeados:**
```javascript
const PLACES = [
  {
    id: 1,
    name: "Plaza de Armas de Cusco",
    description: "Corazón histórico de la ciudad imperial",
    lat: -13.5165,
    lng: -71.9786,
    imageNFT: "/nft-plaza-armas.png",
    radius: 200 // metros
  },
  {
    id: 2,
    name: "Qoricancha - Templo del Sol",
    description: "Templo inca dedicado al dios Sol",
    lat: -13.5197,
    lng: -71.9756,
    imageNFT: "/nft-qoricancha.png",
    radius: 200
  }
];
```

**Dependencias:**
- Google Maps JavaScript API key
- React Google Maps library (@react-google-maps/api)

---

### RF-003: Simulación de Geolocalización (Modo Demo)
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como usuario demo, quiero simular estar en Cusco para probar los check-ins sin estar físicamente allí.

**Criterios de Aceptación:**
- CA-003.1: Toggle switch en el header: "Modo Demo" (ON/OFF)
- CA-003.2: Cuando está ON:
  - Ubicación simulada: Plaza de Armas de Cusco (-13.5165, -71.9786)
  - Mostrar badge "📍 Ubicación simulada: Plaza de Armas"
- CA-003.3: Cuando está OFF:
  - Intenta usar geolocalización real del navegador (navigator.geolocation)
  - Si no hay permisos, muestra mensaje de error
- CA-003.4: Por defecto, el modo demo está activado

**Configuración:**
```env
# .env
VITE_DEFAULT_DEMO_LAT=-13.5165
VITE_DEFAULT_DEMO_LNG=-71.9786
VITE_CHECKIN_RADIUS_METERS=200
```

---

### RF-004: Sistema de Check-in
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como turista, quiero hacer check-in en un lugar turístico para recibir un NFT y tokens TUR.

**Criterios de Aceptación:**
- CA-004.1: Al hacer clic en "Hacer Check-in" de un lugar:
  - Validar que usuario está a menos de 200m del lugar (usando ubicación simulada o real)
  - Si está lejos: Mostrar error "Debes estar a menos de 200m del lugar"
  - Si está cerca: Proceder con el check-in
- CA-004.2: Durante el check-in:
  - Mostrar loader: "Procesando check-in..."
  - Llamar al smart contract `checkin_nft.mint()`
  - Esperar confirmación de transacción
- CA-004.3: Tras check-in exitoso:
  - Mostrar modal de éxito con:
    - "✅ ¡Check-in exitoso!"
    - Imagen del NFT obtenido
    - "Has ganado 1000 TUR"
  - Actualizar balance de TUR
  - Marcar lugar como "Ya visitado" en el mapa
- CA-004.4: Validación: Un usuario NO puede hacer check-in 2 veces en el mismo lugar
  - Si intenta: "Ya hiciste check-in aquí el [fecha]"
- CA-004.5: El check-in debe ejecutarse en una sola transacción que:
  - Mintea el NFT
  - Transfiere 1000 TUR al usuario

**Fórmula de distancia (Haversine):**
```typescript
function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
```

**Dependencias:**
- Smart Contract: `checkin_nft`
- Smart Contract: `tur_token`

---

### RF-005: Minteo de NFT por Check-in
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como turista, al hacer check-in quiero recibir un NFT único del lugar visitado.

**Criterios de Aceptación:**
- CA-005.1: Cada NFT tiene metadata única:
  - `name`: "Turistas - [Nombre del Lugar]"
  - `description`: "[Descripción del lugar]"
  - `image`: URL de la imagen (hardcodeada en /public)
  - `attributes`:
    - `place_id`: ID del lugar
    - `place_name`: Nombre del lugar
    - `latitude`: Coordenada lat
    - `longitude`: Coordenada lng
    - `check_in_date`: Timestamp Unix
    - `check_in_address`: Dirección Stellar del turista
- CA-005.2: La imagen del NFT está precargada en `/public/nft-[place-slug].png`
- CA-005.3: Los NFTs son **soulbound** (no transferibles)
- CA-005.4: Token ID es secuencial (1, 2, 3...)
- CA-005.5: Cada turista puede tener máximo 1 NFT por lugar

**Estructura del NFT:**
```rust
// Smart Contract: checkin_nft
pub struct CheckinNFT {
    pub token_id: u64,
    pub place_id: u32,
    pub place_name: String,
    pub latitude: i64,    // Multiplicado por 1e6 para evitar decimales
    pub longitude: i64,   // Multiplicado por 1e6
    pub check_in_timestamp: u64,
    pub owner: Address,
    pub image_url: String,
}
```

**Dependencias:**
- Imágenes en `/public/nft-plaza-armas.png` y `/public/nft-qoricancha.png`

---

### RF-006: Distribución de Tokens TUR
**Prioridad:** CRÍTICA  
**Historia de Usuario:** Como turista, al hacer check-in quiero recibir 1000 tokens TUR automáticamente.

**Criterios de Aceptación:**
- CA-006.1: Tras cada check-in exitoso, el usuario recibe exactamente 1000 TUR
- CA-006.2: La transferencia de TUR debe ocurrir en la misma transacción del minteo de NFT
- CA-006.3: Los TUR provienen de una cuenta master controlada por el proyecto
- CA-006.4: El balance de TUR se actualiza inmediatamente en el UI

**Configuración del Token TUR:**
- Nombre: "Turistas Token"
- Símbolo: "TUR"
- Decimales: 7 (estándar Stellar)
- Supply inicial: 10,000,000 TUR
- Emisor: Cuenta master del proyecto

**Dependencias:**
- Smart Contract: `tur_token`
- Cuenta master pre-fondeada con TUR

---

### RF-007: Visualización de Colección de NFTs
**Prioridad:** ALTA  
**Historia de Usuario:** Como usuario, quiero ver todos los NFTs que he coleccionado al hacer check-ins.

**Criterios de Aceptación:**
- CA-007.1: Página "/collection" muestra grid de NFTs del usuario conectado
- CA-007.2: Cada NFT se muestra como tarjeta con:
  - Imagen del NFT
  - Nombre del lugar
  - Fecha de check-in (formato: "15 Nov 2025")
  - Coordenadas (formato: "-13.5165, -71.9786")
- CA-007.3: Si el usuario no tiene NFTs, mostrar:
  - Ilustración de estado vacío
  - Mensaje: "Aún no tienes check-ins. ¡Empieza a explorar!"
  - Botón "Ir al Mapa"
- CA-007.4: Al hacer clic en un NFT, mostrar modal con detalles completos
- CA-007.5: Ordenar NFTs por fecha de check-in (más reciente primero)

**Estructura de la vista:**
```
┌─────────────────────────────────────┐
│  Mi Colección (2 NFTs)              │
├─────────────┬───────────────────────┤
│ [Img NFT 1] │ [Img NFT 2]           │
│ Plaza       │ Qoricancha            │
│ 15 Nov 2025 │ 14 Nov 2025           │
└─────────────┴───────────────────────┘
```

**Dependencias:**
- Llamada a smart contract para obtener NFTs del usuario
- React state para almacenar colección

---

### RF-008: Marketplace de Productos y Servicios
**Prioridad:** ALTA  
**Historia de Usuario:** Como usuario, quiero ver productos/servicios locales que puedo comprar con XLM y/o TUR.

**Criterios de Aceptación:**
- CA-008.1: Página "/marketplace" muestra 3 productos hardcodeados
- CA-008.2: Cada producto muestra:
  - Imagen del producto/servicio
  - Nombre
  - Descripción (1-2 líneas)
  - Precio opción 1: "X XLM"
  - Precio opción 2: "Y XLM + Z TUR" (con badge "💰 Descuento")
  - Botón "Comprar"
- CA-008.3: Al hacer clic en "Comprar", modal con:
  - Resumen del producto
  - Selector de opción de pago:
    - Radio button 1: "Pagar con XLM únicamente"
    - Radio button 2: "Pagar con XLM + TUR (descuento)"
  - Tu balance actual: "X XLM | Y TUR"
  - Botón "Confirmar Compra"

**Productos Hardcodeados:**
```javascript
const MARKETPLACE_ITEMS = [
  {
    id: 1,
    name: "Tour Guiado Machu Picchu",
    description: "Tour de día completo con guía certificado",
    image: "/marketplace-tour.jpg",
    merchant_address: "GMERCHANT1...",
    price_xlm: 150,
    price_discount_xlm: 130,
    price_discount_tur: 100
  },
  {
    id: 2,
    name: "Artesanía de Alpaca",
    description: "Poncho tejido a mano con lana de alpaca",
    image: "/marketplace-poncho.jpg",
    merchant_address: "GMERCHANT2...",
    price_xlm: 200,
    price_discount_xlm: 180,
    price_discount_tur: 200
  },
  {
    id: 3,
    name: "Cena en Restaurante Local",
    description: "Menú degustación de comida cusqueña",
    image: "/marketplace-food.jpg",
    merchant_address: "GMERCHANT3...",
    price_xlm: 150,
    price_discount_xlm: 100,
    price_discount_tur: 150
  }
];
```

**Dependencias:**
- Imágenes de productos en `/public/marketplace-*.jpg`

---

### RF-009: Sistema de Compra con XLM + TUR
**Prioridad:** ALTA  
**Historia de Usuario:** Como usuario, quiero comprar productos usando XLM únicamente o XLM + TUR con descuento.

**Criterios de Aceptación:**
- CA-009.1: Al confirmar compra, validar:
  - Si eligió "Solo XLM": Balance XLM >= precio_xlm
  - Si eligió "XLM + TUR": Balance XLM >= precio_discount_xlm AND Balance TUR >= precio_discount_tur
- CA-009.2: Si no tiene fondos suficientes:
  - Mostrar error: "Saldo insuficiente. Necesitas X XLM y Y TUR"
  - No ejecutar transacción
- CA-009.3: Si tiene fondos, ejecutar transacción:
  - Opción 1 (Solo XLM): 
    - Transferir `precio_xlm` XLM a `merchant_address`
  - Opción 2 (XLM + TUR):
    - Transferir `precio_discount_xlm` XLM a `merchant_address`
    - Quemar (burn) `precio_discount_tur` TUR del usuario
- CA-009.4: Tras transacción exitosa:
  - Mostrar modal de éxito: "✅ Compra realizada"
  - Mostrar hash de transacción (link a Stellar Expert)
  - Actualizar balances XLM y TUR
- CA-009.5: Si falla la transacción:
  - Mostrar error específico (ej: "Transacción rechazada por el usuario")

**Flujo de Compra:**
```
1. Usuario selecciona producto
2. Elige método de pago (XLM o XLM+TUR)
3. Confirma compra
4. Frontend valida balances
5. Llama a smart contract `marketplace.purchase()`
6. Smart contract:
   - Valida balances on-chain
   - Transfiere XLM al comerciante
   - Si aplica: Quema TUR
7. Retorna éxito/error
8. Frontend muestra resultado
```

**Dependencias:**
- Smart Contract: `marketplace_purchase`
- Addresses de comerciantes creadas previamente en Stellar Lab

---

### RF-010: Balance y Perfil de Usuario
**Prioridad:** MEDIA  
**Historia de Usuario:** Como usuario, quiero ver mi balance de TUR y estadísticas de mi actividad.

**Criterios de Aceptación:**
- CA-010.1: Página "/profile" muestra:
  - Dirección Stellar (formato corto: GXXX...YYYY)
  - Balance XLM (consultado en tiempo real)
  - Balance TUR (consultado en tiempo real)
  - Estadísticas:
    - "Check-ins realizados: X"
    - "NFTs coleccionados: X"
    - "Productos comprados: X" (opcional, si sobra tiempo)
- CA-010.2: El header de la app siempre muestra:
  - Balance TUR en formato compacto (ej: "2,500 TUR")
- CA-010.3: Botón "Actualizar Balances" para refrescar datos

**Vista del Perfil:**
```
┌─────────────────────────────────┐
│ Mi Perfil                        │
├─────────────────────────────────┤
│ 📍 GXXX...YYYY                   │
│                                  │
│ 💰 Balances:                     │
│   • 45.50 XLM                    │
│   • 2,500 TUR                    │
│                                  │
│ 📊 Estadísticas:                 │
│   • Check-ins: 2                 │
│   • NFTs: 2                      │
│                                  │
│ [Actualizar] [Desconectar]      │
└─────────────────────────────────┘
```

---

### RF-011: Navegación Principal
**Prioridad:** ALTA  
**Historia de Usuario:** Como usuario, quiero navegar fácilmente entre las diferentes secciones de la app.

**Criterios de Aceptación:**
- CA-011.1: Header sticky con:
  - Logo "Turistas" (izquierda)
  - Navegación: Mapa | Colección | Marketplace | Perfil
  - Toggle "Modo Demo"
  - Balance TUR (ej: "2,500 TUR")
  - Botón "Conectar Wallet" o dirección si está conectado
- CA-011.2: Rutas de React Router:
  - `/` → Mapa (página principal)
  - `/collection` → Mi Colección
  - `/marketplace` → Marketplace
  - `/profile` → Perfil
- CA-011.3: Indicador visual de página activa en navegación
- CA-011.4: Responsive: En mobile, menú hamburguesa

---

## 2. REQUERIMIENTOS NO FUNCIONALES

### RNF-001: Performance
- Tiempo de carga inicial: < 3 segundos
- Tiempo de respuesta de transacciones: < 10 segundos (depende de Stellar)
- Mapa debe cargar en < 2 segundos

### RNF-002: Usabilidad
- UI debe ser intuitiva, con mínimo de clicks para funciones principales
- Mensajes de error claros y accionables
- Loading states en todas las operaciones async

### RNF-003: Compatibilidad
- Navegadores: Chrome 90+, Firefox 88+, Safari 14+
- Dispositivos: Desktop y móvil (responsive)
- Freighter wallet instalado

### RNF-004: Seguridad
- Nunca almacenar claves privadas
- Todas las transacciones firmadas por Freighter
- Validación de inputs en frontend y smart contract

### RNF-005: Escalabilidad (Post-MVP)
- Arquitectura debe permitir agregar más lugares fácilmente
- Sistema de roles para comerciantes (futuro)

---

## 3. SMART CONTRACTS (SOROBAN)

### SC-001: CheckinNFT Contract

**Funciones Públicas:**

```rust
// Mintear NFT tras check-in
pub fn mint(
    env: Env,
    to: Address,           // Usuario que hace check-in
    place_id: u32,         // ID del lugar
    place_name: String,    // Nombre del lugar
    latitude: i64,         // Lat * 1e6
    longitude: i64,        // Lng * 1e6
    image_url: String      // URL de la imagen
) -> u64;                  // Retorna token_id

// Obtener NFTs de un usuario
pub fn get_user_nfts(
    env: Env,
    owner: Address
) -> Vec<CheckinNFT>;

// Verificar si usuario ya hizo check-in en un lugar
pub fn has_checked_in(
    env: Env,
    user: Address,
    place_id: u32
) -> bool;

// Obtener metadata de un NFT
pub fn get_nft(
    env: Env,
    token_id: u64
) -> CheckinNFT;
```

**Storage:**
- Map: `token_id` → `CheckinNFT`
- Map: `(user_address, place_id)` → `token_id` (para prevenir duplicados)
- Counter: `next_token_id`

**Restricciones:**
- NFTs son soulbound (función `transfer()` debe fallar)
- Solo el contrato puede mintear

---

### SC-002: TUR Token Contract

**Funciones Públicas:**

```rust
// Transferir TUR (estándar SAC)
pub fn transfer(
    env: Env,
    from: Address,
    to: Address,
    amount: i128
) -> Result<(), Error>;

// Quemar TUR
pub fn burn(
    env: Env,
    from: Address,
    amount: i128
) -> Result<(), Error>;

// Consultar balance
pub fn balance(
    env: Env,
    id: Address
) -> i128;

// Información del token
pub fn name(env: Env) -> String;      // "Turistas Token"
pub fn symbol(env: Env) -> String;    // "TUR"
pub fn decimals(env: Env) -> u32;     // 7
```

**Configuración Inicial:**
- Mintear 10,000,000 TUR a cuenta master al deploy
- Solo el contrato puede llamar a `burn()`

---

### SC-003: Marketplace Purchase Contract

**Funciones Públicas:**

```rust
// Compra con XLM únicamente
pub fn purchase_with_xlm(
    env: Env,
    buyer: Address,
    merchant: Address,
    amount_xlm: i128
) -> Result<(), Error>;

// Compra con XLM + TUR (descuento)
pub fn purchase_with_discount(
    env: Env,
    buyer: Address,
    merchant: Address,
    amount_xlm: i128,
    amount_tur: i128
) -> Result<(), Error>;
```

**Lógica:**
1. Validar balances del comprador
2. Si `purchase_with_discount`:
   - Transferir `amount_xlm` XLM a `merchant`
   - Quemar `amount_tur` TUR del `buyer`
3. Si falla alguna operación, revertir toda la transacción

**Eventos Emitidos:**
```rust
pub struct PurchaseEvent {
    buyer: Address,
    merchant: Address,
    amount_xlm: i128,
    amount_tur_burned: i128,
    timestamp: u64
}
```

---

## 4. ARQUITECTURA TÉCNICA

### Diagrama de Componentes

```
┌──────────────────────────────────────────┐
│          FRONTEND (React + Vite)         │
│                                           │
│  ┌────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Map   │  │Collection│  │Marketplace│ │
│  │  View  │  │   View   │  │   View   │ │
│  └────┬───┘  └─────┬────┘  └─────┬────┘ │
│       │            │              │      │
│       └────────────┼──────────────┘      │
│                    │                     │
│          ┌─────────▼─────────┐          │
│          │ Stellar Wallet Kit │          │
│          │    (Freighter)     │          │
│          └─────────┬──────────┘          │
└────────────────────┼──────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   Stellar Testnet       │
        │   (Horizon API)         │
        └────────┬────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐
│CheckIn│  │   TUR   │  │ Market  │
│  NFT  │  │  Token  │  │ Purchase│
│Contract│  │Contract │  │ Contract│
└───────┘  └─────────┘  └─────────┘
```

### Flujo de Datos Principal

**Check-in Flow:**
```
1. Usuario → Click "Hacer Check-in"
2. Frontend → Valida geolocalización (< 200m)
3. Frontend → Llama CheckinNFT.mint()
4. Freighter → Solicita firma de usuario
5. Usuario → Firma transacción
6. Stellar → Procesa transacción
7. CheckinNFT Contract → Mintea NFT
8. CheckinNFT Contract → Transfiere 1000 TUR
9. Stellar → Retorna success
10. Frontend → Actualiza UI (NFT + balance TUR)
```

**Purchase Flow:**
```
1. Usuario → Selecciona producto + método pago
2. Frontend → Valida balances
3. Frontend → Llama Marketplace.purchase_with_discount()
4. Freighter → Solicita firma
5. Usuario → Firma transacción
6. Marketplace Contract → Valida balances on-chain
7. Marketplace Contract → Transfiere XLM a merchant
8. Marketplace Contract → Quema TUR del buyer
9. Stellar → Retorna success
10. Frontend → Muestra confirmación
```

---

## 5. CONFIGURACIÓN Y SETUP

### Variables de Entorno

```bash
# .env

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Stellar Network
VITE_STELLAR_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org

# Smart Contracts (addresses tras deploy)
VITE_CHECKIN_NFT_CONTRACT=CXXXXX...
VITE_TUR_TOKEN_CONTRACT=CXXXXX...
VITE_MARKETPLACE_CONTRACT=CXXXXX...

# Cuentas del Proyecto
VITE_MASTER_PUBLIC_KEY=GXXXXX...
VITE_MERCHANT_1_ADDRESS=GXXXXX...
VITE_MERCHANT_2_ADDRESS=GXXXXX...
VITE_MERCHANT_3_ADDRESS=GXXXXX...

# Demo Config
VITE_DEFAULT_DEMO_LAT=-13.5165
VITE_DEFAULT_DEMO_LNG=-71.9786
VITE_CHECKIN_RADIUS_METERS=200
```

### Cuentas Necesarias (Crear en Stellar Lab)

1. **Master Account:**
   - Propósito: Emitir TUR, fondear operaciones
   - Balance inicial: 10,000 XLM (testnet)
   - Tokens: 10,000,000 TUR

2. **Merchant Account 1-3:**
   - Propósito: Recibir pagos del marketplace
   - Balance inicial: 5 XLM cada uno

3. **User Test Account:**
   - Propósito: Testing durante desarrollo
   - Balance inicial: 100 XLM

---

## 6. ESTRUCTURA DEL PROYECTO
 - Según reglas de Windsurf rules

## 7. CASOS DE USO DETALLADOS

### CU-001: Usuario Conecta Wallet por Primera Vez

**Precondiciones:**
- Usuario tiene Freighter instalado
- Usuario tiene cuenta con fondos XLM

**Flujo Principal:**
1. Usuario accede a la aplicación
2. Sistema muestra botón "Conectar Wallet"
3. Usuario hace clic en "Conectar Wallet"
4. Sistema abre popup de Freighter
5. Usuario selecciona cuenta y autoriza
6. Sistema recibe dirección pública
7. Sistema consulta balance XLM y TUR
8. Sistema muestra header actualizado con dirección y balances
9. Sistema habilita funcionalidades de la app

**Flujo Alternativo 1: Freighter no instalado**
- En paso 4: Sistema detecta que Freighter no está instalado
- Sistema muestra modal: "Instala Freighter para continuar" con link a extensión
- Usuario instala Freighter
- Usuario regresa y reinicia flujo

**Flujo Alternativo 2: Usuario rechaza conexión**
- En paso 5: Usuario hace clic en "Cancelar" en Freighter
- Sistema muestra mensaje: "Conexión cancelada. Necesitas conectar tu wallet para usar Turista"
- Usuario permanece en estado "no conectado"

**Postcondiciones:**
- Usuario está autenticado
- Dirección pública almacenada en React state
- Balances consultados y mostrados

---

### CU-002: Usuario Hace Check-in Exitoso

**Precondiciones:**
- Usuario está conectado con Freighter
- Modo demo activado (simulación en Plaza de Armas)
- Usuario NO ha hecho check-in previamente en el lugar

**Flujo Principal:**
1. Usuario navega al mapa (página principal)
2. Sistema muestra mapa con 2 pines
3. Usuario hace clic en pin "Plaza de Armas"
4. Sistema muestra info window del lugar con botón "Hacer Check-in"
5. Usuario hace clic en "Hacer Check-in"
6. Sistema valida distancia (ubicación simulada vs lugar)
7. Sistema determina que usuario está a < 200m
8. Sistema verifica que usuario NO tiene check-in previo en este lugar
9. Sistema llama a `CheckinNFT.mint()`
10. Freighter solicita firma de transacción
11. Usuario firma transacción
12. Sistema espera confirmación de Stellar
13. Smart contract mintea NFT con metadata del lugar
14. Smart contract transfiere 1000 TUR al usuario
15. Sistema recibe confirmación exitosa
16. Sistema muestra modal: "✅ Check-in exitoso!"
17. Sistema actualiza:
    - Marca lugar como "Ya visitado" en mapa
    - Actualiza balance TUR (+1000)
    - Agrega NFT a colección local

**Flujo Alternativo 1: Usuario está lejos del lugar**
- En paso 7: Sistema determina que usuario está a > 200m
- Sistema muestra error: "Debes estar a menos de 200m de Plaza de Armas"
- Flujo termina

**Flujo Alternativo 2: Usuario ya hizo check-in**
- En paso 8: Sistema detecta que usuario ya tiene NFT de este lugar
- Sistema muestra mensaje: "Ya hiciste check-in en Plaza de Armas el 14 Nov 2025"
- Flujo termina

**Flujo Alternativo 3: Usuario rechaza firma**
- En paso 11: Usuario cancela en Freighter
- Sistema muestra mensaje: "Check-in cancelado"
- Flujo termina

**Flujo Alternativo 4: Transacción falla**
- En paso 14: Stellar retorna error (ej: fondos insuficientes para fee)
- Sistema muestra error: "Error al procesar check-in: [mensaje]"
- Flujo termina

**Postcondiciones:**
- Usuario tiene 1 NFT nuevo en su colección
- Balance TUR aumentó en 1000
- Usuario no puede volver a hacer check-in en ese lugar

---

### CU-003: Usuario Compra Producto con Descuento (XLM + TUR)

**Precondiciones:**
- Usuario está conectado
- Usuario tiene suficientes XLM y TUR para la compra
- Usuario tiene al menos 1 check-in (tiene TUR)

**Flujo Principal:**
1. Usuario navega a "/marketplace"
2. Sistema muestra 3 productos
3. Usuario hace clic en "Comprar" en producto "Tour Machu Picchu"
4. Sistema muestra modal de compra con:
   - Detalles del producto
   - Opción 1: 50 XLM
   - Opción 2: 30 XLM + 5000 TUR (descuento)
   - Balance actual: "45 XLM | 6500 TUR"
5. Usuario selecciona opción 2 (XLM + TUR)
6. Usuario hace clic en "Confirmar Compra"
7. Sistema valida balances:
   - XLM: 45 >= 30 ✓
   - TUR: 6500 >= 5000 ✓
8. Sistema llama a `Marketplace.purchase_with_discount(30 XLM, 5000 TUR)`
9. Freighter solicita firma
10. Usuario firma transacción
11. Smart contract valida balances on-chain
12. Smart contract transfiere 30 XLM a merchant
13. Smart contract quema 5000 TUR del usuario
14. Sistema recibe confirmación
15. Sistema muestra modal de éxito:
    - "✅ Compra realizada"
    - "Has comprado: Tour Machu Picchu"
    - Link a transacción en Stellar Expert
16. Sistema actualiza balances:
    - XLM: 45 → 15
    - TUR: 6500 → 1500

**Flujo Alternativo 1: Fondos insuficientes**
- En paso 7: Sistema detecta que usuario no tiene suficiente XLM o TUR
- Sistema muestra error: "Saldo insuficiente. Necesitas 30 XLM y 5000 TUR"
- Flujo termina

**Flujo Alternativo 2: Usuario cancela**
- En paso 10: Usuario rechaza firma en Freighter
- Sistema muestra: "Compra cancelada"
- Flujo termina

**Postcondiciones:**
- Usuario pagó 30 XLM y 5000 TUR
- Comerciante recibió 30 XLM
- 5000 TUR fueron quemados (supply total disminuyó)
- Balances actualizados en UI

---

### CU-004: Usuario Ve Su Colección de NFTs

**Precondiciones:**
- Usuario está conectado
- Usuario ha hecho al menos 1 check-in

**Flujo Principal:**
1. Usuario navega a "/collection"
2. Sistema consulta NFTs del usuario llamando a `CheckinNFT.get_user_nfts(user_address)`
3. Sistema recibe lista de NFTs (ej: 2 NFTs)
4. Sistema renderiza grid con tarjetas de NFTs
5. Cada tarjeta muestra:
   - Imagen del NFT
   - Nombre del lugar
   - Fecha de check-in
   - Coordenadas
6. Usuario hace clic en un NFT
7. Sistema muestra modal con detalles completos:
   - Imagen grande
   - Metadata completa
   - Token ID
   - Timestamp exacto

**Flujo Alternativo: Usuario sin NFTs**
- En paso 3: Sistema recibe lista vacía
- Sistema muestra estado vacío:
  - Ilustración
  - "Aún no tienes check-ins"
  - Botón "Ir al Mapa"

**Postcondiciones:**
- Usuario visualizó su colección de NFTs

---

## 8. VALIDACIONES Y REGLAS DE NEGOCIO

### VRN-001: Validación de Distancia para Check-in
```typescript
// Regla: Usuario debe estar a máximo 200m del lugar
function canCheckIn(userLat: number, userLng: number, placeLat: number, placeLng: number): boolean {
  const distance = getDistanceInMeters(userLat, userLng, placeLat, placeLng);
  const maxDistance = parseInt(import.meta.env.VITE_CHECKIN_RADIUS_METERS) || 200;
  return distance <= maxDistance;
}
```

### VRN-002: Prevención de Check-ins Duplicados
```rust
// En Smart Contract
pub fn mint(...) -> Result<u64, Error> {
    // Verificar que usuario NO tenga check-in previo
    let key = (to.clone(), place_id);
    if env.storage().instance().has(&key) {
        return Err(Error::AlreadyCheckedIn);
    }
    
    // Continuar con mint...
}
```

### VRN-003: Validación de Fondos para Compra
```typescript
// Frontend
function canPurchase(userXLM: number, userTUR: number, priceXLM: number, priceTUR: number): boolean {
  return userXLM >= priceXLM && userTUR >= priceTUR;
}

// Smart Contract (doble validación)
pub fn purchase_with_discount(...) -> Result<(), Error> {
    let buyer_xlm = get_xlm_balance(&buyer);
    let buyer_tur = get_tur_balance(&buyer);
    
    if buyer_xlm < amount_xlm || buyer_tur < amount_tur {
        return Err(Error::InsufficientFunds);
    }
    
    // Continuar con compra...
}
```

### VRN-004: NFTs Soulbound (No Transferibles)
```rust
// En CheckinNFT Contract
pub fn transfer(...) -> Result<(), Error> {
    // SIEMPRE retornar error
    Err(Error::NFTNotTransferable)
}
```

### VRN-005: Quema de TUR en Compras
```rust
// Al comprar con descuento, los TUR DEBEN quemarse
pub fn purchase_with_discount(...) -> Result<(), Error> {
    // Transferir XLM
    transfer_xlm(&buyer, &merchant, amount_xlm)?;
    
    // Quemar TUR (reduce el supply)
    tur_token::burn(&buyer, amount_tur)?;
    
    Ok(())
}
```

---

## 9. MANEJO DE ERRORES

### Códigos de Error Smart Contract

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Error {
    // CheckinNFT Errors (100-199)
    AlreadyCheckedIn = 100,
    InvalidPlaceId = 101,
    NFTNotTransferable = 102,
    TokenNotFound = 103,
    
    // TUR Token Errors (200-299)
    InsufficientBalance = 200,
    UnauthorizedBurn = 201,
    
    // Marketplace Errors (300-399)
    InsufficientFunds = 300,
    InvalidMerchant = 301,
    TransferFailed = 302,
}
```

### Mensajes de Error para Usuario

| Código Error | Mensaje Frontend |
|--------------|------------------|
| 100 | "Ya hiciste check-in en este lugar" |
| 101 | "Lugar no válido. Intenta de nuevo" |
| 102 | "Este NFT no puede ser transferido" |
| 200 | "Saldo TUR insuficiente" |
| 300 | "Fondos insuficientes para esta compra" |
| 302 | "Error al procesar el pago. Intenta de nuevo" |
| Network Error | "Error de conexión. Verifica tu internet" |
| User Rejected | "Transacción cancelada por el usuario" |

---

## 10. DATOS DE PRUEBA

### Lugares Turísticos (Hardcoded)

```typescript
// src/constants/places.ts

export const PLACES: Place[] = [
  {
    id: 1,
    name: "Plaza de Armas de Cusco",
    description: "Corazón histórico de la ciudad imperial, rodeada de arquitectura colonial",
    lat: -13.516754,
    lng: -13.516754,
    imageNFT: "/nft-plaza-armas.png",
    radius: 200,
    category: "historical"
  },
  {
    id: 2,
    name: "Qoricancha - Templo del Sol",
    description: "Templo inca más importante dedicado al dios Sol, con impresionante arquitectura",
    lat: -13.519722,
    lng: -71.975556,
    imageNFT: "/nft-qoricancha.png",
    radius: 200,
    category: "historical"
  }
];
```

### Productos Marketplace (Hardcoded)

```typescript
// src/constants/products.ts

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Tour Guiado Machu Picchu",
    description: "Tour de día completo con guía certificado, incluye transporte y almuerzo",
    image: "/marketplace-tour.jpg",
    merchantAddress: "GMERCHANT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Inca Tours SAC",
    priceXLM: 50,
    priceDiscountXLM: 30,
    priceDiscountTUR: 5000,
    category: "tours"
  },
  {
    id: 2,
    name: "Artesanía de Alpaca",
    description: "Poncho tejido a mano con lana de alpaca 100% natural, diseño tradicional cusqueño",
    image: "/marketplace-poncho.jpg",
    merchantAddress: "GMERCHANT2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Artesanías del Valle",
    priceXLM: 20,
    priceDiscountXLM: 12,
    priceDiscountTUR: 2000,
    category: "crafts"
  },
  {
    id: 3,
    name: "Cena en Restaurante Local",
    description: "Menú degustación de comida cusqueña: ceviche, lomo saltado, chicha morada y postre",
    image: "/marketplace-food.jpg",
    merchantAddress: "GMERCHANT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    merchantName: "Restaurante Pachapapa",
    priceXLM: 15,
    priceDiscountXLM: 10,
    priceDiscountTUR: 1500,
    category: "food"
  }
];
```

### Cuentas de Prueba

```bash
# Master Account (crear con Stellar Lab)
Public: GMASTER1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret: SMASTER1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Balance: 10,000 XLM + 10,000,000 TUR

# Merchant 1 (Tour)
Public: GMERCHANT1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret: (solo para testing interno)
Balance: 5 XLM

# Merchant 2 (Artesanía)
Public: GMERCHANT2XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Balance: 5 XLM

# Merchant 3 (Restaurante)
Public: GMERCHANT3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Balance: 5 XLM

# User Test Account (para desarrollo)
Public: GUSER1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret: SUSER1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Balance: 100 XLM + 0 TUR (inicialmente)
```

---

## 11. PLAN DE DESARROLLO (48 HORAS)

### DÍA 1 - Martes (14 horas)

#### Bloque 1: Setup Inicial (2h)
- [ ] Inicializar proyecto con Scaffold Stellar CLI
- [ ] Configurar estructura de carpetas
- [ ] Instalar dependencias (Google Maps, etc)
- [ ] Configurar .env con API keys
- [ ] Setup Git repository

#### Bloque 2: Smart Contracts - Parte 1 (4h)
- [ ] **CheckinNFT Contract:**
  - Definir structs (CheckinNFT, Error)
  - Implementar `mint()` function
  - Implementar `get_user_nfts()`
  - Implementar `has_checked_in()`
  - Agregar storage maps
- [ ] **TUR Token Contract:**
  - Implementar token estándar SAC
  - Funciones: transfer, burn, balance, decimals
  - Mintear supply inicial

#### Bloque 3: Smart Contracts - Parte 2 (3h)
- [ ] **Marketplace Contract:**
  - Implementar `purchase_with_xlm()`
  - Implementar `purchase_with_discount()`
  - Validaciones de balance
  - Integración con TUR token (burn)
- [ ] Compilar todos los contratos
- [ ] Deploy a Stellar testnet
- [ ] Guardar contract IDs en .env

#### Bloque 4: Frontend Base (3h)
- [ ] Configurar React Router (4 rutas)
- [ ] Crear Header component con navegación
- [ ] Implementar WalletConnect component (Freighter)
- [ ] Hook `useWallet` para manejar estado de conexión
- [ ] Crear páginas vacías (MapView, Collection, Marketplace, Profile)

#### Bloque 5: Testing Inicial (2h)
- [ ] Crear cuentas en Stellar Lab (master + merchants)
- [ ] Fondear cuentas con Friendbot
- [ ] Mintear 10M TUR a master account
- [ ] Probar llamadas a contratos desde Stellar Lab
- [ ] Verificar que deploy funciona correctamente

---

### DÍA 2 - Miércoles (14 horas)

#### Bloque 6: Mapa y Geolocalización (4h)
- [ ] Integrar Google Maps en MapView
- [ ] Crear component PlaceMarker
- [ ] Hardcodear 2 lugares (Plaza de Armas, Qoricancha)
- [ ] Implementar toggle "Modo Demo"
- [ ] Función `getDistanceInMeters()` (Haversine)
- [ ] Validación de check-in según distancia
- [ ] Info window con botón "Hacer Check-in"

#### Bloque 7: Sistema de Check-in (4h)
- [ ] Crear CheckinModal component
- [ ] Implementar llamada a `CheckinNFT.mint()`
- [ ] Manejar firma de transacción con Freighter
- [ ] Mostrar loading states
- [ ] Actualizar UI tras check-in exitoso
- [ ] Actualizar balance TUR
- [ ] Marcar lugar como visitado en mapa
- [ ] Manejo de errores (distancia, duplicado, etc)

#### Bloque 8: Colección de NFTs (2h)
- [ ] Crear página Collection
- [ ] Implementar `useNFTs` hook
- [ ] Consultar NFTs del usuario desde contrato
- [ ] Crear NFTCard component
- [ ] Grid responsive de NFTs
- [ ] Modal de detalles de NFT
- [ ] Estado vacío si no tiene NFTs

#### Bloque 9: Marketplace (3h)
- [ ] Crear página Marketplace
- [ ] Hardcodear 3 productos
- [ ] Crear ProductCard component
- [ ] Crear PurchaseModal component
- [ ] Selector de método de pago (XLM o XLM+TUR)
- [ ] Validación de fondos
- [ ] Implementar compra llamando a Marketplace contract
- [ ] Mostrar confirmación y actualizar balances

#### Bloque 10: Perfil y Pulido Final (1h)
- [ ] Crear página Profile
- [ ] Mostrar dirección, balances, estadísticas
- [ ] Hook `useBalances` para consultar XLM y TUR
- [ ] Botón "Actualizar Balances"

---

---

## 12. CRITERIOS DE ACEPTACIÓN FINALES

### Para Considerar el MVP "COMPLETO"

**Funcionalidad Core:**
- [x] Usuario puede conectar Freighter wallet
- [x] Usuario puede ver mapa con 2 lugares turísticos
- [x] Usuario puede hacer check-in (validando distancia simulada)
- [x] Check-in mintea NFT único con imagen del lugar
- [x] Check-in otorga 1000 TUR al usuario
- [x] Usuario puede ver su colección de NFTs
- [x] Usuario puede navegar al marketplace
- [x] Usuario puede comprar productos con XLM o XLM+TUR
- [x] Compra con descuento quema los TUR usados
- [x] Usuario puede ver su perfil con balances

**Requisitos Técnicos (Scaffold Stellar Hackathon):**
- [x] 3 Smart Contracts desplegados en testnet
- [x] Frontend React + TypeScript + Vite
- [x] Integración con Stellar Wallet Kit (Freighter)
- [x] Transacciones reales en Stellar testnet

**Entregables:**
- [x] Código en GitHub (público)
- [x] README con instrucciones de instalación
- [x] Video demo (3-5 min)
- [x] Pitch deck (PDF, 8 slides)
- [x] App desplegada (URL accesible)
- [x] Contract addresses en Stellar Explorer

---

## 13. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| No terminar los 3 contratos a tiempo | Media | Alto | Priorizar CheckinNFT y TUR, Marketplace puede ser más simple |
| Google Maps API rechaza requests | Baja | Medio | Usar API key válida, límite gratuito es suficiente |
| Freighter no se conecta | Baja | Alto | Testing exhaustivo, tener cuenta alternativa |
| Stellar testnet caído | Baja | Crítico | Tener screenshots/videos de respaldo |
| Transacciones fallan por fees | Media | Medio | Pre-fondear cuentas con suficiente XLM |
| No terminar video demo | Media | Alto | Grabar durante desarrollo, no dejar para último momento |

---

## 14. DEPENDENCIAS EXTERNAS

### APIs y Servicios

1. **Google Maps JavaScript API**
   - Propósito: Renderizar mapa interactivo
   - Costo: Gratis hasta 28,000 cargas/mes
   - Requiere: API key con Maps JavaScript API habilitada

2. **Stellar Horizon API**
   - Propósito: Consultar balances, enviar transacciones
   - Endpoint testnet: https://horizon-testnet.stellar.org
   - Gratis, sin límites estrictos

3. **Freighter Wallet**
   - Propósito: Firma de transacciones
   - Extensión de navegador (Chrome/Firefox)
   - Usuario debe instalarlo previamente

4. **Stellar Friendbot**
   - Propósito: Fondear cuentas en testnet
   - URL: https://friendbot.stellar.org
   - Límite: ~1 request cada 10s por cuenta