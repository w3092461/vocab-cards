import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, reviewSRS } from '../../context/AppContext.jsx'

// 振り仮名元件：若有 reading 欄位，顯示在語塊上方
function WordWithReading({ word, reading }) {
  if (!reading) return <span>{word}</span>
  return (
    <ruby>
      {word}
      <rt style={{ fontWeight: 'normal', letterSpacing: '0.05em' }}>{reading}</rt>
    </ruby>
  )
}

// ─── Field helpers (backwards compat: old cards used 'sentence'/'usage') ───
function getExample(card)            { return card.example || card.sentence || '' }
function getNotes(card)              { return card.notes   || card.usage    || '' }
function getExampleTranslation(card) { return card.example_translation || '' }

// ─── Helpers ──────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(s) {
  return (s || '').trim().toLowerCase()
    .replace(/[ぁぃぅぇぉっゃゅょ]/g, c => String.fromCharCode(c.charCodeAt(0) + 1))
    .replace(/\s+/g, '')
}

function fuzzyMatch(a, b) {
  a = normalize(a); b = normalize(b)
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 2) return false
  const shorter = a.length <= b.length ? a : b
  const longer  = a.length <= b.length ? b : a
  let diffs = 0, i = 0, j = 0
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] !== longer[j]) {
      diffs++
      if (diffs > 1) return false
      if (shorter.length === longer.length) { i++; j++ } else j++
    } else { i++; j++ }
  }
  return diffs <= 1
}

function blankSentence(sentence, word) {
  if (!sentence || !word) return sentence || ''
  const blank = '＿'.repeat(Math.max(2, word.length))
  if (sentence.includes(word)) return sentence.replace(word, blank)
  const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return sentence.replace(re, blank)
}

// ─── Main QuizPage ─────────────────────────────────────────
export default function QuizPage() {
  const { lang, getTodayQueue, updateCard, recordReview } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('flashcard')
  const [queue, setQueue] = useState(null)

  if (!lang) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🃏</div>
        <div className="empty-title">請先選擇語言</div>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/')}>回首頁</button>
      </div>
    )
  }

  function buildQueue() {
    const { reviews, newCards } = getTodayQueue()
    const allDue = shuffle([...reviews, ...newCards])
    if (mode === 'fill') {
      // 填空只出現有例句、且例句包含 word 的卡片
      return allDue.filter(c => {
        const ex = getExample(c)
        const w  = c.word || ''
        return ex && (ex.includes(w) || new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(ex))
      })
    }
    return allDue
  }

  function start() { setQueue(buildQueue()) }

  // 尚未開始
  if (queue === null) {
    const { reviews, newCards } = getTodayQueue()
    const total    = reviews.length + newCards.length
    const fillable = [...reviews, ...newCards].filter(c => getExample(c))

    return (
      <div className="animate-in">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>開始複習</h2>

        <div className="tab-bar mb-20">
          <button className={`tab-item ${mode === 'flashcard' ? 'active' : ''}`} onClick={() => setMode('flashcard')}>
            🃏 翻卡
          </button>
          <button className={`tab-item ${mode === 'fill' ? 'active' : ''}`} onClick={() => setMode('fill')}>
            ✏️ 填空
          </button>
        </div>

        <div className="card mb-20">
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>
            {mode === 'flashcard' ? total : fillable.length}
          </div>
          <div className="text-muted text-sm mb-4">
            {mode === 'flashcard'
              ? `張卡片（含 ${newCards.length} 張新卡 + ${reviews.length} 張複習）`
              : `張有例句的卡片可練填空`}
          </div>
          {total === 0 && (
            <div className="alert alert-success mt-8">今日複習已完成 🎉</div>
          )}
        </div>

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={start}
          disabled={mode === 'flashcard' ? total === 0 : fillable.length === 0}
        >
          開始
        </button>
      </div>
    )
  }

  // 全部做完
  if (queue.length === 0) {
    return <SessionDone onRestart={() => setQueue(null)} onHome={() => navigate('/')} />
  }

  function handleAnswer(card, correct) {
    const isNew = !card.srs || card.srs.state === 'new'
    updateCard(card.id, { srs: reviewSRS(card.srs || {}, correct) })
    recordReview({ isNew, correct })
    setQueue(q => q.slice(1))
  }

  if (mode === 'flashcard') {
    return <FlashcardSession queue={queue} onAnswer={handleAnswer} />
  }
  return <FillSession queue={queue} onAnswer={handleAnswer} />
}

