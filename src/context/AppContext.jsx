import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

// ─── localStorage helpers ─────────────────────────────────
const KEY = {
  theme:    'lg2_theme',
  lang:     'lg2_lang',
  cards:    'lg2_cards',
  settings: 'lg2_settings',
  stats:    'lg2_stats',
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── SRS helpers (exported for quiz components) ───────────
const INTERVALS = [1, 2, 4, 8, 16, 32, 64] // days

export function initSRS() {
  return { state: 'new', reps: 0, interval: 0, nextReview: 0 }
}

export function reviewSRS(srs, remembered) {
  const now = Date.now()
  if (remembered) {
    const reps = (srs.reps || 0) + 1
    const interval = INTERVALS[Math.min(reps - 1, INTERVALS.length - 1)]
    return {
      state: interval >= 8 ? 'known' : 'learning',
      interval,
      reps,
      nextReview: now + interval * 86400000,
    }
  } else {
    return {
      state: 'learning',
      interval: 1,
      reps: 0,
      nextReview: now + 86400000,
    }
  }
}

export function isDue(srs) {
  if (!srs || srs.state === 'new') return false
  return srs.nextReview <= Date.now()
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ─── Provider ─────────────────────────────────────────────
export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => load(KEY.theme, 'light'))
  const [lang,  setLang]  = useState(() => load(KEY.lang, null))
  const [cards, setCards] = useState(() => load(KEY.cards, []))
  const [settings, setSettings] = useState(() => load(KEY.settings, { dailyNewLimit: 10 }))
  const [stats, setStats] = useState(() => load(KEY.stats, {
    streak: 0,
    lastStudyDate: null,
    dailyLog: {},  // { 'YYYY-MM-DD': { reviewed: N, newCards: N, correct: N } }
  }))

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light'
      save(KEY.theme, next)
      return next
    })
  }, [])

  const selectLang = useCallback((l) => {
    save(KEY.lang, l)
    setLang(l)
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings(s => {
      const next = { ...s, ...patch }
      save(KEY.settings, next)
      return next
    })
  }, [])

  // ─── Card CRUD ─────────────────────────────────────────
  const addCard = useCallback((card) => {
    setCards(prev => {
      const next = [{
        ...card,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        srs: initSRS(),
      }, ...prev]
      save(KEY.cards, next)
      return next
    })
  }, [])

  const addCards = useCallback((newCards) => {
    setCards(prev => {
      const added = newCards.map(card => ({
        ...card,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: Date.now(),
        srs: initSRS(),
      }))
      const next = [...added, ...prev]
      save(KEY.cards, next)
      return next
    })
  }, [])

  const updateCard = useCallback((id, patch) => {
    setCards(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c)
      save(KEY.cards, next)
      return next
    })
  }, [])

  const deleteCard = useCallback((id) => {
    setCards(prev => {
      const next = prev.filter(c => c.id !== id)
      save(KEY.cards, next)
      return next
    })
  }, [])

  const clearCards = useCallback((language) => {
    setCards(prev => {
      const next = language ? prev.filter(c => c.lang !== language) : []
      save(KEY.cards, next)
      return next
    })
  }, [])

  // ─── Derived queries ───────────────────────────────────
  const getCards = useCallback((language) => {
    return cards.filter(c => c.lang === (language || lang))
  }, [cards, lang])

  const getTodayQueue = useCallback((language) => {
    const l = language || lang
    if (!l) return { reviews: [], newCards: [] }
    const today = todayStr()
    const todayLog = stats.dailyLog[today] || {}
    const newShownToday = todayLog.newCards || 0
    const remaining = Math.max(0, settings.dailyNewLimit - newShownToday)

    const langCards = cards.filter(c => c.lang === l)
    const now = Date.now()

    const reviews = langCards.filter(c =>
      c.srs && c.srs.state !== 'new' && c.srs.nextReview <= now
    )
    const newCards = langCards
      .filter(c => !c.srs || c.srs.state === 'new')
      .slice(0, remaining)

    return { reviews, newCards }
  }, [cards, lang, stats.dailyLog, settings.dailyNewLimit])

  // ─── Stats ─────────────────────────────────────────────
  const recordReview = useCallback(({ isNew, correct }) => {
    const today = todayStr()
    setStats(prev => {
      const log = { ...(prev.dailyLog[today] || { reviewed: 0, newCards: 0, correct: 0 }) }
      log.reviewed++
      if (isNew) log.newCards++
      if (correct) log.correct++

      let streak = prev.streak
      const last = prev.lastStudyDate
      if (last === today) {
        // same day, keep streak
      } else if (last === yesterdayStr()) {
        streak++
      } else {
        streak = 1
      }

      const next = {
        streak,
        lastStudyDate: today,
        dailyLog: { ...prev.dailyLog, [today]: log },
      }
      save(KEY.stats, next)
      return next
    })
  }, [])

  const value = {
    theme, toggleTheme,
    lang, selectLang,
    cards, addCard, addCards, updateCard, deleteCard, clearCards,
    settings, updateSettings,
    stats,
    getCards, getTodayQueue, recordReview,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
