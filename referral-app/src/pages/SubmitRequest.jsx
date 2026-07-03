import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db, SERVICE_CATEGORIES, REQUEST_STATUS } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { popReferralCode } from '../utils/referral'

export default function SubmitRequest() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    category: SERVICE_CATEGORIES[0],
    customerName: '',
    customerNumber: '',
    notes: '',
    referralId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // If they arrived via a /ref/ABC123 link, pre-fill the ID field once.
  useEffect(() => {
    const stashed = popReferralCode()
    if (stashed) setForm((f) => ({ ...f, referralId: stashed }))
  }, [])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName.trim() || !form.customerNumber.trim()) {
      setError('Customer name and number are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      // Resolve the entered Referral ID to a uid to credit. Falls back to
      // whoever originally referred this account, if any.
      let referrerUid = profile?.referredByUid || null
      const code = form.referralId.trim().toUpperCase()
      if (code) {
        const codeSnap = await getDoc(doc(db, 'referralCodes', code))
        if (!codeSnap.exists()) {
          setError(`Referral ID "${code}" was not found — check it and try again, or leave it blank.`)
          setSubmitting(false)
          return
        }
        referrerUid = codeSnap.data().uid
      }

      await addDoc(collection(db, 'requests'), {
        category: form.category,
        customerName: form.customerName.trim(),
        customerNumber: form.customerNumber.trim(),
        notes: form.notes.trim() || null,
        submittedByUid: user.uid,
        submittedByName: profile?.name || user.displayName,
        submittedByEmail: user.email,
        referrerUid,
        status: REQUEST_STATUS.PENDING,
        quotationAmount: null,
        pointsAwarded: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-12">
      <p className="eyebrow mb-2">New service request</p>
      <h1 className="font-display text-2xl mb-8">Tell us about the job</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Referral ID (optional)</label>
          <input
            value={form.referralId}
            onChange={update('referralId')}
            className="input font-mono uppercase"
            placeholder="e.g. AB12CD"
          />
          <p className="text-xs text-ink/40 mt-1">Got an ID from someone? Enter it here so they get credit.</p>
        </div>
        <div>
          <label className="label">Service category</label>
          <select value={form.category} onChange={update('category')} className="input">
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Customer name</label>
          <input value={form.customerName} onChange={update('customerName')} className="input" placeholder="e.g. Nimal Perera" />
        </div>
        <div>
          <label className="label">Customer contact number</label>
          <input value={form.customerNumber} onChange={update('customerNumber')} className="input" placeholder="07X XXX XXXX" />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea value={form.notes} onChange={update('notes')} className="input min-h-[88px]" placeholder="Anything the team should know before quoting" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </div>
  )
}
