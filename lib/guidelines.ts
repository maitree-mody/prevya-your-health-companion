import { supabaseAdmin } from "./supabase";

// Embedding via HuggingFace Inference API (384-dim, sentence-transformers/all-MiniLM-L6-v2).
// Used only when the HF API is reachable. Add HUGGINGFACE_API_KEY to .env.local
// for higher rate limits. Seed with: npm run seed:embed
const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export interface GuidelineChunk {
  condition: string;
  guideline_source: string;
  content: string;
}

export interface GuidelineResult extends GuidelineChunk {
  id: string;
  similarity: number;
}

// ---------------------------------------------------------------------------
// Diagnostic criteria for 6 conditions tracked by Prevya
// ---------------------------------------------------------------------------

export const GUIDELINES: GuidelineChunk[] = [
  // ── PCOS ──────────────────────────────────────────────────────────────────
  {
    condition: "PCOS",
    guideline_source: "Rotterdam Criteria 2003",
    content: `Polycystic Ovary Syndrome (PCOS) is diagnosed when at least 2 of the 3 Rotterdam criteria are met:
1. Oligo-ovulation or anovulation: cycles longer than 35 days or fewer than 8 cycles per year.
2. Clinical or biochemical signs of hyperandrogenism: elevated total/free testosterone, DHEA-S, androstenedione; or clinical signs such as hirsutism (Ferriman-Gallwey score ≥8), acne, or alopecia.
3. Polycystic ovaries on ultrasound: ≥12 follicles (2–9 mm) in one or both ovaries, or ovarian volume >10 mL.
Other causes (thyroid disease, hyperprolactinaemia, congenital adrenal hyperplasia) must be excluded before diagnosis.`,
  },
  {
    condition: "PCOS",
    guideline_source: "Androgen Excess and PCOS Society 2018",
    content: `PCOS hormonal markers and metabolic workup:
- LH:FSH ratio >2:1 or >3:1 (elevated in 60% of PCOS patients, not diagnostic alone).
- Total testosterone >50 ng/dL or free androgen index >5 suggests hyperandrogenism.
- AMH (anti-Müllerian hormone) is typically ≥4.7 ng/mL in PCOS; can be used as a surrogate for antral follicle count.
- Fasting insulin and glucose (HOMA-IR >2.5 indicates insulin resistance, present in 65–80% of PCOS).
- Fasting lipids: dyslipidaemia is common (elevated LDL, triglycerides; low HDL).
- Oral glucose tolerance test (OGTT) recommended for overweight/obese PCOS patients.`,
  },
  {
    condition: "PCOS",
    guideline_source: "ESHRE/ASRM PCOS Guideline 2023",
    content: `PCOS symptom patterns and red flags requiring referral:
- Irregular cycles (>35 days or <21 days), sudden cessation of periods, or cycle length variability >20 days.
- Rapidly progressive hirsutism, virilisation, or clitoromegaly suggests adrenal or ovarian tumour — urgent referral.
- Acanthosis nigricans (dark velvety skin patches at neck/armpits) indicates severe insulin resistance.
- Infertility: anovulation is the leading cause of infertility in PCOS; ovulation induction with letrozole is first-line.
- Mental health: anxiety and depression prevalence is 2–3× higher in PCOS; screen routinely with PHQ-9 and GAD-7.
- Long-term risks: type 2 diabetes (5–7× elevated risk), cardiovascular disease, endometrial hyperplasia/cancer.`,
  },

  // ── ENDOMETRIOSIS ─────────────────────────────────────────────────────────
  {
    condition: "Endometriosis",
    guideline_source: "ASRM Endometriosis Classification 2022",
    content: `Endometriosis diagnostic criteria and staging:
Definitive diagnosis requires histological confirmation (laparoscopy with biopsy showing ectopic endometrial glands/stroma).
ASRM staging (I–IV) based on laparoscopic findings:
- Stage I (Minimal): isolated implants, no significant adhesions.
- Stage II (Mild): superficial implants <5 cm, no adhesions.
- Stage III (Moderate): multiple superficial and deep implants, peritubal/periovarian adhesions, small endometrioma.
- Stage IV (Severe): large endometriomas, dense adhesions, bowel/bladder involvement.
Note: staging correlates poorly with symptom severity; stage I can cause severe pain.
Serum CA-125 may be elevated but is non-specific; useful for monitoring, not diagnosis.`,
  },
  {
    condition: "Endometriosis",
    guideline_source: "ESHRE Endometriosis Guideline 2022",
    content: `Endometriosis hallmark symptoms and diagnostic delay:
- Dysmenorrhoea: severe cyclical pelvic pain beginning before menstruation; pain score ≥7/10 that is not controlled by NSAIDs suggests endometriosis.
- Dyspareunia (deep): pain with deep penetration, worse premenstrually, relieved post-menstruation.
- Chronic pelvic pain: non-cyclic pain lasting >6 months, often in the lower abdomen, back, or rectum.
- Dyschezia: painful defecation, especially during menstruation — suggests rectovaginal/bowel endometriosis.
- Dysuria or haematuria during menstruation suggests bladder endometriosis.
- Subfertility: endometriosis found in 25–50% of infertile women.
Average diagnostic delay is 7–10 years. Elevated suspicion needed when multiple symptoms co-occur cyclically.`,
  },
  {
    condition: "Endometriosis",
    guideline_source: "World Endometriosis Society Consensus 2021",
    content: `Endometriosis non-invasive diagnostic tools and referral criteria:
- Transvaginal ultrasound (TVUS): first-line imaging; sensitive for ovarian endometrioma (>97%) and deep infiltrating endometriosis (DIE) at rectovaginal septum, bladder, and bowel.
- MRI pelvis: superior to TVUS for mapping DIE, especially pre-surgical planning.
- Symptoms warranting urgent gynaecology referral: suspected bowel or bladder involvement, bilateral endometriomas, suspected DIE, failed medical management, or desire for pregnancy.
- Medical management: combined oral contraceptives, progestogens (norethisterone, dienogest), GnRH agonists/antagonists. Surgery for excision preferred over ablation.`,
  },

  // ── PMDD ──────────────────────────────────────────────────────────────────
  {
    condition: "PMDD",
    guideline_source: "DSM-5-TR Diagnostic Criteria 2022",
    content: `Premenstrual Dysphoric Disorder (PMDD) DSM-5 diagnostic criteria:
In most menstrual cycles during the past year, ≥5 symptoms must be present in the final week before menses onset, begin improving within a few days after menses onset, and become minimal or absent in the week post-menses.
At least ONE of the following must be present:
1. Marked affective lability (mood swings, sudden sadness, tearfulness, increased rejection sensitivity).
2. Marked irritability or anger, or increased interpersonal conflicts.
3. Markedly depressed mood, hopelessness, or self-deprecating thoughts.
4. Marked anxiety, tension, or feeling keyed up or on edge.
Additional symptoms (to reach 5 total):
5. Decreased interest in usual activities.
6. Subjective difficulty concentrating.
7. Lethargy, easy fatigability, or marked lack of energy.
8. Marked change in appetite; overeating or food cravings.
9. Hypersomnia or insomnia.
10. Sense of being overwhelmed or out of control.
11. Physical symptoms: breast tenderness, joint/muscle pain, bloating, weight gain.
Symptoms must cause clinically significant distress or interfere with work, school, or usual activities.`,
  },
  {
    condition: "PMDD",
    guideline_source: "ACOG Practice Bulletin 2023",
    content: `PMDD differentiation, symptom tracking, and treatment:
Differentiating PMDD from PMS: PMS involves milder physical and mood symptoms; PMDD requires functional impairment and ≥5 DSM-5 criteria met prospectively for ≥2 consecutive cycles.
Differentiating PMDD from premenstrual exacerbation (PME): depressive or anxiety disorders that worsen premenstrually but do not remit post-menstruation are PME, not PMDD.
Prospective symptom tracking for 2+ cycles is required for diagnosis (Daily Record of Severity of Problems — DRSP or similar tool).
Timing: symptoms onset luteal phase (ovulation to menses), remit within 4 days of onset of menses, and free interval of at least 7 days post-menstruation.
First-line treatment: SSRIs (sertraline, fluoxetine) — continuous or luteal-phase dosing; combined oral contraceptives with drospirenone (Yaz). Second-line: GnRH agonists, cognitive behavioural therapy.`,
  },

  // ── HASHIMOTO'S / HYPOTHYROIDISM ──────────────────────────────────────────
  {
    condition: "Hypothyroidism",
    guideline_source: "ATA Hypothyroidism Guidelines 2014 (updated 2023)",
    content: `Hypothyroidism and Hashimoto's thyroiditis diagnostic criteria:
Primary hypothyroidism:
- TSH >4.5 mIU/L (or above lab reference range) with low or normal free T4 = overt hypothyroidism.
- TSH 4.5–10 mIU/L with normal free T4 = subclinical hypothyroidism.
- TSH >10 mIU/L: treatment with levothyroxine universally recommended.
Hashimoto's thyroiditis (autoimmune):
- Positive anti-TPO antibodies (>35 IU/mL) in >95% of cases.
- Anti-thyroglobulin antibodies (anti-TG) elevated in ~60%.
- Ultrasound: heterogeneous, hypoechoic thyroid parenchyma with pseudonodular pattern; may show micronodules.
- Diagnosis does not require biopsy; clinical + serological + ultrasound findings are sufficient.
Full thyroid panel: TSH, free T4, free T3, anti-TPO, anti-TG, thyroid ultrasound.`,
  },
  {
    condition: "Hypothyroidism",
    guideline_source: "British Thyroid Association Guidelines 2019",
    content: `Hypothyroidism symptoms, cycle impact, and referral criteria:
Cardinal symptoms: fatigue, cold intolerance, weight gain, constipation, dry skin, hair loss (especially outer third of eyebrows), brittle nails, brain fog, depression, slowed reflexes, bradycardia, myxoedema (severe cases).
Menstrual impact: heavy periods (menorrhagia), irregular cycles, anovulation, subfertility, increased miscarriage risk. Hypothyroidism found in 2–4% of women with menorrhagia.
TSH targets: general population 0.5–2.5 mIU/L optimal on treatment; pregnancy target <2.5 mIU/L in first trimester.
Red flags requiring urgent endocrinology referral: TSH >20 mIU/L, suspected myxoedema coma (hypothermia, confusion), thyroid nodule with suspicious features, goitre causing compressive symptoms, failure to respond to adequate levothyroxine dose.`,
  },

  // ── UTERINE FIBROIDS ──────────────────────────────────────────────────────
  {
    condition: "Uterine Fibroids",
    guideline_source: "NICE Guideline NG88 / ACOG Practice Bulletin 228",
    content: `Uterine fibroids (leiomyomata) classification and diagnosis:
FIGO classification by location:
- Type 0–2 (Submucosal): protrude into or distort the uterine cavity; cause the heaviest bleeding and most associated with infertility.
- Type 3–5 (Intramural): within the myometrium; symptomatic when >3 cm.
- Type 6–7 (Subserosal): project outward from uterus; cause bulk/pressure symptoms.
- Type 8: cervical, parasitic, or other locations.
Diagnosis:
- Transvaginal and transabdominal ultrasound: first-line; can characterise size, number, location.
- MRI pelvis: gold standard for mapping, especially pre-procedural planning; differentiates fibroids from adenomyosis.
- Hysteroscopy: for submucosal fibroids; allows simultaneous resection (TCRM).
- Saline infusion sonography (SIS): useful for identifying submucosal involvement.`,
  },
  {
    condition: "Uterine Fibroids",
    guideline_source: "Royal College of Obstetricians and Gynaecologists 2023",
    content: `Uterine fibroid symptoms and treatment thresholds:
Symptoms:
- Heavy menstrual bleeding (HMB): most common; >80 mL/cycle; soaking ≥1 pad/hour, clots >2.5 cm. Often leads to iron deficiency anaemia.
- Pelvic pressure and pain: bulk symptoms from large fibroids; bladder pressure causing urinary frequency/urgency; rectal pressure causing constipation.
- Dysmenorrhoea and dyspareunia: less common than endometriosis but present especially with submucosal/intramural types.
- Reproductive impact: submucosal fibroids reduce IVF success rates by ~50%; intramural fibroids >3 cm may also affect implantation.
Red flags: rapid enlargement, postmenopausal growth (consider leiomyosarcoma), acute severe pain (degeneration).
Treatment ladder: hormonal (progesterone-IUD, ulipristal acetate), uterine artery embolisation, myomectomy, hysterectomy.`,
  },

  // ── ADENOMYOSIS ───────────────────────────────────────────────────────────
  {
    condition: "Adenomyosis",
    guideline_source: "MUSA Consensus Criteria 2022 / ESHRE Guideline 2023",
    content: `Adenomyosis diagnostic criteria (non-invasive):
Adenomyosis is defined as the presence of endometrial glands and stroma within the myometrium, resulting in a diffusely enlarged uterus.
Transvaginal ultrasound (TVUS) MUSA criteria (direct features):
- Myometrial cysts (anechoic, 1–7 mm).
- Hyperechoic islands (bright endometrial tissue within myometrium).
- Fan-shaped shadowing from the endometrial–myometrial junction.
- Echogenic subendometrial lines and buds.
Indirect TVUS features: globular uterine shape, asymmetric myometrial thickening, irregular endometrial–myometrial junction (junctional zone >12 mm on MRI).
MRI criteria: junctional zone (JZ) thickness ≥12 mm is diagnostic; JZ 8–12 mm is indeterminate; JZ/myometrium ratio >40% increases specificity.
TVUS is first-line; MRI reserved for inconclusive ultrasound or pre-surgical planning.`,
  },
  {
    condition: "Adenomyosis",
    guideline_source: "ESHRE Adenomyosis Guideline 2023",
    content: `Adenomyosis symptoms, co-morbidities, and management:
Cardinal symptoms:
- Dysmenorrhoea: severe, often beginning several days before menstruation; may be unresponsive to NSAIDs.
- Heavy menstrual bleeding (HMB): similar to fibroids but often combined with severe cramps.
- Chronic pelvic pain: non-cyclical in advanced cases; may mimic endometriosis.
- Uterine enlargement: uterus may feel boggy and tender on examination, especially premenstrually.
- Dyspareunia: reported in ~30% of cases.
Co-morbidities: adenomyosis co-exists with endometriosis in 20–50% of cases; fibroids in 30%; important to assess for all three simultaneously.
Reproductive impact: associated with increased miscarriage risk, preterm birth, and reduced IVF success; consider in recurrent pregnancy loss workup.
Management: hormonal suppression (progestins, GnRH analogues, levonorgestrel IUS), uterine-sparing surgery, or hysterectomy for definitive treatment.`,
  },
];

