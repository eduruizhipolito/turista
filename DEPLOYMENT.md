# 🚀 Guía de Despliegue en Vercel

## Pasos para Desplegar

### 1. Preparar el Repositorio Git

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "feat: preparar proyecto para despliegue en Vercel"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/TU_USUARIO/turista.git
git branch -M main
git push -u origin main
```

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, agrega estas variables de entorno:

#### **Stellar Network**
- `PUBLIC_STELLAR_NETWORK` = `testnet`
- `PUBLIC_HORIZON_URL` = `https://horizon-testnet.stellar.org`
- `VITE_SOROBAN_RPC_URL` = `https://soroban-testnet.stellar.org`

#### **Contratos**
- `VITE_TUR_TOKEN_CONTRACT` = `[TU_CONTRACT_ID]`
- `VITE_CHECKIN_NFT_CONTRACT` = `[TU_CONTRACT_ID]`
- `VITE_MARKETPLACE_CONTRACT` = `[TU_CONTRACT_ID]`

#### **Cuentas**
- `PUBLIC_MASTER_PUBLIC_KEY` = `[TU_PUBLIC_KEY]`
- `VITE_MERCHANT_1_ADDRESS` = `[MERCHANT_ADDRESS]`
- `VITE_MERCHANT_2_ADDRESS` = `[MERCHANT_ADDRESS]`
- `VITE_MERCHANT_3_ADDRESS` = `[MERCHANT_ADDRESS]`

#### **Google Maps**
- `VITE_GOOGLE_MAPS_API_KEY` = `[TU_API_KEY]`

#### **Demo Config**
- `PUBLIC_DEFAULT_DEMO_LAT` = `-13.5165`
- `PUBLIC_DEFAULT_DEMO_LNG` = `-71.9786`
- `PUBLIC_CHECKIN_RADIUS_METERS` = `200`

### 3. Desplegar en Vercel

#### **Opción A: Desde el Dashboard de Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite
5. Agrega las variables de entorno
6. Click en "Deploy"

#### **Opción B: Desde la CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

### 4. Configuración Post-Despliegue

#### **Dominio Personalizado (Opcional)**
1. En el dashboard de Vercel, ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

#### **Verificar el Despliegue**
- ✅ El logo se muestra correctamente
- ✅ El header tiene fondo blanco
- ✅ Las galerías de lugares y productos se cargan
- ✅ La conexión con Freighter Wallet funciona
- ✅ Los contratos de Stellar responden

## 📝 Notas Importantes

### **Variables de Entorno**
- Todas las variables con prefijo `VITE_` son accesibles en el cliente
- Las variables con prefijo `PUBLIC_` también son públicas
- **NUNCA** expongas claves privadas o secrets

### **Build**
- El comando de build es: `npm run build`
- La carpeta de output es: `dist`
- Vercel ejecuta automáticamente el build en cada push

### **Actualizaciones**
- Cada push a `main` despliega automáticamente
- Los pull requests crean preview deployments

## 🔧 Troubleshooting

### **Error: Module not found**
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### **Error: Environment variables not working**
- Verifica que las variables tengan el prefijo correcto (`VITE_` o `PUBLIC_`)
- Redespliega después de agregar variables

### **Error: 404 en rutas**
- El archivo `vercel.json` ya está configurado para manejar SPA routing
- Verifica que el archivo esté en la raíz del proyecto

## 📊 Monitoreo

Vercel proporciona:
- 📈 Analytics de tráfico
- ⚡ Performance metrics
- 🐛 Error tracking
- 📝 Deployment logs

Accede desde: Dashboard > Tu Proyecto > Analytics
