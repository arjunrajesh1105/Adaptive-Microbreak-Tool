import React, { useState, useEffect } from 'react'

export default function Schedule({ onClose }) {
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(5)
  const [breaks, setBreaks] = useState(() => {
    return JSON.parse(localStorage.getItem('scheduled_breaks') || '[]')
  })
  const [notifiedBreaks, setNotifiedBreaks] = useState([])
  
  // Calendar and meeting states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [meetings, setMeetings] = useState(() => {
    return JSON.parse(localStorage.getItem('calendar_meetings') || '[]')
  })
  const [notifiedMeetings, setNotifiedMeetings] = useState([])
  // Track how many full meeting-hours we've already notified for each date
  const [hourlyNotified, setHourlyNotified] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('meeting_hour_notifications') || '{}')
    } catch (e) {
      return {}
    }
  })
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingStartTime, setMeetingStartTime] = useState('')
  const [meetingEndTime, setMeetingEndTime] = useState('')

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

  // Add a new meeting
  const addMeeting = () => {
    if (!meetingTitle || !meetingDate || !meetingStartTime || !meetingEndTime) {
      return alert('Please fill in all meeting details')
    }
    if (meetingEndTime <= meetingStartTime) {
      return alert('End time must be after start time')
    }
    const newMeeting = {
      id: Date.now(),
      title: meetingTitle,
      date: meetingDate,
      startTime: meetingStartTime,
      endTime: meetingEndTime
    }
    const updated = [...meetings, newMeeting]
    setMeetings(updated)
    localStorage.setItem('calendar_meetings', JSON.stringify(updated))
    setMeetingTitle('')
    setMeetingDate('')
    setMeetingStartTime('')
    setMeetingEndTime('')
    setShowMeetingForm(false)
  }

  const removeMeeting = id => {
    const updated = meetings.filter(m => m.id !== id)
    setMeetings(updated)
    localStorage.setItem('calendar_meetings', JSON.stringify(updated))
    setNotifiedMeetings(prev => prev.filter(nm => nm !== id))
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
      const nowStr = now.toTimeString().slice(0, 5)
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
      
      // Check meeting completions and trigger hour-based break notifications
      const storedMeetings = JSON.parse(localStorage.getItem('calendar_meetings') || '[]')
      const todayStr = now.toISOString().split('T')[0]

      // Helper to parse HH:MM into minutes
      const toMinutes = (hhmm) => {
        const [hh, mm] = hhmm.split(':').map(Number)
        return hh * 60 + mm
      }

      // Sum minutes of meetings that have ended so far today (endTime <= now)
      let completedMinutesToday = 0
      storedMeetings.forEach(m => {
        if (m.date === todayStr) {
          // if meeting has ended (endTime <= nowStr)
          if (m.endTime <= nowStr) {
            try {
              const start = toMinutes(m.startTime)
              const end = toMinutes(m.endTime)
              const dur = Math.max(0, end - start)
              completedMinutesToday += dur
            } catch (e) {
              // ignore malformed times
            }
          }
        }
      })

      // Compute how many full hours completed (each 60 minutes)
      const hoursCompleted = Math.floor(completedMinutesToday / 60)
      const notifiedForToday = hourlyNotified[todayStr] || 0

      if (hoursCompleted > notifiedForToday) {
        // send a notification for each new hour reached (1-per-hour)
        for (let h = notifiedForToday + 1; h <= hoursCompleted; h++) {
          if (Notification.permission === 'granted') {
            new Notification('Meeting Hour Reached — Take a Break', {
              body: `You've completed ${h} hour${h > 1 ? 's' : ''} of meetings today. Take a microbreak!`,
              tag: `meeting-hours-${todayStr}-${h}`,
            })
          }
        }

        // update state and persist
        const updatedHourly = { ...hourlyNotified, [todayStr]: hoursCompleted }
        setHourlyNotified(updatedHourly)
        try { localStorage.setItem('meeting_hour_notifications', JSON.stringify(updatedHourly)) } catch (e) {}
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [notifiedBreaks, notifiedMeetings])

  // Convert "HH:MM" to 12-hour format
  const format12Hour = (time24) => {
    const [h, m] = time24.split(':')
    let hour = Number(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12 || 12
    return `${hour}:${m} ${ampm}`
  }

  // Calendar utilities
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getMeetingsForDate = (dateStr) => {
    return meetings.filter(m => m.date === dateStr)
  }

  const formatDateForInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const calendarDays = []
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#0ea5e9' }}>Schedule Your Break</h2>
      
      {/* Timer Break Section */}
      <div style={{ marginBottom: '30px', padding: '15px', borderRadius: '8px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)' }}>
        <h3 style={{ marginTop: 0, color: '#0ea5e9' }}>Timed Breaks</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
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
            placeholder="Duration"
          />
          <button
            onClick={addBreak}
            style={{ background: 'linear-gradient(90deg,#06b6d4,#0ea5e9)', color: 'white', borderRadius: '8px', padding: '8px 12px', border: 0, cursor: 'pointer' }}
          >
            Add Break
          </button>
        </div>

        <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>Scheduled Breaks for Today</h4>
        <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
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
        {breaks.length === 0 && <p style={{ color: '#666', marginTop: '8px' }}>No timed breaks scheduled</p>}
      </div>

      {/* Calendar Section */}
      <div style={{ marginBottom: '30px', padding: '15px', borderRadius: '8px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)' }}>
        <h3 style={{ marginTop: 0, color: '#0ea5e9' }}>Calendar & Meetings</h3>
        
        {/* Calendar */}
        <div style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button
              onClick={previousMonth}
              style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
            >
              ← Prev
            </button>
            <h4 style={{ margin: 0, color: '#0f172a' }}>{monthYear}</h4>
            <button
              onClick={nextMonth}
              style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer' }}
            >
              Next →
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '5px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', color: '#666', fontSize: '12px', padding: '5px' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
            {calendarDays.map((day, idx) => {
              const dateStr = day ? formatDateForInput(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : ''
              const dayMeetings = day ? getMeetingsForDate(dateStr) : []
              const isToday = day && new Date().toISOString().split('T')[0] === dateStr
              
              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    borderRadius: '6px',
                    background: day ? (isToday ? '#fbbf24' : (dayMeetings.length > 0 ? '#dbeafe' : '#f3f4f6')) : 'transparent',
                    border: day ? (isToday ? '2px solid #f59e0b' : (dayMeetings.length > 0 ? '1px solid #0ea5e9' : '1px solid #e5e7eb')) : 'none',
                    minHeight: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    cursor: day ? 'pointer' : 'default',
                    color: day ? '#0f172a' : '#ccc',
                    fontSize: '13px'
                  }}
                >
                  {day && <span style={{ fontWeight: 'bold' }}>{day}</span>}
                  {dayMeetings.length > 0 && (
                    <span style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: 'bold', marginTop: '2px' }}>
                      {dayMeetings.length} meeting{dayMeetings.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Meeting Form */}
        <div style={{ marginBottom: '15px' }}>
          {!showMeetingForm ? (
            <button
              onClick={() => setShowMeetingForm(true)}
              style={{ background: 'linear-gradient(90deg,#06b6d4,#0ea5e9)', color: 'white', borderRadius: '8px', padding: '8px 12px', border: 0, cursor: 'pointer', width: '100%' }}
            >
              + Add Meeting
            </button>
          ) : (
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: 0, color: '#0f172a' }}>New Meeting</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Meeting title"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #0ea5e9', background: 'white', color: '#0f172a' }}
                />
                <input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #0ea5e9', background: 'white', color: '#0f172a' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="time"
                    placeholder="Start time"
                    value={meetingStartTime}
                    onChange={e => setMeetingStartTime(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #0ea5e9', background: 'white', color: '#0f172a', flex: 1 }}
                  />
                  <input
                    type="time"
                    placeholder="End time"
                    value={meetingEndTime}
                    onChange={e => setMeetingEndTime(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #0ea5e9', background: 'white', color: '#0f172a', flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={addMeeting}
                    style={{ background: 'linear-gradient(90deg,#06b6d4,#0ea5e9)', color: 'white', borderRadius: '8px', padding: '8px 12px', border: 0, cursor: 'pointer', flex: 1 }}
                  >
                    Save Meeting
                  </button>
                  <button
                    onClick={() => setShowMeetingForm(false)}
                    style={{ background: '#f3f4f6', color: '#0f172a', borderRadius: '8px', padding: '8px 12px', border: '1px solid #d1d5db', cursor: 'pointer', flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Meetings List */}
        <div>
          <h4 style={{ marginBottom: '8px', color: '#0f172a' }}>Your Meetings</h4>
          <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
            {meetings.length === 0 ? (
              <li style={{ color: '#666', padding: '8px' }}>No meetings scheduled</li>
            ) : (
              meetings.map(m => (
                <li key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{m.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {formatDateDisplay(m.date)} • {format12Hour(m.startTime)} - {format12Hour(m.endTime)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMeeting(m.id)}
                    style={{ background: 'transparent', border: '1px solid #0ea5e9', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#0ea5e9', whiteSpace: 'nowrap' }}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Close Button */}
      <div style={{ marginTop: '20px' }}>
        <button
          className="btn-ghost"
          onClick={onClose}
          style={{ border: '1px solid #0ea5e9', padding: '8px 12px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: '#0ea5e9', width: '100%' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