// ─── Flashcard Session ─────────────────────────────────────
function FlashcardSession({ queue, onAnswer }) {
  const [flipped, setFlipped] = useState(false)
  const card  = queue[0]
  const total = useRef(queue.length)
  useEffect(() => { setFlipped(false) }, [card?.id])

  const word    = card.word || ''
  const notes   = getNotes(card)
  const example = getExample(card)
  const exTrans = getExampleTranslation(card)
  const progress = ((total.current - queue.length) / total.current) * 100

  return (
    <div className="animate-in">
      <div className="flex items-center gap-12 mb-16">
        <div className="progress-bar flex-1">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm text-faint">{total.current - queue.length}/{total.current}</span>
      </div>

      <div
        className="flashcard-scene mb-20"
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
          {/* Front: 中文意思 */}
          <div className="flashcard-face">
            <div className="text-xs text-faint mb-12" style={{ letterSpacing: '0.08em' }}>中文意思</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.4 }}>
              {card.meaning}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 28 }}>
              點擊翻面 →
            </div>
          </div>

          {/* Back: 目標語言 + 例句 */}
          <div className="flashcard-face flashcard-back">
            <div className="w-full">
              <div className="text-xs text-faint mb-8" style={{ letterSpacing: '0.08em' }}>
                {card.lang === 'ja' ? '日文' : '英文'}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
                <WordWithReading word={word} reading={card.reading} />
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
                    <div className="text-sm text-muted mt-4" style={{ lineHeight: 1.7 }}>
                      {exTrans}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-12">
          <button className="btn btn-danger btn-lg flex-1" onClick={() => onAnswer(card, false)}>
            還不熟
          </button>
          <button className="btn btn-success btn-lg flex-1" onClick={() => onAnswer(card, true)}>
            記得 ✓
          </button>
        </div>
      ) : (
        <div style={{ height: 56 }} />
      )}
    </div>
  )
}

// ─── Fill Blank Session ────────────────────────────────────
function FillSession({ queue, onAnswer }) {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef()
  const card  = queue[0]
  const total = useRef(queue.length)

  useEffect(() => {
    setInput(''); setResult(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [card?.id])

  const word    = card.word || ''
  const example = getExample(card)
  const exTrans = getExampleTranslation(card)
  const notes   = getNotes(card)
  const blanked = blankSentence(example, word)
  const progress = ((total.current - queue.length) / total.current) * 100

  function submit() {
    if (!input.trim() || result) return
    setResult(fuzzyMatch(input, word) ? 'correct' : 'wrong')
  }

  return (
    <div className="animate-in">
      <div className="flex items-center gap-12 mb-16">
        <div className="progress-bar flex-1">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm text-faint">{total.current - queue.length}/{total.current}</span>
      </div>

      <div className="card mb-16">
        <div className="text-xs text-faint mb-6">中文意思</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{card.meaning}</div>
        {notes && <div className="text-sm text-muted mt-6">{notes}</div>}
      </div>

      <div className="card mb-16" style={{ background: 'var(--surface2)' }}>
        <div className="text-xs text-faint mb-6">填入空格</div>
        <div style={{ fontSize: '1.05rem', lineHeight: 1.9 }}>{blanked}</div>
        {exTrans && (
          <div className="text-sm text-muted mt-6" style={{ lineHeight: 1.7 }}>{exTrans}</div>
        )}
      </div>

      {!result ? (
        <>
          <div className="input-group">
            <input
              ref={inputRef}
              className="input"
              style={{ fontSize: '1.1rem' }}
              placeholder={`輸入${card.lang === 'ja' ? '日文' : '英文'}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={submit} disabled={!input.trim()}>
            確認
          </button>
        </>
      ) : (
        <>
          <div className={`alert ${result === 'correct' ? 'alert-success' : 'alert-danger'} mb-12`}>
            {result === 'correct' ? `✓ 正確！答案：${word}` : `✗ 正確答案是：${word}`}
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => onAnswer(card, result === 'correct')}>
            下一張 →
          </button>
        </>
      )}
    </div>
  )
}

// ─── Session Done ──────────────────────────────────────────
function SessionDone({ onRestart, onHome }) {
  return (
    <div className="animate-in text-center" style={{ paddingTop: 40 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>複習完成！</div>
      <div className="text-muted mb-32">今天的卡片全部複習完畢</div>
      <div className="flex flex-col gap-12">
        <button className="btn btn-primary btn-lg btn-full" onClick={onHome}>回首頁</button>
        <button className="btn btn-outline btn-lg btn-full" onClick={onRestart}>再複習一次</button>
      </div>
    </div>
  )
}
