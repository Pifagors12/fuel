import { generateTestWallet } from '@fuel-ts/wallet/test-utils';
import { readFileSync } from 'fs';
import type { Contract } from 'fuels';
import { ContractFactory, NativeAssetId, Provider } from 'fuels';
import { createClient as createSSEClient } from 'graphql-sse';
import { join } from 'path';
import { Observable } from 'rxjs';

import abi from '../test-projects/storage-test-contract/out/debug/storage-test-abi.json';
import storageSlots from '../test-projects/storage-test-contract/out/debug/storage-test-storage_slots.json';

const sseClient = createSSEClient({
  url: 'http://127.0.0.1:4000/graphql/stream',
  onMessage: (message) => {
    console.log('incoming message', message);
  },
});

function toObservable(operation: any) {
  return new Observable((observer) =>
    sseClient.subscribe(operation, {
      next: (data) => observer.next(data),
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    })
  );
}

const setup = async () => {
  const provider = new Provider('http://127.0.0.1:4000/graphql');
  // Create wallet
  const wallet = await generateTestWallet(provider, [[1_000, NativeAssetId]]);

  // Deploy contract
  const bytecode = readFileSync(
    join(__dirname, '../test-projects/storage-test-contract/out/debug/storage-test.bin')
  );
  const factory = new ContractFactory(bytecode, abi, wallet);
  const contract = await factory.deployContract({
    storageSlots,
  });

  return contract;
};

let contractInstance: Contract;

beforeAll(async () => {
  contractInstance = await setup();
});

test('submit tx test', async () => {
  await contractInstance.functions.initialize_counter(1300).call();

  const { transactionId, transactionResponse } = await contractInstance.functions
    .increment_counter(37)
    .call();

  const observable = toObservable({
    query: `
    subscription statusChange {
      statusChange(id: "${transactionId}") {
        __typename
      }
    }
  `,
  });

  const subscription = observable.subscribe({
    next: (data) => console.log(data),
  });

  // wait for 15 seconds and then unsubscribe, don't let jest close the test
  await new Promise((resolve) => {
    setTimeout(() => subscription.unsubscribe(), 10000);
  });
});

test.only('get latest block timestamp', async () => {
  const provider = new Provider('http://127.0.0.1:4000/graphql');
  const latestBlock = await provider.getBlock('latest');
  console.log(latestBlock?.time);
});
