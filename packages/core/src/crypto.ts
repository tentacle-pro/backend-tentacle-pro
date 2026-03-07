/**
 * AES-GCM 加密/解密工具
 * 密钥通过环境变量 ENCRYPTION_KEY 注入（32 字节长度的 base64 字符串）
 * 密文格式：`<iv_base64>:<ciphertext_base64>`
 */

const ALGORITHM = 'AES-GCM'
const IV_LENGTH = 12 // bytes

function getKey(): Promise<CryptoKey> {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set')
  const keyBytes = Buffer.from(raw, 'base64')
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ])
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )
  const ivB64 = Buffer.from(iv).toString('base64')
  const ctB64 = Buffer.from(cipherBuffer).toString('base64')
  return `${ivB64}:${ctB64}`
}

export async function decrypt(token: string): Promise<string> {
  const key = await getKey()
  const [ivB64, ctB64] = token.split(':')
  if (!ivB64 || !ctB64) throw new Error('Invalid encrypted token format')
  const iv = Buffer.from(ivB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ct
  )
  return new TextDecoder().decode(plainBuffer)
}

/** SHA-256 哈希（用于存储 API_KEY） */
export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Buffer.from(hashBuffer).toString('hex')
}
