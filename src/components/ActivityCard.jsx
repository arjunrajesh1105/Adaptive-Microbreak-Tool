import React from 'react'


export default function ActivityCard({ activity, onSelect }) {
return (
<div className="card" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e)=> e.key === 'Enter' && onSelect()}>
<div className="card-left">
<div className={`badge badge-${activity.type}`}>{activity.type}</div>
</div>
<div className="card-body">
<div className="card-title">{activity.title}</div>
<div className="card-desc">{activity.description}</div>
<div className="card-meta">{Math.ceil(activity.duration/60)} min · {activity.type}</div>
</div>
<div className="card-action">
<button className="btn">Start</button>
</div>
</div>
)
}