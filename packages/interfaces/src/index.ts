/* eslint-disable max-classes-per-file */
// #region typedoc:Bech32-HRP
export type Bech32Address = `fuel${string}`;
// #endregion
export type B256Address = string;

export abstract class AbstractScript<T> {
  abstract bytes: Uint8Array;
  abstract encodeScriptData: (data: T) => Uint8Array;
}

// #region typedoc:AbstractAddress
export type AbstractAddress = Bech32Address | B256Address | string;
// #endregion

export abstract class AbstractContract {
  abstract id: AbstractAddress;
}

export abstract class AbstractAccount {
  abstract address: AbstractAddress;
}

export type AddressLike = AbstractAddress | AbstractAccount;

export type ContractIdLike = string;

export abstract class AbstractPredicate {
  abstract bytes: Uint8Array;
  abstract address: AbstractAddress;
  abstract predicateData: Uint8Array;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract types?: ReadonlyArray<any>;
}
