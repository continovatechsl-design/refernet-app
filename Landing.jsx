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

// --- Monthly tiered points calculation ---------------------------------

// "2026-07" style key for the calendar month a Date falls in — used as
// (part of) the doc ID that tracks each referrer's points-earned-this-month.
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// Given a rupee amount and how many points the referrer has already earned
// this calendar month, returns how many points *this* amount earns —
// applying the normal rate up to the monthly threshold, then the bonus
// rate on whatever amount pushes them past it. Rounded to 2 decimals to
// avoid floating point dust.
export function calculateTieredPoints(
  amount,
  cumulativePointsThisMonth,
  {
    normalRate = 0.08,
    bonusRate = 0.10,
    threshold = 100,
    pointValueLkr = 1000,
  } = {}
) {
  const amt = Number(amount) || 0
  const cumulative = Number(cumulativePointsThisMonth) || 0

  if (amt <= 0) return 0

  // Already past the threshold before this invoice — the whole thing is
  // at the bonus rate.
  if (cumulative >= threshold) {
    return round2((amt * bonusRate) / pointValueLkr)
  }

  const pointsAtNormalRate = (amt * normalRate) / pointValueLkr

  // Doesn't cross the threshold — all at the normal rate.
  if (cumulative + pointsAtNormalRate <= threshold) {
    return round2(pointsAtNormalRate)
  }

  // Crosses the threshold partway through this invoice — split it.
  const remainingCapacityPoints = threshold - cumulative
  const amountForRemainingCapacity = (remainingCapacityPoints * pointValueLkr) / normalRate
  const remainingAmount = amt - amountForRemainingCapacity
  const bonusPoints = (remainingAmount * bonusRate) / pointValueLkr

  return round2(remainingCapacityPoints + bonusPoints)
}

function round2(n) {
  return Math.round(n * 100) / 100
}
