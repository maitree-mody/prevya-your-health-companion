import { supabase } from '@/integrations/supabase/client'

// Valid UUID for demo mode — insert this user via Supabase SQL editor:
// INSERT INTO users (id, name, age, conditions_suspected, fertility_intent)
// VALUES ('00000000-0000-0000-0000-000000000001', 'Sarah', 34, ARRAY['Lupus','APS'], true)
// ON CONFLICT (id) DO NOTHING;
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEMO_USER_ID
  return user.id
}

export async function processDocument(file: File) {
  const userId = await getCurrentUserId()
  const reader = new FileReader()
  const base64 = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
  const { data, error } = await supabase.functions.invoke('process-document', {
    body: { fileBase64: base64, fileName: file.name, userId },
  })
  if (error) throw error
  return data
}

export async function runDiagnosis() {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase.functions.invoke('diagnosis-agent', {
    body: { userId },
  })
  if (error) throw error
  return data
}

export async function generateDossier() {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase.functions.invoke('dossier-generator', {
    body: { userId },
  })
  if (error) throw error
  return data
}

// Base URL for the Next.js API (same origin in prod; localhost:3000 in local dev)
const NEXT_API = import.meta.env.VITE_NEXT_API_URL ?? 'http://localhost:3000'

export async function runFullDemo() {
  const userId = await getCurrentUserId()

  // Try the server-side endpoint first (proper sequencing, reliable timing)
  try {
    const res = await fetch(`${NEXT_API}/api/demo/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) return await res.json()
  } catch {
    // Next.js server not reachable — fall back to client-side inserts
  }

  // Fallback: client-side timed inserts via Supabase directly
  const items = [
    { agent: 'intake_agent',    msg: '📂 Intake: Reading 6 years of medical records...',                         status: 'running',  delay: 0     },
    { agent: 'intake_agent',    msg: '📂 Intake: 3 GP letters, 8 blood tests, 2 referral letters processed ✅',  status: 'complete', delay: 2000  },
    { agent: 'diagnosis_agent', msg: '🔬 Diagnosis: Analyzing patterns against ACR/EULAR clinical criteria...', status: 'running',  delay: 4000  },
    { agent: 'diagnosis_agent', msg: '🔬 Diagnosis: APS probability HIGH — ANA positive + 2 miscarriages + joint pain pattern identified ✅', status: 'complete', delay: 6000 },
    { agent: 'orchestrator',    msg: '🧠 Orchestrator: High probability APS detected — initiating rheumatology booking sequence', status: 'complete', delay: 8000 },
    { agent: 'advocate_agent',  msg: '📣 Advocate: Searching for rheumatologists accepting new patients...',    status: 'running',  delay: 10000 },
    { agent: 'advocate_agent',  msg: '📣 Advocate: Appointment found — Dr. Sarah Chen, March 24th ✅',          status: 'complete', delay: 12000 },
    { agent: 'advocate_agent',  msg: '📣 Advocate: Booking confirmed ✅',                                        status: 'complete', delay: 14000 },
    { agent: 'advocate_agent',  msg: '📣 Advocate: Dossier emailed to clinic ✅',                               status: 'complete', delay: 16000 },
    { agent: 'monitor_agent',   msg: '👁️ Monitor: Pain scores elevated 3 days — correlates with luteal phase ✅', status: 'complete', delay: 18000 },
    { agent: 'nutrition_agent', msg: '🥗 Nutrition: Flare risk detected — anti-inflammatory protocol activated ✅', status: 'complete', delay: 20000 },
    { agent: 'voice_agent',     msg: '🗣️ Voice: Initiating outbound call to patient...',                        status: 'running',  delay: 22000 },
  ]

  for (const item of items) {
    setTimeout(async () => {
      await supabase.from('agent_actions').insert({
        user_id: userId,
        agent_name: item.agent,
        action_type: 'demo',
        action_detail: item.msg,
        status: item.status,
        timestamp: new Date().toISOString(),
        verified_boolean: item.status === 'complete',
      })
    }, item.delay)
  }

  return { success: true }
}

export async function getDiagnosisResults() {
  const userId = await getCurrentUserId()
  const { data } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

export async function getDossier() {
  const userId = await getCurrentUserId()
  // dossier content is stored in diagnosis_results; Edge Function populates it
  const { data } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

export async function getAgentFeed() {
  const userId = await getCurrentUserId()
  const { data } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50)
  return data || []
}

export function subscribeToFeed(onUpdate: (action: any) => void) {
  return supabase
    .channel('agent_feed')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_actions',
    }, (payload) => onUpdate(payload.new))
    .subscribe()
}

export async function resetDemo() {
  const userId = await getCurrentUserId()
  await supabase
    .from('agent_actions')
    .delete()
    .eq('user_id', userId)
}
