use soroban_sdk::contracterror;

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
