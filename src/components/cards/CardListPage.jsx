import React, { useState, useMemo, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { srsLabel, srsStateColor } from '../../utils/srs.js'

function getExample(card)            { return card.example || card.sentence || '' }
function getNotes(card)              { return card.notes   || card.usage    || '' }
function getExampleTranslation(card) { return card.example_translation || '' }

export default function CardListPage() {
  const { lang, getCards, deleteCard, addCard, updateCard } = useApp()
  const [search,  setSearch]  = useState('')
  const [detail,  setDetail]  = useState(null)   // card for detail modal
  const [marking, setMarking] = useState(null)   // card for sentence marker
  const [checkedIds, setCheckedIds] = useState(new Set())

  const allCards = lang ? getCards() : []

  const filtered = useMemo(() => {
    if (!search.trim()) return allCards
    const q = search.toLowerCase()
    return allCards.filter(c =>
      (c.word || '').toLowerCase().includes(q) ||
      (c.meaning || '').toLowerCase().includes(q) ||
      (getExample(c)).toLowerCase().includes(q)
    )
  }, [allCards, search])

  if (!lang) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <div className="empty-title">請先選擇語言</div>
      </div>
    )
  }

  // ─── Multi-select helpers ────────────────────────────────
  const allFilteredIds = filtered.map(c => c.id)
  const allChecked = allFilteredIds.length > 0 && allFilteredIds.every(id => checkedIds.has(id))

  function toggleCheck(id) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(allFilteredIds))
    }
  }

  function deleteSelected() {
    const count = checkedIds.size
    if (!window.confirm(`確定刪除 ${count} 張卡片嗎？此操作無法復原。`)) return
    checkedIds.forEach(id => deleteCard(id))
    setCheckedIds(new Set())
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>我的卡片</h2>
        <span className="badge badge-gray">{allCards.length} 張</span>
      </div>

      {/* Search */}
      <input
        className="input mb-12"
        placeholder="搜尋單字、中文、例句…"
        value={search}
        onChange={e => { setSearch(e.target.value); setCheckedIds(new Set()) }}
      />

      {/* Batch action bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-12 mb-12">
          <label className="flex items-center gap-8" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text2)' }}>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            全選（{filtered.length} 張）
          </label>
          {checkedIds.size > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={deleteSelected}
            >
              刪除所選（{checkedIds.size} 張）
            </button>
          )}
        </div>
      )}

      {/* Card list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{allCards.length === 0 ? '📭' : '🔍'}</div>
          <div className="empty-title">{allCards.length === 0 ? '還沒有卡片' : '找不到符合的卡片'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(card => (
            <CardRow
              key={card.id}
              card={card}
              checked={checkedIds.has(card.id)}
              onCheck={() => toggleCheck(card.id)}
              onDetail={() => setDetail(card)}
              onDelete={() => { if (window.confirm('確定刪除？')) deleteCard(card.id) }}
              onMark={() => setMarking(card)}
            />
          ))}
        </div>
      )}

      {detail && (
        <CardDetail
          card={detail}
          onClose={() => setDetail(null)}
          onMark={() => { setMarking(detail); setDetail(null) }}
        />
      )}

      {marking && (
        <SentenceMarker
          card={marking}
          lang={lang}
          onAddCard={addCard}
          onUpdateCard={updateCard}
          onClose={() => setMarking(null)}
        />
      )}
    </div>
  )
}

// ─── Card Row ──────────────────────────────────────────────
function CardRow({ card, checked, onCheck, onDetail, onDelete, onMark }) {
  const word    = card.word || ''
  const example = getExample(card)

  return (
    <div
      className="card-sm"
      style={{
        borderColor: checked ? 'var(--primary)' : 'var(--border)',
        background:  checked ? 'var(--primary-light)' : 'var(--surface)',
      }}
    >
      <div className="flex items-center gap-8">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
        />

        {/* Content (clickable for detail) */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onDetail}>
          <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
            <span className="font-semibold" style={{ fontSize: '1rem' }}>{word}</span>
            <span className={`badge ${srsStateColor(card.srs)}`}>{srsLabel(card.srs)}</span>
            {example && <span className="badge badge-gray">有例句</span>}
          </div>
          <div className="text-sm text-muted mt-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.meaning}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
          {example && (
            <button
              className="btn-icon text-primary"
              title="標記語塊"
              onClick={e => { e.stopPropagation(); onMark() }}
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              框選
            </button>
          )}
          <button
            className="btn-icon"
            style={{ color: 'var(--danger)' }}
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card Detail Modal ─────────────────────────────────────
function CardDetail({ card, onClose, onMark }) {
  const word    = card.word || ''
  const notes   = getNotes(card)
  const example = getExample(card)
  const exTrans = getExampleTranslation(card)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <span className={`badge ${srsStateColor(card.srs)}`}>{srsLabel(card.srs)}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          {card.reading ? (
            <ruby>{word}<rt style={{ fontWeight: 'normal' }}>{card.reading}</rt></ruby>
          ) : word}
        </div>
        <div className="divider" />
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
          {card.meaning}
        </div>

        {notes && (
          <div className="text-sm text-muted mb-12" style={{ lineHeight: 1.7 }}>{notes}</div>
        )}

        {example && (
          <>
            <div className="divider" />
            <div className="text-xs text-faint mb-6">例句</div>
            <div style={{ fontSize: '1rem', lineHeight: 1.9 }}>{example}</div>
            {exTrans && (
              <div className="text-sm text-muted mt-4" style={{ lineHeight: 1.7 }}>{exTrans}</div>
            )}
            <button className="btn btn-outline btn-sm mt-12" onClick={onMark}>
              ✏️ 標記語塊
            </button>
          </>
        )}

        {card.chunks?.length > 0 && (
          <>
            <div className="divider" />
            <div className="text-xs text-faint mb-8">已標記語塊</div>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              {card.chunks.map((ch, i) => (
                <span key={i} className="badge badge-blue">{ch.text}</span>
              ))}
            </div>
          </>
        )}

        <div className="divider" />
        <div className="text-xs text-faint">
          SRS：{srsLabel(card.srs)}
          {card.srs?.interval > 0 && ` · 間隔 ${card.srs.interval} 天`}
        </div>
      </div>
    </div>
  )
}

