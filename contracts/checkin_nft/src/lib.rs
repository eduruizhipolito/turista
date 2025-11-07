#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, String, Vec, symbol_short};

// NFT data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CheckinNFT {
    pub token_id: u64,
    pub place_id: u32,
    pub place_name: String,
    pub latitude: i64,      // Lat * 1e6 to avoid decimals
    pub longitude: i64,     // Lng * 1e6 to avoid decimals
    pub check_in_timestamp: u64,
    pub owner: Address,
    pub image_url: String,
}

// Storage keys
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NFT(u64),                           // token_id -> CheckinNFT
    UserPlaceCheckin(Address, u32),     // (user, place_id) -> token_id
    NextTokenId,                        // Counter for token IDs
    TurTokenContract,                   // Address of TUR token contract
    Admin,                              // Admin address
}

// Error types
#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyCheckedIn = 100,
    InvalidPlaceId = 101,
    NFTNotTransferable = 102,
    TokenNotFound = 103,
    Unauthorized = 104,
}

#[contract]
pub struct CheckinNFTContract;

#[contractimpl]
impl CheckinNFTContract {
    /// Initialize the contract
    pub fn initialize(
        env: Env,
        admin: Address,
        tur_token_contract: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TurTokenContract, &tur_token_contract);
        env.storage().instance().set(&DataKey::NextTokenId, &1u64);
    }

    /// Mint a new NFT after check-in
    pub fn mint(
        env: Env,
        to: Address,
        place_id: u32,
        place_name: String,
        latitude: i64,
        longitude: i64,
        image_url: String,
    ) -> Result<u64, Error> {
        // Require authentication
        to.require_auth();

        // Validate place_id
        if place_id == 0 {
            return Err(Error::InvalidPlaceId);
        }

        // Check if user already checked in at this place
        let checkin_key = DataKey::UserPlaceCheckin(to.clone(), place_id);
        if env.storage().instance().has(&checkin_key) {
            return Err(Error::AlreadyCheckedIn);
        }

        // Get next token ID
        let token_id: u64 = env.storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1);

        // Create NFT
        let nft = CheckinNFT {
            token_id,
            place_id,
            place_name: place_name.clone(),
            latitude,
            longitude,
            check_in_timestamp: env.ledger().timestamp(),
            owner: to.clone(),
            image_url: image_url.clone(),
        };

        // Store NFT
        env.storage().instance().set(&DataKey::NFT(token_id), &nft);
        
        // Mark user as checked in at this place
        env.storage().instance().set(&checkin_key, &token_id);

        // Increment token ID counter
        env.storage().instance().set(&DataKey::NextTokenId, &(token_id + 1));

        // Emit event
        env.events().publish(
            (symbol_short!("mint"), to.clone(), place_id),
            token_id,
        );

        // Transfer 1000 TUR to user (1000 * 10^7 = 10000000000)
        let tur_amount: i128 = 1000_0000000;
        let tur_contract: Address = env.storage()
            .instance()
            .get(&DataKey::TurTokenContract)
            .unwrap();
        
        let admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap();

        // Call TUR token transfer
        // Note: In production, this would use contract invocation
        // For now, we emit an event that the frontend will handle
        env.events().publish(
            (symbol_short!("tur_rwrd"), to, tur_amount),
            token_id,
        );

        Ok(token_id)
    }

    /// Get NFT by token ID
    pub fn get_nft(env: Env, token_id: u64) -> Result<CheckinNFT, Error> {
        env.storage()
            .instance()
            .get(&DataKey::NFT(token_id))
            .ok_or(Error::TokenNotFound)
    }

    /// Get all NFTs owned by a user
    pub fn get_user_nfts(env: Env, owner: Address) -> Vec<CheckinNFT> {
        let mut nfts = Vec::new(&env);
        
        // Get next token ID to know the range
        let next_token_id: u64 = env.storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1);

        // Iterate through all NFTs and filter by owner
        for token_id in 1..next_token_id {
            if let Some(nft) = env.storage().instance().get::<DataKey, CheckinNFT>(&DataKey::NFT(token_id)) {
                if nft.owner == owner {
                    nfts.push_back(nft);
                }
            }
        }

        nfts
    }

    /// Check if user has checked in at a specific place
    pub fn has_checked_in(env: Env, user: Address, place_id: u32) -> bool {
        let checkin_key = DataKey::UserPlaceCheckin(user, place_id);
        env.storage().instance().has(&checkin_key)
    }

    /// Get token ID for a user's check-in at a place
    pub fn get_checkin_token_id(env: Env, user: Address, place_id: u32) -> Option<u64> {
        let checkin_key = DataKey::UserPlaceCheckin(user, place_id);
        env.storage().instance().get(&checkin_key)
    }

    /// Transfer function - ALWAYS FAILS (Soulbound NFTs)
    pub fn transfer(
        _env: Env,
        _from: Address,
        _to: Address,
        _token_id: u64,
    ) -> Result<(), Error> {
        // NFTs are soulbound and cannot be transferred
        Err(Error::NFTNotTransferable)
    }

    /// Get total number of NFTs minted
    pub fn total_supply(env: Env) -> u64 {
        let next_token_id: u64 = env.storage()
            .instance()
            .get(&DataKey::NextTokenId)
            .unwrap_or(1);
        
        next_token_id - 1
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CheckinNFTContract);
        let client = CheckinNFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        assert_eq!(client.total_supply(), 0);
    }

    #[test]
    fn test_mint() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CheckinNFTContract);
        let client = CheckinNFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        let place_id = 1u32;
        let place_name = String::from_str(&env, "Plaza de Armas");
        let latitude = -13516754i64; // -13.516754 * 1e6
        let longitude = -71978516i64; // -71.978516 * 1e6
        let image_url = String::from_str(&env, "/nft-plaza-armas.png");

        let token_id = client.mint(
            &user,
            &place_id,
            &place_name,
            &latitude,
            &longitude,
            &image_url,
        );

        assert_eq!(token_id, 1);
        assert_eq!(client.total_supply(), 1);
        assert!(client.has_checked_in(&user, &place_id));

        let nft = client.get_nft(&token_id);
        assert_eq!(nft.owner, user);
        assert_eq!(nft.place_id, place_id);
        assert_eq!(nft.place_name, place_name);
    }

    #[test]
    fn test_cannot_checkin_twice() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CheckinNFTContract);
        let client = CheckinNFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        let place_id = 1u32;
        let place_name = String::from_str(&env, "Plaza de Armas");
        let latitude = -13516754i64;
        let longitude = -71978516i64;
        let image_url = String::from_str(&env, "/nft-plaza-armas.png");

        // First check-in should succeed
        client.mint(&user, &place_id, &place_name, &latitude, &longitude, &image_url);

        // Second check-in should fail
        let result = client.try_mint(&user, &place_id, &place_name, &latitude, &longitude, &image_url);
        assert_eq!(result, Err(Ok(Error::AlreadyCheckedIn)));
    }

    #[test]
    fn test_transfer_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CheckinNFTContract);
        let client = CheckinNFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        let place_id = 1u32;
        let token_id = client.mint(
            &user1,
            &place_id,
            &String::from_str(&env, "Plaza de Armas"),
            &-13516754i64,
            &-71978516i64,
            &String::from_str(&env, "/nft-plaza-armas.png"),
        );

        // Transfer should fail (soulbound)
        let result = client.try_transfer(&user1, &user2, &token_id);
        assert_eq!(result, Err(Ok(Error::NFTNotTransferable)));
    }

    #[test]
    fn test_get_user_nfts() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CheckinNFTContract);
        let client = CheckinNFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let tur_contract = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin, &tur_contract);

        // Mint 2 NFTs for the user
        client.mint(
            &user,
            &1u32,
            &String::from_str(&env, "Plaza de Armas"),
            &-13516754i64,
            &-71978516i64,
            &String::from_str(&env, "/nft-plaza-armas.png"),
        );

        client.mint(
            &user,
            &2u32,
            &String::from_str(&env, "Qoricancha"),
            &-13519722i64,
            &-71975556i64,
            &String::from_str(&env, "/nft-qoricancha.png"),
        );

        let nfts = client.get_user_nfts(&user);
        assert_eq!(nfts.len(), 2);
    }
}
