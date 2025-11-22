import React, { useEffect, useState, useRef } from 'react'

const SAMPLE_ACTIVITIES = [
  { id: 'breath90_01', type: 'mental', title: '90s Guided Breathing', durationSec: 90, desc: 'Simple breathing guidance with short audio/text.' },
  { id: 'stretch60_01', type: 'physical', title: '60s Desk Stretches', durationSec: 60, desc: 'Neck rolls and shoulder openers you can do seated.' },
  { id: 'ground60_01', type: 'mental', title: '60s Grounding', durationSec: 60, desc: 'Short grounding exercise to reset focus.' },
  { id: 'microgame30_01', type: 'cognitive', title: '30s Pattern Puzzle', durationSec: 30, desc: 'A quick visual puzzle to reset attention.' },
  { id: 'social30_01', type: 'social', title: '30s Check-in Prompt', durationSec: 30, desc: 'Quick prompt: message a colleague or share a GIF.' }
]

export default function AdaptiveMicrobreak() {
  const [intervalMinutes, setIntervalMinutes] = useState(() => parseInt(localStorage.getItem('ab_interval')) || 60)
  const [isRunning, setIsRunning] = useState(false)
  const [secondsActive, setSecondsActive] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [preferences, setPreferences] = useState(() => JSON.parse(localStorage.getItem('ab_prefs')) || {})
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('ab_history')) || [])
  const intervalRef = useRef(null)

  useEffect(() => { localStorage.setItem('ab_interval', intervalMinutes) }, [intervalMinutes])
  useEffect(() => { localStorage.setItem('ab_prefs', JSON.stringify(preferences)) }, [preferences])
  useEffect(() => { localStorage.setItem('ab_history', JSON.stringify(history)) }, [history])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSecondsActive(s => s + 1), 1000)
    } else clearInterval(intervalRef.current)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  useEffect(() => { if (!showPrompt && secondsActive >= intervalMinutes * 60) triggerPrompt() }, [secondsActive, intervalMinutes, showPrompt])

  function triggerPrompt() {
    const scored = SAMPLE_ACTIVITIES.map(a => ({ ...a, score: (preferences[a.type] || 0.5) + Math.random() * 0.5 })).sort((x,y) => y.score - x.score)
    const chosen = scored[0]
    setCurrentActivity(chosen)
    setShowPrompt(true)
  }

  function completeActivity(action = 'complete') {
    const entry = { id: currentActivity?.id || null, action, timestamp: Date.now(), durationSec: currentActivity?.durationSec || 0 }
    setHistory(h => [entry, ...h].slice(0,200))
    if (currentActivity) setPreferences(prev => ({ ...prev, [currentActivity.type]: Math.min(1, (prev[currentActivity.type] || 0.5) + (action === 'complete' ? 0.1 : -0.05)) }))
    setSecondsActive(0)
    setShowPrompt(false)
    setCurrentActivity(null)
  }

  function skipActivity() { completeActivity('skip') }
  function postponeActivity() { setSecondsActive(intervalMinutes * 60 - 5 * 60); setShowPrompt(false) }
  function resetData() { localStorage.removeItem('ab_history'); localStorage.removeItem('ab_prefs'); setHistory([]); setPreferences({}) }

  return (
    <div className="container">
      <header>
        <h1>Adaptive Microbreak — Prototype</h1>
        <div>Interval: <input type="number" min="15" max="180" value={intervalMinutes} onChange={e => setIntervalMinutes(Number(e.target.value))} /> minutes</div>
      </header>

      <main>
        <section>
          <h2>Session</h2>
          <button onClick={() => setIsRunning(r => !r)}>{isRunning ? 'Stop' : 'Start'}</button>
          <div>Active Time: {formatTime(secondsActive)}</div>
          <div>Breaks Today: {history.filter(h => isToday(h.timestamp)).length}</div>

          <h3>Recent Activity</h3>
          <ul>
            {history.map((h, idx) => (
              <li key={idx}>{h.id || 'n/a'} — {new Date(h.timestamp).toLocaleString()} — {h.action}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Activity Library</h3>
          {SAMPLE_ACTIVITIES.map(a => (
            <div key={a.id}>
              <strong>{a.title}</strong> ({a.durationSec}s) — {a.desc}
              <button onClick={() => { setCurrentActivity(a); setShowPrompt(true) }}>Try</button>
            </div>
          ))}
        </section>

      </main>

      {showPrompt && currentActivity && (
        <div className="modal">
          <h3>Break Suggested</h3>
          <div>{currentActivity.title} • {currentActivity.durationSec}s</div>
          <div>{currentActivity.desc}</div>
          <button onClick={() => completeActivity('complete')}>Start Activity</button>
          <button onClick={postponeActivity}>Remind me later</button>
          <button onClick={skipActivity}>Skip</button>
        </div>
      )}

      <footer>
        <button onClick={resetData}>Reset Local Data</button>
      </footer>
    </div>
  )
}

function formatTime(sec) {
  const s = sec % 60; const m = Math.floor(sec / 60) % 60; const h = Math.floor(sec / 3600)
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
function isToday(ts) { const d = new Date(ts); const t = new Date(); return d.toDateString() === t.toDateString() }