import React, { useState, useEffect } from 'react'
import { srsLabel, srsClass } from '../../utils/srs.js'

export default function Flashcard({ card, onAnswer, lang }) {
  const [flipped, setFlipped] = useState(false)
  const [reverse, setReverse] = useState(false)

  // reset on card change
  useEffect(() => { setFlipped(false) }, [card])

  if (!card) return null

  const isJa = lang === 'ja'

  const frontText  = reverse
    ? card.meaning
    : (card.word || card.phrase || card.pattern || card.word)
  const frontSub   = reverse ? null : (isJa ? card.reading : null)
  const frontBadge = reverse ? null : card.level
  const backMeaning = reverse
    ? (card.word || card.phrase || card.pattern)
    : card.meaning
  const backUsage  = card.usage || null
  const examples   = card.examples || []

  return (
    <div>
      {/* reverse toggle */}
      <div className="flex items-center justify-between mb-12">
        <span className="text-sm text-muted">
          {card.type === 'vocab' ? '單字' : card.type === 'grammar' ? '文法' : '語塊'}
          {card.level && <span className="badge badge-ghost ml-4" style={{ marginLeft: 6 }}>{card.level}</span>}
        </span>
        <label className="flex items-center gap-8" style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text2)' }}>
          <span>反向</span>
          <label className="toggle">
            <input type="checkbox" checked={reverse} onChange={e => { setReverse(e.target.checked); setFlipped(false) }} />
            <span className="toggle-slider" />
          </label>
        </label>
      </div>

      {/* card */}
      <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          {/* front */}
          <div className="flashcard-face">
            <div className="flashcard-word">{frontText}</div>
            {frontSub && <div className="flashcard-reading">{frontSub}</div>}
            {card.pos && <div className="flashcard-type">{card.pos}{card.accent != null ? `  アクセント:${card.accent}` : ''}</div>}
            <div className="text-sm text-muted mt-12" style={{ opacity: 0.5 }}>點擊翻面</div>
          </div>

          {/* back */}
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-meaning">{backMeaning}</div>
            {backUsage && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 10, maxWidth: '90%', textAlign: 'center', lineHeight: 1.6 }}>
                {backUsage}
              </div>
            )}
            {examples.slice(0, 2).map((ex, i) => (
              <div key={i} className="flashcard-example" style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{ex.ja || ex.en || ex.sentence}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{ex.zh || ex.translation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* srs info */}
      <div className="flex items-center justify-center mt-12 mb-16">
        <span className={`text-sm ${srsClass(card.srs)}`}>{srsLabel(card.srs)}</span>
        {card.srs?.interval > 0 && (
          <span className="text-sm text-muted" style={{ marginLeft: 8 }}>
            間隔 {card.srs.interval} 天
          </span>
        )}
      </div>

      {/* answer buttons */}
      {flipped && (
        <div className="flex gap-12 animate-fade-in">
          <button
            className="btn btn-danger btn-full"
            onClick={() => onAnswer(false)}
          >
            ✗ 不記得
          </button>
          <button
            className="btn btn-success btn-full"
            onClick={() => onAnswer(true)}
          >
            ✓ 記得
          </button>
        </div>
      )}

      {!flipped && (
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-outline" onClick={() => setFlipped(true)}>
            顯示答案
          </button>
        </div>
      )}
    </div>
  )
}
