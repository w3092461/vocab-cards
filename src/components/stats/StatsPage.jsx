import React, { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function StatsPage() {
  const { stats, lang, getActiveCards } = useApp()
  const navigate = useNavigate()

  const allCards = lang ? getActiveCards(lang) : []

  // last 30 days
  const days = useMemo(() => {
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const log = stats.dailyLog[key] || { answered: 0, correct: 0 }
      result.push({ date: key, label: `${d.getMonth() + 1}/${d.getDate()}`, ...log })
    }
    return result
  }, [stats.dailyLog])

  const maxAnswered = Math.max(...days.map(d => d.answered), 1)

  // srs distribution
  const newCount      = allCards.filter(c => !c.srs || c.srs.state === 'new').length
  const learningCount = allCards.filter(c => c.srs?.state === 'learning').length
  const knownCount    = allCards.filter(c => c.srs?.state === 'known').length
  const total = allCards.length || 1

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>學習統計</h2>

      {/* summary row */}
      <div className="grid-3 mb-20">
        <div className="card-sm" style={{ textAlign: 'center' }}>
          <div className="text-xl font-bold">{stats.totalAnswered}</div>
          <div className="text-sm text-muted">總答題</div>
        </div>
        <div className="card-sm" style={{ textAlign: 'center' }}>
          <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>{accuracy}%</div>
          <div className="text-sm text-muted">總正確率</div>
        </div>
        <div className="card-sm" style={{ textAlign: 'center' }}>
          <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>🔥{stats.streak}</div>
          <div className="text-sm text-muted">連勝天</div>
        </div>
      </div>

      {/* daily bar chart */}
      <div className="section-title">過去 30 天學習量</div>
      <div className="card mb-20" style={{ padding: '16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, overflowX: 'auto' }}>
          {days.map((d, i) => {
            const h = Math.max(3, Math.round((d.answered / maxAnswered) * 72))
            const isToday = d.date === new Date().toISOString().slice(0, 10)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 16 }}>
                <div
                  title={`${d.date}: ${d.answered} 題`}
                  style={{
                    width: 12,
                    height: h,
                    background: isToday ? 'var(--primary)' : d.answered > 0 ? 'var(--primary-dark)' : 'var(--bg3)',
                    borderRadius: 3,
                    opacity: d.answered > 0 ? 1 : 0.4,
                    transition: 'height 0.3s',
                  }}
                />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span className="text-sm text-muted">30 天前</span>
          <span className="text-sm text-muted">今天</span>
        </div>
      </div>

      {/* SRS distribution */}
      {lang && (
        <>
          <div className="section-title">卡片熟悉度分布</div>
          <div className="card mb-20">
            <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: `${(knownCount / total) * 100}%`, background: 'var(--success)', minWidth: knownCount > 0 ? 4 : 0 }} />
              <div style={{ width: `${(learningCount / total) * 100}%`, background: 'var(--warning)', minWidth: learningCount > 0 ? 4 : 0 }} />
              <div style={{ width: `${(newCount / total) * 100}%`, background: 'var(--info)', minWidth: newCount > 0 ? 4 : 0 }} />
            </div>
            <div className="flex gap-16">
              <div className="flex items-center gap-8">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)' }} />
                <span className="text-sm">已熟悉 {knownCount}</span>
              </div>
              <div className="flex items-center gap-8">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--warning)' }} />
                <span className="text-sm">學習中 {learningCount}</span>
              </div>
              <div className="flex items-center gap-8">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--info)' }} />
                <span className="text-sm">新卡 {newCount}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* wrong cards */}
      {stats.wrongCards?.length > 0 && (
        <>
          <div className="section-title flex items-center justify-between">
            <span>錯題本</span>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/cards?filter=wrong')}>
              查看全部
            </button>
          </div>
          <div className="card mb-20">
            <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>
              {stats.wrongCards.length}
            </div>
            <div className="text-sm text-muted mb-12">個待複習的錯題</div>
            <button className="btn btn-danger" onClick={() => navigate('/quiz?mode=flashcard&filter=wrong')}>
              開始複習錯題
            </button>
          </div>
        </>
      )}
    </div>
  )
}
