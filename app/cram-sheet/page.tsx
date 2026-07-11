import { ACS_TOPIC_WEIGHTS } from "@/lib/acs-weights";

export default function CramSheetPage() {
  return (
    <div className="print:bg-white print:text-black mx-auto max-w-4xl grid gap-8 print:gap-4 px-4 sm:px-0">
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
          {[
            ["Max altitude", "400 ft AGL (or within 400 ft of structure)"],
            ["Max speed", "100 mph (87 knots)"],
            ["VLOS", "Must maintain visual line of sight"],
            ["Right of way", "Yield to all manned aircraft"],
            ["Alcohol", "No use within 8 hours; no operation while under the influence; concentration must remain below 0.04"],
            ["Drugs", "No drug that affects faculties contrary to safety"],
            ["Max weight", "55 lbs (including payload)"],
            ["Registration", "All drones operated under Part 107 must be registered"],
            ["Night ops", "Anti-collision light visible 3 SM"],
            ["Accident report", "Within 10 days — serious injury or $500+ damage"],
            ["Remote ID", "Required for most operations"],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="font-semibold">{label}:</span>{" "}
              <span className="text-muted-foreground print:text-gray-700">{value}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-sm mt-5 mb-2">Operations Over People — Category Snapshot</h3>
        <div className="grid gap-2 text-xs">
          {[
            ["Category 1", "0.55 lb or less including attachments; no exposed rotating parts that would lacerate skin. Sustained flight over open-air assemblies requires Remote ID compliance."],
            ["Category 2", "Aircraft is listed on an FAA-accepted declaration of compliance, has a Category 2 label and operating instructions, and meets the performance standard. Sustained flight over open-air assemblies requires Remote ID compliance."],
            ["Category 3", "Aircraft is listed on an FAA-accepted declaration of compliance, has a Category 3 label and operating instructions; it must not cause injury at or above 25 foot-pounds of kinetic energy on impact, have exposed rotating parts that could lacerate skin, or have a safety defect or condition that creates an undue hazard. No open-air assemblies; closed/restricted-site notice or no sustained flight over unprotected nonparticipants."],
            ["Category 4", "Part 21 airworthiness certificate; follow approved operating limitations and maintenance requirements. Sustained flight over open-air assemblies requires Remote ID compliance."],
          ].map(([category, rule]) => (
            <div key={category}>
              <span className="font-semibold">{category}:</span>{" "}
              <span className="text-muted-foreground print:text-gray-700">{rule}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground print:text-gray-700">
          Source: <a className="underline" href="https://www.faa.gov/uas/commercial_operators/operations_over_people">FAA Operations Over People</a>
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
            {[
              ["B", "Busy (30+ NM)", "Solid blue", "Clearance (ATC)"],
              ["C", "Moderate (10 NM radius)", "Solid magenta", "Authorization (LAANC)"],
              ["D", "Towered (4 NM radius)", "Dashed blue", "Authorization (LAANC)"],
              ["E", "Controlled (not B/C/D)", "Dashed magenta / fuzzy blue", "None below floor unless surface"],
              ["G", "Uncontrolled", "Not depicted", "None"],
            ].map(([cls, desc, chart, rule]) => (
              <div key={cls} className="grid grid-cols-1 sm:grid-cols-4 border-b py-2 sm:py-1.5 print:border-gray-400 gap-1 sm:gap-0">
                <div className="font-bold">Class {cls}</div>
                <div><span className="sm:hidden text-muted-foreground">Description: </span>{desc}</div>
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
          <div><span className="font-semibold">Class G floor:</span> 700 ft AGL (magenta vignette), 1,200 ft AGL (blue vignette)</div>
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
            {[
              ["I", "Regulations", ACS_TOPIC_WEIGHTS.regulations, "9-15"],
              ["II", "Airspace & Operating Requirements", ACS_TOPIC_WEIGHTS.airspace, "9-15"],
              ["III", "Weather", ACS_TOPIC_WEIGHTS.weather, "7-10"],
              ["IV", "Loading & Performance", ACS_TOPIC_WEIGHTS.loadingPerformance, "4-7"],
              ["V", "Operations", ACS_TOPIC_WEIGHTS.operations, "21-27"],
            ].map(([area, topic, pct, qs]) => (
              <div key={area} className="grid grid-cols-1 sm:grid-cols-4 border-b py-2 sm:py-1.5 print:border-gray-400 gap-1 sm:gap-0">
                <div className="font-bold">Area {area}</div>
                <div><span className="sm:hidden text-muted-foreground">Topic: </span>{topic}</div>
                <div><span className="sm:hidden text-muted-foreground">Weight: </span>{pct}</div>
                <div className="font-semibold"><span className="sm:hidden text-muted-foreground">Questions: </span>{qs}</div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-2">Test Format</h3>
        <div className="grid gap-1 text-sm">
          <div><span className="font-semibold">Questions:</span> 60 multiple choice (3 choices each)</div>
          <div><span className="font-semibold">Time:</span> 120 minutes (2 hours)</div>
          <div><span className="font-semibold">Passing:</span> 70% (42/60 correct)</div>
          <div><span className="font-semibold">Test code:</span> UAG — Unmanned Aircraft General — Small</div>
          <div><span className="font-semibold">Renewal:</span> Every 24 calendar months (free online ALC-677)</div>
          <div><span className="font-semibold">Min age:</span> 16 years old | English proficiency required</div>
        </div>
      </section>

      {/* SECTION 5 — Cloud Clearance & Chart Symbols */}
      <section className="rounded-xl border bg-card p-6 print:border-black print:bg-white print:p-2">
        <h2 className="text-lg font-bold mb-3 text-primary print:text-black print:text-base">
          Cloud Clearance &amp; Visibility
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <span className="font-semibold">Part 107 minimum visibility:</span> 3 SM from the control station
          </div>
          <div>
            <span className="font-semibold">Part 107 cloud distance:</span> At least 500 ft below and 2,000 ft horizontally
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground print:text-gray-700">
          Source: <a className="underline" href="https://www.ecfr.gov/current/title-14/part-107/section-107.51">14 CFR § 107.51</a>
        </p>

        <h3 className="font-semibold text-sm mt-4 mb-2">Chart Symbols to Know</h3>
        <div className="grid gap-1 text-sm">
          <div><span className="font-semibold">MEF:</span> Maximum Elevation Figure — bold blue number, 100s of ft MSL, includes 100-200 ft margin</div>
          <div><span className="font-semibold">Airport (blue):</span> Towered, IFR approach. <span className="font-semibold">Airport (magenta):</span> Non-towered, no IFR</div>
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