// ---------------------------------------------------------------------------
// Embedding via HuggingFace Inference API → 384-dim vectors
// Free tier, no API key required. Add HUGGINGFACE_API_KEY to .env.local
// for higher rate limits.
// ---------------------------------------------------------------------------

export async function embedText(text: string): Promise<number[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.HUGGINGFACE_API_KEY;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(HF_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    if (res.ok) {
      const data = await res.json();
      // Response is [[...]] (1×384) — flatten one level if needed
      return Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[]);
    }

    if (res.status === 503 && attempt < 3) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 5000));
      continue;
    }

    throw new Error(`HuggingFace API error ${res.status}: ${await res.text()}`);
  }
  throw new Error("embedText: max retries exceeded");
}

// ---------------------------------------------------------------------------
// RAG retrieval — full-text search (active path, no embedding needed)
// Upgrade to vector search by calling retrieveGuidelinesVector once embeddings
// are seeded via `npm run seed:embed`.
// ---------------------------------------------------------------------------

export async function retrieveGuidelines(
  symptoms: string,
  matchCount = 5
): Promise<GuidelineResult[]> {
  const { data, error } = await supabaseAdmin.rpc("match_guidelines_fts", {
    query_text: symptoms,
    match_count: matchCount,
  });

  if (error) throw new Error(`retrieveGuidelines RPC failed: ${error.message}`);

  return ((data ?? []) as Array<Omit<GuidelineResult, "similarity"> & { rank: number }>).map(
    (row) => ({ ...row, similarity: row.rank })
  );
}

// ---------------------------------------------------------------------------
// Vector retrieval — upgrade path once embeddings are populated
// ---------------------------------------------------------------------------

export async function retrieveGuidelinesVector(
  symptoms: string,
  matchCount = 5,
  matchThreshold = 0.4
): Promise<GuidelineResult[]> {
  const embedding = await embedText(symptoms);

  const { data, error } = await supabaseAdmin.rpc("match_guidelines", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw new Error(`retrieveGuidelinesVector RPC failed: ${error.message}`);
  return (data ?? []) as GuidelineResult[];
}
