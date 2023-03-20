contract;

use std::{b512::B512, ecr::ec_recover_address};
use std::logging::log;

abi B512Test {
    fn test_function(sig: B512) -> b256;
}

impl B512Test for Contract {
    fn test_function(sig: B512) -> b256 {
        // log(sig);
        let expected_public_key = 0xe10f526b192593793b7a1559a391445faba82a1d669e3eb2dcd17f9c121b24b1;
        let message_hash = 0x6aed34e6bddff5e1d872b5d7d5698a7b73abd6f3b33402732edc73ab9ffb9c70;
        if let Result::Ok(pub_key_sig) = ec_recover_address(sig, message_hash)
        {
            if pub_key_sig.value == expected_public_key {
                return expected_public_key;
            }
        }
        return 0xe10f526b192593793b7a1559a391445faba82a13269e3eb2dcd17f9c121b24b1
    }
}
