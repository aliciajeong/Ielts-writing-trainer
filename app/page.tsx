'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Home,
  Loader2,
  MessageSquare,
  PenLine,
  PlusCircle,
  Trophy,
  XCircle,
} from 'lucide-react'

type LevelId = 'Band 4' | 'Band 5' | 'Band 6' | 'Band 7' | 'Band 8+'
type TaskId = 'Task 1 Academic' | 'Task 1 General' | 'Task 2'
type DifficultyId = 'easy' | 'medium' | 'hard'
type TabId = 'home' | 'practice' | 'feedback' | 'tracker' | 'guide'

type TopicResponse = {
  taskType: TaskId
  category: string
  difficulty: DifficultyId
  question: string
  visualDescription: string | null
  letterContext: string | null
  essayType: string | null
  structureGuide: string[]
  keyVocab: string[]
  tipForLevel: string
}

type CriterionKey =
  | 'taskAchievement'
  | 'coherenceCohesion'
  | 'lexicalResource'
  | 'grammaticalRange'

type ScoreFeedback = {
  overallBand: number
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
  annotatedEssay?: string
  errors?: Array<{
    type: string
    original: string
    correction: string
    explanation: string
  }>
  vocabAlternatives?: Array<{
    original: string
    level: string
    alternatives?: Array<{
      word: string
      level: string
      example: string
    }>
  }>
  sentenceImprovements?: Array<{
    original: string
    improved: string
    technique?: string
    reason: string
  }>
  modelParagraph?: string
  criteriaFeedback?: Partial<Record<CriterionKey, string>>
  strengths?: string[]
  priorities?: string[]
  generalTips?: string
  nextStepTopic?: string
}

type HistoryEntry = {
  id?: string
  date: string
  level: LevelId
  taskType: TaskId
  difficulty: DifficultyId
  topic?: string
  category?: string
  score: number
  taskAchievement?: number
  coherenceCohesion?: number
  lexicalResource?: number
  grammaticalRange?: number
  essay?: string
  wordCount?: number
  timeSpent?: number
}

const LEVELS: Array<{ id: LevelId; desc: string }> = [
  { id: 'Band 4', desc: 'Basic vocabulary, simple sentences' },
  { id: 'Band 5', desc: 'Familiar topics, everyday language' },
  { id: 'Band 6', desc: 'Mixed vocabulary, clearer arguments' },
  { id: 'Band 7', desc: 'Wide vocabulary, complex structures' },
  { id: 'Band 8+', desc: 'Near-native, sophisticated discourse' },
]

const TASKS: Array<{ id: TaskId; label: string; min: number; time: number }> = [
  { id: 'Task 1 Academic', label: 'Task 1 - Academic', min: 150, time: 20 },
  { id: 'Task 1 General', label: 'Task 1 - General', min: 150, time: 20 },
  { id: 'Task 2', label: 'Task 2 - Essay', min: 250, time: 40 },
]

const DIFFS: Array<{ id: DifficultyId; label: string; desc: string }> = [
  { id: 'easy', label: 'Easy', desc: 'Personal familiar topics' },
  { id: 'medium', label: 'Medium', desc: 'Social & current issues' },
  { id: 'hard', label: 'Hard', desc: 'Abstract complex topics' },
]

const CATS = [
  'Technology',
  'Environment',
  'Education',
  'Health',
  'Globalisation',
  'Society',
  'Economy',
  'Science',
  'Culture',
  'Politics',
  'Media',
  'Transport',
] as const

const CRITERIA: Array<{ key: CriterionKey; label: string; short: string }> = [
  { key: 'taskAchievement', label: 'Task Achievement', short: 'TA' },
  { key: 'coherenceCohesion', label: 'Coherence & Cohesion', short: 'CC' },
  { key: 'lexicalResource', label: 'Lexical Resource', short: 'LR' },
  { key: 'grammaticalRange', label: 'Grammatical Range', short: 'GRA' },
]

const BAND_DESC: Record<string, string> = {
  '9': 'Expert user',
  '8.5': 'Very good user',
  '8': 'Very good user',
  '7.5': 'Good user',
  '7': 'Good user',
  '6.5': 'Competent user',
  '6': 'Competent user',
  '5.5': 'Modest user',
  '5': 'Modest user',
  '4.5': 'Limited user',
  '4': 'Limited user',
}

