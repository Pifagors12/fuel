import { TestNodeLauncher } from '@fuel-ts/test-utils';
import { WalletUnlocked, Predicate, BaseAssetId, BN, getRandomB256 } from 'fuels';

import { SnippetProjectEnum, getSnippetProjectArtifacts } from '../../../projects';

/**
 * @group node
 */
describe(__filename, () => {
  const { abiContents: abi, binHexlified: bin } = getSnippetProjectArtifacts(
    SnippetProjectEnum.WHITELISTED_ADDRESS_PREDICATE
  );

  beforeAll(async (ctx) => {
    await TestNodeLauncher.prepareCache(ctx.tasks.length);

    return () => TestNodeLauncher.killCachedNodes();
  });

  it('should successfully tranfer to setted whitelisted address', async () => {
    await using launched = await TestNodeLauncher.launch();
    const {
      wallets: [wallet],
      provider,
    } = launched;
    const { minGasPrice: gasPrice } = provider.getGasConfig();

    // #region predicate-with-configurable-constants-2
    const newWhitelistedAddress = getRandomB256();

    const configurable = { WHITELISTED: newWhitelistedAddress };
    // instantiate predicate with configurable constants
    const predicate = new Predicate(bin, wallet.provider, abi, configurable);

    // set predicate data to be the same as the configurable constant
    predicate.setData(configurable.WHITELISTED);

    // transferring funds to the predicate
    const tx1 = await wallet.transfer(predicate.address, 500_000, BaseAssetId, { gasPrice });

    await tx1.waitForResult();

    const destinationWallet = WalletUnlocked.generate({
      provider: wallet.provider,
    });

    const amountToTransfer = 100;

    // transferring funds from the predicate to destination if predicate returns true
    const tx2 = await predicate.transfer(destinationWallet.address, amountToTransfer, BaseAssetId, {
      gasPrice,
    });

    await tx2.waitForResult();
    // #endregion predicate-with-configurable-constants-2

    const destinationBalance = await destinationWallet.getBalance(BaseAssetId);

    expect(new BN(destinationBalance).toNumber()).toEqual(amountToTransfer);
  });

  it('should successfully tranfer to default whitelisted address', async () => {
    await using launched = await TestNodeLauncher.launch();
    const {
      wallets: [wallet],
      provider,
    } = launched;
    const { minGasPrice: gasPrice } = provider.getGasConfig();

    // #region predicate-with-configurable-constants-3
    const predicate = new Predicate(bin, wallet.provider, abi);

    // set predicate data to be the same as the configurable constant
    predicate.setData('0xa703b26833939dabc41d3fcaefa00e62cee8e1ac46db37e0fa5d4c9fe30b4132');

    // transferring funds to the predicate
    const tx1 = await wallet.transfer(predicate.address, 300_000, BaseAssetId, { gasPrice });

    await tx1.waitForResult();

    const destinationWallet = WalletUnlocked.generate({
      provider: wallet.provider,
    });

    const amountToTransfer = 100;

    // transferring funds from the predicate to destination if predicate returns true
    const tx2 = await predicate.transfer(destinationWallet.address, amountToTransfer, BaseAssetId, {
      gasPrice,
    });

    await tx2.waitForResult();
    // #endregion predicate-with-configurable-constants-3

    const destinationBalance = await destinationWallet.getBalance(BaseAssetId);

    expect(new BN(destinationBalance).toNumber()).toEqual(amountToTransfer);
  });
});
