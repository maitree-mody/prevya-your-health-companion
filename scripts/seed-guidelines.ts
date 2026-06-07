import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { GUIDELINES, embedText, type GuidelineChunk } from "../lib/guidelines";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedChunk(chunk: GuidelineChunk) {
  const { data: existing } = await supabase
    .from("medical_guidelines")
    .select("id, embedding")
    .eq("condition", chunk.condition)
    .eq("guideline_source", chunk.guideline_source)
    .maybeSingle();

  const embedding = await embedText(chunk.content);

  if (existing) {
    if (existing.embedding) {
      console.log(`  ↩  already embedded: [${chunk.condition}] ${chunk.guideline_source}`);
      return;
    }
    // Row exists but embedding is null — backfill
    const { error } = await supabase
      .from("medical_guidelines")
      .update({ embedding })
      .eq("id", existing.id);
    if (error) throw new Error(`Update failed: ${error.message}`);
    console.log(`  ↑  embedded: [${chunk.condition}] ${chunk.guideline_source}`);
    return;
  }

  // New row
  const { error } = await supabase.from("medical_guidelines").insert({
    condition: chunk.condition,
    guideline_source: chunk.guideline_source,
    content: chunk.content,
    embedding,
  });
  if (error) throw new Error(`Insert failed: ${error.message}`);
  console.log(`  ✓  seeded: [${chunk.condition}] ${chunk.guideline_source}`);
}

async function main() {
  console.log(`Seeding ${GUIDELINES.length} guideline chunks…\n`);
  for (const chunk of GUIDELINES) {
    await seedChunk(chunk);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
