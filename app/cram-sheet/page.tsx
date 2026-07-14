import type { Metadata } from "next";
import styles from "@/components/modern-flight-school.module.css";
import {
  CRAM_ACS_ROWS,
  CRAM_AIRPORT_SYMBOL_COLORS,
  CRAM_AIRSPACE_ROWS,
  CRAM_OPERATING_LIMITS,
  CRAM_OPERATIONS_OVER_PEOPLE,
  CRAM_TEST_FORMAT,
  CRAM_WEATHER_MINIMUMS,
} from "@/lib/cram-sheet-data";
import { OFFICIAL_REGULATORY_SOURCES } from "@/lib/regulatory-sources";

export const metadata: Metadata = {
  title: "FAA Part 107 Cram Sheet",
  description: "Review a concise FAA Part 107 knowledge test reference covering rules, airspace, weather, and operations.",
};

export default function CramSheetPage() {
  return (
    <div className={`${styles.coursePage} print:bg-white print:text-black mx-auto max-w-4xl grid gap-8 print:gap-4 px-4 sm:px-0`}>
      <div className="print:hidden">
        <h1 className="text-4xl font-bold tracking-normal">Part 107 Cram Sheet</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          One-page quick reference. Press Ctrl+P / Cmd+P to print.
        </p>
      </div>

      {/* Header — visible on print only */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold">FAA Part 107 — Cram Sheet</h1>
        <p className="text-sm text-gray-600">Quick reference for the UAG Knowledge Test</p>
      </div>

      {/* SECTION 1 — Part 107 Operating Limits */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          Part 107 Operating Limits
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {CRAM_OPERATING_LIMITS.map(({ id, label, value }) => (
            <div key={id}>
              <span className="font-semibold">{label}:</span>{" "}
              <span className="text-muted-foreground print:text-gray-700">{value}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-sm mt-5 mb-2">Operations Over People — Category Snapshot</h3>
        <div className="grid gap-2 text-xs">
          {CRAM_OPERATIONS_OVER_PEOPLE.map(({ id, category, rule }) => (
            <div key={id}>
              <span className="font-semibold">{category}:</span>{" "}
              <span className="text-muted-foreground print:text-gray-700">{rule}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground print:text-gray-700">
          Source: <a className="underline" href={OFFICIAL_REGULATORY_SOURCES.operationsOverPeople.url}>FAA Operations Over People</a>
        </p>
      </section>

      {/* SECTION 2 — Airspace Quick Reference */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          Airspace Quick Reference
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-0 sm:min-w-[600px] text-sm">
            <div className="hidden sm:grid sm:grid-cols-4 font-bold border-b pb-1 print:border-gray-400">
              <div>Class</div><div>Description</div><div>Chart Color</div><div>Rule</div>
            </div>
            {CRAM_AIRSPACE_ROWS.map(({ className, description, chart, rule }) => (
              <div key={className} className="grid grid-cols-1 sm:grid-cols-4 border-b py-2 sm:py-1.5 print:border-gray-400 gap-1 sm:gap-0">
                <div className="font-bold">{className}</div>
                <div><span className="sm:hidden text-muted-foreground">Description: </span>{description}</div>
                <div><span className="sm:hidden text-muted-foreground">Chart: </span>{chart}</div>
                <div className="font-semibold"><span className="sm:hidden text-muted-foreground">Rule: </span>{rule}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 grid gap-1 text-sm">
          <div><span className="font-semibold">TRSA:</span> Terminal Radar Service Area — optional radar services</div>
          <div><span className="font-semibold">MOA:</span> Military Operations Area — VFR allowed, watch for military</div>
          <div><span className="font-semibold">Restricted:</span> Artillery, bombing — requires permission when active</div>
          <div><span className="font-semibold">Prohibited:</span> No flight ever (White House, Camp David)</div>
          <div><span className="font-semibold">TFR:</span> Check NOTAMs before every flight (tfr.faa.gov)</div>
          <div><span className="font-semibold">5 NM ring:</span> Class C inner ring radius</div>
          <div><span className="font-semibold">Class E floor:</span> 700 ft AGL (shaded magenta), 1,200 ft AGL (shaded blue)</div>
        </div>
      </section>

      {/* SECTION 3 — Weather */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          Weather &amp; Performance
        </h2>

        <h3 className="font-semibold text-sm mb-2">METAR Decode</h3>
        <div className="mb-3 font-mono text-xs bg-muted p-2 rounded print:bg-gray-100 break-words whitespace-pre-wrap">
          METAR KATL 161552Z 31012G18KT 10SM FEW030 BKN050 22/14 A3012 RMK AO2
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground print:text-gray-700 mb-4">
          <div>KATL = station | 161552Z = 16th at 15:52 Zulu | 31012G18KT = wind 310° at 12 kts gusting 18</div>
          <div>10SM = visibility 10 statute miles | FEW030 = few clouds at 3,000 ft | BKN050 = broken at 5,000 ft</div>
          <div>22/14 = temp 22°C / dewpoint 14°C | A3012 = altimeter 30.12 inHg | RMK = remarks | AO2 = automated with precip sensor</div>
        </div>

        <h3 className="font-semibold text-sm mb-2">TAF Decode</h3>
        <div className="mb-3 font-mono text-xs bg-muted p-2 rounded print:bg-gray-100 break-words whitespace-pre-wrap">
          TAF KATL 161720Z 1618/1724 31010KT P6SM SCT040
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground print:text-gray-700 mb-4">
          <div>161720Z = issued 16th at 17:20 Zulu | 1618/1724 = valid 16th 18Z to 17th 24Z</div>
          <div>P6SM = visibility greater than 6 SM | SCT040 = scattered at 4,000 ft</div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {[
            ["Density altitude", "↑ hot/high/humid = ↑ DA = ↓ performance"],
            ["Standard lapse", "2°C per 1,000 ft"],
            ["Inversion", "Temp increases w/ altitude — traps fog/pollution"],
            ["Stable air", "Stratus, steady precip, poor vis, smooth ride"],
            ["Unstable air", "Cumulus, showery precip, good vis, rough ride"],
            ["Wind shear", "Sudden change in wind direction/speed — avoid"],
            ["3-1-1 rule", "3 days, 1 hr of fire, 1 hr of flight. LiPo storage charge"],
            ["IMSAFE", "Illness, Medication, Stress, Alcohol, Fatigue, Emotion — preflight self-check"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="font-semibold">{label}:</span>{" "}
              <span className="text-muted-foreground print:text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — ACS & Test Format */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          ACS Test Breakdown
        </h2>
        <div className="overflow-x-auto mb-3">
          <div className="min-w-0 sm:min-w-[500px] text-sm">
            <div className="hidden sm:grid sm:grid-cols-4 font-bold border-b pb-1 print:border-gray-400">
              <div>Area</div><div>Topic</div><div>% of Test</div><div>Est. Questions</div>
            </div>
            {CRAM_ACS_ROWS.map(({ area, topic, weight, estimatedQuestions }) => (
              <div key={area} className="grid grid-cols-1 sm:grid-cols-4 border-b py-2 sm:py-1.5 print:border-gray-400 gap-1 sm:gap-0">
                <div className="font-bold">Area {area}</div>
                <div><span className="sm:hidden text-muted-foreground">Topic: </span>{topic}</div>
                <div><span className="sm:hidden text-muted-foreground">Weight: </span>{weight}</div>
                <div className="font-semibold"><span className="sm:hidden text-muted-foreground">Questions: </span>{estimatedQuestions}</div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-2">Test Format</h3>
        <div className="grid gap-1 text-sm">
          {CRAM_TEST_FORMAT.map(({ id, label, value }) => (
            <div key={id}><span className="font-semibold">{label}:</span> {value}</div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground print:text-gray-700">
          Source: <a className="underline" href={OFFICIAL_REGULATORY_SOURCES.uasAcs.url}>FAA-S-ACS-10B</a>
        </p>
      </section>

      {/* SECTION 5 — Cloud Clearance & Chart Symbols */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          Cloud Clearance &amp; Visibility
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {CRAM_WEATHER_MINIMUMS.map(({ id, label, value }) => (
            <div key={id}>
              <span className="font-semibold">{label}:</span> {value}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground print:text-gray-700">
          Source: <a className="underline" href={OFFICIAL_REGULATORY_SOURCES.operatingLimitations.url}>14 CFR § 107.51</a>
        </p>

        <h3 className="font-semibold text-sm mt-4 mb-2">Chart Symbols to Know</h3>
        <div className="grid gap-1 text-sm">
          <div><span className="font-semibold">MEF:</span> Maximum Elevation Figure — bold blue number, 100s of ft MSL, includes 100-200 ft margin</div>
          <div><span className="font-semibold">{CRAM_AIRPORT_SYMBOL_COLORS.label}:</span> {CRAM_AIRPORT_SYMBOL_COLORS.value}</div>
          <div><span className="font-semibold">Obstacle:</span> Man-made &gt; 200 ft AGL. Triangle = &lt;1,000 ft AGL. Taller = taller symbol</div>
          <div><span className="font-semibold">Isogonic line:</span> Dashed magenta — shows magnetic variation</div>
          <div><span className="font-semibold">Victor airway:</span> V-####, 8 nm wide, 1,200 ft AGL to FL180</div>
          <div><span className="font-semibold">AWOS/ASOS:</span> Circle with frequency — automated weather at airport</div>
        </div>
      </section>

      {/* Print footer */}
      <div className="hidden print:block border-t border-black pt-3 text-xs text-gray-600">
        Generated from the free FAA Part 107 Training Platform. Public domain — no copyright.
      </div>
    </div>
  );
}
