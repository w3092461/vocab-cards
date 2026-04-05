import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

const ITEMS = [
  { path: '/',        icon: '🏠', label: '首頁' },
  { path: '/quiz',    icon: '🃏', label: '複習' },
  { path: '/import',  icon: '📥', label: '匯入' },
  { path: '/cards',   icon: '📚', label: '卡片' },
  { path: '/settings',icon: '⚙️', label: '設定' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, getTodayQueue } = useApp()

  const { reviews, newCards } = lang ? getTodayQueue() : { reviews: [], newCards: [] }
  const dueCount = reviews.length + newCards.length

  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ path, icon, label }) => {
        const active = location.pathname === path
        const showBadge = path === '/quiz' && dueCount > 0
        return (
          <button
            key={path}
            className={`nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="nav-icon" style={{ position: 'relative', display: 'inline-block' }}>
              {icon}
              {showBadge && (
                <span style={{
                  position: 'absolute',
                  top: -4, right: -6,
                  background: 'var(--danger)',
                  color: '#fff',
                  borderRadius: '100px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0 4px',
                  minWidth: 14,
                  textAlign: 'center',
                  lineHeight: '14px',
                  height: 14,
                }}>
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
