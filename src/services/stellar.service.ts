import { SorobanRpc, Address, xdr } from '@stellar/stellar-sdk';
import { CONFIG } from '@/constants/config';

class StellarService {
  private server: SorobanRpc.Server;

  constructor() {
    this.server = new SorobanRpc.Server(CONFIG.HORIZON_URL, {
      allowHttp: true,
    });
  }

    public async hasCheckedIn(publicKey: string, placeId: number): Promise<boolean> {
    try {
      const key = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('UserPlaceCheckin'),
        new Address(publicKey).toScVal(),
        xdr.ScVal.scvU32(placeId),
      ]);

      const ledgerKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: new Address(CONFIG.CONTRACTS.CHECKIN_NFT).toScAddress(),
          key,
                    durability: xdr.ContractDataDurability.temporary(),
        })
      );

            const ledgerEntries = await this.server.getLedgerEntries(ledgerKey);
      return ledgerEntries && ledgerEntries.entries && ledgerEntries.entries.length > 0;
    } catch (error) {
      console.error('Error in hasCheckedIn:', error);
      return false;
    }
  }
}

export const stellarService = new StellarService();
