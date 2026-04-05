import React, { useState, useEffect } from 'react'
import { shuffle } from '../../utils/quiz.js'

export default function WordArrange({ card, onAnswer, lang }) {
  const [tiles, setTiles] = useState([])      // pool of remaining tiles
  const [arranged, setArranged] = useState([]) // user's current arrangement
  const [result, setResult] = useState(null)
  const [sentence, setSentence] = useState('')

  useEffect(() => {
    setResult(null)
    setArranged([])
    if (!card) return

    // pick an example sentence
    const ex = card.examples?.[0]
    const raw = ex?.ja || ex?.en || ex?.sentence || ''
    if (!raw) { setSentence(''); setTiles([]); return }
    setSentence(raw)

    // split into words/chunks
    const words = lang === 'ja'
      ? splitJapanese(raw)
      : raw.split(/\s+/).filter(Boolean)

    setTiles(shuffle(words.map((w, i) => ({ id: i, text: w }))))
  }, [card])

  function moveTileToArranged(tile) {
    if (result) return
    setTiles(t => t.filter(x => x.id !== tile.id))
    setArranged(a => [...a, tile])
  }

  function moveTileBack(tile) {
    if (result) return
    setArranged(a => a.filter(x => x.id !== tile.id))
    setTiles(t => [...t, tile])
  }

  function check() {
    if (!sentence) return
    const userSentence = arranged.map(t => t.text).join(lang === 'ja' ? '' : ' ')
    const correct = userSentence === sentence || normalize(userSentence) === normalize(sentence)
    setResult(correct ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(correct), 1200)
  }

  // fallback
  if (!card || (!sentence && card)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div className="text-2xl font-bold mb-12">{card?.word || card?.phrase}</div>
        <div style={{ color: 'var(--text2)', marginBottom: 20 }}>{card?.meaning}</div>
        <div className="flex gap-12" style={{ justifyContent: 'center' }}>
          <button className="btn btn-danger" onClick={() => onAnswer(false)}>不記得</button>
          <button className="btn btn-success" onClick={() => onAnswer(true)}>記得</button>
        </div>
      </div>
    )
  }

  const ex = card.examples?.[0]
  const translation = ex?.zh || ex?.translation || card.meaning

  return (
    <div>
      <div className="badge badge-primary mb-16">{card.level || '語塊重組'}</div>

      <div className="card mb-16">
        <div className="text-sm text-muted mb-4">中文：</div>
        <div style={{ fontWeight: 600 }}>{translation}</div>
      </div>

      {/* drop zone */}
      <div className="label mb-8">你的排列</div>
      <div
        className={`drop-zone mb-16 ${result ? '' : ''}`}
        style={{ borderColor: result === 'correct' ? 'var(--success)' : result === 'wrong' ? 'var(--danger)' : undefined }}
      >
        {arranged.length === 0 && (
          <span className="text-muted text-sm">點擊下方詞語來排列…</span>
        )}
        {arranged.map(tile => (
          <button
            key={tile.id}
            className="word-tile selected"
            onClick={() => moveTileBack(tile)}
            disabled={!!result}
          >
            {tile.text}
          </button>
        ))}
      </div>

      {/* tile pool */}
      <div className="label mb-8">詞語</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {tiles.map(tile => (
          <button
            key={tile.id}
            className="word-tile"
            onClick={() => moveTileToArranged(tile)}
            disabled={!!result}
          >
            {tile.text}
          </button>
        ))}
      </div>

      {result && (
        <div
          className="card animate-fade-in mb-16"
          style={{
            borderColor: result === 'correct' ? 'var(--success)' : 'var(--danger)',
            background: result === 'correct' ? 'var(--success-light)' : 'var(--danger-light)',
          }}
        >
          {result === 'correct' ? (
            <div style={{ color: 'var(--success)', fontWeight: 700 }}>✓ 正確！</div>
          ) : (
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: 700 }}>✗ 正確順序：</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>{sentence}</div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <button
          className="btn btn-primary btn-full"
          onClick={check}
          disabled={arranged.length === 0}
        >
          確認順序
        </button>
      )}
    </div>
  )
}

function splitJapanese(str) {
  // Split on particles / punctuation boundaries for Japanese
  const chunks = []
  let buf = ''
  const particles = ['は','が','を','に','で','と','も','の','へ','から','まで','より','など']
  for (const ch of str) {
    buf += ch
    if ('。、！？'.includes(ch)) {
      if (buf.trim()) chunks.push(buf.trim())
      buf = ''
    }
  }
  if (buf.trim()) chunks.push(buf.trim())

  // If very short or only one chunk, split into 2-3 char chunks
  if (chunks.length <= 1 && str.length > 4) {
    const size = Math.ceil(str.length / 4)
    const result = []
    for (let i = 0; i < str.length; i += size) result.push(str.slice(i, i + size))
    return result.filter(Boolean)
  }
  return chunks
}

function normalize(str) {
  return str.replace(/\s+/g, '').toLowerCase()
}
