import { FuelError } from '@fuel-ts/errors';
import { expectToThrowFuelError, safeExec } from '@fuel-ts/errors/test-utils';
import { Provider } from '@fuel-ts/providers';
import type { ChainConfig } from '@fuel-ts/providers/test-utils';
import { WalletConfig } from '@fuel-ts/wallet/test-utils';
import { randomInt, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import { writeFile } from 'fs/promises';
import os from 'os';
import { join } from 'path';

import { TestNodeLauncher } from './test-node-launcher';

const pathToContractRootDir = join(__dirname, '../../test/fixtures/simple-contract');

async function generateChainConfigFile(chainName: string): Promise<[string, () => void]> {
  const chainConfig = JSON.parse(
    readFileSync(
      join(__dirname, '../../../../', '.fuel-core', 'configs', 'chainConfig.json'),
      'utf-8'
    )
  ) as ChainConfig;

  chainConfig.chain_name = chainName;

  const tempDirPath = join(os.tmpdir(), '.fuels-ts', randomUUID());

  if (!existsSync(tempDirPath)) {
    mkdirSync(tempDirPath, { recursive: true });
  }
  const chainConfigPath = join(tempDirPath, '.chainConfig.json');

  // Write a temporary chain configuration file.
  await writeFile(chainConfigPath, JSON.stringify(chainConfig), 'utf-8');

  return [chainConfigPath, () => rmSync(tempDirPath, { recursive: true, force: true })];
}

describe('TestNodeLauncher', () => {
  test('kills the node after going out of scope', async () => {
    let url = '';

    {
      await using launched = await TestNodeLauncher.launch();

      const { provider } = launched;

      url = provider.url;
      await provider.getBlockNumber();
    }

    const { error } = await safeExec(async () => {
      const p = await Provider.create(url);
      await p.getBlockNumber();
    });

    expect(error).toMatchObject({
      code: 'ECONNREFUSED',
    });
  });

  test('kills the node if error happens post-launch', async () => {
    const port = '9876';
    try {
      await TestNodeLauncher.launch({
        nodeOptions: { port },
        deployContracts: [{ contractDir: 'invalid path' }],
      });
    } catch (err) {
      expect(err).toBeDefined();

      const { error } = await safeExec(async () => {
        const url = `http://127.0.0.1:${port}/graphql`;
        const p = await Provider.create(url);
        await p.getBlockNumber();
      });

      expect(error).toMatchObject({
        code: 'ECONNREFUSED',
      });

      return;
    }

    // Should never reach here; using fail() gives a ReferenceError and would crash the whole program
    expect(false).toBe(true);
  });

  test('a contract can be deployed', async () => {
    await using launched = await TestNodeLauncher.launch({
      deployContracts: [{ contractDir: pathToContractRootDir }],
    });

    const {
      contracts: [contract],
    } = launched;

    const gasPrice = contract.provider.getGasConfig().minGasPrice;

    const response = await contract.functions.test_function().txParams({ gasPrice }).call();
    expect(response.value).toBe(true);
  });

  test('a contract can be deployed by providing just the path', async () => {
    // #region TestNodeLauncher-deploy-contract
    await using launched = await TestNodeLauncher.launch({
      deployContracts: [pathToContractRootDir],
    });

    const {
      contracts: [contract],
    } = launched;
    const gasPrice = contract.provider.getGasConfig().minGasPrice;

    const response = await contract.functions.test_function().txParams({ gasPrice }).call();
    expect(response.value).toBe(true);
    // #endregion TestNodeLauncher-deploy-contract
  });

  test('multiple contracts can be deployed with different wallets', async () => {
    // #region TestNodeLauncher-multiple-contracts-and-wallets
    await using launched = await TestNodeLauncher.launch({
      walletConfig: new WalletConfig({ wallets: 2 }),
      deployContracts: [
        { contractDir: pathToContractRootDir },
        { contractDir: pathToContractRootDir, walletIndex: 1 },
      ],
    });

    const {
      contracts: [contract1, contract2],
      wallets: [wallet1, wallet2],
    } = launched;
    // #endregion TestNodeLauncher-multiple-contracts-and-wallets

    const gasPrice = contract1.provider.getGasConfig().minGasPrice;

    const contract1Response = (
      await contract1.functions.test_function().txParams({ gasPrice }).call()
    ).value;
    const contract2Response = (
      await contract2.functions.test_function().txParams({ gasPrice }).call()
    ).value;

    expect(contract1Response).toBe(true);
    expect(contract2Response).toBe(true);

    expect(contract1.account).toEqual(wallet1);
    expect(contract2.account).toEqual(wallet2);
  });

  test('throws on invalid walletIndex', async () => {
    await expectToThrowFuelError(
      async () => {
        await TestNodeLauncher.launch({
          deployContracts: [{ contractDir: pathToContractRootDir, walletIndex: 2 }],
        });
      },
      {
        code: FuelError.CODES.INVALID_INPUT_PARAMETERS,
        message: `Invalid walletIndex 2; wallets array contains 2 elements.`,
      }
    );
  });

  test('can be given different fuel-core args via an environment variable', async () => {
    // #region TestNodeLauncher-custom-fuel-core-args
    process.env.DEFAULT_FUEL_CORE_ARGS = `--min-gas-price 150 --tx-max-depth 20`;

    await using launched = await TestNodeLauncher.launch();
    // #endregion

    const { provider } = launched;

    expect(provider.getGasConfig().minGasPrice.toNumber()).toEqual(150);
    expect(provider.getNode().maxDepth).toEqual(20);
  });

  test('can be given a different base chain config via an environment variable', async () => {
    const chainName = 'gimme_fuel';
    const [chainConfigPath, cleanup] = await generateChainConfigFile(chainName);

    // #region TestNodeLauncher-custom-chain-config
    process.env.DEFAULT_CHAIN_CONFIG_PATH = chainConfigPath;

    await using launched = await TestNodeLauncher.launch();
    // #endregion
    cleanup();

    const { provider } = launched;

    const { name } = await provider.fetchChain();

    expect(name).toEqual(chainName);
  });

  test('chain config from environment variable can be extended manually', async () => {
    const chainName = 'gimme_fuel';
    const [chainConfigPath, cleanup] = await generateChainConfigFile(chainName);

    process.env.DEFAULT_CHAIN_CONFIG_PATH = chainConfigPath;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const max_inputs = randomInt(200);
    await using launched = await TestNodeLauncher.launch({
      nodeOptions: {
        chainConfig: {
          transaction_parameters: {
            max_inputs,
          },
        },
      },
    });

    cleanup();
    const { provider } = launched;

    const {
      name,
      consensusParameters: { maxInputs },
    } = await provider.fetchChain();
    expect(name).toEqual(chainName);
    expect(maxInputs.toNumber()).toEqual(max_inputs);
  });
});
