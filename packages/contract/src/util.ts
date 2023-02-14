import type { BytesLike, DataOptions } from '@ethersproject/bytes';
import { isHexString, hexlify, arrayify, concat } from '@ethersproject/bytes';
import { sha256 } from '@ethersproject/sha2';
import type { ContractId } from '@fuel-ts/interfaces';
import { calcRoot } from '@fuel-ts/merkle';
import SparseMerkleTree from '@fuel-ts/sparsemerkle';
import type { StorageSlot } from '@fuel-ts/transactions';

import { Contract } from './index';

export const getContractRoot = (bytecode: Uint8Array): string => {
  const chunkSize = 8;
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytecode.length; offset += chunkSize) {
    const chunk = new Uint8Array(chunkSize);
    chunk.set(bytecode.slice(offset, offset + chunkSize));
    chunks.push(chunk);
  }
  return calcRoot(chunks.map((c) => hexlify(c)));
};

export const getContractStorageRoot = (storageSlots: StorageSlot[]): string => {
  const tree = new SparseMerkleTree();

  storageSlots.forEach(({ key, value }) => tree.update(key, value));

  return tree.root;
};

export const getContractId = (
  bytecode: BytesLike,
  salt: BytesLike,
  stateRoot: BytesLike
): string => {
  const root = getContractRoot(arrayify(bytecode));
  const contractId = sha256(concat(['0x4655454C', salt, root, stateRoot]));
  return contractId;
};

/**
 * Generic assert function to avoid undesirable errors
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const includeHexPrefix = (value: string, options?: DataOptions) =>
  hexlify(value, {
    ...options,
    allowMissingPrefix: true,
  });

export function isContractId(address: string): address is ContractId {
  return address.length === 66 && /0x[0-9a-f]{64}$/i.test(address);
}

export function assertContractId(address: string): asserts address is ContractId {
  if (!isContractId(address)) {
    throw new Error(`Invalid contract id: ${address}`);
  }
}
