# Adaptive-Microbreak-Tool

Polished, high-fidelity React prototype with a modern card dashboard UI. The prototype is local-first and embeds YouTube videos for guided activities when available.


## Setup
1. `npm install`
2. `npm run dev`
3. Open the URL printed by Vite (usually http://localhost:5173)


## Notes
- Activity data lives in `src/data/activities.json`. Add or edit items there.
- All user activity history is saved in `localStorage` under `ab_history`.
- Evaluation Plan (project background) is at: `/mnt/data/Approach and Alternative Designs.pdf`


## Next steps
- Improve personalization by tracking likes and skips and using a local recommender.
- Add accessibility features: audio cues, larger text sizes, and keyboard-only navigation.