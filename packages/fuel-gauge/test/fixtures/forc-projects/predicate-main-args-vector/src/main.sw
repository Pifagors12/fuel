predicate;

fn main(some_vec: Vec<u8>) -> bool {
    let firstElement = some_vec.get(0).unwrap();
    firstElement == 42
}
