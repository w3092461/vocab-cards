import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../../context/AppContext.jsx'

// ─── 自動偵測語言 ─────────────────────────────────────────
function detectLang(word) {
  // 包含平假名、片假名、漢字 → 日文
  return /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\u3400-\u4dbf]/.test(word) ? 'ja' : 'en'
}

// ─── CSV 範本（統一格式）──────────────────────────────────
const CSV_TEMPLATE = `word,reading,meaning,example,example_translation,notes
食べる,たべる,吃,毎日ご飯を食べます。,我每天吃飯。,動詞・他動詞
建物の中,たてものの なか,建築物的內部,建物の中は涼しいです。,建築物內部很涼爽。,
coming of age,,成長・成人,It's a coming of age story.,這是一個成長故事。,常用於電影描述`

// ─── 欄位名稱對應（支援多種別名）────────────────────────
const FIELD_ALIASES = {
  word:                ['word', '單字', '語塊', 'phrase', 'vocabulary', 'term'],
  reading:             ['reading', '讀音', '平假名', 'furigana', 'yomi'],
  meaning:             ['meaning', '意思', '中文', '翻譯', 'translation', 'chinese'],
  example:             ['example', '例句', 'sentence', '來源句子', 'sample'],
  example_translation: ['example_translation', '例句翻譯', '翻譯句子', 'sentence_translation'],
  notes:               ['notes', '說明', '補充', 'usage', '使用說明', 'note', 'grammar'],
}

function buildColumnMap(headers) {
  const map = {}
  headers.forEach((h, i) => {
    const norm = String(h || '').trim().toLowerCase().replace(/\s+/g, '_')
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (!(field in map) && aliases.some(a => norm === a || norm.includes(a))) {
        map[field] = i
      }
    }
  })
  return map
}

// ─── 讀取檔案 ─────────────────────────────────────────────
async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)

    reader.onload = ev => {
      try {
        let rows
        if (isExcel) {
          const wb = XLSX.read(ev.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        } else {
          const lines = ev.target.result.trim().split('\n').filter(l => l.trim())
          rows = lines.map(parseCSVLine)
        }
        resolve(rows)
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('檔案讀取失敗'))
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file, 'UTF-8')
  })
}

