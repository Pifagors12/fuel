/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BytesLike } from '@ethersproject/bytes';
import { arrayify } from '@ethersproject/bytes';
import { Interface } from '@fuel-ts/abi-coder';
import type { InputValue, JsonAbi } from '@fuel-ts/abi-coder';
import { AbstractScript } from '@fuel-ts/interfaces';
import type { BN } from '@fuel-ts/math';
import type { ScriptRequest } from '@fuel-ts/program';
import type { Provider } from '@fuel-ts/providers';
import type { Account } from '@fuel-ts/wallet';

import { ScriptInvocationScope } from './script-invocation-scope';

type Result<T> = {
  value: T | BN | undefined;
  logs: unknown[];
};

type InvokeMain<TArgs extends Array<any> = Array<any>, TReturn = any> = (
  ...args: TArgs
) => ScriptInvocationScope<TArgs, TReturn>;

export class Script<
  TInput extends Array<any>,
  TOutput,
  const TAbi extends JsonAbi = JsonAbi
> extends AbstractScript {
  bytes: Uint8Array;
  interface: Interface<TAbi>;
  account: Account;
  script!: ScriptRequest<InputValue<void>[], Result<TOutput>>;
  provider: Provider;
  functions: { main: InvokeMain<TInput, TOutput> };

  constructor(bytecode: BytesLike, abi: TAbi, account: Account) {
    super();
    this.bytes = arrayify(bytecode);
    this.interface = new Interface(abi);

    this.provider = account.provider;
    this.account = account;

    this.functions = {
      main: (...args: TInput) =>
        new ScriptInvocationScope(this, this.interface.getFunction('main'), args),
    };
  }

  setConfigurableConstants<CName extends Parameters<typeof this.interface.encodeConfigurable>[0]>(
    configurables: CName
  ) {
    try {
      if (!Object.keys(this.interface.configurables).length) {
        throw new Error('Script has no configurable constants to be set');
      }

      Object.entries(configurables).forEach(([key, value]) => {
        if (!this.interface.configurables[key]) {
          throw new Error(`Script has no configurable constant named: ${key}`);
        }

        const { offset } = this.interface.configurables[key];

        const encoded = this.interface.encodeConfigurable(key, value);

        this.bytes.set(encoded, offset);
      });
    } catch (err) {
      throw new Error(`Error setting configurable: ${err}`);
    }

    return this;
  }
}
