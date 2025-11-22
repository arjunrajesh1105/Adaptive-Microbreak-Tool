import React from 'react'
import ActivityCard from './ActivityCard'


const CATEGORY_ORDER = ['physical','mental','cognitive','social']
const CATEGORY_LABEL = { physical: 'Physical', mental: 'Mental', cognitive: 'Cognitive', social: 'Social' }


export default function Dashboard({ activities, onSelect }) {
return (
<div className="dashboard-root">
<header className="dash-header">
<div>
<h1 className="title">Adaptive Microbreak</h1>
<p className="tag">Short, evidence-based breaks that fit your workflow</p>
</div>
<div className="meta">
<div className="btn-primary">Start Session</div>
</div>
</header>


<section className="cards-grid">
{CATEGORY_ORDER.map(cat => (
<div key={cat} className="category-block">
<h2 className="category-title">{CATEGORY_LABEL[cat]}</h2>
<div className="category-list">
{activities[cat].map(act => (
<ActivityCard key={act.id} activity={act} onSelect={() => onSelect(act)} />
))}
</div>
</div>
))}
</section>


<footer className="dash-footer">Source: Prototype — local-only data for testing. Evaluation Plan: <code>/mnt/data/Approach and Alternative Designs.pdf</code></footer>
</div>
)
}