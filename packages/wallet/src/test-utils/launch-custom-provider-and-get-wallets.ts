import type { Provider } from '@fuel-ts/providers';
import { setupTestProvider } from '@fuel-ts/providers/test-utils';
import type { SetupTestProviderOptions } from '@fuel-ts/providers/test-utils';

import type { WalletUnlocked } from '../wallets';

import { WalletConfig } from './wallet-config';

export interface LaunchCustomProviderAndGetWalletsOptions extends SetupTestProviderOptions {
  /** Configures the wallets that should exist in the genesis block of a node. */
  walletConfig: WalletConfig;
}

export async function launchCustomProviderAndGetWallets<
  Dispose extends boolean = true,
  ReturnType = {
    wallets: WalletUnlocked[];
    provider: Provider;
  } & (Dispose extends true ? AsyncDisposable : { cleanup: () => Promise<void> }),
>(
  {
    walletConfig = new WalletConfig(),
    providerOptions,
    nodeOptions = {},
  }: Partial<LaunchCustomProviderAndGetWalletsOptions> = {},
  dispose?: Dispose
): Promise<ReturnType> {
  const wallets = walletConfig.wallets;

  const chainConfig = walletConfig.apply(nodeOptions.chainConfig);

  const { provider, cleanup } = await setupTestProvider(
    {
      providerOptions,
      nodeOptions: {
        ...nodeOptions,
        chainConfig,
      },
    },
    false
  );

  wallets.forEach((wallet) => {
    wallet.connect(provider);
  });

  return (
    dispose ?? true
      ? {
          wallets,
          provider,
          [Symbol.asyncDispose]: cleanup,
        }
      : {
          wallets,
          provider,
          cleanup,
        }
  ) as ReturnType;
}
