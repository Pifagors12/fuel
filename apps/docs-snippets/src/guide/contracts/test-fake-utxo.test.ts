import type { Contract, BN } from 'fuels';
import { BaseAssetId, InputType, ZeroBytes32, bn, hexlify, InvocationCallResult } from 'fuels';

import { SnippetProjectEnum } from '../../../projects';
import { createAndDeployContractFromProject } from '../../utils';

describe(__filename, () => {
  let contract: Contract;

  beforeAll(async () => {
    contract = await createAndDeployContractFromProject(SnippetProjectEnum.RETURN_CONTEXT);
  });

  it('should successfully execute transaction with `txParams` and `callParams`', async () => {
    const transactionGasLimit = 3_000_000;
    const amount = bn.parseUnits('30');

    console.log('Amount to be fowarded: ', amount.format());
    const invoke = await contract.functions
      .return_context_amount()
      .callParams({
        forward: {
          assetId: BaseAssetId,
          amount,
        },
      })
      .txParams({
        gasLimit: transactionGasLimit,
      });
    const request = await invoke.getTransactionRequest({
      fundTransaction: false,
    });
    request.inputs = request.inputs.filter((i) => i.type !== InputType.Coin);

    request.inputs.push({
      type: InputType.Coin,
      id: `${ZeroBytes32}01`,
      amount: bn.parseUnits('10000'),
      predicateData: '0x',
      predicate: '0x',
      assetId: BaseAssetId,
      owner: contract.account!.address.toB256(),
      txPointer: ZeroBytes32,
      witnessIndex: 0,
    });
    request.witnesses = ['0x'];

    console.dir(request, { depth: null });

    const response = await contract.provider.call(request, {
      utxoValidation: false,
    });
    const { value } = await InvocationCallResult.build<BN>(
      invoke.functionInvocationScopes,
      response,
      invoke.isMultiCall
    );
    console.log('Amount fowarded: ', value.format());
  });
});
