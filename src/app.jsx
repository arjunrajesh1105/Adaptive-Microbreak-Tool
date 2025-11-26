import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ActivityPage from './components/ActivityPage'
import activities from './data/activities.json'

export default function App() {
  const [selected, setSelected] = useState(null)

  // Track continuous work time (in seconds)
  const [workSeconds, setWorkSeconds] = useState(() => {
    return Number(localStorage.getItem('work_seconds') || 0)
  })

  // Request notification permission once
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  // Increment work timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Save work timer to localStorage (so it survives refresh)
  useEffect(() => {
    localStorage.setItem('work_seconds', workSeconds)
  }, [workSeconds])

  // Break threshold in seconds (45 minutes)
  const BREAK_THRESHOLD = 1 * 60

  // Trigger notification when threshold is reached
  useEffect(() => {
    if (workSeconds === BREAK_THRESHOLD) {
      if (Notification.permission === 'granted') {
        new Notification('Time for a break!', {
          body: "You've been working for a while. Take a quick activity to recharge.",
        })
      }
    }
  }, [workSeconds])

  // Reset timer when user starts a break activity
  const handleSelect = (activity) => {
    setSelected(activity)
    setWorkSeconds(0)
  }

  const handleClose = () => {
    setSelected(null)
  }

  return (
    <div className="app-root">
      {!selected ? (
        <Dashboard activities={activities} onSelect={handleSelect} />
      ) : (
        <ActivityPage activity={selected} onClose={handleClose} />
      )}
    </div>
  )
}