// ─── Sentence Marker ───────────────────────────────────────
function SentenceMarker({ card, lang, onAddCard, onUpdateCard, onClose }) {
  const sentenceRef = useRef()
  const [pendingText, setPendingText] = useState('')
  const [meaning,     setMeaning]     = useState('')
  const [showForm,    setShowForm]     = useState(false)
  const [manualText,  setManualText]   = useState('')
  const [added,       setAdded]        = useState([])
  const [message,     setMessage]      = useState('')

  const example   = getExample(card)
  const allChunks = [...(card.chunks || []), ...added]
  const hasSentence = example && example.length > 3

  function handleMouseUp() {
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const text = sel.toString().trim()
      if (!text) return
      const range = sel.getRangeAt(0)
      if (!sentenceRef.current) return
      if (!sentenceRef.current.contains(range.commonAncestorContainer) &&
          !sentenceRef.current.contains(range.startContainer)) return
      setPendingText(text)
      setManualText('')
      setMeaning('')
      setShowForm(true)
      sel.removeAllRanges()
    }, 20)
  }

  function handleConfirm() {
    const text = pendingText || manualText.trim()
    if (!text || !meaning.trim()) return
    const newChunk = { text, meaning: meaning.trim() }
    onAddCard({ lang, word: text, meaning: meaning.trim(), example, sourceCardId: card.id })
    const updatedChunks = [...allChunks, newChunk]
    onUpdateCard(card.id, { chunks: updatedChunks })
    setAdded(prev => [...prev, newChunk])
    setMessage(`已新增「${text}」`)
    setShowForm(false)
    setPendingText('')
    setManualText('')
    setMeaning('')
    setTimeout(() => setMessage(''), 2500)
  }

  function renderSentence() {
    if (!example) return null
    const highlighted = new Array(example.length).fill(null)
    allChunks.forEach(ch => {
      let idx = 0
      while (true) {
        const pos = example.indexOf(ch.text, idx)
        if (pos === -1) break
        for (let i = pos; i < pos + ch.text.length; i++) highlighted[i] = ch.meaning
        idx = pos + 1
      }
    })
    const parts = []
    let i = 0
    while (i < example.length) {
      if (highlighted[i]) {
        let j = i
        while (j < example.length && highlighted[j]) j++
        parts.push(<mark key={i} title={highlighted[i]}>{example.slice(i, j)}</mark>)
        i = j
      } else {
        let j = i
        while (j < example.length && !highlighted[j]) j++
        parts.push(<span key={i}>{example.slice(i, j)}</span>)
        i = j
      }
    }
    return parts
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <div style={{ fontWeight: 700 }}>標記語塊</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {hasSentence ? (
          <>
            <div className="text-xs text-faint mb-8">用滑鼠在句子中拖選語塊，或點「手動輸入」</div>
            <div
              className="card mb-8 sentence-text"
              ref={sentenceRef}
              onMouseUp={handleMouseUp}
              style={{ background: 'var(--surface2)', cursor: 'text', minHeight: 60, userSelect: 'text', WebkitUserSelect: 'text' }}
            >
              {renderSentence()}
            </div>
          </>
        ) : (
          <div className="alert alert-danger mb-12" style={{ fontSize: '0.82rem' }}>
            這張卡片沒有完整例句，請用「手動輸入」新增語塊。
          </div>
        )}

        {!showForm && (
          <button className="btn btn-ghost btn-sm mb-12"
            onClick={() => { setPendingText(''); setManualText(''); setMeaning(''); setShowForm(true) }}>
            ✏️ 手動輸入語塊
          </button>
        )}

        {message && <div className="alert alert-success mb-12 animate-in">{message}</div>}

        {showForm && (
          <div className="card mb-12 animate-in" style={{ borderColor: 'var(--primary)', borderWidth: 1.5 }}>
            {pendingText ? (
              <div className="text-sm font-semibold mb-8">
                已選取：<span style={{ color: 'var(--primary)' }}>「{pendingText}」</span>
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: 10 }}>
                <label className="label">語塊文字</label>
                <input
                  className="input"
                  autoFocus
                  placeholder={lang === 'ja' ? '例：ひびが入る' : 'e.g. coming of age'}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
              </div>
            )}
            <div className="input-group" style={{ marginBottom: 10 }}>
              <label className="label">中文意思</label>
              <input
                className="input"
                autoFocus={!!pendingText}
                placeholder="輸入這個語塊的中文意思…"
                value={meaning}
                onChange={e => setMeaning(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
            </div>
            <div className="flex gap-8">
              <button
                className="btn btn-primary flex-1"
                onClick={handleConfirm}
                disabled={!(pendingText || manualText.trim()) || !meaning.trim()}
              >
                新增語塊卡片
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setPendingText('') }}>
                取消
              </button>
            </div>
          </div>
        )}

        {allChunks.length > 0 && (
          <div className="mt-8">
            <div className="text-xs text-faint mb-8">已標記（{allChunks.length}）</div>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              {allChunks.map((ch, i) => (
                <span key={i} className="badge badge-blue" title={ch.meaning}>{ch.text}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16">
          <button className="btn btn-outline btn-full" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  )
}
