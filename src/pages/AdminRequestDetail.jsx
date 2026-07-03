import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore'
import { db, REQUEST_STATUS } from '../firebase'
import StatusBadge from '../components/StatusBadge'

export default function AdminRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [referrer, setReferrer] = useState(null)
  const [quotation, setQuotation] = useState('')
  const [points, setPoints] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'requests', id), (snap) => {
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null
      setReq(data)
      if (data?.quotationAmount != null) setQuotation(String(data.quotationAmount))
    })
    return unsub
  }, [id])

  useEffect(() => {
    if (!req?.referrerUid) {
      setReferrer(null)
      return
    }
    return onSnapshot(doc(db, 'users', req.referrerUid), (snap) => setReferrer(snap.data() || null))
  }, [req?.referrerUid])

  const sendQuotation = async () => {
    if (!quotation) return
    setBusy(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: REQUEST_STATUS.QUOTED,
        quotationAmount: Number(quotation),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'requests', id), { status: REQUEST_STATUS.REJECTED, updatedAt: serverTimestamp() })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const markCompleted = async () => {
    const pointsNum = Number(points)
    if (!points || Number.isNaN(pointsNum) || pointsNum < 0) {
      setError('Enter a valid point amount to award.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await runTransaction(db, async (tx) => {
        const reqRef = doc(db, 'requests', id)
        tx.update(reqRef, {
          status: REQUEST_STATUS.COMPLETED,
          pointsAwarded: pointsNum,
          updatedAt: serverTimestamp(),
        })
        if (req.referrerUid) {
          tx.update(doc(db, 'users', req.referrerUid), { points: increment(pointsNum) })
        }
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!req) {
    return <div className="max-w-2xl mx-auto px-5 py-10 text-ink/40">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link to="/admin" className="text-xs text-ink/40 hover:text-ink/70">← All requests</Link>

      <div className="flex items-center justify-between mt-3 mb-8">
        <h1 className="font-display text-2xl">{req.customerName}</h1>
        <StatusBadge status={req.status} />
      </div>

      <div className="card p-6 mb-6 grid grid-cols-2 gap-y-4 text-sm">
        <div><p className="label">Category</p><p>{req.category}</p></div>
        <div><p className="label">Customer number</p><p>{req.customerNumber}</p></div>
        <div><p className="label">Submitted by</p><p>{req.submittedByName} ({req.submittedByEmail})</p></div>
        <div>
          <p className="label">Referrer credited</p>
          <p>{referrer ? `${referrer.name} (${referrer.email})` : req.referrerUid ? '—' : 'Direct — no referrer'}</p>
        </div>
        {req.notes && (
          <div className="col-span-2"><p className="label">Notes</p><p className="text-ink/70">{req.notes}</p></div>
        )}
      </div>

      {req.status !== 'completed' && req.status !== 'rejected' && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Quotation</p>
          <div className="flex gap-2">
            <input
              value={quotation}
              onChange={(e) => setQuotation(e.target.value)}
              type="number"
              min="0"
              className="input"
              placeholder="Quotation amount (LKR)"
            />
            <button onClick={sendQuotation} disabled={busy} className="btn-primary flex-shrink-0">
              Send quotation
            </button>
          </div>
        </div>
      )}

      {req.status === 'quoted' && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Mark job as completed</p>
          <div className="flex gap-2">
            <input
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              type="number"
              min="0"
              className="input"
              placeholder="Points to award referrer"
            />
            <button onClick={markCompleted} disabled={busy} className="btn-primary flex-shrink-0">
              Complete & award points
            </button>
          </div>
          {!req.referrerUid && (
            <p className="text-xs text-ink/40 mt-2">This request has no referrer — points won't be credited anywhere.</p>
          )}
        </div>
      )}

      {req.status === 'completed' && (
        <div className="card p-6 mb-6 bg-brand-50/50">
          <p className="text-sm text-brand-700">
            Completed — <span className="font-mono">{req.pointsAwarded}</span> points awarded
            {referrer ? ` to ${referrer.name}` : ''}.
          </p>
        </div>
      )}

      {req.status === 'pending' && (
        <button onClick={reject} disabled={busy} className="btn-ghost text-red-600 !border-red-200">
          Reject request
        </button>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}