function parseCSVLine(line) {
  const result = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function col(row, idx) {
  return idx == null ? '' : String(row[idx] ?? '').trim()
}

// ─── Main ImportPage ───────────────────────────────────────
export default function ImportPage() {
  const [tab, setTab] = useState(0)
  const { addCard, addCards, updateCard, cards: allCards = [] } = useApp()

  // 不再需要選語言，自動偵測
  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-16">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>匯入卡片</h2>
        <span className="badge badge-gray">已有 {allCards.length} 張</span>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>上傳檔案</button>
        <button className={`tab-item ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>手動新增</button>
      </div>

      {tab === 0 && (
        <FileImport
          existingCards={allCards}
          addCards={addCards}
          updateCard={updateCard}
        />
      )}
      {tab === 1 && <ManualAdd addCard={addCard} />}
    </div>
  )
}

// ─── File Import ───────────────────────────────────────────
function FileImport({ existingCards, addCards, updateCard }) {
  const fileRef = useRef()
  const [status,     setStatus]     = useState(null)   // { ok, count } | null
  const [duplicates, setDuplicates] = useState(null)   // [{ newCard, existing }] | null
  const [pendingNew, setPendingNew] = useState([])     // non-duplicate cards waiting

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setStatus(null); setDuplicates(null); setPendingNew([])

    try {
      const rows = await readFile(file)
      if (rows.length < 2) throw new Error('檔案沒有資料列（第一列應為欄位名稱）')

      const headers = rows[0].map(h => String(h || ''))
      const colMap  = buildColumnMap(headers)

      if (colMap.word == null || colMap.meaning == null) {
        throw new Error('找不到必填欄位「word」和「meaning」，請確認欄位名稱')
      }

      const parsed = rows.slice(1)
        .map(row => ({
          word:                col(row, colMap.word),
          reading:             col(row, colMap.reading),
          meaning:             col(row, colMap.meaning),
          example:             col(row, colMap.example),
          example_translation: col(row, colMap.example_translation),
          notes:               col(row, colMap.notes),
        }))
        .filter(r => r.word && r.meaning)
        .map(r => ({ ...r, lang: detectLang(r.word) }))

      // 重複偵測
      const dups = []
      const clean = []
      for (const newCard of parsed) {
        const existing = existingCards.find(
          c => (c.word || '').toLowerCase() === newCard.word.toLowerCase()
        )
        if (existing) {
          dups.push({ newCard, existing })
        } else {
          clean.push(newCard)
        }
      }

      if (dups.length > 0) {
        setPendingNew(clean)
        setDuplicates(dups)
      } else {
        addCards(parsed)
        setStatus({ ok: true, count: parsed.length })
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    }
  }

  function handleDuplicateResolved(choices) {
    // choices: { [word]: 'skip' | 'new' | 'replace' }
    const toAdd     = [...pendingNew]
    const toReplace = []

    for (const { newCard, existing } of duplicates) {
      const choice = choices[newCard.word] || 'skip'
      if (choice === 'new')     toAdd.push(newCard)
      if (choice === 'replace') toReplace.push({ id: existing.id, data: newCard })
    }

    if (toAdd.length > 0)     addCards(toAdd)
    toReplace.forEach(({ id, data }) =>
      updateCard(id, { word: data.word, reading: data.reading, meaning: data.meaning,
                       example: data.example, example_translation: data.example_translation,
                       notes: data.notes })
    )

    setStatus({ ok: true, count: toAdd.length + toReplace.length })
    setDuplicates(null)
    setPendingNew([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      {/* 範本說明 */}
      <div className="card mb-16" style={{ background: 'var(--surface2)', padding: '12px 14px' }}>
        <div className="text-xs font-semibold text-muted mb-8">欄位名稱（第一列為標題）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4px 12px', fontSize: '0.82rem' }}>
          <span className="font-semibold">word</span>        <span className="text-muted">單字、語塊或完整句子（必填）</span>
          <span className="font-semibold">reading</span>     <span className="text-muted">平假名讀音，顯示在語塊上方（選填）</span>
          <span className="font-semibold">meaning</span>     <span className="text-muted">中文意思（必填）</span>
          <span className="font-semibold">example</span>     <span className="text-muted">例句（選填）</span>
          <span className="font-semibold">example_translation</span> <span className="text-muted">例句中文翻譯（選填）</span>
          <span className="font-semibold">notes</span>       <span className="text-muted">補充說明（選填）</span>
        </div>
        <div className="text-xs text-faint mt-8">語言（日文／英文）依 word 欄位自動辨識。reading 欄位範例：建物の中 → たてものの なか</div>
      </div>

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
        download="template.csv"
        className="btn btn-outline btn-sm mb-16"
        style={{ display: 'inline-flex' }}
      >
        ↓ 下載 CSV 範本
      </a>

      <div className="input-group">
        <label className="label">上傳檔案（Excel .xlsx 或 CSV .csv）</label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFile}
          className="input"
        />
      </div>

      {status && !duplicates && (
        <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'} mt-8`}>
          {status.ok ? `✓ 成功匯入 ${status.count} 張卡片` : `✗ 錯誤：${status.msg}`}
        </div>
      )}

      {duplicates && (
        <DuplicateReview
          duplicates={duplicates}
          onResolve={handleDuplicateResolved}
          onCancel={() => { setDuplicates(null); setPendingNew([]) }}
        />
      )}
    </div>
  )
}

