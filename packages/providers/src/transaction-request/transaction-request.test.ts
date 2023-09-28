import { Address } from '@fuel-ts/address';
import { BaseAssetId } from '@fuel-ts/address/configs';
import type { BN } from '@fuel-ts/math';
import { bn, toNumber } from '@fuel-ts/math';
import { TransactionType } from '@fuel-ts/transactions';

import type { CoinQuantityLikeObject } from '../coin-quantity';

import { ScriptTransactionRequest } from './script-transaction-request';
import type { TransactionRequestLike } from './types';
import { transactionRequestify } from './utils';

describe('TransactionRequest', () => {
  describe('transactionRequestify', () => {
    it('should keep data from input in transaction request created', () => {
      const script = Uint8Array.from([1, 2, 3, 4]);
      const scriptData = Uint8Array.from([5, 6]);
      const txRequestLike: TransactionRequestLike = {
        type: TransactionType.Script,
        script,
        scriptData,
        gasPrice: 1,
        gasLimit: 10000,
        maturity: 1,
        inputs: [],
        outputs: [],
        witnesses: [],
      };
      const txRequest = transactionRequestify(txRequestLike);

      if (txRequest.type === TransactionType.Script) {
        expect(txRequest.script).toEqual(txRequestLike.script);
        expect(txRequest.scriptData).toEqual(txRequestLike.scriptData);
      }

      expect(txRequest.type).toEqual(txRequestLike.type);
      expect(toNumber(txRequest.gasPrice)).toEqual(txRequestLike.gasPrice);
      expect(toNumber(txRequest.gasLimit)).toEqual(txRequestLike.gasLimit);
      expect(txRequest.maturity).toEqual(txRequestLike.maturity);
      expect(txRequest.inputs).toEqual(txRequestLike.inputs);
      expect(txRequest.outputs).toEqual(txRequestLike.outputs);
      expect(txRequest.witnesses).toEqual(txRequestLike.witnesses);
    });

    it('should throw error if invalid transaction type', () => {
      const txRequestLike = {
        type: 5,
        gasPrice: 1,
      };

      expect(() => transactionRequestify(txRequestLike)).toThrow('Invalid transaction type: 5');
    });
  });

  describe('getRequiredCoins', () => {
    const assetId1 = '0x0101010101010101010101010101010101010101010101010101010101010101';
    const assetId2 = '0x0202020202020202020202020202020202020202020202020202020202020202';

    type AssertType = {
      length: number;
      coinQuantities: CoinQuantityLikeObject[];
      expectedAmounts: Record<string, BN>;
    };

    const assertRequiredCoins = (assert: AssertType) => {
      const { expectedAmounts, coinQuantities, length } = assert;

      expect(coinQuantities.length).toBe(length);

      coinQuantities.forEach((quantity) => {
        const { amount, assetId } = quantity;
        expect(Number(expectedAmounts[String(assetId)])).toBe(Number(amount));
      });
    };

    it('should properly get required coins quantities [W/ BASE ASSET ONLY]', () => {
      const fee = bn(10);
      const amount = bn(700);
      const transactionRequest = new ScriptTransactionRequest();

      transactionRequest.addCoinOutput(Address.fromRandom(), amount);

      const coinQuantities = transactionRequest.getRequiredCoins(fee);

      assertRequiredCoins({
        length: 1,
        coinQuantities,
        expectedAmounts: {
          [assetId1]: amount,
          [String(BaseAssetId)]: amount.add(fee),
        },
      });
    });

    it('should properly get required coins quantities [W/O BASE ASSET]', () => {
      const fee = bn(89);

      const amount1 = bn(1200);
      const amount2 = bn(800);

      const transactionRequest = new ScriptTransactionRequest();

      transactionRequest.addCoinOutput(Address.fromRandom(), amount1, assetId1);
      transactionRequest.addCoinOutput(Address.fromRandom(), amount2, assetId2);

      const coinQuantities = transactionRequest.getRequiredCoins(fee);

      assertRequiredCoins({
        length: 3,
        coinQuantities,
        expectedAmounts: {
          [assetId1]: amount1,
          [assetId2]: amount2,
          [String(BaseAssetId)]: fee,
        },
      });
    });

    it('should properly get required coins quantities [W/ BASE ASSET AND OTHERS]', () => {
      const fee = bn(99);

      const amount1 = bn(1200);
      const amount2 = bn(800);
      const amount3 = bn(500);

      const transactionRequest = new ScriptTransactionRequest();

      transactionRequest.addCoinOutput(Address.fromRandom(), amount1, assetId1);
      transactionRequest.addCoinOutput(Address.fromRandom(), amount2, assetId2);
      transactionRequest.addCoinOutput(Address.fromRandom(), amount3, BaseAssetId);

      const requiredCoins = transactionRequest.getRequiredCoins(fee);

      assertRequiredCoins({
        length: 3,
        coinQuantities: requiredCoins,
        expectedAmounts: {
          [assetId1]: amount1,
          [assetId2]: amount2,
          [String(BaseAssetId)]: amount3.add(fee),
        },
      });
    });
  });
});
