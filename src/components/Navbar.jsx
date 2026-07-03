import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, isAdmin, signOutUser } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-black/[0.06] bg-paper/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(227,161,56,0.18)]" />
          <span className="font-display text-lg tracking-tight">ReferNet</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <Link to="/dashboard" className="btn-ghost !border-0 !px-3">
              Dashboard
            </Link>
            <Link to="/submit-request" className="btn-ghost !border-0 !px-3">
              New request
            </Link>
            {isAdmin && (
              <Link to="/admin" className="btn-ghost !border-0 !px-3">
                Admin
              </Link>
            )}
            <div className="w-px h-5 bg-black/10 mx-1.5" />
            {profile?.photoURL && (
              <img
                src={profile.photoURL}
                alt=""
                className="h-8 w-8 rounded-full border border-black/10"
                referrerPolicy="no-referrer"
              />
            )}
            <button
              onClick={async () => {
                await signOutUser()
                navigate('/')
              }}
              className="btn-ghost !border-0 !px-3 text-ink/50"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
