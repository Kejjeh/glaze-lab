import { useEffect, useMemo, useRef, useState } from 'react'
import { PANTRY, STAPLES, GLAZE, RICE, SIDES, PROTEINS } from './data/recipes.js'
import { MEALS } from './data/meals.js'
import { missingIngredients } from './lib/pantry.js'
import { applyProtein, withDoneness } from './lib/protein.js'
import { orderedSteps, elapsedLabel } from './lib/meals.js'
import { filterDishes } from './lib/filters.js'
import { searchDishes } from './lib/search.js'
import { dietTags, matchesDiet } from './lib/diet.js'
import { missingImpact, shoppingList } from './lib/insights.js'
import { scaleIngredients, formatAmount } from './lib/scaling.js'
import { createTimer, start, pause, reset, remaining, settle, formatTime } from './lib/timer.js'
import { loadOwned, saveOwned } from './lib/storage.js'

const PANTRY_IDS = PANTRY.map((p) => p.id)
const LABELS = Object.fromEntries(PANTRY.map((p) => [p.id, p.label]))
const GROUPS = [...new Set(PANTRY.map((p) => p.group))]
const BATCHES = [0.5, 1, 2, 3, 4]
const DIETS = ['all', 'pescatarian', 'vegetarian', 'vegan', 'gluten-free']
const DIET_SHORT = {
  pescatarian: 'pescatarian',
  vegetarian: 'veg',
  vegan: 'vegan',
  'gluten-free': 'GF',
}
const PROTEIN_KEY = 'glazelab.protein.v1'
const APPLIANCE_LABEL = { 'air-fryer': 'Air-Fryer', 'rice-cooker': 'Rice-Cooker', prep: 'Prep' }

const labelFor = (item) => LABELS[item] ?? item.charAt(0).toUpperCase() + item.slice(1)

// Turn a build into a concrete dish for the picked protein (glazes and the
// protein-forward rice bowls); fixed veg/plain dishes pass through untouched.
const withProtein = (build, protein) => (build.usesProtein ? applyProtein(build, protein) : build)

// Collapse the diet hierarchy to the most specific badge + a GF flag.
function dietBadges(dish) {
  const tags = dietTags(dish)
  const badges = []
  if (tags.includes('vegan')) badges.push('vegan')
  else if (tags.includes('vegetarian')) badges.push('vegetarian')
  else if (tags.includes('pescatarian')) badges.push('pescatarian')
  if (tags.includes('gluten-free')) badges.push('gluten-free')
  return badges
}

