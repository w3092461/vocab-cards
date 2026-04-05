// Re-export from AppContext for convenience
export { initSRS, reviewSRS, isDue } from '../context/AppContext.jsx'

export function srsLabel(srs) {
  if (!srs || srs.state === 'new') return '新卡'
  if (srs.state === 'known') return '已熟悉'
  if (srs.interval <= 1) return '明天'
  return `${srs.interval} 天後`
}

export function srsStateColor(srs) {
  if (!srs || srs.state === 'new') return 'badge-blue'
  if (srs.state === 'known') return 'badge-green'
  return 'badge-gray'
}
