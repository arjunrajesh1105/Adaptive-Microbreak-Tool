import React from 'react'
import ActivityCard from './ActivityCard'

const CATEGORY_ORDER = ['physical','mental','cognitive','social']
const CATEGORY_LABEL = { 
  physical: 'Physical', 
  mental: 'Mental', 
  cognitive: 'Cognitive', 
  social: 'Social' 
}

export default function Dashboard({ activities, onSelect, onOpenSchedule }) {
  // Load completed activities from localStorage and keep only the last 10
  const completedHistory = JSON.parse(localStorage.getItem('ab_history') || '[]').slice(0, 10)

  return (
    <div className="dashboard-root">

      <header className="dash-header">
        <div>
          <h1 className="title">Adaptive Microbreak</h1>
          <p className="tag">Short, evidence-based breaks that fit your workflow</p>
        </div>

        <div className="meta">
          <button 
            className="btn-primary"
            onClick={onOpenSchedule}
          >
            Start Session
          </button>
        </div>
      </header>

      {/* Recent Completed Activities */}
      {completedHistory.length > 0 && (
        <section className="recent-completed">
          <h2 className="category-title">Recently Completed</h2>
          <div className="recent-list">
            {completedHistory.map(hist => {
              // Find the activity details from activities data
              const act = activities[hist.category]?.find(a => a.id === hist.id)
              if (!act) return null
              return (
                <div
                  key={hist.timestamp}
                  className={`recent-card badge-${act.type}`}
                  onClick={() => onSelect(act)}
                >
                  <div className={`badge badge-${act.type} recent-category`}>{act.type}</div>
                  <div className="recent-title">{act.title}</div>
                  <div className="recent-duration">{Math.ceil(act.duration / 60)} min</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Activity Categories */}
      <section className="cards-grid">
        {CATEGORY_ORDER.map(cat => (
          <div key={cat} className="category-block">
            <h2 className="category-title">{CATEGORY_LABEL[cat]}</h2>
            <div className="category-list">
              {activities[cat].map(act => (
                <ActivityCard 
                  key={act.id} 
                  activity={act} 
                  onSelect={() => onSelect(act)} 
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="dash-footer">
        Source: Prototype — local-only data for testing. Evaluation Plan: 
        <code>/mnt/data/Approach and Alternative Designs.pdf</code>
      </footer>

    </div>
  )
}
