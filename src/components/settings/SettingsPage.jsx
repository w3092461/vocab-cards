import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'

export default function SettingsPage() {
  const { lang, settings, updateSettings, clearCards, theme, toggleTheme } = useApp()
  const [confirmClear, setConfirmClear] = useState(false)

  const limitOptions = [5, 10, 15, 20]

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>設定</h2>

      {/* Daily new card limit */}
      <div className="card mb-16">
        <div className="font-semibold mb-4">每日新卡上限</div>
        <div className="text-sm text-muted mb-12">
          每天最多引入幾張新卡片（不含複習卡）
        </div>
        <div className="flex gap-8">
          {limitOptions.map(n => (
            <button
              key={n}
              className={`btn flex-1 ${settings.dailyNewLimit === n ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => updateSettings({ dailyNewLimit: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="card mb-16">
        <div className="font-semibold mb-12">主題外觀</div>
        <div className="flex gap-8">
          <button
            className={`btn flex-1 ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => theme !== 'light' && toggleTheme()}
          >
            ☀️ 淺色
          </button>
          <button
            className={`btn flex-1 ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => theme !== 'dark' && toggleTheme()}
          >
            🌙 深色
          </button>
        </div>
      </div>

      {/* Clear data */}
      <div className="card" style={{ borderColor: 'var(--danger)', borderWidth: 1 }}>
        <div className="font-semibold mb-4" style={{ color: 'var(--danger)' }}>清除資料</div>
        <div className="text-sm text-muted mb-12">
          {lang
            ? `清除目前語言（${lang === 'ja' ? '日文' : '英文'}）的所有卡片，或清除全部資料。`
            : '清除所有卡片資料。此操作無法復原。'}
        </div>

        {!confirmClear ? (
          <div className="flex flex-col gap-8">
            {lang && (
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => setConfirmClear('lang')}
              >
                清除{lang === 'ja' ? '日文' : '英文'}卡片
              </button>
            )}
            <button
              className="btn btn-outline"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => setConfirmClear('all')}
            >
              清除全部資料
            </button>
          </div>
        ) : (
          <div>
            <div className="alert alert-danger mb-12">
              確定要清除{confirmClear === 'lang' ? `${lang === 'ja' ? '日文' : '英文'}卡片` : '全部資料'}？此操作無法復原。
            </div>
            <div className="flex gap-8">
              <button
                className="btn btn-danger flex-1"
                onClick={() => {
                  if (confirmClear === 'lang') clearCards(lang)
                  else clearCards(null)
                  setConfirmClear(false)
                }}
              >
                確定清除
              </button>
              <button className="btn btn-ghost flex-1" onClick={() => setConfirmClear(false)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-faint mt-20">
        語塊練習 v2 · 資料僅存在您的裝置上
      </div>
    </div>
  )
}
