#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, symbol_short};

// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    TurTokenContract,
    Admin,
}

// Error types
#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InsufficientFunds = 300,
    InvalidMerchant = 301,
    TransferFailed = 302,
    Unauthorized = 303,
}

// Purchase event data
#[contracttype]
#[derive(Clone, Debug)]
pub struct PurchaseEvent {
    pub buyer: Address,
    pub merchant: Address,
    pub amount_xlm: i128,
    pub amount_tur_burned: i128,
    pub timestamp: u64,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Initialize the marketplace contract
    pub fn initialize(
        env: Env,
        admin: Address,
        tur_token_contract: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TurTokenContract, &tur_token_contract);
    }

    /// Purchase with XLM only
    pub fn purchase_with_xlm(
        env: Env,
        buyer: Address,
        merchant: Address,
        amount_xlm: i128,
    ) -> Result<(), Error> {
        // Require buyer authentication
        buyer.require_auth();

        // Validate amount
        if amount_xlm <= 0 {
            return Err(Error::InsufficientFunds);
        }

        // Note: In a real implementation, we would:
        // 1. Check buyer's XLM balance
        // 2. Transfer XLM from buyer to merchant
        // For this MVP, we emit an event that the frontend will handle

        // Emit purchase event
        let purchase_event = PurchaseEvent {
            buyer: buyer.clone(),
            merchant: merchant.clone(),
            amount_xlm,
            amount_tur_burned: 0,
            timestamp: env.ledger().timestamp(),
        };

        env.events().publish(
            (symbol_short!("purchase"), buyer, merchant),
            purchase_event,
        );

        Ok(())
    }

    /// Purchase with XLM + TUR discount
    pub fn purchase_with_discount(
        env: Env,
        buyer: Address,
        merchant: Address,
        amount_xlm: i128,
        amount_tur: i128,
    ) -> Result<(), Error> {
        // Require buyer authentication
        buyer.require_auth();

        // Validate amounts
        if amount_xlm <= 0 || amount_tur <= 0 {
            return Err(Error::InsufficientFunds);
        }

        // Get TUR token contract address
        let tur_contract: Address = env.storage()
            .instance()
            .get(&DataKey::TurTokenContract)
            .unwrap();

        // Note: In a real implementation, we would:
        // 1. Check buyer's XLM balance >= amount_xlm
        // 2. Check buyer's TUR balance >= amount_tur
        // 3. Transfer XLM from buyer to merchant
        // 4. Burn TUR from buyer
        //
        // For this MVP, we emit events that the frontend will handle
        // The actual XLM transfer and TUR burn will be done via separate transactions

        // Emit TUR burn event
        env.events().publish(
            (symbol_short!("burn_tur"), buyer.clone(), amount_tur),
            tur_contract,
        );

        // Emit purchase event
        let purchase_event = PurchaseEvent {
            buyer: buyer.clone(),
            merchant: merchant.clone(),
            amount_xlm,
            amount_tur_burned: amount_tur,
            timestamp: env.ledger().timestamp(),
        };

        env.events().publish(
            (symbol_short!("purchase"), buyer, merchant),
            purchase_event,
        );

        Ok(())
    }

    /// Get total purchases count (for statistics)
    pub fn get_purchase_count(_env: Env) -> u64 {
        // This would be implemented with a counter in storage
        // For MVP, we return 0
        0
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Marketplace);
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);

        client.initialize(&admin, &tur_contract);
    }

    #[test]
    fn test_purchase_with_xlm() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, Marketplace);
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        let amount_xlm = 50_0000000i128; // 50 XLM

        client.purchase_with_xlm(&buyer, &merchant, &amount_xlm);
    }

    #[test]
    fn test_purchase_with_discount() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, Marketplace);
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        let amount_xlm = 30_0000000i128; // 30 XLM
        let amount_tur = 5000_0000000i128; // 5000 TUR

        client.purchase_with_discount(&buyer, &merchant, &amount_xlm, &amount_tur);
    }

    #[test]
    fn test_invalid_amounts() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, Marketplace);
        let client = MarketplaceClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let buyer = Address::generate(&env);
        let merchant = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        // Test with zero amount
        let result = client.try_purchase_with_xlm(&buyer, &merchant, &0);
        assert_eq!(result, Err(Ok(Error::InsufficientFunds)));

        // Test with negative amount
        let result = client.try_purchase_with_xlm(&buyer, &merchant, &-100);
        assert_eq!(result, Err(Ok(Error::InsufficientFunds)));
    }
}
