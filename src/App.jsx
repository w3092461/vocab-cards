import React, { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Header from './components/layout/Header.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import HomePage from './components/home/HomePage.jsx'
import QuizPage from './components/quiz/QuizPage.jsx'
import ImportPage from './components/import/ImportPage.jsx'
import CardListPage from './components/cards/CardListPage.jsx'
import SettingsPage from './components/settings/SettingsPage.jsx'

function AppShell() {
  const { theme } = useApp()
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <>
      <Header />
      <main className="page">
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/quiz"     element={<QuizPage />} />
          <Route path="/import"   element={<ImportPage />} />
          <Route path="/cards"    element={<CardListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AppProvider>
  )
}
