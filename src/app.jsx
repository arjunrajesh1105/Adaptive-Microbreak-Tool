import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import ActivityPage from './components/ActivityPage'
import activities from './data/activities.json'


export default function App() {
const [selected, setSelected] = useState(null)


return (
<div className="app-root">
{!selected ? (
<Dashboard activities={activities} onSelect={setSelected} />
) : (
<ActivityPage activity={selected} onClose={() => setSelected(null)} />
)}
</div>
)
}