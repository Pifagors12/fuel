import { FuelError } from '@fuel-ts/errors';
import { expectToThrowFuelError } from '@fuel-ts/errors/test-utils';

import { WalletConfig } from './wallet-config';

describe('WalletConfig', () => {
  it('throws on invalid number of wallets', async () => {
    await expectToThrowFuelError(
      () => new WalletConfig({ numWallets: -1 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of wallets must be greater than zero.'
      )
    );

    await expectToThrowFuelError(
      () => new WalletConfig({ numWallets: 0 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of wallets must be greater than zero.'
      )
    );
  });

  it('throws on invalid number of assets', async () => {
    await expectToThrowFuelError(
      () => new WalletConfig({ numOfAssets: -1 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of assets per wallet must be greater than zero.'
      )
    );

    await expectToThrowFuelError(
      () => new WalletConfig({ numOfAssets: 0 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of assets per wallet must be greater than zero.'
      )
    );
  });

  it('throws on invalid number of coins per asset', async () => {
    await expectToThrowFuelError(
      () => new WalletConfig({ coinsPerAsset: -1 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of coins per asset must be greater than zero.'
      )
    );

    await expectToThrowFuelError(
      () => new WalletConfig({ coinsPerAsset: 0 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Number of coins per asset must be greater than zero.'
      )
    );
  });

  it('throws on invalid amount per coin', async () => {
    await expectToThrowFuelError(
      () => new WalletConfig({ amountPerCoin: -1 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Amount per coin must be greater than zero.'
      )
    );

    await expectToThrowFuelError(
      () => new WalletConfig({ amountPerCoin: 0 }),
      new FuelError(
        FuelError.CODES.INVALID_WALLET_CONFIG,
        'Amount per coin must be greater than zero.'
      )
    );
  });
});
