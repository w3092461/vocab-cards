import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { srsLabel, srsClass } from '../../utils/srs.js'

const TYPE_LABELS = { vocab: '單字', grammar: '文法', phrase: '語塊' }

export default function CardBrowserPage() {
  const { lang, getActiveCards, stats, updateCard, deleteCard } = useApp()
  const [params] = useSearchParams()
  const filterParam = params.get('filter') // 'wrong' | null

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [srsFilter, setSrsFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const allCards = lang ? getActiveCards(lang) : []

  const levels = useMemo(() => {
    const set = new Set(allCards.map(c => c.level).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [allCards])

  const filtered = useMemo(() => {
    let cards = allCards
    if (filterParam === 'wrong') {
      const wrongIds = new Set(stats.wrongCards || [])
      cards = cards.filter(c => wrongIds.has(c.id))
    }
    if (search) {
      const q = search.toLowerCase()
      cards = cards.filter(c =>
        (c.word || '').toLowerCase().includes(q) ||
        (c.reading || '').includes(q) ||
        (c.meaning || '').includes(q) ||
        (c.phrase || '').includes(q)
      )
    }
    if (typeFilter !== 'all') cards = cards.filter(c => c.type === typeFilter)
    if (levelFilter !== 'all') cards = cards.filter(c => c.level === levelFilter)
    if (srsFilter !== 'all')   cards = cards.filter(c => (c.srs?.state || 'new') === srsFilter)
    return cards
  }, [allCards, search, typeFilter, levelFilter, srsFilter, filterParam, stats.wrongCards])

  if (!lang) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-title">請先選擇語言</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-16">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {filterParam === 'wrong' ? '❌ 錯題本' : '📚 題庫'}
        </h2>
        <span className="badge badge-ghost">{filtered.length} 張</span>
      </div>

      {/* search */}
      <input
        className="input mb-12"
        placeholder="搜尋單字、讀音、中文…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', flex: 1 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">全部類型</option>
          <option value="vocab">單字</option>
          <option value="grammar">文法</option>
          <option value="phrase">語塊</option>
        </select>
        <select className="input" style={{ width: 'auto', flex: 1 }} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          {levels.map(l => <option key={l} value={l}>{l === 'all' ? '全部等級' : l}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', flex: 1 }} value={srsFilter} onChange={e => setSrsFilter(e.target.value)}>
          <option value="all">全部狀態</option>
          <option value="new">新卡</option>
          <option value="learning">學習中</option>
          <option value="known">已熟悉</option>
        </select>
      </div>

      {/* card list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">找不到符合的卡片</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(card => (
            <CardRow
              key={card.id}
              card={card}
              isSelected={selected?.id === card.id}
              onSelect={() => setSelected(s => s?.id === card.id ? null : card)}
              onDelete={card.isUser ? () => deleteCard(card.id) : null}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* card detail panel */}
      {selected && (
        <CardDetail card={selected} lang={lang} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function CardRow({ card, isSelected, onSelect, onDelete, lang }) {
  const word = card.word || card.phrase || card.pattern || ''
  const srs  = card.srs || {}

  return (
    <div
      className="card-sm"
      style={{
        cursor: 'pointer',
        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
      }}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="font-semibold" style={{ fontSize: '1rem' }}>{word}</span>
            {card.reading && card.reading !== word && (
              <span className="text-sm text-muted">（{card.reading}）</span>
            )}
            {card.level && <span className="badge badge-ghost">{card.level}</span>}
            <span className="badge badge-ghost">{TYPE_LABELS[card.type] || card.type}</span>
          </div>
          <div className="text-sm text-muted mt-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.meaning}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <span className={`text-sm ${srsClass(srs)}`}>{srsLabel(srs)}</span>
          {onDelete && (
            <button
              className="btn-icon"
              style={{ color: 'var(--danger)' }}
              onClick={e => { e.stopPropagation(); if (window.confirm('確定刪除？')) onDelete() }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CardDetail({ card, lang, onClose }) {
  const examples = card.examples || []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <div className="flex gap-8">
            <span className="badge badge-primary">{card.level}</span>
            <span className="badge badge-ghost">{TYPE_LABELS[card.type] || card.type}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>
          {card.word || card.phrase || card.pattern}
        </div>
        {card.reading && (
          <div className="text-muted mb-4">{card.reading}</div>
        )}
        {card.pos && (
          <div className="text-sm text-muted mb-12">
            {card.pos}{card.accent != null && ` ・ アクセント：${card.accent}`}
          </div>
        )}
        <div className="divider" />
        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 8 }}>
          {card.meaning}
        </div>
        {card.usage && (
          <div className="text-sm" style={{ color: 'var(--text2)', marginBottom: 12, lineHeight: 1.7 }}>
            {card.usage}
          </div>
        )}

        {examples.length > 0 && (
          <>
            <div className="divider" />
            <div className="label mb-8">例句</div>
            {examples.map((ex, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 500 }}>{ex.ja || ex.en || ex.sentence}</div>
                <div className="text-sm text-muted">{ex.zh || ex.translation}</div>
              </div>
            ))}
          </>
        )}

        <div className="divider" />
        <div className="flex gap-8">
          <span className="text-sm">SRS 狀態：</span>
          <span className={`text-sm ${srsClass(card.srs)}`}>{srsLabel(card.srs)}</span>
          {card.srs?.interval > 0 && (
            <span className="text-sm text-muted">· 間隔 {card.srs.interval} 天</span>
          )}
        </div>
        {card.isUser && card.videoName && (
          <div className="text-sm text-muted mt-8">
            來源：{card.videoName}{card.timestamp ? ` @ ${card.timestamp}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
