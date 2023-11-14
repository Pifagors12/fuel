import { mergeDeepRight } from 'ramda';
import type { PartialDeep } from 'type-fest';

import type { ProviderOptions } from '../..';
import { Provider } from '../..';

import { defaultChainConfig } from './defaultChainConfig';
import type { ChainConfig } from './fuel-node-interfaces';
import type { LaunchNodeResult, LaunchTestNodeOptions } from './launchTestNode';
import { launchTestNode } from './launchTestNode';

export interface SetupTestProviderOptions {
  /** Options for configuring the provider. */
  providerOptions: Partial<ProviderOptions>;
  /** Options for configuring the test node. */
  nodeOptions: Partial<
    Omit<LaunchTestNodeOptions, 'chainConfig'> & {
      chainConfig: PartialDeep<ChainConfig>;
    }
  >;
}

export async function setupTestProvider<
  Dispose extends boolean = true,
  R = Dispose extends true
    ? Provider & AsyncDisposable
    : { provider: Provider } & Pick<Awaited<LaunchNodeResult>, 'cleanup'>,
>(options?: Partial<SetupTestProviderOptions>, dispose?: Dispose): Promise<R> {
  // @ts-expect-error this is a polyfill (see https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management)
  Symbol.dispose ??= Symbol('Symbol.dispose');
  // @ts-expect-error this is a polyfill (see https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management)
  Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');

  const nodeOptions: Partial<LaunchTestNodeOptions> = {
    ...options?.nodeOptions,
    chainConfig: mergeDeepRight(defaultChainConfig, options?.nodeOptions?.chainConfig || {}),
  };

  const { cleanup, url } = await launchTestNode(nodeOptions);

  try {
    const provider = await Provider.create(url, options?.providerOptions);

    return (
      dispose ?? true
        ? Object.assign(provider, {
            [Symbol.asyncDispose]: cleanup,
          })
        : {
            provider,
            cleanup,
          }
    ) as R;
  } catch (err) {
    await cleanup();
    throw err;
  }
}
