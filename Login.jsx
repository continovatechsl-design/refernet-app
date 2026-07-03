import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import StatusBadge from '../components/StatusBadge'

const FILTERS = ['all', 'pending', 'quoted', 'accepted', 'invoiced', 'paid', 'completed', 'rejected']

export default function AdminDashboard() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) =>
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return unsub
  }, [])

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">All requests</h1>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-brand-600 text-paper' : 'text-ink/50 hover:bg-brand-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/40 border-b border-black/[0.06]">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Submitted by</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-black/[0.06] last:border-0 hover:bg-brand-50/40">
                <td className="px-5 py-3">
                  <p className="font-medium">{r.customerName}</p>
                  <p className="text-xs text-ink/40">{r.customerNumber}</p>
                </td>
                <td className="px-5 py-3 text-ink/70">{r.category}</td>
                <td className="px-5 py-3 text-ink/70">{r.submittedByName || r.submittedByEmail}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-right">
                  <Link to={`/admin/requests/${r.id}`} className="text-brand-600 text-xs font-medium hover:underline">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">No requests here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
