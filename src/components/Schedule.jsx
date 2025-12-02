import React, { useState, useEffect } from 'react'

export default function Schedule({ onClose }) {
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(5)
  const [breaks, setBreaks] = useState(() => {
    return JSON.parse(localStorage.getItem('scheduled_breaks') || '[]')
  })
  const [notifiedBreaks, setNotifiedBreaks] = useState([])

  // Add a new break
  const addBreak = () => {
    if (!time) return alert('Please select a start time')
    const newBreak = { id: Date.now(), time, duration }
    const updated = [...breaks, newBreak].sort((a, b) => a.time.localeCompare(b.time))
    setBreaks(updated)
    localStorage.setItem('scheduled_breaks', JSON.stringify(updated))
    setTime('')
    setDuration(5)
  }

  const removeBreak = id => {
    const updated = breaks.filter(b => b.id !== id)
    setBreaks(updated)
    localStorage.setItem('scheduled_breaks', JSON.stringify(updated))
    setNotifiedBreaks(prev => prev.filter(nb => nb !== id))
  }

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  // Background notification checker using localStorage (works across tabs)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const nowStr = now.toTimeString().slice(0,5)
      const storedBreaks = JSON.parse(localStorage.getItem('scheduled_breaks') || '[]')
      storedBreaks.forEach(b => {
        if (b.time === nowStr && !notifiedBreaks.includes(b.id)) {
          if (Notification.permission === 'granted') {
            new Notification('Break Time!', {
              body: `Your scheduled ${b.duration} min break is starting now.`,
            })
            setNotifiedBreaks(prev => [...prev, b.id])
          }
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [notifiedBreaks])

  // Convert "HH:MM" to 12-hour format
  const format12Hour = (time24) => {
    const [h, m] = time24.split(':')
    let hour = Number(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12 || 12
    return `${hour}:${m} ${ampm}`
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#0ea5e9' }}>Schedule Your Break</h2>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #0ea5e9', background: 'white', color: '#0f172a' }}
        />
        <input
          type="number"
          min="1"
          max="60"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #0ea5e9', width: '80px', background: 'white', color: '#0f172a' }}
        />
        <button
          onClick={addBreak}
          style={{ background: 'linear-gradient(90deg,#06b6d4,#0ea5e9)', color: 'white', borderRadius: '8px', padding: '8px 12px', border: 0, cursor: 'pointer' }}
        >
          Add Break
        </button>
      </div>

      <h4>Scheduled Breaks for Today</h4>
      <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {breaks.map(b => (
          <li key={b.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)',
          }}>
            <span>{format12Hour(b.time)} — {b.duration} min</span>
            <button
              onClick={() => removeBreak(b.id)}
              style={{ background: 'transparent', border: '1px solid #0ea5e9', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#0ea5e9' }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '20px' }}>
        <button
          className="btn-ghost"
          onClick={onClose}
          style={{ border: '1px solid #0ea5e9', padding: '8px 12px', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
