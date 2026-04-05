// 使用瀏覽器專用的 kuromoji build，繞過 Vite ESM 限制
let tokenizerPromise = null

function loadKuromoji() {
  if (window.kuromoji) return Promise.resolve(window.kuromoji)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/kuromoji.js'
    script.onload = () => {
      console.log('[furigana] kuromoji.js loaded')
      resolve(window.kuromoji)
    }
    script.onerror = (e) => {
      console.warn('[furigana] failed to load kuromoji.js', e)
      reject(new Error('kuromoji.js not found'))
    }
    document.head.appendChild(script)
  })
}

function getTokenizer() {
  if (tokenizerPromise) return tokenizerPromise
  tokenizerPromise = loadKuromoji().then(kuromoji => {
    return new Promise((resolve, reject) => {
      console.log('[furigana] building tokenizer...')
      kuromoji.builder({ dicPath: '/dict' }).build((err, tokenizer) => {
        if (err) { console.warn('[furigana] build failed:', err); reject(err) }
        else { console.log('[furigana] tokenizer ready ✓'); resolve(tokenizer) }
      })
    })
  })
  return tokenizerPromise
}

function katakanaToHiragana(str) {
  return (str || '').replace(/[\u30a1-\u30f6]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  )
}

export async function toFuriganaHTML(text) {
  if (!text) return null
  if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return null
  try {
    const tokenizer = await getTokenizer()
    const tokens = tokenizer.tokenize(text)
    return tokens.map(token => {
      const surface = token.surface_form
      const reading = katakanaToHiragana(token.reading)
      if (reading && reading !== surface && /[\u4e00-\u9fff\u3400-\u4dbf]/.test(surface)) {
        return `<ruby>${surface}<rt>${reading}</rt></ruby>`
      }
      return surface
    }).join('')
  } catch (e) {
    console.warn('[furigana] error:', e.message)
    return null
  }
}
