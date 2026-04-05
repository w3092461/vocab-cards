import React, { useState, useEffect } from 'react'
import { buildMCQuestion } from '../../utils/quiz.js'

export default function MultipleChoice({ card, allCards, onAnswer, lang }) {
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('ja_to_zh')

  useEffect(() => {
    if (!card) return
    setSelected(null)
    const q = buildMCQuestion(card, allCards, direction)
    setQuestion(q)
  }, [card, direction])

  if (!card || !question) return null

  const isJa = lang === 'ja'
  const dirLabel = isJa
    ? (direction === 'ja_to_zh' ? '日文 → 中文' : '中文 → 日文')
    : (direction === 'ja_to_zh' ? '英文 → 中文' : '中文 → 英文')

  function handleSelect(opt) {
    if (selected !== null) return
    setSelected(opt)
    setTimeout(() => onAnswer(opt.correct), 900)
  }

  return (
    <div>
      {/* direction toggle */}
      <div className="flex items-center justify-between mb-16">
        <span className="badge badge-ghost">{card.type === 'vocab' ? '單字' : card.type === 'grammar' ? '文法' : '語塊'}</span>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setDirection(d => d === 'ja_to_zh' ? 'zh_to_ja' : 'ja_to_zh')}
        >
          {dirLabel}
        </button>
      </div>

      {/* question */}
      <div className="card mb-20" style={{ textAlign: 'center', minHeight: 140, justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {card.level && <div className="badge badge-primary mb-8">{card.level}</div>}
        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{question.question}</div>
        {direction === 'ja_to_zh' && card.reading && card.reading !== question.question && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text3)', marginTop: 6 }}>{card.reading}</div>
        )}
      </div>

      {/* options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (selected) {
            if (opt.correct)   cls += ' correct'
            else if (opt === selected) cls += ' wrong'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
            >
              <span style={{ fontWeight: 600, marginRight: 8, opacity: 0.5 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className={`card mt-16 animate-fade-in`} style={{
          borderColor: selected.correct ? 'var(--success)' : 'var(--danger)',
          background: selected.correct ? 'var(--success-light)' : 'var(--danger-light)',
        }}>
          {selected.correct ? (
            <div style={{ color: 'var(--success)', fontWeight: 700 }}>✓ 正確！</div>
          ) : (
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ 答錯了</div>
              <div style={{ marginTop: 4, color: 'var(--text2)', fontSize: '0.88rem' }}>
                正確答案：{question.options.find(o => o.correct)?.text}
              </div>
            </div>
          )}
          {card.examples?.[0] && (
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text2)' }}>
              <div>{card.examples[0].ja || card.examples[0].en}</div>
              <div style={{ color: 'var(--text3)' }}>{card.examples[0].zh}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
