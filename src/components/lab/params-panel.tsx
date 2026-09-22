import { ALL_MONTHS } from "@/lib/forecast/data";
import { monthLabel } from "@/lib/forecast/dates";
import { SITES, type LabParams, type NationalModel, type SiteMethod } from "@/lib/forecast/types";
import { useLab, type PresetName } from "@/store/lab-store";
import { Field, Range, Section, Select, Toggle } from "./knobs";

const ORIGINS = ALL_MONTHS.filter((t) => t >= "2023-06-01" && t <= "2026-06-01");

const NAT: { value: NationalModel; label: string }[] = [
  { value: "mean", label: "Moving mean (window)" },
  { value: "persist", label: "Persist (last month)" },
  { value: "snaive", label: "Seasonal naive" },
  { value: "ewma", label: "EWMA" },
  { value: "ses", label: "Simple exp. smoothing" },
  { value: "ensemble", label: "Level ensemble" },
  { value: "hw", label: "Holt–Winters" },
  { value: "arima", label: "ARIMA(p,d,q)" },
  { value: "sarima", label: "SARIMA" },
  { value: "ols", label: "OLS recursive" },
  { value: "ridge", label: "Ridge recursive" },
];

const SITE: { value: SiteMethod; label: string }[] = [
  { value: "ensemble", label: "Level ensemble" },
  { value: "mean", label: "Moving mean" },
  { value: "ewma", label: "EWMA" },
  { value: "ses", label: "SES" },
  { value: "hw", label: "Holt–Winters" },
  { value: "ols", label: "OLS recursive" },
  { value: "croston", label: "Croston-like" },
  { value: "snaive", label: "Seasonal naive" },
  { value: "persist", label: "Persist" },
];

const PRESETS: { id: PresetName; label: string }[] = [
  { id: "notebook", label: "Notebook cut" },
  { id: "consecutive", label: "No skip" },
  { id: "includeFeb", label: "Train through Feb" },
  { id: "trendChaser", label: "HW trend chaser" },
];