export default function App() {
  const [mode, setMode] = useState('air-fryer')
  const [lane, setLane] = useState('all')
  const [diet, setDiet] = useState('all')
  const [query, setQuery] = useState('')
  const [hideLocked, setHideLocked] = useState(false)
  const [batch, setBatch] = useState(1)
  const [pantryOpen, setPantryOpen] = useState(false)
  const [owned, setOwned] = useState(() => new Set(loadOwned() ?? PANTRY_IDS))
  const [proteinId, setProteinId] = useState(() => {
    try {
      return localStorage.getItem(PROTEIN_KEY) || 'salmon'
    } catch {
      return 'salmon'
    }
  })
  const [donenessId, setDonenessId] = useState(null)
  const [timers, setTimers] = useState({})
  const [now, setNow] = useState(() => Date.now())

  const audioCtxRef = useRef(null)
  const timersRef = useRef(timers)
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

  const protein = PROTEINS.find((p) => p.id === proteinId) ?? PROTEINS[0]

  function unlockAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      if (!audioCtxRef.current) audioCtxRef.current = new AC()
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    } catch {
      /* no audio — silent */
    }
  }

  function beep() {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    saveOwned([...owned])
  }, [owned])

  useEffect(() => {
    try {
      localStorage.setItem(PROTEIN_KEY, proteinId)
    } catch {
      /* ignore */
    }
  }, [proteinId])

  // Single heartbeat: advance the clock and settle finished timers.
  useEffect(() => {
    const iv = setInterval(() => {
      const t = Date.now()
      const cur = timersRef.current
      let changed = false
      const next = {}
      for (const [id, tm] of Object.entries(cur)) {
        const s = settle(tm, t)
        if (s !== tm) {
          changed = true
          if (s.done && !tm.done) beep()
        }
        next[id] = s
      }
      setNow(t)
      if (changed) setTimers(next)
    }, 250)
    return () => clearInterval(iv)
  }, [])

  // Keep the screen awake while any timer runs (re-acquiring on return).
  const anyRunning = Object.values(timers).some((t) => t.running)
  useEffect(() => {
    if (!anyRunning || !('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        /* denied — ignore */
      }
    }
    acquire()
    const onVis = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      if (lock) lock.release().catch(() => {})
    }
  }, [anyRunning])

  const modeBuilds = mode === 'air-fryer' ? GLAZE : mode === 'sides' ? SIDES : RICE
  const modeDishes = useMemo(() => {
    const effProtein = withDoneness(protein, donenessId)
    return modeBuilds.map((b) => withProtein(b, effProtein))
  }, [modeBuilds, protein, donenessId])
  const lanes = useMemo(() => ['all', ...new Set(modeDishes.map((d) => d.lane))], [modeDishes])
  const visible = useMemo(() => {
    let list = filterDishes(modeDishes, { lane, hideLocked, owned, pantry: PANTRY_IDS })
    list = searchDishes(list, query, labelFor)
    if (diet !== 'all') list = list.filter((d) => matchesDiet(d, diet))
    return list
  }, [modeDishes, lane, hideLocked, owned, query, diet])

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
  const startTimer = (dish) => {
    unlockAudio()
    setTimers((p) => ({
      ...p,
      [dish.id]: start(p[dish.id] ?? createTimer(dish.cookSeconds), Date.now()),
    }))
  }
  const pauseTimer = (dish) =>
    setTimers((p) => ({
      ...p,
      [dish.id]: pause(p[dish.id] ?? createTimer(dish.cookSeconds), Date.now()),
    }))
  const resetTimer = (dish) =>
    setTimers((p) => ({ ...p, [dish.id]: reset(p[dish.id] ?? createTimer(dish.cookSeconds)) }))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Glaze Lab</h1>
          <p>Pick a protein. Glaze it. Rice it.</p>
        </div>
        <button
          className="pantry-btn"
          onClick={() => setPantryOpen((v) => !v)}
          aria-expanded={pantryOpen}
        >
          Pantry{' '}
          <span className="count">
            {owned.size}/{PANTRY_IDS.length}
          </span>
        </button>
      </header>

      {(mode === 'air-fryer' || mode === 'rice-cooker') && (
        <div className="proteins" aria-label="Protein">
          <span className="ctl-label">Protein</span>
          {PROTEINS.map((p) => (
            <button
              key={p.id}
              className={`protein-chip ${proteinId === p.id ? 'active' : ''} ${owned.has(p.id) ? '' : 'out'}`}
              aria-pressed={proteinId === p.id}
              onClick={() => {
                setProteinId(p.id)
                setDonenessId(null)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'air-fryer' && protein.levels && (
        <div className="doneness" aria-label="Doneness">
          <span className="ctl-label">Doneness</span>
          {protein.levels.map((l) => {
            const activeId =
              donenessId ?? protein.levels.find((x) => x.default)?.id ?? protein.levels[0].id
            return (
              <button
                key={l.id}
                className={`done-chip ${activeId === l.id ? 'active' : ''}`}
                aria-pressed={activeId === l.id}
                onClick={() => setDonenessId(l.id)}
              >
                {l.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="modes" role="tablist" aria-label="Cooking mode">
        {[
          ['air-fryer', 'Air-Fryer', GLAZE.length],
          ['rice-cooker', 'Rice-Cooker', RICE.length],
          ['sides', 'Sides', SIDES.length],
          ['meals', 'Meals', MEALS.length],
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

      {mode !== 'meals' && (
        <>
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

            <div className="search">
              <input
                type="search"
                placeholder="Search dishes or ingredients…"
                aria-label="Search dishes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
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

          <div className="diets" aria-label="Dietary filter">
            {DIETS.map((d) => (
              <button
                key={d}
                className={`diet-chip ${diet === d ? 'active' : ''}`}
                onClick={() => setDiet(d)}
              >
                {d === 'all' ? 'Any diet' : (DIET_SHORT[d] ?? d)}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'air-fryer' && (
        <p className="tip">
          Times are starting points for a 5.8-qt basket — cook to the internal temp with a
          thermometer, since air-fryer set temps drift.
        </p>
      )}
      {mode === 'rice-cooker' && (
        <p className="tip">
          COSORI: rinse grains until clear, use 1:1¼ water for rice/quinoa/farro (oatmeal 1:3), and
          rest 5 min before fluffing.
        </p>
      )}
      {mode === 'sides' && (
        <p className="tip">
          Single-layer the basket (fill ≤ ¾) and shake halfway; steamed sides go over the rice at
          the ~30-min mark.
        </p>
      )}

      <main className="grid">
        {mode === 'meals'
          ? MEALS.map((meal) => <MealCard key={meal.id} meal={meal} />)
          : visible.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                owned={owned}
                batch={batch}
                timer={dish.mode === 'air-fryer' ? timerFor(dish) : null}
                now={now}
                onStart={() => startTimer(dish)}
                onPause={() => pauseTimer(dish)}
                onReset={() => resetTimer(dish)}
              />
            ))}
        {mode !== 'meals' && visible.length === 0 && (
          <p className="empty">No dishes match — try clearing the search or another filter.</p>
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

function DishCard({ dish, owned, batch, timer, now, onStart, onPause, onReset }) {
  const missing = missingIngredients(dish, owned, PANTRY_IDS)
  const locked = missing.length > 0
  const scaled = scaleIngredients(dish.ingredients, batch)
  const badges = dietBadges(dish)

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

      {badges.length > 0 && (
        <div className="diet-badges">
          {badges.map((b) => (
            <span key={b} className={`diet-badge ${b}`}>
              {DIET_SHORT[b] ?? b}
            </span>
          ))}
        </div>
      )}

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

      {dish.tempF && (
        <div className="cookmeta">
          <span className="temp">{dish.tempF}°F</span>
          <span className="internal">internal {dish.doneness}</span>
        </div>
      )}
      {dish.tip && <p className="preptip">💡 {dish.tip}</p>}

      {dish.cooker && (
        <div className="cookmeta">
          <span className="temp">{dish.cooker}</span>
          {dish.setup && <span className="internal">{dish.setup}</span>}
        </div>
      )}

      {timer && (
        <CookTimer timer={timer} now={now} onStart={onStart} onPause={onPause} onReset={onReset} />
      )}
    </article>
  )
}

function CookTimer({ timer, now, onStart, onPause, onReset }) {
  const secs = remaining(timer, now)
  return (
    <div className={`timer ${timer.done ? 'done' : ''} ${timer.running ? 'running' : ''}`}>
      <span className="clock">{formatTime(secs)}</span>
      <div className="timer-btns">
        {!timer.running && !timer.done && <button onClick={onStart}>Start</button>}
        {timer.running && <button onClick={onPause}>Pause</button>}
        <button className="ghost" onClick={onReset}>
          Reset
        </button>
      </div>
      {timer.done && <span className="ding">✓ done</span>}
    </div>
  )
}

function MealCard({ meal }) {
  return (
    <article className="card meal-card">
      <div className="card-head">
        <span className="lane-tag">{meal.serves}</span>
        <span className="meal-total">~{elapsedLabel(meal.totalMinutes)}</span>
      </div>
      <h3>{meal.name}</h3>
      <p className="blurb">{meal.blurb}</p>
      <ol className="timeline">
        {orderedSteps(meal).map((s, i) => (
          <li key={i} className="tl-step">
            <span className="tl-clock">{elapsedLabel(s.atMinute)}</span>
            <span className={`tl-app ${s.appliance}`}>{APPLIANCE_LABEL[s.appliance]}</span>
            <span className="tl-text">{s.text}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function PantryDrawer({ owned, onToggle, onAll, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    const prev = document.activeElement
    const focusables = () =>
      [...node.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.disabled && el.offsetParent !== null,
      )
    focusables()[0]?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (f.length === 0) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  const impact = missingImpact([...GLAZE, ...RICE], owned, PANTRY_IDS).slice(0, 4)
  const list = shoppingList([...GLAZE, ...RICE], owned, PANTRY_IDS)

  const copyList = () => {
    const text = list.map((x) => labelFor(x.item)).join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Pantry" ref={ref}>
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

        {impact.length > 0 && (
          <section className="insight">
            <h4>Almost there</h4>
            <ul className="impact">
              {impact.map((x) => (
                <li key={x.item}>
                  <button className="impact-buy" onClick={() => onToggle(x.item)}>
                    + {labelFor(x.item)}
                  </button>
                  <span className="impact-n">
                    unlocks {x.unlocks} dish{x.unlocks === 1 ? '' : 'es'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {list.length > 0 && (
          <section className="insight">
            <div className="insight-head">
              <h4>Shopping list ({list.length})</h4>
              <button className="ghost small" onClick={copyList}>
                Copy
              </button>
            </div>
            <div className="shop-items">
              {list.map((x) => (
                <span key={x.item} className="shop-item">
                  {labelFor(x.item)}
                  {x.count > 1 && <em> ×{x.count}</em>}
                </span>
              ))}
            </div>
          </section>
        )}

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
