predicate;

use std::bytes::Bytes;

#[allow(dead_code)]
enum SomeEnum<T> {
    First: bool,
    Second: T,
}

struct Wrapper<T> {
    inner: T,
    inner_enum: SomeEnum<Bytes>,
}

fn expected_bytes() -> Bytes {
    let mut bytes = Bytes::new();

    bytes.push(50u8);
    bytes.push(41u8);
    bytes.push(42u8);
    bytes.push(100u8);
    bytes.push(234u8);

    bytes
}

fn valid_bytes(bytes: Bytes) -> bool {
    let exp = expected_bytes();
    exp.get(0).unwrap() == bytes.get(0).unwrap() && exp.get(1).unwrap() == bytes.get(1).unwrap() && exp.get(2).unwrap() == bytes.get(2).unwrap()
}

fn valid_vec(arg: Vec<Bytes>) -> bool {
    if arg.len() != 2 {
        return false;
    }

    valid_bytes(arg.get(0).unwrap()) && valid_bytes(arg.get(1).unwrap())
}

//fn main(bytes: Bytes) -> bool {
 //   bytes.get(0).unwrap() == 50
//    valid_bytes(bytes)
//    if let SomeEnum::Second(enum_bytes) = wrapper.inner_enum {
  //      valid_bytes(enum_bytes) && valid_vec(wrapper.inner)
    //} else {
      //  false
    //}
//}
fn main(wrapper: Wrapper<Vec<Bytes>>) -> bool {
    if let SomeEnum::Second(enum_bytes) = wrapper.inner_enum {
      valid_bytes(enum_bytes) && valid_vec(wrapper.inner)
    } else {
        false
    }
}
