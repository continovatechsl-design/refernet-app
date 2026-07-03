const STYLES = {
  pending: 'bg-amber-400/15 text-amber-500',
  quoted: 'bg-brand-100 text-brand-600',
  completed: 'bg-brand-600/10 text-brand-700',
  rejected: 'bg-red-500/10 text-red-600',
}

const LABELS = {
  pending: 'Pending',
  quoted: 'Quoted',
  completed: 'Completed',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || 'bg-ink/10 text-ink/60'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status] || status}
    </span>
  )
}
