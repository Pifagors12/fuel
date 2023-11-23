predicate;

use std::bytes::Bytes;

fn expected_bytes() -> Bytes {
    let mut bytes = Bytes::new();

    bytes.push(50u8);
    bytes.push(41u8);
    bytes.push(42u8);
    bytes.push(100u8);
    bytes.push(234u8);

    bytes
}

fn main(arg1: u8, arg2: u8) -> bool {
    let exp = expected_bytes();
    exp.get(0).unwrap() == arg1 && exp.get(1).unwrap() == arg2
}