function saveEntry(e: HistoryEntry) {
  if (typeof window === 'undefined') return
  const h = getHistory()
  h.unshift({ ...e, id: Date.now().toString() })
  localStorage.setItem('ielts_history', JSON.stringify(h.slice(0, 300)))
}

function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ielts_history') || '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

function getStreak() {
  const h = getHistory()
  if (!h.length) return 0
  const dates = [...new Set(h.map((e) => e.date?.slice(0, 10)).filter(Boolean))]
    .sort()
    .reverse()
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (const d of dates) {
    const ed = new Date(d as string)
    ed.setHours(0, 0, 0, 0)
    if (Math.round((cursor.getTime() - ed.getTime()) / 86400000) <= 1) {
      streak++
      cursor = ed
    } else {
      break
    }
  }
  return streak
}

function getStats(days: number) {
  const cutoff = new Date(Date.now() - days * 86400000)
  const entries = getHistory().filter((e) => new Date(e.date) >= cutoff)
  const scores = entries.map((e) => Number(e.score)).filter(Boolean)
  const avg = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2
    : 0
  return { count: entries.length, avg, best: scores.length ? Math.max(...scores) : 0 }
}

function getCalData(year: number, month: number): Record<number, HistoryEntry[]> {
  const map: Record<number, HistoryEntry[]> = {}
  getHistory().forEach((e) => {
    const d = e.date?.slice(0, 10)
    if (!d) return
    const [y, m] = d.split('-').map(Number)
    if (y === year && m === month) {
      const day = Number(d.split('-')[2])
      if (!map[day]) map[day] = []
      map[day].push(e)
    }
  })
  return map
}

export default function App() {
  const [tab, setTab] = useState<TabId>('home')
  const [level, setLevel] = useState<LevelId>('Band 6')
  const [taskType, setTaskType] = useState<TaskId>('Task 2')
  const [difficulty, setDifficulty] = useState<DifficultyId>('medium')
  const [category, setCategory] = useState<string | null>(null)
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [feedback, setFeedback] = useState<ScoreFeedback | null>(null)
  const [loadingTopic, setLoadingTopic] = useState(false)
  const [loadingScore, setLoadingScore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function getTopic() {
    setLoadingTopic(true)
    setError(null)
    setTopic(null)
    setFeedback(null)
    try {
      const res = await fetch('/api/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, taskType, difficulty, category }),
      })
      if (!res.ok) throw new Error('Failed to generate topic')
      setTopic((await res.json()) as TopicResponse)
      setTab('practice')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoadingTopic(false)
    }
  }

  async function submitEssay(text: string, timeSpent: number) {
    setLoadingScore(true)
    setError(null)
    try {
      const wc = text.trim().split(/\s+/).length
      const res = await fetch('/api/score-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay: text,
          topic: topic?.question,
          taskType,
          level,
          timeSpent,
          wordCount: wc,
        }),
      })
      if (!res.ok) throw new Error('Failed to score essay')
      const data = (await res.json()) as ScoreFeedback
      setFeedback(data)
      saveEntry({
        date: new Date().toISOString(),
        level,
        taskType,
        difficulty,
        topic: topic?.question,
        category: topic?.category,
        score: data.overallBand,
        taskAchievement: data.taskAchievement,
        coherenceCohesion: data.coherenceCohesion,
        lexicalResource: data.lexicalResource,
        grammaticalRange: data.grammaticalRange,
        essay: text,
        wordCount: wc,
        timeSpent,
      })
      setTab('feedback')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoadingScore(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#fff',
        paddingBottom: 80,
      }}
    >
      {tab === 'home' && (
        <HomeScreen
          level={level}
          setLevel={setLevel}
          taskType={taskType}
          setTaskType={setTaskType}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          category={category}
          setCategory={setCategory}
          onGet={getTopic}
          loading={loadingTopic}
          error={error}
        />
      )}
      {tab === 'practice' && (
        <PracticeScreen
          topic={topic}
          taskType={taskType}
          onSubmit={submitEssay}
          loading={loadingScore}
          onBack={() => setTab('home')}
          error={error}
        />
      )}
      {tab === 'feedback' && feedback && (
        <FeedbackScreen
          feedback={feedback}
          level={level}
          onNew={() => {
            setTopic(null)
            setFeedback(null)
            setTab('home')
          }}
        />
      )}
      {tab === 'tracker' && <TrackerScreen />}
      {tab === 'guide' && <GuideScreen taskType={taskType} />}
      <BottomNav active={tab} onChange={setTab} hasFeedback={!!feedback} />
    </div>
  )
}

