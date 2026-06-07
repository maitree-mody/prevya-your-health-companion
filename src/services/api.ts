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

export async function runFullDemo() {
  const userId = await getCurrentUserId()

  const items = [
    { agent: 'intake_agent',    msg: '📂 Reading 6 years of medical records...',                    status: 'running',  delay: 0     },
    { agent: 'intake_agent',    msg: '📂 3 GP letters, 8 blood tests processed ✅',                 status: 'complete', delay: 2000  },
    { agent: 'diagnosis_agent', msg: '🔬 Analyzing against ACR/EULAR criteria...',                 status: 'running',  delay: 2500  },
    { agent: 'diagnosis_agent', msg: '🔬 APS probability HIGH — ANA positive + 2 miscarriages ✅', status: 'complete', delay: 5000  },
    { agent: 'orchestrator',    msg: '🧠 High probability detected — initiating rheumatology booking', status: 'complete', delay: 6000 },
    { agent: 'advocate_agent',  msg: '📣 Searching for rheumatologists...',                         status: 'running',  delay: 7000  },
    { agent: 'advocate_agent',  msg: '📣 Dr. Sarah Chen, March 24th — booked ✅',                  status: 'complete', delay: 9000  },
    { agent: 'advocate_agent',  msg: '📣 Dossier emailed to clinic ✅',                             status: 'complete', delay: 11000 },
    { agent: 'monitor_agent',   msg: '👁️ Pain elevated 3 days — luteal phase correlation ✅',      status: 'complete', delay: 12000 },
    { agent: 'nutrition_agent', msg: '🥗 Anti-inflammatory protocol activated ✅',                  status: 'complete', delay: 13000 },
    { agent: 'voice_agent',     msg: '🗣️ Outbound call initiated...',                              status: 'running',  delay: 14000 },
  ]

  for (const item of items) {
    setTimeout(async () => {
      await supabase.from('agent_actions').insert({
        user_id: userId,
        agent_name: item.agent,
        action_type: 'demo',
        action_detail: item.msg,
        status: item.status,
        timestamp: new Date(Date.now() + item.delay).toISOString(),
        verified_boolean: true,
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
