import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/home')({
  component: HomePage,
})

const DEMO_ITEMS = [
  { agent: '📂 Intake', msg: 'Reading 6 years of medical records...', delay: 0 },
  { agent: '📂 Intake', msg: '3 GP letters, 8 blood tests processed ✅', delay: 2000 },
  { agent: '🔬 Diagnosis', msg: 'Analyzing against ACR/EULAR criteria...', delay: 3000 },
  { agent: '🔬 Diagnosis', msg: 'APS probability HIGH — ANA positive + 2 pregnancy losses ✅', delay: 5000 },
  { agent: '🧠 Orchestrator', msg: 'Initiating rheumatology booking sequence', delay: 6000 },
  { agent: '📣 Advocate', msg: 'Searching for rheumatologists...', delay: 7000 },
  { agent: '📣 Advocate', msg: 'Dr. Sarah Chen, March 24th — booked ✅', delay: 9000 },
  { agent: '📣 Advocate', msg: 'Dossier emailed to clinic ✅', delay: 11000 },
  { agent: '👁️ Monitor', msg: 'Pain elevated 3 days — luteal phase correlation ✅', delay: 12000 },
  { agent: '🗣️ Voice', msg: 'Outbound call initiated...', delay: 13000 },
]

function HomePage() {
  const [items, setItems] = useState<typeof DEMO_ITEMS>([])
  const [running, setRunning] = useState(false)

  const runDemo = () => {
    setItems([])
    setRunning(true)
    DEMO_ITEMS.forEach((item) => {
      setTimeout(() => {
        setItems(prev => [...prev, item])
      }, item.delay)
    })
    setTimeout(() => setRunning(false), 14000)
  }

  const reset = () => setItems([])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F5',
      padding: '40px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{maxWidth: '800px', margin: '0 auto'}}>
        <div style={{marginBottom: '8px', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.15em',
          color: '#888'}}>
          Mission Control
        </div>
        <h1 style={{fontSize: '32px', fontWeight: '600',
          color: '#1B2A4A', marginBottom: '8px'}}>
          Prevya is working for you.
        </h1>
        <p style={{color: '#666', marginBottom: '32px'}}>
          5 agents running autonomously in the background.
        </p>

        <div style={{display: 'flex', gap: '12px', marginBottom: '32px'}}>
          <button onClick={runDemo} disabled={running} style={{
            background: '#D4788A', color: 'white',
            border: 'none', borderRadius: '10px',
            padding: '12px 24px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500'
          }}>
            {running ? '⏳ Running...' : '▶ Run Demo'}
          </button>
          <button onClick={reset} style={{
            background: 'transparent', color: '#666',
            border: '1px solid #ddd', borderRadius: '10px',
            padding: '12px 24px', cursor: 'pointer',
            fontSize: '14px'
          }}>
            ↺ Reset
          </button>
        </div>

        {/* Nav links */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '32px'}}>
          {[
            { to: '/checkin',   label: '🎙️ Daily Check-in' },
            { to: '/dossier',   label: '📋 My Dossier' },
            { to: '/coach',     label: '💬 Appointment Coach' },
            { to: '/nutrition', label: '🥗 Nutrition' },
            { to: '/timeline',  label: '📅 Timeline' },
            { to: '/journey',   label: '🧭 My Journey' },
            { to: '/upload',    label: '📤 Upload Records' },
            { to: '/picture',   label: '🖼️ My Picture' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              display: 'block', padding: '12px 16px',
              background: 'white', border: '1px solid #E5DACE',
              borderRadius: '10px', textDecoration: 'none',
              color: '#1B2A4A', fontSize: '13px', fontWeight: '500',
              transition: 'border-color 0.15s',
            }}>
              {label}
            </Link>
          ))}
        </div>

        <div style={{
          background: '#1B2A4A', borderRadius: '16px',
          padding: '24px', minHeight: '300px'
        }}>
          <div style={{fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: '#ffffff44',
            marginBottom: '16px'}}>
            Agent Activity
          </div>
          {items.length === 0 && (
            <div style={{color: '#ffffff44', fontSize: '14px'}}>
              Click Run Demo to watch agents work in real time...
            </div>
          )}
          {items.map((item, i) => (
            <div key={i} style={{
              color: 'white', fontSize: '14px',
              padding: '10px 0',
              borderBottom: '1px solid #ffffff11',
              animation: 'fadeIn 0.3s ease'
            }}>
              <span style={{color: '#D4788A', marginRight: '8px'}}>
                {item.agent}
              </span>
              {item.msg}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
