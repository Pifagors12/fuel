import { Coder, NumberCoder, U64Coder } from '@fuel-ts/abi-coder';
import type { BN } from '@fuel-ts/math';

// Bitfield of used policy types.
export enum PolicyType {
  GasPrice = 1,
  WitnessLimit = 2,
  Maturity = 4,
  MaxFee = 8,
}

export type Policy = PolicyGasPrice | PolicyWitnessLimit | PolicyMaturity | PolicyMaxFee;

export type PolicyGasPrice = {
  type: PolicyType.GasPrice;
  data: BN;
};

export type PolicyWitnessLimit = {
  type: PolicyType.WitnessLimit;
  data: BN;
};

export type PolicyMaturity = {
  type: PolicyType.Maturity;
  data: number;
};

export type PolicyMaxFee = {
  type: PolicyType.MaxFee;
  data: BN;
};

export class PoliciesCoder extends Coder<Policy[], Policy[]> {
  constructor() {
    super('Policies', 'array Policy', 0);
  }

  encode(policies: Policy[]): Uint8Array {
    throw new Error('Implement me');
  }

  decode(data: Uint8Array, offset: number, policyTypes: number): [Policy[], number] {
    let o = offset;
    const policies: Policy[] = [];

    if (policyTypes & PolicyType.GasPrice) {
      const [gasPrice, nextOffset] = new U64Coder().decode(data, o);
      o = nextOffset;
      policies.push({ type: PolicyType.GasPrice, data: gasPrice });
    }

    if (policyTypes & PolicyType.WitnessLimit) {
      const [witnessLimit, nextOffset] = new U64Coder().decode(data, o);
      o = nextOffset;
      policies.push({ type: PolicyType.WitnessLimit, data: witnessLimit });
    }

    if (policyTypes & PolicyType.Maturity) {
      const [maturity, nextOffset] = new NumberCoder('u32').decode(data, o);
      o = nextOffset;
      policies.push({ type: PolicyType.Maturity, data: maturity });
    }

    if (policyTypes & PolicyType.MaxFee) {
      const [maxFee, nextOffset] = new U64Coder().decode(data, o);
      o = nextOffset;
      policies.push({ type: PolicyType.MaxFee, data: maxFee });
    }

    return [policies, o];
  }
}
