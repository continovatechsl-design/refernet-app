// Short, human-friendly referral codes (avoids ambiguous chars like 0/O/1/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateReferralCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export const REF_STORAGE_KEY = 'refnet_pending_referral_code'

export function stashReferralCode(code) {
  if (code) sessionStorage.setItem(REF_STORAGE_KEY, code)
}

export function popReferralCode() {
  const code = sessionStorage.getItem(REF_STORAGE_KEY)
  sessionStorage.removeItem(REF_STORAGE_KEY)
  return code
}