function BottomNav({
  active,
  onChange,
  hasFeedback,
}: {
  active: TabId
  onChange: (tab: TabId) => void
  hasFeedback: boolean
}) {
  const tabs: Array<{ id: TabId; icon: typeof Home; label: string }> = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'practice', icon: PenLine, label: 'Write' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
    { id: 'tracker', icon: CalendarDays, label: 'Tracker' },
    { id: 'guide', icon: BookOpen, label: 'Guide' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        zIndex: 100,
      }}
    >
      {tabs.map(({ id, icon: Icon, label }) => {
        const active2 = active === id
        const disabled = id === 'feedback' && !hasFeedback
        return (
          <button
            key={id}
            onClick={() => !disabled && onChange(id)}
            disabled={disabled}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 4px',
              border: 'none',
              background: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              color: active2 ? '#1e3a5f' : '#94a3b8',
              opacity: disabled ? 0.3 : 1,
              fontFamily: 'inherit',
            }}
          >
            <Icon size={20} strokeWidth={active2 ? 2.5 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeScreen({
  level,
  setLevel,
  taskType,
  setTaskType,
  difficulty,
  setDifficulty,
  category,
  setCategory,
  onGet,
  loading,
  error,
}: {
  level: LevelId
  setLevel: (val: LevelId) => void
  taskType: TaskId
  setTaskType: (val: TaskId) => void
  difficulty: DifficultyId
  setDifficulty: (val: DifficultyId) => void
  category: string | null
  setCategory: (val: string | null) => void
  onGet: () => Promise<void>
  loading: boolean
  error: string | null
}) {
  const streak = useMemo(() => getStreak(), [])
  const weekStats = useMemo(() => getStats(7), [])

  return (
    <div style={{ padding: '24px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            IELTS Writing
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Daily practice · AI feedback</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {streak > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 999,
                padding: '5px 10px',
              }}
            >
              <Flame size={13} color="#ea580c" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#c2410c' }}>{streak}d</span>
            </div>
          )}
          {weekStats?.avg ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 999,
                padding: '5px 10px',
              }}
            >
              <Trophy size={13} color="#1e3a5f" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e3a5f' }}>{weekStats.avg}</span>
            </div>
          ) : null}
        </div>
      </div>

      <SCard step={1} title="Your band level" sub="Sets vocabulary & grammar expectations">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: level === l.id ? '#1e3a5f' : '#f1f5f9',
                color: level === l.id ? '#fff' : '#475569',
              }}
            >
              {l.id}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>{LEVELS.find((l) => l.id === level)?.desc}</p>
      </SCard>

      <SCard step={2} title="Task type" sub="Academic, General, or Essay">
        {TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTaskType(t.id)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${taskType === t.id ? '#1e3a5f' : '#e2e8f0'}`,
              background: taskType === t.id ? '#1e3a5f' : '#fff',
              color: taskType === t.id ? '#fff' : '#0f172a',
              cursor: 'pointer',
              marginBottom: 8,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              {t.min}+ words · {t.time} min
            </span>
          </button>
        ))}
      </SCard>

      <SCard step={3} title="Topic difficulty" sub="Adjust if the topic feels too hard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {DIFFS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              style={{
                padding: '12px 8px',
                borderRadius: 12,
                border: `1px solid ${difficulty === d.id ? '#1e3a5f' : '#e2e8f0'}`,
                background: difficulty === d.id ? '#1e3a5f' : '#fff',
                color: difficulty === d.id ? '#fff' : '#475569',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, lineHeight: 1.3 }}>{d.desc}</div>
            </button>
          ))}
        </div>
      </SCard>

      <SCard step={4} title="Topic category" sub="Optional - blank for random">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => setCategory(null)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: !category ? '#1e3a5f' : '#f1f5f9',
              color: !category ? '#fff' : '#475569',
            }}
          >
            Random
          </button>
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? null : c)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: category === c ? '#1e3a5f' : '#f1f5f9',
                color: category === c ? '#fff' : '#475569',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </SCard>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            color: '#dc2626',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={onGet}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          background: '#1e3a5f',
          color: '#fff',
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.5 : 1,
          fontFamily: 'inherit',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Generating topic...
          </>
        ) : (
          <>
            Get today&apos;s topic
            <ChevronRight size={18} />
          </>
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function SCard({
  step,
  title,
  sub,
  children,
}: {
  step: number
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#1e3a5f',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {step}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{title}</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function PracticeScreen({
  topic,
  taskType,
  onSubmit,
  loading,
  onBack,
  error,
}: {
  topic: TopicResponse | null
  taskType: TaskId
  onSubmit: (text: string, timeSpent: number) => Promise<void>
  loading: boolean
  onBack: () => void
  error: string | null
}) {
  const cfg = TASKS.find((t) => t.id === taskType) || TASKS[2]
  const SECS = cfg.time * 60
  const [text, setText] = useState('')
  const [timeLeft, setTimeLeft] = useState(SECS)
  const [timerOn, setTimerOn] = useState(false)
  const [started, setStarted] = useState(false)
  const [spent, setSpent] = useState(0)
  const [showStruct, setShowStruct] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const wc = text.trim() ? text.trim().split(/\s+/).length : 0
  const pct = Math.min((wc / cfg.min) * 100, 100)
  const tpct = (timeLeft / SECS) * 100
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const startTimer = useCallback(() => {
    if (!started) {
      setTimerOn(true)
      setStarted(true)
    }
  }, [started])

  useEffect(() => {
    if (timerOn && timeLeft > 0) {
      ref.current = setInterval(() => {
        setTimeLeft((p) => {
          if (p <= 1) {
            if (ref.current) clearInterval(ref.current)
            setTimerOn(false)
            return 0
          }
          return p - 1
        })
        setSpent((p) => p + 1)
      }, 1000)
    }
    return () => {
      if (ref.current) clearInterval(ref.current)
    }
  }, [timerOn, timeLeft])

  const tc = timeLeft < 300 ? '#dc2626' : timeLeft < 600 ? '#ea580c' : '#1e3a5f'
  const tbg = timeLeft < 300 ? '#fef2f2' : timeLeft < 600 ? '#fff7ed' : '#eff6ff'
  const tbd = timeLeft < 300 ? '#fecaca' : timeLeft < 600 ? '#fed7aa' : '#bfdbfe'

  const handleSubmit = () => {
    if (!confirm && wc < cfg.min) {
      setConfirm(true)
      return
    }
    setTimerOn(false)
    if (ref.current) clearInterval(ref.current)
    onSubmit(text, spent)
  }

  return (
    <div style={{ padding: '16px 16px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          color: '#64748b',
          marginBottom: 20,
          fontFamily: 'inherit',
        }}
      >
        <ArrowLeft size={18} />
        Back
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ border: `1px solid ${tbd}`, background: tbg, borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: tc, fontFamily: 'monospace' }}>{fmt(timeLeft)}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{cfg.time}min</span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{ height: '100%', borderRadius: 99, background: tc, width: `${tpct}%`, transition: 'width 1s ease' }}
            />
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${wc >= cfg.min ? '#86efac' : '#e2e8f0'}`,
            background: wc >= cfg.min ? '#f0fdf4' : '#f8fafc',
            borderRadius: 12,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: wc >= cfg.min ? '#16a34a' : '#0f172a' }}>
              {wc}
              <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>/ {cfg.min}</span>
            </span>
            {wc >= cfg.min && <CheckCircle size={14} color="#16a34a" />}
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: wc >= cfg.min ? '#16a34a' : '#1e3a5f',
                width: `${pct}%`,
                transition: 'width .3s',
              }}
            />
          </div>
        </div>
      </div>

      {!started && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            color: '#1d4ed8',
            marginBottom: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span>Time starts when you begin writing</span>
        </div>
      )}
      {timeLeft === 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            color: '#dc2626',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Time&apos;s up! Submit now.
        </div>
      )}

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ background: '#1e3a5f', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
            {taskType}
          </span>
          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 999 }}>
            {topic?.category}
          </span>
          {topic?.essayType && (
            <span
              style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 999,
                textTransform: 'capitalize',
              }}
            >
              {topic.essayType.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.6 }}>{topic?.question}</p>
        {topic?.visualDescription && (
          <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 10, padding: 12, marginTop: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Visual description</p>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{topic.visualDescription}</p>
          </div>
        )}
        {topic?.letterContext && (
          <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 10, padding: 12, marginTop: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Context</p>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{topic.letterContext}</p>
          </div>
        )}
      </div>

      {topic?.structureGuide?.length ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
          <button
            onClick={() => setShowStruct(!showStruct)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Structure guide</span>
            {showStruct ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </button>
          {showStruct && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
              {topic.structureGuide.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#1e3a5f',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{s}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {topic?.keyVocab?.length ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
          <button
            onClick={() => setShowVocab(!showVocab)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Key vocabulary</span>
            {showVocab ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </button>
          {showVocab && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10 }}>
                {topic.keyVocab.map((w, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: '#eff6ff',
                      color: '#1e3a5f',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    {w}
                  </span>
                ))}
              </div>
              {topic.tipForLevel && (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginTop: 10,
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Tip:</strong> {topic.tipForLevel}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          <span>Your answer</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#94a3b8' }}>{text.length} chars</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (!started) startTimer()
          }}
          rows={14}
          placeholder={`Write your ${taskType} response here...\n\nMinimum ${cfg.min} words required.`}
          style={{
            width: '100%',
            padding: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.7,
            resize: 'none',
            outline: 'none',
            color: '#0f172a',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#1e3a5f')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            color: '#dc2626',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {confirm && wc < cfg.min && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            color: '#c2410c',
            marginBottom: 12,
          }}
        >
          You have {wc} words - minimum is {cfg.min}. Submit anyway?
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || text.trim().length < 10}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          background: '#1e3a5f',
          color: '#fff',
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading || text.trim().length < 10 ? 0.4 : 1,
          fontFamily: 'inherit',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Scoring your essay...
          </>
        ) : confirm && wc < cfg.min ? (
          'Yes, submit anyway'
        ) : (
          'Submit for AI feedback'
        )}
      </button>
    </div>
  )
}

function FeedbackScreen({
  feedback: fb,
  level,
  onNew,
}: {
  feedback: ScoreFeedback
  level: LevelId
  onNew: () => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'vocab' | 'sentences' | 'model'>(
    'overview'
  )
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'errors', label: `Errors${fb.errors?.length ? ` (${fb.errors.length})` : ''}` },
    { id: 'vocab', label: 'Vocab' },
    { id: 'sentences', label: 'Sentences' },
    { id: 'model', label: 'Model' },
  ] as const

  return (
    <div>
      <div style={{ background: '#1e3a5f', padding: '32px 24px 24px', textAlign: 'center', color: '#fff' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Overall Band Score</p>
        <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{fb.overallBand}</div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          {BAND_DESC[String(fb.overallBand)] || BAND_DESC[String(Math.floor(fb.overallBand))] || 'Good progress'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20 }}>
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 4px', textAlign: 'center' }}
            >
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{c.short}</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{fb[c.key]}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <CheckCircle size={12} />Strengths
          </p>
          {fb.strengths?.map((s, i) => (
            <p key={i} style={{ fontSize: 11, color: '#15803d', lineHeight: 1.4, marginBottom: 4 }}>
              · {s}
            </p>
          ))}
        </div>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <XCircle size={12} />Fix first
          </p>
          {fb.priorities?.map((p, i) => (
            <p key={i} style={{ fontSize: 11, color: '#c2410c', lineHeight: 1.4, marginBottom: 4 }}>
              · {p}
            </p>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, margin: '0 16px 4px' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === t.id ? '#fff' : 'none',
              color: activeTab === t.id ? '#1e3a5f' : '#94a3b8',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {activeTab === 'overview' && (
          <div>
            {fb.annotatedEssay && (
              <FCard title="Your essay" sub="Hover/tap errors to see corrections">
                <div
                  style={{ fontSize: 14, lineHeight: 1.8, color: '#0f172a' }}
                  dangerouslySetInnerHTML={{ __html: fb.annotatedEssay }}
                />
              </FCard>
            )}
            <FCard title="Criteria breakdown">
              {CRITERIA.map((c) => (
                <div key={c.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>{fb[c.key]}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#1e3a5f',
                        borderRadius: 99,
                        width: `${(fb[c.key] / 9) * 100}%`,
                      }}
                    />
                  </div>
                  {fb.criteriaFeedback?.[c.key] && (
                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{fb.criteriaFeedback[c.key]}</p>
                  )}
                </div>
              ))}
            </FCard>
            {fb.generalTips && (
              <FCard title="Personalised advice" bg="#eff6ff" border="#bfdbfe">
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{fb.generalTips}</p>
              </FCard>
            )}
            {fb.nextStepTopic && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <ArrowRight size={16} color="#1e3a5f" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Practice next</p>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{fb.nextStepTopic}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div>
            {!fb.errors?.length ? (
              <Empty icon="OK" text="No major errors found - great work!" />
            ) : (
              fb.errors.map((e, i) => (
                <div
                  key={i}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12 }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      marginBottom: 8,
                      textTransform: 'capitalize',
                      background:
                        e.type === 'grammar'
                          ? '#fef2f2'
                          : e.type === 'vocabulary'
                            ? '#fff7ed'
                            : e.type === 'coherence'
                              ? '#fefce8'
                              : '#eff6ff',
                      color:
                        e.type === 'grammar'
                          ? '#dc2626'
                          : e.type === 'vocabulary'
                            ? '#c2410c'
                            : e.type === 'coherence'
                              ? '#ca8a04'
                              : '#2563eb',
                    }}
                  >
                    {e.type}
                  </span>
                  <p style={{ fontSize: 13, color: '#dc2626', textDecoration: 'line-through', lineHeight: 1.5, marginBottom: 6 }}>
                    {e.original}
                  </p>
                  <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>→ {e.correction}</p>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{e.explanation}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'vocab' && (
          <div>
            {!fb.vocabAlternatives?.length ? (
              <Empty icon="OK" text="Vocabulary looks good!" />
            ) : (
              fb.vocabAlternatives.map((v, i) => (
                <div
                  key={i}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12 }}
                >
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
                    &quot;{v.original}&quot; <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>{v.level}</span>
                  </p>
                  {v.alternatives?.map((a, j) => (
                    <div key={j} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>{a.word}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: '#eff6ff',
                            color: '#1e3a5f',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          {a.level}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>
                        &quot;{a.example}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sentences' && (
          <div>
            {!fb.sentenceImprovements?.length ? (
              <Empty icon="OK" text="Sentence structures look good!" />
            ) : (
              fb.sentenceImprovements.map((s, i) => (
                <div
                  key={i}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 12 }}
                >
                  {s.technique && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#f5f3ff',
                        color: '#7c3aed',
                        marginBottom: 8,
                      }}
                    >
                      {s.technique}
                    </span>
                  )}
                  <p style={{ fontSize: 13, color: '#dc2626', textDecoration: 'line-through', lineHeight: 1.6, marginBottom: 6 }}>
                    {s.original}
                  </p>
                  <p style={{ fontSize: 13, color: '#1e3a5f', fontWeight: 500, lineHeight: 1.6, marginBottom: 6 }}>{s.improved}</p>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{s.reason}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'model' && (
          <div>
            <FCard title="Model paragraph" sub={`Written at ${level} for this topic`}>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{fb.modelParagraph}</p>
            </FCard>
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
              Compare this with your writing to spot the differences
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            background: '#1e3a5f',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
          }}
        >
          <PlusCircle size={18} />New practice
        </button>
      </div>
    </div>
  )
}

function FCard({
  title,
  sub,
  children,
  bg = '#fff',
  border = '#e2e8f0',
}: {
  title: string
  sub?: string
  children: React.ReactNode
  bg?: string
  border?: string
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: sub ? 2 : 12 }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{sub}</p>}
      {children}
    </div>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, color: '#94a3b8' }}>{text}</p>
    </div>
  )
}

function TrackerScreen() {
  const [view, setView] = useState<'calendar' | 'history'>('calendar')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const calData = useMemo(() => getCalData(year, month), [year, month])
  const streak = useMemo(() => getStreak(), [])
  const week = useMemo(() => getStats(7), [])
  const mon = useMemo(() => getStats(30), [])
  const history = useMemo(() => getHistory().slice(0, 30), [])

  const mName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDay(null)
  }
  const bandColor = (s: number) =>
    s >= 7.5 ? '#16a34a' : s >= 6.5 ? '#1e3a5f' : s >= 5.5 ? '#3b82f6' : '#f59e0b'

  return (
    <div style={{ padding: '24px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Progress Tracker</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Day streak', val: streak, suffix: 'days', bg: '#fff7ed', bd: '#fed7aa' },
          { label: 'This week', val: week?.count || 0, suffix: 'essays', bg: '#eff6ff', bd: '#bfdbfe' },
          { label: 'Weekly avg', val: week?.avg || '—', suffix: '', bg: '#f0fdf4', bd: '#bbf7d0' },
          { label: 'Monthly best', val: mon?.best || '—', suffix: '', bg: '#f5f3ff', bd: '#ddd6fe' },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
              {s.val}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 3 }}>{s.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {['calendar', 'history'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v as 'calendar' | 'history')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: view === v ? '#fff' : 'none',
              color: view === v ? '#1e3a5f' : '#94a3b8',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'calendar' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10, fontSize: 18, color: '#475569' }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{mName}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10, fontSize: 18, color: '#475569' }}>›</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 8 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const entries = calData[day]
                const hasEntry = (entries?.length ?? 0) > 0
                const best = hasEntry ? Math.max(...entries.map((e) => Number(e.score))) : null
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() + 1 === month &&
                  new Date().getFullYear() === year
                const isSel = selectedDay === day

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSel ? null : day)}
                    style={{
                      aspectRatio: 1,
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isSel ? '2px solid #0f172a' : isToday ? '1.5px solid #1e3a5f' : 'none',
                      background: hasEntry ? bandColor(best as number) : 'none',
                      color: hasEntry ? '#fff' : isToday ? '#1e3a5f' : '#0f172a',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      outline: 'none',
                    }}
                  >
                    <span>{day}</span>
                    {hasEntry && <span style={{ fontSize: 9, opacity: 0.8 }}>{best}</span>}
                  </button>
                )
              })}
            </div>
          </div>
          {selectedDay && calData[selectedDay] ? (
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 16, marginTop: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                {mName.split(' ')[0]} {selectedDay}
              </p>
              {calData[selectedDay].map((e, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', flex: 1, marginRight: 8 }}>
                      {e.topic?.slice(0, 60)}...
                    </p>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f', flexShrink: 0 }}>{e.score}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>
                    {e.level} · {e.taskType} · {e.wordCount} words
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {view === 'history' && (
        <div>
          {!history.length ? (
            <Empty icon="-" text="No essays yet - start practising!" />
          ) : (
            history.map((e, i) => {
              const itemId = e.id ?? String(i)
              const isOpen = openId === itemId
              return (
                <div
                  key={itemId}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginBottom: 10 }}
                >
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}
                    onClick={() => setOpenId(isOpen ? null : itemId)}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#1e3a5f',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {e.score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: 3,
                        }}
                      >
                        {e.topic}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {e.level} · {e.wordCount || '?'} words
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      color="#94a3b8"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '.2s' }}
                    />
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
                        {CRITERIA.map((c) => (
                          <div key={c.key} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '8px 4px' }}>
                            <p style={{ fontSize: 10, color: '#94a3b8' }}>{c.short}</p>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>{e[c.key] || '—'}</p>
                          </div>
                        ))}
                      </div>
                      {e.essay && (
                        <p
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {e.essay}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function GuideScreen({ taskType }: { taskType: TaskId }) {
  const [selTask, setSelTask] = useState<TaskId>(taskType || 'Task 2')
  const [selType, setSelType] = useState(0)
  const GUIDES: Record<
    TaskId,
    {
      types: Array<{
        name: string
        desc: string
        structure: Array<{ l: string; d: string; nav: boolean; opt?: boolean }>
        tips: string[]
      }>
    }
  > = {
    'Task 2': {
      types: [
        {
          name: 'Opinion essay',
          desc: 'Do you agree or disagree?',
          structure: [
            { l: 'Introduction', d: 'Paraphrase topic + state your position clearly', nav: true },
            { l: 'Body 1', d: 'Main argument supporting your position + example', nav: false },
            { l: 'Body 2', d: 'Second supporting argument + example or evidence', nav: false },
            { l: 'Body 3 (optional)', d: 'Counter-argument + rebuttal', nav: false, opt: true },
            { l: 'Conclusion', d: 'Restate your opinion differently. No new ideas.', nav: true },
          ],
          tips: [
            'Your opinion must be clear from the first paragraph',
            'Every body paragraph: topic sentence -> explanation -> example',
            'Use linkers: However, Furthermore, In addition, Consequently',
            'Avoid listing opinions without developing them',
          ],
        },
      ],
    },
    'Task 1 Academic': {
      types: [
        {
          name: 'Line / Bar / Pie chart',
          desc: 'Trends and comparisons',
          structure: [
            { l: 'Introduction (1-2 sentences)', d: 'Paraphrase the title - do not copy it', nav: true },
            { l: 'Overview (2-3 sentences)', d: '2 most striking trends - no specific numbers here', nav: true },
            { l: 'Body 1 - Main trend', d: 'Significant trend with specific data and comparisons', nav: false },
            { l: 'Body 2 - Secondary trend', d: 'Contrasting or secondary feature with data', nav: false },
          ],
          tips: [
            'The overview is the most important paragraph - always include it',
            'Never include your opinion - describe what you see',
            'Use varied language: peaked, plummeted, remained stable, fluctuated',
            'Compare: compared to, whereas, while',
          ],
        },
      ],
    },
    'Task 1 General': {
      types: [
        {
          name: 'Formal letter',
          desc: 'To a company or unknown person',
          structure: [
            { l: 'Opening', d: 'Dear Sir/Madam - state purpose in first sentence', nav: true },
            { l: 'Bullet 1', d: 'Address the first bullet point fully', nav: false },
            { l: 'Bullet 2', d: 'Address the second bullet point fully', nav: false },
            { l: 'Bullet 3', d: 'Address the third bullet point fully', nav: false },
            { l: 'Closing', d: 'Yours faithfully + request for action', nav: true },
          ],
          tips: [
            'I am writing to inquire about... / I would be grateful if...',
            'Never use contractions in formal letters',
            'Each bullet point should be one paragraph',
            'End with: I look forward to your response',
          ],
        },
      ],
    },
  }

  const guide = GUIDES[selTask]
  const curr = guide?.types[selType]

  return (
    <div style={{ padding: '24px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Writing Guide</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Structure templates for every task type</p>
      {TASKS.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            setSelTask(t.id)
            setSelType(0)
          }}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '13px 16px',
            borderRadius: 14,
            border: `1px solid ${selTask === t.id ? '#1e3a5f' : '#e2e8f0'}`,
            background: selTask === t.id ? '#1e3a5f' : '#fff',
            color: selTask === t.id ? '#fff' : '#0f172a',
            cursor: 'pointer',
            marginBottom: 8,
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>{t.label}</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>
            {t.min}+ words · {t.time} min
          </span>
        </button>
      ))}
      {guide && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '.5px',
              marginBottom: 8,
              marginTop: 16,
            }}
          >
            Essay type
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {guide.types.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelType(i)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: `1px solid ${selType === i ? '#1e3a5f' : '#e2e8f0'}`,
                  background: selType === i ? '#1e3a5f' : '#fff',
                  color: selType === i ? '#fff' : '#475569',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {curr && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{curr.name}</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{curr.desc}</p>
          <div>
            {curr.structure.map((block, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: block.nav ? '#1e3a5f' : '#94a3b8',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: block.opt ? 0.5 : 1,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < curr.structure.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: block.nav ? '#eff6ff' : block.opt ? 'transparent' : '#f8fafc',
                    border: `1px ${block.opt ? 'dashed' : 'solid'} ${block.nav ? '#bfdbfe' : '#e2e8f0'}`,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 8,
                    opacity: block.opt ? 0.65 : 1,
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: block.nav ? '#1e3a5f' : '#0f172a', marginBottom: 3 }}>{block.l}</p>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{block.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, marginTop: 4 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '.5px',
                marginBottom: 12,
              }}
            >
              Key tips
            </p>
            {curr.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1e3a5f', flexShrink: 0, marginTop: 5 }} />
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
