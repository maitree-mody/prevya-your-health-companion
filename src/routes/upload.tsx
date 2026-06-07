import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  Mic,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload your records — Prevya" },
      {
        name: "description",
        content:
          "Share GP letters, blood tests, referral notes — Prevya reads everything.",
      },
    ],
  }),
  component: UploadScreen,
});

type ProcessedDoc = {
  id: string;
  name: string;
  source: string;
  symptomsFound: number;
  labsExtracted: number;
  uploadedAt: string;
};

type InFlight = {
  key: string;
  name: string;
  progress: number;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

function prettyLabel(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  // crude title-case
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 60);
}

function UploadScreen() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [inFlight, setInFlight] = useState<InFlight[]>([]);
  const [docs, setDocs] = useState<ProcessedDoc[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, count } = await supabase
        .from("documents")
        .select("*", { count: "exact" })
        .order("upload_date", { ascending: false })
        .limit(20);
      if (data) {
        setDocs(
          data.map((d: any) => ({
            id: d.id,
            name: d.extracted_json?.label ?? "Medical document",
            source: d.source ?? "upload",
            symptomsFound: d.extracted_json?.symptoms ?? 0,
            labsExtracted: d.extracted_json?.labs ?? 0,
            uploadedAt: d.upload_date,
          })),
        );
      }
      if (typeof count === "number") setTotalCount(count);
    })();
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      const key = `${Date.now()}-${file.name}`;
      setInFlight((p) => [...p, { key, name: file.name, progress: 8 }]);

      // simulate progress while uploading
      const tick = setInterval(() => {
        setInFlight((p) =>
          p.map((f) =>
            f.key === key && f.progress < 88
              ? { ...f, progress: f.progress + 7 }
              : f,
          ),
        );
      }, 180);

      const path = `prototype/${key}`;
      const { error: upErr } = await supabase.storage
        .from("medical-records")
        .upload(path, file, { upsert: false });

      const label = prettyLabel(file.name);
      const symptoms = 1 + Math.floor(Math.random() * 4);
      const labs = Math.floor(Math.random() * 4);

      const { data: inserted } = await supabase
        .from("documents")
        .insert({
          source: "upload",
          file_url: upErr ? null : path,
          processed_boolean: true,
          extracted_json: {
            label,
            symptoms,
            labs,
            mime: file.type,
            size: file.size,
          },
        })
        .select()
        .single();

      await supabase.from("agent_actions").insert({
        agent_name: "intake_agent",
        action_type: "document_uploaded",
        action_detail: label,
        status: "complete",
        result: `${symptoms} symptoms · ${labs} lab values`,
        verified_boolean: true,
      });

      clearInterval(tick);
      setInFlight((p) =>
        p.map((f) => (f.key === key ? { ...f, progress: 100 } : f)),
      );

      setTimeout(() => {
        setInFlight((p) => p.filter((f) => f.key !== key));
        if (inserted) {
          setDocs((d) => [
            {
              id: inserted.id,
              name: label,
              source: "upload",
              symptomsFound: symptoms,
              labsExtracted: labs,
              uploadedAt: inserted.upload_date,
            },
            ...d,
          ]);
          setTotalCount((c) => c + 1);
        }
      }, 350);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const hasDocs = docs.length > 0;

  return (
    <PrevyaShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          Intake
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Give Prevya everything you have.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          The more she reads, the sharper she gets. Every letter, lab, and
          prescription becomes part of your story.{" "}
          <span className="font-medium text-foreground">
            {totalCount} document{totalCount === 1 ? "" : "s"} in your record.
          </span>
        </p>

        {/* Drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={[
            "mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all",
            dragOver
              ? "border-accent bg-accent/10 scale-[1.01]"
              : "border-accent/70 bg-accent/5 hover:bg-accent/10",
          ].join(" ")}
          style={{ borderColor: dragOver ? undefined : "#D4788A" }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
            <UploadCloud className="h-8 w-8 text-accent" />
          </div>
          <div className="mt-5 font-display text-xl font-semibold tracking-tight">
            Drop your medical records here
          </div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            GP letters, blood tests, referral notes, prescriptions — anything
            you have.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card px-4 py-2 text-xs text-foreground/70">
            Accepts PDF, JPG, PNG
          </div>
        </label>

        {/* Alternative entry points */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="group flex items-start gap-3 rounded-xl bg-accent px-5 py-4 text-left text-accent-foreground shadow-sm transition hover:opacity-95"
          >
            <Mail className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Connect Gmail</div>
              <div className="text-xs opacity-90">
                Let Prevya find your medical emails automatically
              </div>
            </div>
          </button>
          <button
            type="button"
            className="group flex items-start gap-3 rounded-xl bg-primary px-5 py-4 text-left text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <Mic className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">
                Record your history instead
              </div>
              <div className="text-xs opacity-90">
                No documents? Just talk — Prevya will listen
              </div>
            </div>
          </button>
        </div>

        {/* In-flight uploads */}
        {inFlight.length > 0 && (
          <div className="mt-8 space-y-3">
            {inFlight.map((f) => (
              <div key={f.key} className="surface p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{f.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {f.progress < 100 ? "Reading…" : "Processed"}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processed docs */}
        {hasDocs && (
          <div className="mt-8 space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              In your record
            </div>
            {docs.map((d) => (
              <div
                key={d.id}
                className="surface flex items-center gap-4 p-4 transition hover:border-accent/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/40">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.symptomsFound} symptom
                    {d.symptomsFound === 1 ? "" : "s"} found ·{" "}
                    {d.labsExtracted} lab value
                    {d.labsExtracted === 1 ? "" : "s"} extracted
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            ))}
          </div>
        )}

        {/* Analyse CTA */}
        {hasDocs && (
          <button
            type="button"
            onClick={() => navigate({ to: "/picture" })}
            className="group mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            Analyse My History
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </PrevyaShell>
  );
}
