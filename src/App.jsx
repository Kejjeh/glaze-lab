import { useEffect, useMemo, useState } from 'react'
import { PANTRY, STAPLES, GLAZE, RICE } from './data/recipes.js'
import { missingIngredients } from './lib/pantry.js'
import { filterDishes } from './lib/filters.js'
import { scaleIngredients, formatAmount } from './lib/scaling.js'
import { createTimer, start, pause, reset, tick, formatTime } from './lib/timer.js'
import { loadOwned, saveOwned } from './lib/storage.js'

const PANTRY_IDS = PANTRY.map((p) => p.id)
const LABELS = Object.fromEntries(PANTRY.map((p) => [p.id, p.label]))
const GROUPS = [...new Set(PANTRY.map((p) => p.group))]
const BATCHES = [0.5, 1, 2, 3, 4]

const labelFor = (item) =>
  LABELS[item] ?? item.charAt(0).toUpperCase() + item.slice(1)

function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    /* audio not available — silent */
  }
}

export default function App() {
  const [mode, setMode] = useState('air-fryer')
  const [lane, setLane] = useState('all')
  const [hideLocked, setHideLocked] = useState(false)
  const [batch, setBatch] = useState(1)
  const [pantryOpen, setPantryOpen] = useState(false)
  const [owned, setOwned] = useState(() => new Set(loadOwned() ?? PANTRY_IDS))
  const [timers, setTimers] = useState({})

  // Persist the pantry whenever it changes.
  useEffect(() => {
    saveOwned([...owned])
  }, [owned])

  // One heartbeat drives every running card timer.
  useEffect(() => {
    const iv = setInterval(() => {
      setTimers((prev) => {
        let changed = false
        const next = {}
        for (const [id, t] of Object.entries(prev)) {
          const nt = t.running ? tick(t) : t
          if (nt !== t) {
            changed = true
            if (nt.done && !t.done) beep()
          }
          next[id] = nt
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const modeDishes = mode === 'air-fryer' ? GLAZE : RICE
  const lanes = useMemo(
    () => ['all', ...new Set(modeDishes.map((d) => d.lane))],
    [modeDishes],
  )
  const visible = useMemo(
    () => filterDishes(modeDishes, { lane, hideLocked, owned, pantry: PANTRY_IDS }),
    [modeDishes, lane, hideLocked, owned],
  )

  function switchMode(next) {
    setMode(next)
    setLane('all')
  }

  function toggleItem(id) {
    setOwned((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const setAll = (on) => setOwned(on ? new Set(PANTRY_IDS) : new Set())

  const timerFor = (dish) => timers[dish.id] ?? createTimer(dish.cookSeconds)
  const updateTimer = (dish, fn) =>
    setTimers((prev) => ({ ...prev, [dish.id]: fn(prev[dish.id] ?? createTimer(dish.cookSeconds)) }))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Salmon Lab</h1>
          <p>Glaze it. Steam it. Eat.</p>
        </div>
        <button
          className="pantry-btn"
          onClick={() => setPantryOpen((v) => !v)}
          aria-expanded={pantryOpen}
        >
          Pantry <span className="count">{owned.size}/{PANTRY_IDS.length}</span>
        </button>
      </header>

      <div className="modes" role="tablist" aria-label="Cooking mode">
        {[
          ['air-fryer', 'Air-Fryer', GLAZE.length],
          ['rice-cooker', 'Rice-Cooker', RICE.length],
        ].map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            className={`mode ${mode === id ? 'active' : ''}`}
            onClick={() => switchMode(id)}
          >
            {label} <span className="mode-n">{n}</span>
          </button>
        ))}
      </div>

      <div className="controls">
        <div className="batch" aria-label="Batch size">
          <span className="ctl-label">Batch</span>
          {BATCHES.map((b) => (
            <button
              key={b}
              className={`batch-chip ${batch === b ? 'active' : ''}`}
              onClick={() => setBatch(b)}
            >
              {b === 0.5 ? '½×' : `${b}×`}
            </button>
          ))}
        </div>

        <label className="hide-locked">
          <input
            type="checkbox"
            checked={hideLocked}
            onChange={(e) => setHideLocked(e.target.checked)}
          />
          Hide locked
        </label>
      </div>

      <div className="lanes" aria-label="Lane filter">
        {lanes.map((l) => (
          <button
            key={l}
            className={`lane-chip ${lane === l ? 'active' : ''}`}
            onClick={() => setLane(l)}
          >
            {l === 'all' ? 'All' : l}
          </button>
        ))}
      </div>

      <main className="grid">
        {visible.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            owned={owned}
            batch={batch}
            timer={dish.mode === 'air-fryer' ? timerFor(dish) : null}
            onStart={() => updateTimer(dish, start)}
            onPause={() => updateTimer(dish, pause)}
            onReset={() => updateTimer(dish, reset)}
          />
        ))}
        {visible.length === 0 && (
          <p className="empty">No dishes match — try showing locked dishes or another lane.</p>
        )}
      </main>

      {pantryOpen && (
        <PantryDrawer
          owned={owned}
          onToggle={toggleItem}
          onAll={setAll}
          onClose={() => setPantryOpen(false)}
        />
      )}
    </div>
  )
}

function DishCard({ dish, owned, batch, timer, onStart, onPause, onReset }) {
  const missing = missingIngredients(dish, owned, PANTRY_IDS)
  const locked = missing.length > 0
  const scaled = scaleIngredients(dish.ingredients, batch)

  return (
    <article className={`card ${locked ? 'locked' : ''}`}>
      <div className="card-head">
        <span className="lane-tag">{dish.lane}</span>
        {locked && (
          <span className="needs" title="Missing pantry items">
            needs: {missing.map(labelFor).join(', ')}
          </span>
        )}
      </div>
      <h3>{dish.name}</h3>
      <p className="blurb">{dish.blurb}</p>

      <ul className="ingredients">
        {scaled.map((ing, i) => {
          const short = missing.includes(ing.item)
          return (
            <li key={i} className={short ? 'short' : ''}>
              <span className="amt">
                {formatAmount(ing.amount)} {ing.unit}
              </span>
              <span className="item">{labelFor(ing.item)}</span>
            </li>
          )
        })}
      </ul>

      <details className="steps">
        <summary>Method</summary>
        <ol>
          {dish.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </details>

      {timer && (
        <CookTimer timer={timer} onStart={onStart} onPause={onPause} onReset={onReset} />
      )}
    </article>
  )
}

function CookTimer({ timer, onStart, onPause, onReset }) {
  return (
    <div className={`timer ${timer.done ? 'done' : ''} ${timer.running ? 'running' : ''}`}>
      <span className="clock">{formatTime(timer.remaining)}</span>
      <div className="timer-btns">
        {!timer.running && !timer.done && (
          <button onClick={onStart}>Start</button>
        )}
        {timer.running && <button onClick={onPause}>Pause</button>}
        <button className="ghost" onClick={onReset}>
          Reset
        </button>
      </div>
      {timer.done && <span className="ding">✓ done</span>}
    </div>
  )
}

function PantryDrawer({ owned, onToggle, onAll, onClose }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" aria-label="Pantry">
        <div className="drawer-head">
          <h2>Pantry</h2>
          <button className="close" onClick={onClose} aria-label="Close pantry">
            ✕
          </button>
        </div>
        <p className="drawer-sub">
          Uncheck what you're out of — dishes needing it grey out in both modes.
        </p>
        <div className="drawer-actions">
          <button onClick={() => onAll(true)}>Check all</button>
          <button className="ghost" onClick={() => onAll(false)}>
            Clear
          </button>
        </div>
        {GROUPS.map((group) => (
          <section key={group} className="pantry-group">
            <h4>{group}</h4>
            <div className="pantry-items">
              {PANTRY.filter((p) => p.group === group).map((p) => (
                <label key={p.id} className={owned.has(p.id) ? 'on' : 'off'}>
                  <input
                    type="checkbox"
                    checked={owned.has(p.id)}
                    onChange={() => onToggle(p.id)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </section>
        ))}
        <p className="drawer-foot">
          Staples ({[...STAPLES].join(', ')}) are always assumed on hand.
        </p>
      </aside>
    </>
  )
}
