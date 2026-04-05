import { japaneseVocabulary } from './japanese/vocabulary.js'
import { japaneseGrammar } from './japanese/grammar.js'
import { japanesePhrases } from './japanese/phrases.js'
import { englishVocabulary } from './english/vocabulary.js'
import { englishPhrases } from './english/phrases.js'

export const builtinCards = {
  ja: [...japaneseVocabulary, ...japaneseGrammar, ...japanesePhrases],
  en: [...englishVocabulary, ...englishPhrases],
}

export { japaneseVocabulary, japaneseGrammar, japanesePhrases, englishVocabulary, englishPhrases }
