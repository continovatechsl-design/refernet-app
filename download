import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, REQUEST_STATUS, PAYOUT_DUE_DAYS, POINTS_NORMAL_RATE, POINTS_BONUS_RATE, POINTS_BONUS_THRESHOLD, POINT_VALUE_LKR } from '../firebase'
import { calculateTieredPoints, getMonthKey } from '../utils/referral'
import StatusBadge from '../components/StatusBadge'

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PdfUploader({ label, existingUrl, existingName, onUpload, busy }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  const pick = (e) => {
    const f = e.target.files?.[0]
    setError(null)
    if (f && f.type !== 'application/pdf') {
      setError('Please choose a PDF file.')
      setFile(null)
      return
    }
    setFile(f || null)
  }

  const submit = async () => {
    if (!file) return
    try {
      await onUpload(file)
      setFile(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      {existingUrl && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mb-3"
        >
          📄 View current {label} PDF{existingName ? ` (${existingName})` : ''}
        </a>
      )}
      <div className="flex gap-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={pick}
          className="input file:mr-3 file:btn-ghost file:!py-1.5 file:!px-3 file:text-xs file:cursor-pointer text-xs"
        />
        <button onClick={submit} disabled={!file || busy} className="btn-primary flex-shrink-0 !py-2 !px-3.5 text-sm">
          {busy ? 'Uploading…' : existingUrl ? 'Replace' : 'Upload'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}

export default function AdminRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [referrer, setReferrer] = useState(null)
  const [quotation, setQuotation] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [monthlyEarned, setMonthlyEarned] = useState(0)
  const [overridePoints, setOverridePoints] = useState('')
  const [useOverride, setUseOverride] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'requests', id), (snap) => {
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null
      setReq(data)
      if (data?.quotationAmount != null) setQuotation(String(data.quotationAmount))
      if (data?.invoiceAmount != null) setInvoiceAmount(String(data.invoiceAmount))
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

  // Referrer's points earned so far in the current calendar month — needed
  // to know whether this invoice lands in the 8% normal tier, the 10% bonus
  // tier (after 100 pts/month), or split across both.
  useEffect(() => {
    if (!req?.referrerUid) {
      setMonthlyEarned(0)
      return
    }
    const docId = `${req.referrerUid}_${getMonthKey()}`
    return onSnapshot(doc(db, 'monthlyPoints', docId), (snap) => {
      setMonthlyEarned(snap.exists() ? snap.data().points || 0 : 0)
    })
  }, [req?.referrerUid])

  // --- Stage 1: pending -> quoted -------------------------------------
  const uploadQuotation = async (file) => {
    if (!quotation) throw new Error('Enter a quotation amount first.')
    setUploading(true)
    setError(null)
    try {
      const path = `requests/${id}/quotation-${Date.now()}-${file.name}`
      const fileRef = storageRef(storage, path)
      await uploadBytes(fileRef, file, { contentType: 'application/pdf' })
      const url = await getDownloadURL(fileRef)
      await updateDoc(doc(db, 'requests', id), {
        status: REQUEST_STATUS.QUOTED,
        quotationAmount: Number(quotation),
        quotationPdfUrl: url,
        quotationPdfPath: path,
        quotationPdfName: file.name,
        updatedAt: serverTimestamp(),
      })
    } finally {
      setUploading(false)
    }
  }

  // --- Stage 2: quoted -> accepted --------------------------------------
  const markAccepted = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: REQUEST_STATUS.ACCEPTED,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // --- Stage 3: accepted -> invoiced ------------------------------------
  const uploadInvoice = async (file) => {
    setUploading(true)
    setError(null)
    try {
      const path = `requests/${id}/invoice-${Date.now()}-${file.name}`
      const fileRef = storageRef(storage, path)
      await uploadBytes(fileRef, file, { contentType: 'application/pdf' })
      const url = await getDownloadURL(fileRef)
      await updateDoc(doc(db, 'requests', id), {
        status: REQUEST_STATUS.INVOICED,
        invoiceAmount: invoiceAmount ? Number(invoiceAmount) : req.quotationAmount ?? null,
        invoicePdfUrl: url,
        invoicePdfPath: path,
        invoicePdfName: file.name,
        updatedAt: serverTimestamp(),
      })
    } finally {
      setUploading(false)
    }
  }

  // --- Stage 4: invoiced -> paid (points auto-calculated & credited,
  //     payout clock starts) -----------------------------------------
  const baseAmount = req?.invoiceAmount ?? req?.quotationAmount ?? 0
  const previewPoints = req?.referrerUid ? calculateTieredPoints(baseAmount, monthlyEarned) : 0
  const previewCrossesThreshold = monthlyEarned < POINTS_BONUS_THRESHOLD && monthlyEarned + previewPoints > POINTS_BONUS_THRESHOLD

  const markPaid = async () => {
    let pointsNum
    if (useOverride) {
      pointsNum = Number(overridePoints)
      if (!overridePoints || Number.isNaN(pointsNum) || pointsNum < 0) {
        setError('Enter a valid override point amount.')
        return
      }
    }
    setBusy(true)
    setError(null)
    try {
      const dueDate = Timestamp.fromDate(new Date(Date.now() + PAYOUT_DUE_DAYS * 24 * 60 * 60 * 1000))
      const monthKey = getMonthKey()
      await runTransaction(db, async (tx) => {
        const reqRef = doc(db, 'requests', id)
        let monthlyRef = null
        let cumulative = 0
        if (req.referrerUid) {
          monthlyRef = doc(db, 'monthlyPoints', `${req.referrerUid}_${monthKey}`)
          const monthlySnap = await tx.get(monthlyRef)
          cumulative = monthlySnap.exists() ? monthlySnap.data().points || 0 : 0
        }
        const finalPoints = useOverride
          ? pointsNum
          : req.referrerUid
          ? calculateTieredPoints(baseAmount, cumulative)
          : 0

        tx.update(reqRef, {
          status: REQUEST_STATUS.PAID,
          pointsAwarded: finalPoints,
          paidAt: serverTimestamp(),
          payoutDueDate: dueDate,
          updatedAt: serverTimestamp(),
        })
        if (req.referrerUid) {
          tx.update(doc(db, 'users', req.referrerUid), { points: increment(finalPoints) })
          tx.set(
            monthlyRef,
            { uid: req.referrerUid, monthKey, points: cumulative + finalPoints, updatedAt: serverTimestamp() },
            { merge: true }
          )
        }
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // --- Stage 5: paid -> completed (referrer actually paid out) ----------
  const markPayoutDone = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: REQUEST_STATUS.COMPLETED,
        payoutCompletedAt: serverTimestamp(),
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

  if (!req) {
    return <div className="max-w-2xl mx-auto px-5 py-10 text-ink/40">Loading…</div>
  }

  const payoutOverdue = req.payoutDueDate && req.payoutDueDate.toDate() < new Date()

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

      {/* Stage 1: pending -> quoted */}
      {req.status === REQUEST_STATUS.PENDING && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Quotation</p>
          <input
            value={quotation}
            onChange={(e) => setQuotation(e.target.value)}
            type="number"
            min="0"
            className="input mb-3"
            placeholder="Quotation amount (LKR)"
          />
          <p className="text-xs text-ink/45 mb-3">
            Generate the quotation in your invoice management system, download the PDF, then upload it here — customer gets it from you directly (WhatsApp/email).
          </p>
          <PdfUploader label="quotation" onUpload={uploadQuotation} busy={uploading} />
          <button onClick={reject} disabled={busy} className="text-xs text-red-600 hover:underline mt-4">
            Reject request instead
          </button>
        </div>
      )}

      {/* Stage 2: quoted -> accepted */}
      {req.status === REQUEST_STATUS.QUOTED && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Quotation sent — LKR {req.quotationAmount}</p>
          <PdfUploader
            label="quotation"
            existingUrl={req.quotationPdfUrl}
            existingName={req.quotationPdfName}
            onUpload={uploadQuotation}
            busy={uploading}
          />
          <div className="circuit-rule my-5" />
          <p className="text-xs text-ink/45 mb-3">
            Once the customer confirms (call/WhatsApp) they're happy with the quotation, mark it accepted.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={markAccepted} disabled={busy} className="btn-primary !py-2 !px-3.5 text-sm">
              Mark quotation accepted
            </button>
            <button onClick={reject} disabled={busy} className="text-xs text-red-600 hover:underline">
              Customer declined — reject
            </button>
          </div>
        </div>
      )}

      {/* Stage 3: accepted -> invoiced */}
      {req.status === REQUEST_STATUS.ACCEPTED && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Accepted on {fmtDate(req.acceptedAt)} — upload the invoice</p>
          <input
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
            type="number"
            min="0"
            className="input mb-3"
            placeholder={`Invoice amount (LKR)${req.quotationAmount ? ` — defaults to ${req.quotationAmount}` : ''}`}
          />
          <PdfUploader label="invoice" onUpload={uploadInvoice} busy={uploading} />
        </div>
      )}

      {/* Stage 4: invoiced -> paid */}
      {req.status === REQUEST_STATUS.INVOICED && (
        <div className="card p-6 mb-6">
          <p className="eyebrow mb-3">Invoice sent — LKR {req.invoiceAmount}</p>
          <PdfUploader
            label="invoice"
            existingUrl={req.invoicePdfUrl}
            existingName={req.invoicePdfName}
            onUpload={uploadInvoice}
            busy={uploading}
          />
          <div className="circuit-rule my-5" />
          <p className="text-xs text-ink/45 mb-3">
            Once the invoice is paid, points are credited automatically and a {PAYOUT_DUE_DAYS}-day payout countdown starts.
          </p>

          {req.referrerUid ? (
            <div className="bg-brand-50/60 border border-brand-100 rounded-sm p-4 mb-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-ink/60">Points to award</p>
                <p className="font-display text-2xl text-brand-700">{previewPoints}</p>
              </div>
              <p className="text-xs text-ink/45 mt-1">
                LKR {baseAmount} · {monthlyEarned} pts already earned this month
                {previewCrossesThreshold
                  ? ` — crosses the ${POINTS_BONUS_THRESHOLD} pt threshold, so it's split: ${POINTS_NORMAL_RATE * 100}% up to ${POINTS_BONUS_THRESHOLD}, ${POINTS_BONUS_RATE * 100}% beyond`
                  : monthlyEarned >= POINTS_BONUS_THRESHOLD
                  ? ` — already past ${POINTS_BONUS_THRESHOLD} pts this month, so this is all at the ${POINTS_BONUS_RATE * 100}% bonus rate`
                  : ` — at the normal ${POINTS_NORMAL_RATE * 100}% rate (1 pt = LKR ${POINT_VALUE_LKR})`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink/40 mb-4">This request has no referrer — no points will be credited.</p>
          )}

          <label className="flex items-center gap-2 text-xs text-ink/50 mb-3 cursor-pointer">
            <input type="checkbox" checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} />
            Override the calculated points manually
          </label>
          {useOverride && (
            <input
              value={overridePoints}
              onChange={(e) => setOverridePoints(e.target.value)}
              type="number"
              min="0"
              className="input mb-3"
              placeholder="Points to award referrer"
            />
          )}

          <button onClick={markPaid} disabled={busy} className="btn-primary">
            Mark invoice paid
          </button>
        </div>
      )}

      {/* Stage 5: paid -> completed (payout) */}
      {req.status === REQUEST_STATUS.PAID && (
        <div className={`card p-6 mb-6 ${payoutOverdue ? 'bg-red-50/60' : 'bg-brand-50/50'}`}>
          <p className="text-sm text-brand-700 mb-1">
            Invoice paid on {fmtDate(req.paidAt)} — <span className="font-mono">{req.pointsAwarded}</span> points credited
            {referrer ? ` to ${referrer.name}` : ''}.
          </p>
          <p className={`text-sm mb-4 ${payoutOverdue ? 'text-red-600 font-medium' : 'text-ink/60'}`}>
            {payoutOverdue ? 'Payout is overdue — was due' : 'Referrer payout due by'} {fmtDate(req.payoutDueDate)}.
          </p>
          <button onClick={markPayoutDone} disabled={busy} className="btn-primary !py-2 !px-3.5 text-sm">
            Mark referrer paid out
          </button>
        </div>
      )}

      {/* Stage 6: completed */}
      {req.status === REQUEST_STATUS.COMPLETED && (
        <div className="card p-6 mb-6 bg-brand-50/50 space-y-1 text-sm text-brand-700">
          <p>Quoted LKR {req.quotationAmount} · accepted {fmtDate(req.acceptedAt)}</p>
          <p>Invoiced LKR {req.invoiceAmount} · paid {fmtDate(req.paidAt)}</p>
          <p className="font-medium">
            {req.pointsAwarded} points paid out to {referrer ? referrer.name : 'referrer'} on {fmtDate(req.payoutCompletedAt)}.
          </p>
        </div>
      )}

      {req.status === REQUEST_STATUS.REJECTED && (
        <div className="card p-6 mb-6 bg-red-50/50">
          <p className="text-sm text-red-600">This request was rejected.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}
