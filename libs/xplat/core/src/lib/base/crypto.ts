import { slice } from 'ramda';
import CryptoJS from 'crypto-js';

export const decrypt = (encrypted: string, key: string) => {
  const decrypted = CryptoJS.AES.decrypt(encrypted, key);
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  return plaintext;
};

export const getStringKey = (url: string) =>
  slice(0, 32, url + 'gggggggggggggggggggggggggggggggg');

export const getPlayHash = (url: string, encryptedHash: string) => {
  try {
    const hash = decrypt(encryptedHash, getStringKey(url));
    return hash;
  } catch (err) {
    throw new Error(`Not able to decode play hash ${err.code}: ${err.message}`);
  }
};
