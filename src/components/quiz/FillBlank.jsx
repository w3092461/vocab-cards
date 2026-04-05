import React, { useState, useEffect, useRef } from 'react'
import { buildFillBlank, fuzzyMatch } from '../../utils/quiz.js'

export default function FillBlank({ card, allCards, onAnswer, lang }) {
  const [q, setQ] = useState(null)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // null | 'correct' | 'wrong'
  const inputRef = useRef()

  useEffect(() => {
    setInput('')
    setResult(null)
    const blank = buildFillBlank(card)
    setQ(blank)
  }, [card])

  // fallback: if no example, show meaning
  if (!card) return null

  function submit() {
    if (!q || result) return
    const correct = fuzzyMatch(input, q.answer)
    setResult(correct ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(correct), 1200)
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit()
  }

  // fallback — no fill blank possible
  if (!q) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div className="text-2xl font-bold mb-12">{card.word || card.phrase}</div>
        <div style={{ color: 'var(--text2)', marginBottom: 20 }}>{card.meaning}</div>
        <div className="flex gap-12" style={{ justifyContent: 'center' }}>
          <button className="btn btn-danger" onClick={() => onAnswer(false)}>不記得</button>
          <button className="btn btn-success" onClick={() => onAnswer(true)}>記得</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="badge badge-primary mb-16">{card.level || card.type}</div>

      <div className="card mb-16">
        <div className="text-sm text-muted mb-8">翻譯：{q.translation}</div>
        <div style={{ fontSize: '1.2rem', lineHeight: 1.8, fontWeight: 500 }}>
          {q.sentence}
        </div>
      </div>

      <div className="input-group mb-16">
        <label className="label">填入缺少的詞</label>
        <input
          ref={inputRef}
          className={`input ${result ? (result === 'correct' ? '' : 'animate-shake') : ''}`}
          style={{
            borderColor: result === 'correct' ? 'var(--success)' : result === 'wrong' ? 'var(--danger)' : undefined,
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="輸入答案…"
          autoFocus
          disabled={!!result}
        />
      </div>

      {result && (
        <div
          className={`card animate-fade-in mb-16`}
          style={{
            borderColor: result === 'correct' ? 'var(--success)' : 'var(--danger)',
            background: result === 'correct' ? 'var(--success-light)' : 'var(--danger-light)',
          }}
        >
          {result === 'correct' ? (
            <div style={{ color: 'var(--success)', fontWeight: 700 }}>✓ 正確！</div>
          ) : (
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ 答案：{q.answer}</div>
              <div style={{ marginTop: 4, fontSize: '0.88rem', color: 'var(--text2)' }}>{q.original}</div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <button className="btn btn-primary btn-full" onClick={submit} disabled={!input.trim()}>
          確認答案
        </button>
      )}
    </div>
  )
}
