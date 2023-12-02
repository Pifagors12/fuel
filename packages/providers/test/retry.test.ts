import { safeExec } from '@fuel-ts/errors/test-utils';

import Provider from '../src/provider';

// TODO: Figure out a way to import this constant from `@fuel-ts/wallet/configs`
const FUEL_NETWORK_URL = 'http://127.0.0.1:4000/graphql';

function mockFetch(maxAttempts: number, callTimes: number[]) {
  const fetchSpy = jest.spyOn(global, 'fetch');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore TS is throwing error when test is run, but not in IDE
  fetchSpy.mockImplementation((input: RequestInfo | URL, init: RequestInit | undefined) => {
    callTimes.push(Date.now());

    if (fetchSpy.mock.calls.length <= maxAttempts) {
      const error = new Error();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore TS is throwing error when test is run, but not in IDE
      error.cause = {
        code: 'ECONNREFUSED',
      };

      throw error;
    }

    fetchSpy.mockRestore();

    return fetch(input, init);
  });
}

describe('Retries correctly', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const maxAttempts = 4;
  const duration = 150;

  function assertBackoff(callTime: number, index: number, arr: number[], expectedWaitTime: number) {
    if (index === 0) {
      return;
    } // initial call doesn't count as it's not a retry

    const waitTime = callTime - arr[index - 1];

    // in one test run the waitTime was 1ms less than the expectedWaitTime
    // meaning that the call happened before the wait duration expired
    // this might be something related to the event loop and how it schedules setTimeouts
    // expectedWaitTime minus 5ms seems like reasonable to allow
    expect(waitTime).toBeGreaterThanOrEqual(expectedWaitTime - 5);
    expect(waitTime).toBeLessThanOrEqual(expectedWaitTime + 10);
  }

  test('fixed backoff', async () => {
    const retryOptions = { maxAttempts, baseDuration: duration, backoff: 'fixed' as const };

    const provider = await Provider.create(FUEL_NETWORK_URL, { retryOptions });
    const callTimes: number[] = [];

    mockFetch(maxAttempts, callTimes);

    const expectedChainInfo = await provider.operations.getChain();

    const chainInfo = await provider.operations.getChain();

    expect(chainInfo).toEqual(expectedChainInfo);
    expect(callTimes.length - 1).toBe(maxAttempts); // callTimes.length - 1 is for the initial call that's not a retry so we ignore it

    callTimes.forEach((callTime, index) => assertBackoff(callTime, index, callTimes, duration));
  });

  test('linear backoff', async () => {
    const retryOptions = { maxAttempts, baseDuration: duration, backoff: 'linear' as const };

    const provider = await Provider.create(FUEL_NETWORK_URL, { retryOptions });
    const callTimes: number[] = [];

    mockFetch(maxAttempts, callTimes);

    const expectedChainInfo = await provider.operations.getChain();

    const chainInfo = await provider.operations.getChain();

    expect(chainInfo).toEqual(expectedChainInfo);
    expect(callTimes.length - 1).toBe(maxAttempts); // callTimes.length - 1 is for the initial call that's not a retry so we ignore it

    callTimes.forEach((callTime, index) =>
      assertBackoff(callTime, index, callTimes, duration * index)
    );
  });

  test('exponential backoff', async () => {
    const retryOptions = { maxAttempts, baseDuration: duration, backoff: 'exponential' as const };

    const provider = await Provider.create(FUEL_NETWORK_URL, { retryOptions });
    const callTimes: number[] = [];

    mockFetch(maxAttempts, callTimes);

    const expectedChainInfo = await provider.operations.getChain();

    const chainInfo = await provider.operations.getChain();

    expect(chainInfo).toEqual(expectedChainInfo);
    expect(callTimes.length - 1).toBe(maxAttempts); // callTimes.length - 1 is for the initial call that's not a retry so we ignore it

    callTimes.forEach((callTime, index) =>
      assertBackoff(callTime, index, callTimes, duration * (2 ^ (index - 1)))
    );
  });

  test('throws if last attempt fails', async () => {
    const retryOptions = { maxAttempts, baseDuration: duration, backoff: 'fixed' as const };

    const provider = await Provider.create(FUEL_NETWORK_URL, { retryOptions });

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore TS is throwing error when test is run, but not in IDE
      .mockImplementation(() => {
        const error = new Error();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TS is throwing error when test is run, but not in IDE
        error.cause = {
          code: 'ECONNREFUSED',
        };

        throw error;
      });

    const { error } = await safeExec(() => provider.operations.getChain());

    expect(error).toMatchObject({ cause: { code: 'ECONNREFUSED' } });
    // the added one is for the initial call which isn't considered a retry attempt
    expect(fetchSpy).toHaveBeenCalledTimes(maxAttempts + 1);
  });
});
