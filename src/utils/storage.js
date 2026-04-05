export const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem('lg_' + key)
      return v !== null ? JSON.parse(v) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('lg_' + key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage write failed', e)
    }
  },
  remove(key) {
    localStorage.removeItem('lg_' + key)
  },
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lg_'))
      .forEach(k => localStorage.removeItem(k))
  },
}
