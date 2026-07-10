import { CheckCircle, Clock, BookOpen } from "lucide-react";

const modules = [
  { num: 1, title: "Welcome & Getting Started" },
  { num: 2, title: "FAA Regulations (Part 107 Rules)" },
  { num: 3, title: "National Airspace System" },
  { num: 4, title: "Reading Sectional Charts" },
  { num: 5, title: "Airport Operations" },
  { num: 6, title: "Weather & Micrometeorology" },
  { num: 7, title: "Drone Flight Operations" },
  { num: 8, title: "Aeronautical Decision-Making & CRM" },
  { num: 9, title: "Physiology" },
  { num: 10, title: "Maintenance & Preflight Inspection" },
  { num: 11, title: "Practice Exams" },
  { num: 12, title: "Practical Flight Skills" },
  { num: 13, title: "Industry Pathways & Careers" },
];

const sevenDayPlan = [
  {
    day: 1,
    title: "Rules & Regulations",
    modules: [1, 2],
    focus: "Part 107 operating limits, registration, night ops, over people, accident reporting, Remote ID, waivers.",
    tip: "These are the most-tested topics. Memorize the numbers: 400 ft, 100 mph, 55 lbs, 8 hours, 10 days.",
  },
  {
    day: 2,
    title: "Airspace Deep Dive",
    modules: [3],
    focus: "Classes B through G, special use airspace, TFRs, NOTAMs, airspace authorization via LAANC.",
    tip: "Draw the airspace pyramid from memory. Keep Part 107's 3 SM visibility and cloud-clearance baseline separate from manned-aircraft VFR minima.",
  },
  {
    day: 3,
    title: "Chart Reading Marathon",
    modules: [4],
    focus: "Lat/long, airport symbols, airspace boundaries, MEFs, isogonic lines, obstacles, Victor airways.",
    tip: "Open a real sectional chart side by side. Practice finding every symbol.",
  },
  {
    day: 4,
    title: "Airports & Weather",
    modules: [5, 6],
    focus: "Airport ops (CTAF, UNICOM, traffic patterns), METAR/TAF decode, density altitude, weather products.",
    tip: "Decode 5 real METARs and 5 TAFs from AviationWeather.gov. It clicks fast.",
  },
  {
    day: 5,
    title: "Operations & Decision-Making",
    modules: [7, 8],
    focus: "Preflight, emergency procedures, lost link, LiPo safety, ADM models (DECIDE, PAVE, IMSAFE), hazardous attitudes.",
    tip: "Focus on the 5 hazardous attitudes — guaranteed exam material.",
  },
  {
    day: 6,
    title: "Physiology, Maintenance & Practice",
    modules: [9, 10, 11],
    focus: "Hypoxia, CO poisoning, vision, alcohol effects, preflight inspection, maintenance, full practice exam.",
    tip: "Take the full 60-question practice exam under timed conditions. Flag weak areas.",
  },
  {
    day: 7,
    title: "Review & Cram",
    modules: [12, 13],
    focus: "Review cram sheet, retake practice exam, drill weak areas, review flagged questions.",
    tip: "Get a full night's sleep. The test is 2 hours — you've got this.",
  },
];

