// Encrypted-at-rest local store (T1).
//
// Local-first and on-device only: no cloud, no network, no bank integration.
// Domain entities are persisted to an MMKV store whose contents are encrypted
// with a per-install key. The key itself is generated once and held in the
// platform secure keystore (Expo SecureStore → iOS Keychain / Android Keystore),
// so the on-disk data is unreadable without the hardware-backed key.

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { MMKV } from 'react-native-mmkv';

const ENCRYPTION_KEY_ID = 'kira.store.encryptionKey';

/** Fetch the store encryption key, generating and persisting it on first run. */
async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
  if (existing) {
    return existing;
  }
  const bytes = Crypto.getRandomBytes(32);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

/** A minimal typed key→JSON store over an encrypted MMKV instance. */
export class EncryptedStore {
  private constructor(private readonly mmkv: MMKV) {}

  /** Open (or create) the encrypted store. Call once at app start. */
  static async open(id = 'kira.default'): Promise<EncryptedStore> {
    const encryptionKey = await getOrCreateEncryptionKey();
    return new EncryptedStore(new MMKV({ id, encryptionKey }));
  }

  read<T>(key: string): T | undefined {
    const raw = this.mmkv.getString(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }

  write<T>(key: string, value: T): void {
    this.mmkv.set(key, JSON.stringify(value));
  }

  delete(key: string): void {
    this.mmkv.delete(key);
  }
}
