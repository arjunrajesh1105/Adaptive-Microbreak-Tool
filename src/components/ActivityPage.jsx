import React, { useEffect, useState, useRef } from 'react'

export default function ActivityPage({ activity, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(activity.duration)
  const [running, setRunning] = useState(true)
  const [completed, setCompleted] = useState(false) // track if already completed
  const timerRef = useRef(null)

  // Timer interval effect
  useEffect(() => {
    if (running && secondsLeft > 0) {
      timerRef.current = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running, secondsLeft])

  // When timer hits 0 or finish button pressed, record completion
  const recordCompletion = () => {
  if (completed) return;
  setCompleted(true);

  const hist = JSON.parse(localStorage.getItem('ab_history') || '[]');
  hist.unshift({
    id: activity.id,
    category: activity.type,
    title: activity.title,
    timestamp: Date.now(),
    duration: activity.duration
  });
  
  // Keep only the latest 10
  localStorage.setItem('ab_history', JSON.stringify(hist.slice(0, 10)));
};


  useEffect(() => {
    if (secondsLeft <= 0) {
      clearInterval(timerRef.current)
      setRunning(false)
      recordCompletion()
    }
  }, [secondsLeft])

  function formatTime(sec) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2,'0')}`
  }

  const handleFinish = () => {
    setSecondsLeft(0)
    recordCompletion()
    onClose()
  }

  return (
    <div className="activity-page">
      <div className="activity-header">
        <button className="btn-link" onClick={onClose}>← Back</button>
        <div>
          <h2>{activity.title}</h2>
          <div className="meta">{Math.ceil(activity.duration / 60)} min • {activity.type}</div>
        </div>
        <div></div>
      </div>

      <div className="activity-content">
        <div className="activity-left">
          <p className="lead">{activity.description}</p>

          {activity.video ? (
            <div className="video-wrap">
              <iframe
                width="560"
                height="315"
                src={activity.video}
                title={activity.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="placeholder">No video — follow on-screen instructions.</div>
          )}
        </div>

        <aside className="activity-right">
          <div className="timer">
            <div className="timer-display">{formatTime(secondsLeft)}</div>
            <div className="timer-controls">
              <button className="btn" onClick={() => setRunning(r => !r)}>
                {running ? 'Pause' : 'Resume'}
              </button>
              <button className="btn-ghost" onClick={handleFinish}>
                Finish
              </button>
            </div>
          </div>

          <div className="notes">
            <h4>Tips</h4>
            <ul>
              <li>Follow the guide gently — no pressure.</li>
              <li>If a video is linked, set audio to a comfortable level.</li>
              <li>Mark activities you like to get better suggestions over time.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
