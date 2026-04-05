import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

export default function Header() {
  const { theme, toggleTheme, lang, selectLang } = useApp()
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <button
        className="btn-icon"
        style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', padding: '4px 8px' }}
        onClick={() => navigate('/')}
      >
        語塊練習
      </button>

      <div className="flex items-center gap-8">
        {lang && (
          <button
            className="badge badge-blue"
            style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', padding: '4px 10px' }}
            onClick={() => { selectLang(null); navigate('/') }}
            title="切換語言"
          >
            {lang === 'ja' ? '🇯🇵 日文' : '🇬🇧 英文'}
          </button>
        )}
        <button className="btn-icon" onClick={toggleTheme} aria-label="切換主題">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
