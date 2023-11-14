import { FuelError } from '@fuel-ts/errors';
import { expectToThrowFuelError } from '@fuel-ts/errors/test-utils';
import fs from 'fs';
import fsAsync from 'fs/promises';
import http from 'http';
import { parse } from 'url';

import { sleepUntilTrue } from '../sleep';

import { defaultChainConfig } from './defaultChainConfig';
import { launchTestNode } from './launchTestNode';

async function nodeIsRunning(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(parse(url), () => {
      resolve(true);
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

describe('launchNode', () => {
  afterAll(() => jest.clearAllMocks());

  it('throws an error if the node fails to start due to bad input', async () => {
    await expectToThrowFuelError(
      async () => {
        const badCoin = { amount: '0', asset_id: '3212', owner: '4343' };

        await launchTestNode({
          chainConfig: {
            ...defaultChainConfig,
            initial_state: {
              coins: [badCoin],
              messages: [],
            },
          },
        });
      },
      {
        code: FuelError.CODES.INVALID_INPUT_PARAMETERS,
      }
    );
  });

  it('cleanup kills the started node', async () => {
    const { cleanup, url } = await launchTestNode();
    expect(await nodeIsRunning(url)).toBe(true);

    await cleanup();

    expect(await nodeIsRunning(url)).toBe(false);
  });

  it('can launch a node on a specific port', async () => {
    const port = '5678';
    const { cleanup, url } = await launchTestNode({ port });
    const ip = url.split(/\d*\/graphql$/)[0];
    const expectedUrl = `${ip}:${port}/graphql`;
    expect(await nodeIsRunning(expectedUrl)).toBe(true);

    await cleanup();
  });

  it('creates a temporary config file on launch and deletes it on cleanup', async () => {
    const fsSpy = jest.spyOn(fsAsync, 'writeFile');

    const { cleanup } = await launchTestNode();

    const tempFilePath = fsSpy.mock.calls[0][0] as string;
    expect(fs.existsSync(tempFilePath));

    await cleanup();

    expect(!fs.existsSync(tempFilePath));
  });

  it("can be given a logger function to access the node's logs as they're printed out", async () => {
    const logs = [];
    const { cleanup } = await launchTestNode({
      logger: (text) => {
        logs.push(text);
      },
    });

    await cleanup();

    expect(logs.length).toBeGreaterThan(0);
  });

  it('kills node on event:exit', async () => {
    const { url } = await launchTestNode();

    process.emit('exit', 0);

    // give time for cleanup to kill the node
    await sleepUntilTrue(async () => !(await nodeIsRunning(url)), 500);

    expect(await nodeIsRunning(url)).toBe(false);
  });

  it('kills node on event:SIGINT (ctrl+c)', async () => {
    const { url } = await launchTestNode();

    process.emit('SIGINT');

    await sleepUntilTrue(async () => !(await nodeIsRunning(url)), 500);

    expect(await nodeIsRunning(url)).toBe(false);
  });

  it('kills node on event:SIGUSR1', async () => {
    const { url } = await launchTestNode();

    process.emit('SIGUSR1');

    await sleepUntilTrue(async () => !(await nodeIsRunning(url)), 500);

    expect(await nodeIsRunning(url)).toBe(false);
  });

  it('kills node on event:SIGUSR2', async () => {
    const { url } = await launchTestNode();

    process.emit('SIGUSR2');

    await sleepUntilTrue(async () => !(await nodeIsRunning(url)), 500);

    expect(await nodeIsRunning(url)).toBe(false);
  });

  it('kills node on event:uncaughtException', async () => {
    const { url } = await launchTestNode();

    process.emit('uncaughtException', new Error());

    await sleepUntilTrue(async () => !(await nodeIsRunning(url)), 500);

    expect(await nodeIsRunning(url)).toBe(false);
  });
});