const fourteenDayPlan = [
  { day: 1, title: "Welcome & Regulations", modules: [1, 2], focus: "Course overview, Part 107 operating limits, registration, Remote ID." },
  { day: 2, title: "Regulations (continued)", modules: [2], focus: "Night ops, op over people, waivers, LAANC, accident reporting. Quiz module 2." },
  { day: 3, title: "Airspace Classes", modules: [3], focus: "Class B, C, D — characteristics, chart depiction, authorization requirements." },
  { day: 4, title: "Airspace (continued)", modules: [3], focus: "Class E, G, special use (MOA, Restricted, Prohibited), TFRs, NOTAMs. Quiz module 3." },
  { day: 5, title: "Charts — Basics", modules: [4], focus: "Lat/long, chart legend, airport symbols, airspace boundaries on charts." },
  { day: 6, title: "Charts — Advanced", modules: [4], focus: "MEFs, isogonic lines, obstacles, Victor airways, MSL vs AGL. Quiz module 4." },
  { day: 7, title: "Airport Operations", modules: [5], focus: "Towered vs non-towered, CTAF/UNICOM, traffic patterns, runway markings. Quiz module 5." },
  { day: 8, title: "Weather Fundamentals", modules: [6], focus: "Standard atmosphere, density altitude, wind, clouds, stable/unstable air." },
  { day: 9, title: "METARs, TAFs & Briefings", modules: [6], focus: "Full METAR/TAF decode with real examples. Weather briefings. Quiz module 6." },
  { day: 10, title: "Flight Operations", modules: [7], focus: "Preflight, performance, emergency, lost link, LiPo safety. Quiz module 7." },
  { day: 11, title: "ADM & CRM", modules: [8], focus: "DECIDE, PAVE, IMSAFE, hazardous attitudes, CRM. Quiz module 8." },
  { day: 12, title: "Physiology & Maintenance", modules: [9, 10], focus: "Hypoxia, CO, vision, drugs/alcohol, preflight inspection, battery care." },
  { day: 13, title: "Practice Exam & Review", modules: [11], focus: "Full 60-question timed exam, review weak areas, drill flashcards." },
  { day: 14, title: "Final Review & Career Pathways", modules: [12, 13], focus: "Cram sheet review, retake exam, explore industry careers. Rest before test day." },
];

export default function StudyPlanPage() {
  return (
    <div className="mx-auto max-w-4xl grid gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-normal">Study Plan</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Structured day-by-day roadmaps to keep you on track. Pick the pace that fits your schedule.
        </p>
      </div>

      {/* 7-Day Cram Track */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">7-Day Cram Track</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          For experienced operators or anyone with a tight deadline. Plan on 3–4 hours per day. Every day covers tested ACS material.
        </p>
        <div className="grid gap-4">
          {sevenDayPlan.map((day) => (
            <div key={day.day} className="grid gap-2 rounded-lg border bg-muted/30 p-4 sm:grid-cols-[auto_1fr]">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shrink-0">
                {day.day}
              </div>
              <div>
                <h3 className="font-bold">{day.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{day.focus}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {day.modules.map((m) => (
                    <a
                      key={m}
                      href={`/modules/module-${m}`}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      M{m}: {modules[m - 1].title}
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-xs text-primary font-medium">
                  💡 {day.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 14-Day Standard Track */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">14-Day Standard Track</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Steady pace for first-time learners. Plan on 1.5–2 hours per day. Includes quiz days to reinforce.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {fourteenDayPlan.map((day) => (
            <div key={day.day} className="flex gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0 mt-0.5">
                {day.day}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{day.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{day.focus}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {day.modules.map((m) => (
                    <a
                      key={m}
                      href={`/modules/module-${m}`}
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium hover:bg-accent transition-colors"
                    >
                      M{m}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-bold mb-3">Study Tips</h2>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• Take the practice exam <span className="font-semibold text-foreground">every other day</span> — it&apos;s the fastest way to find weak spots.</li>
          <li>• Use flashcards for <span className="font-semibold text-foreground">5-minute bursts</span> — waiting in line, coffee break, etc.</li>
          <li>• Print the <a href="/cram-sheet" className="underline hover:text-primary">cram sheet</a> and keep it on your desk.</li>
          <li>• Decode <span className="font-semibold text-foreground">real METARs</span> at AviationWeather.gov — it sticks better than theory.</li>
          <li>• Open a <span className="font-semibold text-foreground">live sectional chart</span> (SkyVector.com) while studying Module 4.</li>
          <li>• The official FAA study guide is free — use it as backup reference.</li>
          <li>• Sleep matters. Your brain consolidates what you studied during sleep.</li>
          <li>• The test is 60 questions in 120 minutes — that&apos;s 2 minutes per question. Don&apos;t rush.</li>
        </ul>
      </section>
    </div>
  );
}
