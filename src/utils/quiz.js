/** Shuffle array (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick n random items from arr (no repeats) */
export function sample(arr, n) {
  return shuffle(arr).slice(0, n)
}

/**
 * Build a multiple-choice question from cards.
 * @param {object} card       – the "question" card
 * @param {object[]} allCards – pool for distractors
 * @param {'ja_to_zh'|'zh_to_ja'} direction
 */
export function buildMCQuestion(card, allCards, direction = 'ja_to_zh') {
  const distractors = sample(
    allCards.filter(c => c.id !== card.id),
    3
  )

  const toQuestion = (c) => direction === 'ja_to_zh' ? (c.word || c.phrase || c.pattern) : c.meaning
  const toAnswer   = (c) => direction === 'ja_to_zh' ? c.meaning : (c.word || c.phrase || c.pattern)

  const options = shuffle([
    { text: toAnswer(card), correct: true, id: card.id },
    ...distractors.map(c => ({ text: toAnswer(c), correct: false, id: c.id })),
  ])

  return { question: toQuestion(card), options, card }
}

/** Normalise a string for fill-blank comparison */
export function normalise(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[ー]/g, 'ー')  // keep long vowel mark
}

/** Fuzzy match: allow 1 edit distance */
export function fuzzyMatch(a, b) {
  const na = normalise(a)
  const nb = normalise(b)
  if (na === nb) return true
  if (Math.abs(na.length - nb.length) > 1) return false
  let diff = 0
  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    if (na[i] !== nb[i]) diff++
    if (diff > 1) return false
  }
  return true
}

/**
 * Build a fill-blank question from a card's example sentence.
 * Blanks out the card's word in the sentence.
 */
export function buildFillBlank(card) {
  const examples = card.examples || []
  const jp = examples.find(e => e.ja || e.sentence)
  if (!jp) return null

  const sentence = jp.ja || jp.sentence || ''
  const word = card.word || card.phrase || card.pattern || ''
  if (!sentence || !word) return null

  const blanked = sentence.replace(word, '＿＿＿')
  if (blanked === sentence) return null // couldn't find word in sentence

  return {
    sentence: blanked,
    answer: word,
    original: sentence,
    translation: jp.zh || jp.translation || card.meaning,
    card,
  }
}
