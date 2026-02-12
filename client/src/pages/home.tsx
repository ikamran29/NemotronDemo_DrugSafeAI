import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  X,
  Zap,
  Trash2,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  Pill,
  Activity,
} from "lucide-react";
import type { CheckResponse, Interaction, DrugListResponse } from "@shared/schema";

const QUICK_ADD_DRUGS = [
  "Warfarin",
  "Aspirin",
  "Omeprazole",
  "Metformin",
  "Lisinopril",
  "Sertraline",
  "Atorvastatin",
  "Clopidogrel",
];

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { className: string }> = {
    major: { className: "bg-red-500/10 text-red-400 border-red-500/25" },
    moderate: { className: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
    minor: { className: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
  };
  const c = config[severity] || config.minor;
  return (
    <span
      data-testid={`badge-severity-${severity}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border no-default-hover-elevate no-default-active-elevate ${c.className}`}
    >
      {severity}
    </span>
  );
}

function RiskBanner({ riskScore, summary }: { riskScore: string; summary: string }) {
  const config: Record<string, { icon: typeof AlertCircle; color: string; bg: string; border: string; label: string }> = {
    critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/[0.06]", border: "border-red-500/20", label: "Critical Risk" },
    high: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/[0.06]", border: "border-red-400/20", label: "High Risk" },
    moderate: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/[0.06]", border: "border-amber-400/20", label: "Moderate Risk" },
    low: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/[0.06]", border: "border-green-400/20", label: "Low Risk" },
  };
  const c = config[riskScore] || config.low;
  const Icon = c.icon;

  return (
    <div data-testid="banner-risk" className={`flex items-start gap-4 p-5 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg}`}>
        <Icon className={`w-6 h-6 ${c.color}`} />
      </div>
      <div className="min-w-0">
        <div className={`text-[13px] font-semibold uppercase tracking-wide mb-0.5 ${c.color}`} data-testid="text-risk-label">
          {c.label}
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed" data-testid="text-risk-summary">
          {summary}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, colorClass }: { value: number; label: string; colorClass: string }) {
  return (
    <Card className="p-4 text-center">
      <div className={`font-mono text-3xl font-bold mb-1 ${colorClass}`} data-testid={`stat-${label.toLowerCase()}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </Card>
  );
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
  const [expanded, setExpanded] = useState(false);

  const severityIndicator: Record<string, string> = {
    major: "bg-red-500",
    moderate: "bg-amber-500",
    minor: "bg-blue-500",
  };

  return (
    <Card
      data-testid={`card-interaction-${interaction.drug1}-${interaction.drug2}`}
      className="overflow-visible"
    >
      <button
        data-testid={`button-expand-${interaction.drug1}-${interaction.drug2}`}
        className="flex items-center justify-between gap-3 w-full p-4 text-left cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${severityIndicator[interaction.severity] || severityIndicator.minor}`} />
        <div className="flex items-center gap-2.5 font-semibold text-[15px] flex-wrap">
          <span>{interaction.drug1}</span>
          <span className="text-muted-foreground text-xs">x</span>
          <span>{interaction.drug2}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <SeverityBadge severity={interaction.severity} />
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <DetailItem label="Interaction Type" value={interaction.interaction_type} />
            <DetailItem label="Mechanism" value={interaction.mechanism} />
            <DetailItem label="Clinical Significance" value={interaction.clinical_significance} fullWidth />
            <DetailItem label="Recommendation" value={interaction.recommendation} fullWidth />
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`bg-muted/50 rounded-md p-3.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
      <div className="text-sm text-foreground/80 leading-relaxed">{value}</div>
    </div>
  );
}

function DrugTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span
      data-testid={`tag-drug-${name.toLowerCase()}`}
      className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1.5 text-sm font-medium animate-in fade-in zoom-in-95 duration-200"
    >
      {name}
      <Button
        size="icon"
        variant="ghost"
        data-testid={`button-remove-${name.toLowerCase()}`}
        className="w-[18px] h-[18px] min-h-0 rounded-full"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12" data-testid="loading-analysis">
      <div className="relative mb-6">
        <div className="w-12 h-12 border-[3px] border-muted rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-t-primary rounded-full animate-spin" />
      </div>
      <div className="text-foreground text-[15px] font-medium">Analyzing drug interactions...</div>
      <div className="text-muted-foreground text-[13px] mt-1.5 font-mono">
        NVIDIA Nemotron is reasoning through medication combinations
      </div>
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Pill className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Enter Medications to Check</h3>
      <p className="text-muted-foreground text-sm max-w-md">
        Add at least 2 medications above, then click "Analyze" to check for potential drug interactions powered by NVIDIA Nemotron AI.
      </p>
    </div>
  );
}

export default function Home() {
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [results, setResults] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { data: drugList } = useQuery<DrugListResponse>({
    queryKey: ["/api/drugs"],
  });

  const allDrugs = drugList?.drugs || [];

  const checkMutation = useMutation({
    mutationFn: async (medications: string[]) => {
      const res = await apiRequest("POST", "/api/check", { medications });
      return (await res.json()) as CheckResponse;
    },
    onSuccess: (data) => {
      setResults(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setResults(null);
    },
  });

  const filteredDrugs = allDrugs.filter(
    (d) =>
      d.toLowerCase().startsWith(inputValue.toLowerCase()) &&
      !selectedDrugs.some((s) => s.toLowerCase() === d.toLowerCase())
  ).slice(0, 6);

  const addDrug = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      const normalized = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      if (selectedDrugs.some((d) => d.toLowerCase() === normalized.toLowerCase())) return;
      if (selectedDrugs.length >= 8) return;
      setSelectedDrugs((prev) => [...prev, normalized]);
      setInputValue("");
      setShowAutocomplete(false);
      setAutocompleteIndex(-1);
      inputRef.current?.focus();
    },
    [selectedDrugs]
  );

  const removeDrug = useCallback((index: number) => {
    setSelectedDrugs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedDrugs([]);
    setResults(null);
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocompleteIndex((prev) => Math.min(prev + 1, filteredDrugs.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocompleteIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (autocompleteIndex >= 0 && filteredDrugs[autocompleteIndex]) {
          addDrug(filteredDrugs[autocompleteIndex]);
        } else if (inputValue.trim()) {
          addDrug(inputValue);
        }
      } else if (e.key === "Backspace" && !inputValue && selectedDrugs.length > 0) {
        removeDrug(selectedDrugs.length - 1);
      }
    },
    [autocompleteIndex, filteredDrugs, inputValue, selectedDrugs, addDrug, removeDrug]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheck = () => {
    if (selectedDrugs.length < 2) return;
    setError(null);
    checkMutation.mutate(selectedDrugs);
  };

  const interactions = results?.interactions || [];
  const sortedInteractions = [...interactions].sort((a, b) => {
    const order: Record<string, number> = { major: 0, moderate: 1, minor: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
  const majorCount = interactions.filter((i) => i.severity === "major").length;
  const moderateCount = interactions.filter((i) => i.severity === "moderate").length;
  const minorCount = interactions.filter((i) => i.severity === "minor").length;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(118, 185, 71, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(118, 185, 71, 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute -top-[200px] -right-[100px] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "#76b900", filter: "blur(120px)" }}
        />
        <div
          className="absolute -bottom-[200px] -left-[100px] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "#2dd4bf", filter: "blur(120px)" }}
        />
      </div>

      <div className="relative z-10 max-w-[920px] mx-auto px-6">
        <header className="pt-10 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #76b900, #2dd4bf)" }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-serif text-3xl font-extrabold bg-gradient-to-r from-foreground to-teal-400 bg-clip-text text-transparent tracking-tight" data-testid="text-logo">
              DrugSafe AI
            </h1>
          </div>
          <p className="text-muted-foreground text-[15px] mb-2">
            AI-powered drug interaction analysis for safer medication management
          </p>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider border"
            style={{ background: "rgba(118, 185, 0, 0.08)", borderColor: "rgba(118, 185, 0, 0.2)", color: "#76b900" }}
            data-testid="badge-nvidia"
          >
            <Activity className="w-3.5 h-3.5" />
            Powered by NVIDIA Nemotron via NIM
          </div>
        </header>

        <Card className="p-6 my-7">
          <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
            <div className="text-base font-semibold">Enter Medications</div>
            <div className="font-mono text-xs text-muted-foreground bg-muted rounded-md px-2.5 py-1" data-testid="text-drug-count">
              {selectedDrugs.length} / 8 drugs
            </div>
          </div>

          <div className="relative" ref={autocompleteRef}>
            <div
              className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-muted/50 border border-border rounded-lg cursor-text transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
              onClick={() => inputRef.current?.focus()}
              data-testid="input-drug-tags"
            >
              {selectedDrugs.map((drug, i) => (
                <DrugTag key={drug} name={drug} onRemove={() => removeDrug(i)} />
              ))}
              <input
                ref={inputRef}
                type="text"
                className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-foreground text-sm py-1.5 px-1 placeholder:text-muted-foreground"
                placeholder={selectedDrugs.length === 0 ? "Type a medication name and press Enter..." : "Add another medication..."}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowAutocomplete(e.target.value.trim().length > 0);
                  setAutocompleteIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                data-testid="input-drug-search"
              />
            </div>

            {showAutocomplete && filteredDrugs.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-lg max-h-[200px] overflow-y-auto z-50 shadow-lg" data-testid="dropdown-autocomplete">
                {filteredDrugs.map((drug, i) => (
                  <div
                    key={drug}
                    data-testid={`option-drug-${drug.toLowerCase()}`}
                    className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-sm hover-elevate ${i === autocompleteIndex ? "bg-primary/10 text-foreground" : "text-muted-foreground"}`}
                    onClick={() => addDrug(drug)}
                  >
                    <span>{drug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Quick add:</span>
            {QUICK_ADD_DRUGS.map((drug) => (
              <button
                key={drug}
                data-testid={`button-quick-add-${drug.toLowerCase()}`}
                className={`text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground cursor-pointer hover-elevate ${
                  selectedDrugs.some((d) => d.toLowerCase() === drug.toLowerCase())
                    ? "opacity-40 pointer-events-none"
                    : ""
                }`}
                onClick={() => addDrug(drug)}
                disabled={selectedDrugs.some((d) => d.toLowerCase() === drug.toLowerCase())}
              >
                {drug}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-5 flex-col sm:flex-row">
            <Button
              data-testid="button-analyze"
              className="flex-1"
              onClick={handleCheck}
              disabled={selectedDrugs.length < 2 || checkMutation.isPending}
            >
              {checkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {checkMutation.isPending ? "Analyzing..." : "Analyze Interactions with Nemotron"}
            </Button>
            <Button
              data-testid="button-clear"
              variant="secondary"
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {error && (
            <div className="mt-3 p-3.5 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-red-400 text-sm" data-testid="text-error">
              {error}
            </div>
          )}
        </Card>

        {checkMutation.isPending && <LoadingState />}

        {!checkMutation.isPending && results && (
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <RiskBanner riskScore={results.risk_score} summary={results.summary} />

            <div className="grid grid-cols-3 gap-3 my-5">
              <StatCard value={majorCount} label="Major" colorClass="text-red-400" />
              <StatCard value={moderateCount} label="Moderate" colorClass="text-amber-400" />
              <StatCard value={minorCount} label="Minor" colorClass="text-blue-400" />
            </div>

            {sortedInteractions.length === 0 ? (
              <Card className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-foreground font-medium">No interactions found</div>
                <div className="text-muted-foreground text-sm mt-1">
                  These medications appear safe to take together based on AI analysis.
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedInteractions.map((interaction, i) => (
                  <InteractionCard key={`${interaction.drug1}-${interaction.drug2}-${i}`} interaction={interaction} />
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded-lg border text-[13px] text-muted-foreground leading-relaxed" style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.15)" }}>
              <strong className="text-amber-400">Medical Disclaimer:</strong> DrugSafe AI is an educational tool and demonstration of NVIDIA Nemotron's capabilities.
              It is NOT a substitute for professional medical advice, diagnosis, or treatment.
              Always consult a licensed pharmacist or physician before making any medication decisions.
            </div>
          </div>
        )}

        {!checkMutation.isPending && !results && <EmptyResults />}

        <footer className="text-center py-8 border-t border-border mt-10">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-[13px]">
            Built with{" "}
            <a href="https://developer.nvidia.com/nemotron" target="_blank" rel="noopener noreferrer" className="text-[#76b900] hover:underline">
              NVIDIA Nemotron
            </a>{" "}
            via{" "}
            <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer" className="text-[#76b900] hover:underline">
              NIM API
            </a>
          </div>
          <div className="mt-2.5 text-xs text-muted-foreground">
            <a href="https://developer.nvidia.com/gtc-golden-ticket-contest" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground mx-2">
              GTC 2026 Contest
            </a>
            <span>#NVIDIAGTC</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