export function ParamsPanel() {
  const params = useLab((s) => s.params);
  const patch = useLab((s) => s.patch);
  const reset = useLab((s) => s.reset);
  const applyPreset = useLab((s) => s.applyPreset);
  const toggleMature = useLab((s) => s.toggleMature);
  const p = params;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((pr) => (
          <button
            key={pr.id}
            type="button"
            onClick={() => applyPreset(pr.id)}
            className="h-8 rounded-sm border border-border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {pr.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="h-8 rounded-sm px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Reset
        </button>
      </div>

      <Section title="Protocol">
        <Field
          label="Origin (last fitted month)"
          value={monthLabel(p.origin)}
          hint="Nothing after this close enters a coefficient. The notebook freeze is Jan 2026."
        >
          <Select
            value={p.origin}
            onChange={(v) => patch({ origin: v })}
            options={ORIGINS.map((t) => ({ value: t, label: monthLabel(t) }))}
          />
        </Field>
        <Field
          label="Skip months after origin"
          value={String(p.skipMonths)}
          hint="1 = January trains, February is a bridge, March–May score."
        >
          <Range min={0} max={3} value={p.skipMonths} onChange={(v) => patch({ skipMonths: v })} />
        </Field>
        <Field
          label="Score horizon"
          value={`${p.horizon} months`}
          hint="Length of the scored window after the skip."
        >
          <Range min={1} max={6} value={p.horizon} onChange={(v) => patch({ horizon: v })} />
        </Field>
        <Toggle
          checked={p.clipNegative}
          onChange={(v) => patch({ clipNegative: v })}
          label="Clip forecasts at zero"
        />
        <Toggle
          checked={p.dropPaddedTail}
          onChange={(v) => patch({ dropPaddedTail: v })}
          label="Ignore Jul–Aug 2026 padded zeros"
        />
      </Section>

      <Section title="National model">
        <Field label="Shipped national family">
          <Select
            value={p.nationalModel}
            onChange={(v) => patch({ nationalModel: v as NationalModel })}
            options={NAT}
          />
        </Field>
        <Field
          label="Mean window"
          value={`${p.meanWindow} m`}
          hint="12-month mean beat everything on the notebook holdout (MAE 2.61)."
        >
          <Range min={1} max={18} value={p.meanWindow} onChange={(v) => patch({ meanWindow: v })} />
        </Field>
        <Field label="EWMA span" value={String(p.ewmaSpan)}>
          <Range min={2} max={18} value={p.ewmaSpan} onChange={(v) => patch({ ewmaSpan: v })} />
        </Field>
        <Field
          label="SES alpha"
          value={p.sesAlpha.toFixed(2)}
          hint="0 = stubborn mean. 1 = last observation only."
        >
          <Range
            min={0.05}
            max={0.95}
            step={0.05}
            value={p.sesAlpha}
            onChange={(v) => patch({ sesAlpha: v })}
          />
        </Field>
      </Section>

      <Section title="Holt–Winters">
        <Toggle checked={p.hwTrend} onChange={(v) => patch({ hwTrend: v })} label="Trend component" />
        <Toggle
          checked={p.hwSeasonal}
          onChange={(v) => patch({ hwSeasonal: v })}
          label="Seasonal component"
        />
        <Toggle checked={p.hwDamped} onChange={(v) => patch({ hwDamped: v })} label="Damped trend" />
        <Toggle
          checked={p.hwAuto}
          onChange={(v) => patch({ hwAuto: v })}
          label="Search α β γ on a back-holdout"
        />
        <Field label="Seasonal period" value={String(p.seasonalPeriod)}>
          <Range
            min={4}
            max={12}
            value={p.seasonalPeriod}
            onChange={(v) => patch({ seasonalPeriod: v })}
          />
        </Field>
        {p.hwDamped && (
          <Field label="Phi (damp)" value={p.hwPhi.toFixed(2)}>
            <Range
              min={0.5}
              max={0.98}
              step={0.02}
              value={p.hwPhi}
              onChange={(v) => patch({ hwPhi: v })}
            />
          </Field>
        )}
        {!p.hwAuto && (
          <>
            <Field label="Alpha (level)" value={p.hwAlpha.toFixed(2)}>
              <Range
                min={0.05}
                max={0.9}
                step={0.05}
                value={p.hwAlpha}
                onChange={(v) => patch({ hwAlpha: v })}
              />
            </Field>
            <Field label="Beta (trend)" value={p.hwBeta.toFixed(2)}>
              <Range
                min={0}
                max={0.8}
                step={0.05}
                value={p.hwBeta}
                onChange={(v) => patch({ hwBeta: v })}
              />
            </Field>
            <Field label="Gamma (season)" value={p.hwGamma.toFixed(2)}>
              <Range
                min={0}
                max={0.8}
                step={0.05}
                value={p.hwGamma}
                onChange={(v) => patch({ hwGamma: v })}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="ARIMA / SARIMA">
        <div className="grid grid-cols-3 gap-2">
          <Pdq label="p" value={p.arimaP} onChange={(v) => patch({ arimaP: v })} />
          <Pdq label="d" value={p.arimaD} onChange={(v) => patch({ arimaD: v })} max={2} />
          <Pdq label="q" value={p.arimaQ} onChange={(v) => patch({ arimaQ: v })} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Seasonal block used only when national model is SARIMA.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Pdq label="P" value={p.sarimaP} onChange={(v) => patch({ sarimaP: v })} max={1} />
          <Pdq label="D" value={p.sarimaD} onChange={(v) => patch({ sarimaD: v })} max={1} />
          <Pdq label="Q" value={p.sarimaQ} onChange={(v) => patch({ sarimaQ: v })} max={1} />
        </div>
      </Section>

      <Section title="Regression (OLS / Ridge)">
        <Field
          label="Ridge λ"
          value={p.ridgeLambda.toFixed(1)}
          hint="0 is OLS. Higher shrinks noisy lags instead of dropping them."
        >
          <Range
            min={0}
            max={20}
            step={0.5}
            value={p.ridgeLambda}
            onChange={(v) => patch({ ridgeLambda: v })}
          />
        </Field>
        <Field
          label="Freeze enrollments on last k months"
          value={String(p.enrollFreezeWindow)}
          hint="Future enrollments are not known at origin. We hold this level."
        >
          <Range
            min={1}
            max={6}
            value={p.enrollFreezeWindow}
            onChange={(v) => patch({ enrollFreezeWindow: v })}
          />
        </Field>
        <Toggle checked={p.useYLag} onChange={(v) => patch({ useYLag: v })} label="Lag sales yₜ₋₁" />
        <Toggle
          checked={p.useEnrollL1}
          onChange={(v) => patch({ useEnrollL1: v })}
          label="Lag enrollments t−1"
        />
        <Toggle
          checked={p.useEnrollL2}
          onChange={(v) => patch({ useEnrollL2: v })}
          label="Lag enrollments t−2"
        />
        <Toggle
          checked={p.useHoliday}
          onChange={(v) => patch({ useHoliday: v })}
          label="Holiday days (known ahead)"
        />
        <Toggle checked={p.useTrend} onChange={(v) => patch({ useTrend: v })} label="Linear time index" />
      </Section>

      <Section title="Site production rule">
        <Field label="Mature / mid sites use">
          <Select
            value={p.matureMethod}
            onChange={(v) => patch({ matureMethod: v as SiteMethod })}
            options={SITE}
          />
        </Field>
        <Field label="Intermittent sites use">
          <Select
            value={p.interMethod}
            onChange={(v) => patch({ interMethod: v as SiteMethod })}
            options={SITE}
          />
        </Field>
        <Field
          label="Blend mean-12 into mature"
          value={`${Math.round(p.blendMean12 * 100)}%`}
          hint="Notebook used 50/50 mean-12 + OLS on mature IDs."
        >
          <Range
            min={0}
            max={1}
            step={0.05}
            value={p.blendMean12}
            onChange={(v) => patch({ blendMean12: v })}
          />
        </Field>
        <Field label="Ensemble weights (6 / 12 / EWMA)">
          <div className="grid grid-cols-3 gap-2">
            <MiniW label="6m" value={p.wMean6} onChange={(v) => patch({ wMean6: v })} />
            <MiniW label="12m" value={p.wMean12} onChange={(v) => patch({ wMean12: v })} />
            <MiniW label="EW" value={p.wEwma} onChange={(v) => patch({ wEwma: v })} />
          </div>
        </Field>
        <Field label="Croston lookback" value={`${p.crostonWindow} m`}>
          <Range
            min={6}
            max={24}
            value={p.crostonWindow}
            onChange={(v) => patch({ crostonWindow: v })}
          />
        </Field>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Tap to move a site between buckets</p>
          <div className="flex flex-wrap gap-1">
            {SITES.map((id) => {
              const on = p.matureIds.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleMature(id)}
                  className={
                    "h-8 rounded-sm px-2 font-mono text-xs " +
                    (on
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground")
                  }
                >
                  {id}
                  {on ? " · M" : " · I"}
                </button>
              );
            })}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Pdq({
  label,
  value,
  onChange,
  max = 3,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <Field label={label} value={String(value)}>
      <Range min={0} max={max} value={value} onChange={onChange} />
    </Field>
  );
}

function MiniW({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} value={value.toFixed(0)}>
      <Range min={0} max={5} step={1} value={value} onChange={onChange} />
    </Field>
  );
}

export type { LabParams };
