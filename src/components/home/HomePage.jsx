import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

export default function HomePage() {
  const { lang, selectLang, getTodayQueue, getCards, stats } = useApp()
  const navigate = useNavigate()

  if (!lang) return <LanguageSelector onSelect={selectLang} />

  const { reviews, newCards } = getTodayQueue()
  const dueCount = reviews.length + newCards.length
  const allCards = getCards()
  const knownCount = allCards.filter(c => c.srs?.state === 'known').length
  const learningCount = allCards.filter(c => c.srs?.state === 'learning').length
  const newCount = allCards.filter(c => !c.srs || c.srs.state === 'new').length

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = stats.dailyLog[today] || {}
  const todayReviewed = todayLog.reviewed || 0

  return (
    <div className="animate-in">
      {/* Streak */}
      <div className="flex items-center justify-between mb-20">
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>今天</div>
          <div className="text-sm text-muted">
            {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
        </div>
        {stats.streak > 0 && (
          <div className="text-center">
            <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>🔥</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text2)' }}>
              {stats.streak} 天連續
            </div>
          </div>
        )}
      </div>

      {/* Today's review count */}
      <div className="card mb-16" style={{ background: dueCount > 0 ? 'var(--primary)' : 'var(--surface)' }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: dueCount > 0 ? '#fff' : 'var(--text)',
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {dueCount}
        </div>
        <div style={{ color: dueCount > 0 ? 'rgba(255,255,255,0.85)' : 'var(--text2)', fontSize: '0.9rem', marginBottom: 16 }}>
          {dueCount === 0 ? '今天沒有待複習的卡片' : `張卡片待複習（含 ${newCards.length} 張新卡）`}
        </div>
        <button
          className="btn btn-lg btn-full"
          style={{
            background: dueCount > 0 ? '#fff' : 'var(--primary)',
            color: dueCount > 0 ? 'var(--primary)' : '#fff',
          }}
          onClick={() => navigate('/quiz')}
          disabled={dueCount === 0}
        >
          {dueCount > 0 ? '開始複習' : '今日完成 ✓'}
        </button>
      </div>

      {/* Today stats */}
      {todayReviewed > 0 && (
        <div className="text-sm text-muted mb-16 text-center">
          今日已複習 {todayReviewed} 張
        </div>
      )}

      {/* SRS distribution */}
      {allCards.length > 0 && (
        <div className="card mb-16">
          <div className="text-sm font-semibold text-muted mb-12">卡片狀態</div>
          <div className="flex gap-16">
            <div className="text-center flex-1">
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{newCount}</div>
              <div className="text-xs text-faint">新卡</div>
            </div>
            <div className="text-center flex-1">
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{learningCount}</div>
              <div className="text-xs text-faint">學習中</div>
            </div>
            <div className="text-center flex-1">
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{knownCount}</div>
              <div className="text-xs text-faint">已熟悉</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-12">
        <button className="btn btn-outline flex-1" onClick={() => navigate('/import')}>
          📥 匯入卡片
        </button>
        <button className="btn btn-outline flex-1" onClick={() => navigate('/cards')}>
          📚 查看卡片
        </button>
      </div>

      {allCards.length === 0 && (
        <div className="empty-state mt-20">
          <div className="empty-icon">📭</div>
          <div className="empty-title">還沒有任何卡片</div>
          <div className="empty-desc">從匯入頁面上傳 CSV，或手動新增卡片</div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/import')}>
            開始匯入
          </button>
        </div>
      )}
    </div>
  )
}

function LanguageSelector({ onSelect }) {
  return (
    <div className="animate-in" style={{ paddingTop: 32 }}>
      <div className="text-center mb-32">
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>👋</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>選擇學習語言</div>
        <div className="text-muted text-sm">日文與英文的卡片分開管理</div>
      </div>

      <div className="flex flex-col gap-12">
        <button
          className="card"
          style={{
            cursor: 'pointer',
            border: '2px solid var(--border)',
            background: 'var(--surface)',
            textAlign: 'left',
            transition: 'border-color 0.15s',
            padding: '20px',
          }}
          onClick={() => onSelect('ja')}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🇯🇵</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>日文</div>
          <div className="text-sm text-muted mt-4">Japanese</div>
        </button>

        <button
          className="card"
          style={{
            cursor: 'pointer',
            border: '2px solid var(--border)',
            background: 'var(--surface)',
            textAlign: 'left',
            transition: 'border-color 0.15s',
            padding: '20px',
          }}
          onClick={() => onSelect('en')}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🇬🇧</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>英文</div>
          <div className="text-sm text-muted mt-4">English</div>
        </button>
      </div>
    </div>
  )
}
