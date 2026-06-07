CREATE TABLE IF NOT EXISTS public.diagnosis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  conditions jsonb,
  recommended_tests jsonb,
  cross_patterns jsonb,
  doctor_summary text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosis_results TO authenticated;
GRANT SELECT, INSERT ON public.diagnosis_results TO anon;
GRANT ALL ON public.diagnosis_results TO service_role;
ALTER TABLE public.diagnosis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.diagnosis_results FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.diagnosis_results (conditions, recommended_tests, cross_patterns, doctor_summary) VALUES (
'[
  {"name":"Lupus (SLE)","level":"moderate","evidence":["Recurrent joint pain in hands and knees","Photosensitive rash noted in 2022 GP letter","Persistent fatigue across 8 check-ins"]},
  {"name":"Antiphospholipid Syndrome","level":"low","evidence":["One early pregnancy loss on record","No clotting events documented","aPL antibodies never tested"]},
  {"name":"Hashimoto''s Thyroiditis","level":"high","evidence":["TSH trending upward over 6 months","Cold intolerance + hair thinning reported","Family history: mother, maternal aunt"]},
  {"name":"Endometriosis","level":"high","evidence":["Cyclical pelvic pain peaking 2 days pre-period","Pain unrelieved by standard NSAIDs","Painful intercourse reported in 3 check-ins"]},
  {"name":"Multiple Sclerosis","level":"low","evidence":["Single episode of arm numbness in 2023","No optic symptoms reported","No MRI on file"]},
  {"name":"Premature Ovarian Insufficiency","level":"moderate","evidence":["AMH 0.4 ng/mL at age 31","Two skipped cycles in last 6 months","FSH elevated on last panel"]}
]'::jsonb,
'[
  {"name":"Anti-TPO and anti-thyroglobulin antibodies","priority":"urgent","rationale":"Confirms autoimmune thyroid involvement given rising TSH and family history."},
  {"name":"Pelvic MRI with endometriosis protocol","priority":"urgent","rationale":"Standard ultrasound missed deep infiltrating lesions consistent with your pain pattern."},
  {"name":"ANA, anti-dsDNA, complement C3/C4","priority":"soon","rationale":"Screens for lupus given joint, skin, and fatigue cluster."},
  {"name":"Repeat AMH + FSH + LH on cycle day 3","priority":"soon","rationale":"Confirms ovarian reserve trajectory before fertility planning."},
  {"name":"Lupus anticoagulant + anticardiolipin antibodies","priority":"soon","rationale":"One pregnancy loss warrants APS screen, especially with possible lupus."},
  {"name":"Vitamin D, B12, ferritin recheck","priority":"routine","rationale":"Track replacement progress and rule out contributing fatigue causes."}
]'::jsonb,
'[
  {"title":"Your pain follows your cycle — not your stress","body":"Across 12 weeks, pain scores peak 48h before menses every cycle, independent of work stressors. No single specialist saw the full timeline."},
  {"title":"Thyroid and ovarian markers are moving together","body":"TSH is rising while AMH is falling — a pattern documented in autoimmune ovarian involvement that your endocrinologist and gynaecologist each saw half of."},
  {"title":"Fatigue clusters after high-histamine meals","body":"Nutrition logs show 36h fatigue spikes after aged cheese, wine, fermented foods — never flagged because no clinician has both your food log and symptom data."}
]'::jsonb,
'I''ve been tracking my symptoms daily for 12 weeks and a pattern has emerged: cyclical pelvic pain peaking pre-menses, rising TSH with family history of Hashimoto''s, and falling AMH at 31. I''d like to discuss thyroid antibody testing, a pelvic MRI with endometriosis protocol, and a repeat ovarian reserve panel.'
);