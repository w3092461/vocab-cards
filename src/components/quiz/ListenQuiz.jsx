import React, { useState, useEffect } from 'react'
import { buildMCQuestion } from '../../utils/quiz.js'

export default function ListenQuiz({ card, allCards, onAnswer, lang }) {
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!card) return
    setSelected(null)
    setPlaying(false)
    // For listen, always foreign → meaning (user hears the word, picks meaning)
    const q = buildMCQuestion(card, allCards, 'ja_to_zh')
    setQuestion(q)
  }, [card])

  useEffect(() => {
    setSupported('speechSynthesis' in window)
  }, [])

  function speak() {
    if (!supported || !card) return
    window.speechSynthesis.cancel()
    const text = card.word || card.phrase || card.pattern || ''
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang === 'ja' ? 'ja-JP' : 'en-US'
    utter.rate = 0.85
    utter.onstart = () => setPlaying(true)
    utter.onend   = () => setPlaying(false)
    window.speechSynthesis.speak(utter)
  }

  useEffect(() => {
    // auto-play on card change
    if (card && supported) {
      setTimeout(() => speak(), 300)
    }
  }, [card])

  function handleSelect(opt) {
    if (selected) return
    setSelected(opt)
    setTimeout(() => onAnswer(opt.correct), 900)
  }

  if (!card || !question) return null

  return (
    <div>
      <div className="badge badge-primary mb-16">聽力測驗</div>

      {/* play button */}
      <div className="card mb-20" style={{ textAlign: 'center', padding: '32px 20px' }}>
        {!supported ? (
          <div className="text-muted">您的瀏覽器不支援語音播放</div>
        ) : (
          <>
            <button
              className={`btn btn-primary btn-lg`}
              onClick={speak}
              style={{ borderRadius: '50%', width: 80, height: 80, fontSize: '1.8rem', marginBottom: 12 }}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <div className="text-sm text-muted">點擊播放語音</div>
          </>
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
              disabled={!!selected}
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
        <div
          className="card mt-16 animate-fade-in"
          style={{
            borderColor: selected.correct ? 'var(--success)' : 'var(--danger)',
            background: selected.correct ? 'var(--success-light)' : 'var(--danger-light)',
          }}
        >
          <div style={{ fontWeight: 700, color: selected.correct ? 'var(--success)' : 'var(--danger)' }}>
            {selected.correct ? '✓ 正確！' : `✗ 正確答案：${question.options.find(o => o.correct)?.text}`}
          </div>
          <div style={{ marginTop: 6, fontWeight: 600 }}>{card.word || card.phrase}</div>
          {card.reading && <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{card.reading}</div>}
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
