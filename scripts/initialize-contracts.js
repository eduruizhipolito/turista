import { Contract, SorobanRpc, TransactionBuilder, Networks, BASE_FEE, Keypair, Address } from '@stellar/stellar-sdk';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  // Skip empty lines and comments
  if (!trimmedLine || trimmedLine.startsWith('#')) return;
  
  const match = trimmedLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

console.log('📄 Variables encontradas en .env:');
console.log('Keys:', Object.keys(envVars));

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const CHECKIN_CONTRACT_ID = envVars.VITE_CHECKIN_NFT_CONTRACT;
const TUR_CONTRACT_ID = envVars.VITE_TUR_TOKEN_CONTRACT;
const ADMIN_SECRET = envVars.PRIVATE_MASTER_KEY;

async function initializeCheckinContract() {
  console.log('🚀 Inicializando CheckinNFT Contract...');
  
  if (!CHECKIN_CONTRACT_ID || !TUR_CONTRACT_ID || !ADMIN_SECRET) {
    console.error('❌ Faltan variables de entorno');
    console.log('CHECKIN_CONTRACT_ID:', CHECKIN_CONTRACT_ID);
    console.log('TUR_CONTRACT_ID:', TUR_CONTRACT_ID);
    console.log('ADMIN_SECRET:', ADMIN_SECRET ? '***' : 'undefined');
    return;
  }

  const server = new SorobanRpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
  const adminKeypair = Keypair.fromSecret(ADMIN_SECRET);
  const adminPublicKey = adminKeypair.publicKey();

  console.log('Admin:', adminPublicKey);
  console.log('CheckinNFT Contract:', CHECKIN_CONTRACT_ID);
  console.log('TUR Token Contract:', TUR_CONTRACT_ID);

  try {
    // Get account
    const account = await server.getAccount(adminPublicKey);
    
    // Build contract
    const contract = new Contract(CHECKIN_CONTRACT_ID);
    
    // Build transaction
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'initialize',
          Address.fromString(adminPublicKey).toScVal(),
          Address.fromString(TUR_CONTRACT_ID).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    // Simulate
    console.log('📡 Simulando transacción...');
    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      console.error('❌ Error en simulación:', simulated.error);
      return;
    }

    // Prepare
    const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build();
    
    // Sign
    prepared.sign(adminKeypair);
    
    // Send
    console.log('📤 Enviando transacción...');
    const sentTx = await server.sendTransaction(prepared);
    
    if (sentTx.status === 'PENDING') {
      console.log('⏳ Esperando confirmación...');
      let getResponse = await server.getTransaction(sentTx.hash);
      
      while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        getResponse = await server.getTransaction(sentTx.hash);
      }
      
      if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
        console.log('✅ Contrato inicializado exitosamente!');
        console.log('Hash:', sentTx.hash);
      } else {
        console.error('❌ Transacción falló:', getResponse);
      }
    } else {
      console.error('❌ Error al enviar:', sentTx);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initializeCheckinContract();