// ─── Duplicate Review Modal ────────────────────────────────
function DuplicateReview({ duplicates, onResolve, onCancel }) {
  const [choices, setChoices] = useState(() => {
    const init = {}
    duplicates.forEach(({ newCard }) => { init[newCard.word] = 'skip' })
    return init
  })

  function setChoice(word, value) {
    setChoices(prev => ({ ...prev, [word]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-16">
          <div style={{ fontWeight: 700 }}>發現重複卡片（{duplicates.length} 張）</div>
          <button className="btn-icon" onClick={onCancel}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '50vh', overflowY: 'auto' }}>
          {duplicates.map(({ newCard, existing }) => (
            <div key={newCard.word} className="card-sm">
              <div className="font-semibold mb-4" style={{ color: 'var(--primary)' }}>
                「{newCard.word}」
              </div>
              <div className="text-sm text-muted mb-8">
                已有卡片：{existing.meaning}<br />
                新匯入：{newCard.meaning}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { value: 'new',     label: '① 不同意思 → 分開建立新卡片' },
                  { value: 'skip',    label: '② 重複了 → 跳過不匯入' },
                  { value: 'replace', label: '③ 更新原本的卡片 → 取代舊的' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-8 text-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name={newCard.word}
                      value={opt.value}
                      checked={choices[newCard.word] === opt.value}
                      onChange={() => setChoice(newCard.word, opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-12 mt-16">
          <button
            className="btn btn-primary flex-1"
            onClick={() => onResolve(choices)}
          >
            確認匯入
          </button>
          <button className="btn btn-ghost flex-1" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ─── 手動新增 ──────────────────────────────────────────────
function ManualAdd({ addCard }) {
  const [form, setForm] = useState({
    word: '', reading: '', meaning: '', example: '', example_translation: '', notes: ''
  })
  const [done, setDone] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit() {
    if (!form.word.trim() || !form.meaning.trim()) return
    const lang = detectLang(form.word)
    addCard({ lang, ...form })
    setForm({ word: '', reading: '', meaning: '', example: '', example_translation: '', notes: '' })
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  const detectedLang = form.word ? detectLang(form.word) : null

  return (
    <div>
      <div className="input-group">
        <label className="label">
          單字 / 語塊
          {detectedLang && (
            <span className="badge badge-blue" style={{ marginLeft: 8 }}>
              {detectedLang === 'ja' ? '🇯🇵 日文' : '🇬🇧 英文'}
            </span>
          )}
        </label>
        <input
          className="input"
          value={form.word}
          onChange={e => set('word', e.target.value)}
          placeholder="例：建物の中　或　coming of age"
        />
      </div>

      {detectedLang === 'ja' && (
        <div className="input-group">
          <label className="label">平假名讀音（選填，顯示在語塊上方）</label>
          <input
            className="input"
            value={form.reading}
            onChange={e => set('reading', e.target.value)}
            placeholder="例：たてものの なか"
          />
        </div>
      )}

      <div className="input-group">
        <label className="label">中文意思</label>
        <input
          className="input"
          value={form.meaning}
          onChange={e => set('meaning', e.target.value)}
          placeholder="例：裂縫出現"
        />
      </div>

      <div className="input-group">
        <label className="label">例句（選填）</label>
        <textarea
          className="input"
          value={form.example}
          onChange={e => set('example', e.target.value)}
          placeholder="例：コンクリートにひびが入っていました。"
        />
      </div>

      <div className="input-group">
        <label className="label">例句中文翻譯（選填）</label>
        <textarea
          className="input"
          value={form.example_translation}
          onChange={e => set('example_translation', e.target.value)}
          placeholder="例：混凝土上出現了裂縫。"
        />
      </div>

      <div className="input-group">
        <label className="label">補充說明（選填）</label>
        <textarea
          className="input"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="使用方法、文法說明、語境提示…"
        />
      </div>

      <button
        className="btn btn-primary btn-lg btn-full"
        onClick={submit}
        disabled={!form.word.trim() || !form.meaning.trim()}
      >
        新增卡片
      </button>

      {done && (
        <div className="alert alert-success mt-12 animate-in text-center">✓ 新增成功！</div>
      )}
    </div>
  )
}
