import { Link } from 'react-router-dom'
import { SERVICE_CATEGORIES } from '../firebase'

const STEPS = [
  { n: '01', t: 'Share your ID', d: 'Every account gets a unique referral ID — send it to anyone who needs a job done.' },
  { n: '02', t: 'They submit a request', d: 'They sign in, enter your ID, and log the customer details plus the service category.' },
  { n: '03', t: 'We quote & complete the job', d: 'Our team quotes, delivers, and marks the job complete.' },
  { n: '04', t: 'You earn points', d: 'Points land on your profile and convert to LKR whenever you cash out.' },
]

export default function Landing() {
  return (
    <div className="max-w-5xl mx-auto px-5">
      <section className="pt-20 pb-16 grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <p className="eyebrow mb-4">Referral network · Sri Lanka</p>
          <h1 className="text-4xl md:text-5xl leading-[1.08] font-semibold tracking-tight text-ink">
            Send the job. <span className="text-brand-600">Earn the points.</span>
          </h1>
          <p className="mt-5 text-ink/60 text-lg max-w-md">
            Refer electrical, CCTV, solar, automation and construction work to
            our team — every completed job puts points on your profile.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/login" className="btn-primary">
              Get your referral link
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <p className="eyebrow mb-4">Service categories</p>
          <ul className="space-y-2">
            {SERVICE_CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-3 text-sm text-ink/80">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-24">
        <div className="circuit-rule mb-10" />
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-xs text-amber-500">{s.n}</span>
              <h3 className="mt-2 font-display text-lg">{s.t}</h3>
              <p className="mt-1.5 text-sm text-ink/55 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
