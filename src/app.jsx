import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ActivityPage from './components/ActivityPage'
import Schedule from './components/Schedule'
import activities from './data/activities.json'

export default function App() {
  const [selected, setSelected] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)

  // Track work time
  const [workSeconds, setWorkSeconds] = useState(() => {
    return Number(localStorage.getItem('work_seconds') || 0)
  })

  // Scheduled breaks from localStorage
  const [scheduledBreaks, setScheduledBreaks] = useState(() => {
    return JSON.parse(localStorage.getItem('scheduled_breaks') || '[]')
  })

  // Track which breaks have already triggered notifications
  const [notifiedBreaks, setNotifiedBreaks] = useState([])

  // Request notification permission once
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  // Tick the work timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Save work timer to localStorage
  useEffect(() => {
    localStorage.setItem('work_seconds', workSeconds)
  }, [workSeconds])

  // Notify when work threshold is reached (45 min)
  const BREAK_THRESHOLD = 45 * 60
  useEffect(() => {
    if (workSeconds === BREAK_THRESHOLD && Notification.permission === 'granted') {
      new Notification('Time for a break!', {
        body: "You've been working for a while. Take a quick activity to recharge."
      })
    }
  }, [workSeconds])

  // Check scheduled breaks in the background
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const nowStr = now.toTimeString().slice(0,5) // "HH:MM" 24-hour format

      const storedBreaks = JSON.parse(localStorage.getItem('scheduled_breaks') || '[]')

      storedBreaks.forEach(b => {
        if (b.time === nowStr && !notifiedBreaks.includes(b.id)) {
          if (Notification.permission === 'granted') {
            new Notification('Scheduled Break', {
              body: `Your ${b.duration} min break is starting now!`
            })
            setNotifiedBreaks(prev => [...prev, b.id])
          }
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [notifiedBreaks])

  // Update scheduled breaks if localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setScheduledBreaks(JSON.parse(localStorage.getItem('scheduled_breaks') || '[]'))
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // When a user selects an activity, reset timer
  const handleSelect = (activity) => {
    setSelected(activity)
    setWorkSeconds(0)
  }

  const handleClose = () => {
    setSelected(null)
  }

  return (
    <div className="app-root">
      {/* Schedule Page */}
      {showSchedule && (
        <Schedule onClose={() => setShowSchedule(false)} />
      )}

      {/* Activity Page */}
      {!showSchedule && selected && (
        <ActivityPage
          activity={selected}
          onClose={handleClose}
        />
      )}

      {/* Dashboard */}
      {!showSchedule && !selected && (
        <Dashboard
          activities={activities}
          onSelect={handleSelect}
          onOpenSchedule={() => setShowSchedule(true)}
        />
      )}
    </div>
  )
}
