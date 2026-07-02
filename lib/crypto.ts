// PIN을 AES-256 GCM 키로 변환 (PBKDF2)
async function deriveKey(pin: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const salt = hexToBuffer(saltHex);
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// 텍스트 암호화 -> "saltHex:ivHex:cipherHex"
const STATIC_SALT_HEX = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const keyCache = new Map<string, CryptoKey>();

async function getDerivedKeyCached(pin: string, saltHex: string): Promise<CryptoKey> {
  const cacheKey = `${pin}:${saltHex}`;
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey)!;
  }
  const key = await deriveKey(pin, saltHex);
  keyCache.set(cacheKey, key);
  return key;
}

export async function encryptText(plainText: string, pin: string): Promise<string> {
  if (!plainText) return plainText;
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await getDerivedKeyCached(pin, STATIC_SALT_HEX);
    const enc = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      enc.encode(plainText)
    );

    return `${STATIC_SALT_HEX}:${bufferToHex(iv)}:${bufferToHex(encrypted)}`;
  } catch (error) {
    console.error("Encryption error", error);
    throw new Error("암호화 실패");
  }
}

export async function decryptText(cipherText: string, pin: string): Promise<string> {
  if (!cipherText) return cipherText;
  if (cipherText.startsWith("DEMO_PLAIN:")) return cipherText.replace("DEMO_PLAIN:", "");
  if (!cipherText.includes(":")) return cipherText; // 레거시 평문 처리 (하위호환성)
  
  try {
    const [saltHex, ivHex, encHex] = cipherText.split(":");
    const key = await getDerivedKeyCached(pin, saltHex);
    const iv = hexToBuffer(ivHex);
    const encryptedData = hexToBuffer(encHex);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      encryptedData as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    return "🔐 [해독 불가: PIN 불일치]";
  }
}
