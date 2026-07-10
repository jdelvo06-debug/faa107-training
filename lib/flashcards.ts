import type { Flashcard } from "@/lib/types";
import { ACS_TOPIC_WEIGHTS } from "@/lib/acs-weights";

export const flashcards: Flashcard[] = [
  {
    id: "fc-1-ftn",
    moduleId: "1",
    topic: "Operations",
    front: "FTN",
    back: "FAA Tracking Number, obtained through IACRA before scheduling the knowledge test."
  },
  {
    id: "fc-1-uag",
    moduleId: "1",
    topic: "Operations",
    front: "UAG",
    back: "Unmanned Aircraft General - Small, the initial Part 107 knowledge test."
  },
  {
    id: "fc-1-pass",
    moduleId: "1",
    topic: "Operations",
    front: "Part 107 passing score",
    back: "70 percent, or at least 42 correct answers out of 60."
  },
  {
    id: "fc-1-iacra",
    moduleId: "1",
    topic: "Operations",
    front: "IACRA",
    back: "Integrated Airman Certification and Rating Application, used for the certificate application."
  },
  {
    id: "fc-1-laanc",
    moduleId: "1",
    topic: "Airspace",
    front: "LAANC",
    back: "Low Altitude Authorization and Notification Capability for controlled airspace authorization."
  },
  {
    id: "fc-1-vlos",
    moduleId: "1",
    topic: "Operations",
    front: "VLOS",
    back: "Visual line of sight. The aircraft must be visible with unaided vision except corrective lenses."
  },
  {
    id: "fc-2-400",
    moduleId: "2",
    topic: "Regulations",
    front: "Standard altitude limit",
    back: "400 ft AGL, with structure-related allowances when applicable."
  },
  {
    id: "fc-2-speed",
    moduleId: "2",
    topic: "Regulations",
    front: "Standard speed limit",
    back: "100 mph groundspeed."
  },
  {
    id: "fc-2-night",
    moduleId: "2",
    topic: "Regulations",
    front: "Night lighting",
    back: "Anti-collision lighting visible for at least 3 statute miles."
  },
  {
    id: "fc-2-waiver",
    moduleId: "2",
    topic: "Regulations",
    front: "Part 107 waiver",
    back: "FAA approval to deviate from a specific rule limitation with accepted safety mitigations."
  },
  {
    id: "fc-2-remote-id",
    moduleId: "2",
    topic: "Regulations",
    front: "Remote ID",
    back: "Drone identification and location information broadcast while in flight."
  },
  {
    id: "fc-3-classb",
    moduleId: "3",
    topic: "Airspace",
    front: "Class B airspace",
    back: "Controlled airspace around the busiest airports — shaped like an upside-down wedding cake. Authorization always required for Part 107."
  },
  {
    id: "fc-3-classc",
    moduleId: "3",
    topic: "Airspace",
    front: "Class C airspace",
    back: "Two-ring structure around mid-size airports: inner ring 5 NM surface-to-1,200 AGL, outer ring 10 NM 1,200-to-4,000 AGL. Authorization required."
  },
  {
    id: "fc-3-surface-e",
    moduleId: "3",
    topic: "Airspace",
    front: "Surface Class E",
    back: "Class E that starts at the surface — shown with dashed magenta lines. Part 107 authorization required."
  },
  {
    id: "fc-3-classg",
    moduleId: "3",
    topic: "Airspace",
    front: "Class G airspace",
    back: "Uncontrolled airspace. No ATC services, no Part 107 authorization required. Most drone ops happen here."
  },
  {
    id: "fc-3-mtr",
    moduleId: "3",
    topic: "Airspace",
    front: "MTR (Military Training Route)",
    back: "Low-altitude high-speed military training corridor. VR = visual, IR = instrument. 3-digit = narrow (<4 NM). Manned military traffic has priority."
  },
  {
    id: "fc-3-tfr",
    moduleId: "3",
    topic: "Airspace",
    front: "TFR (Temporary Flight Restriction)",
    back: "Temporary airspace restriction for VIP movements, disasters, stadiums, or space launches. Check tfr.faa.gov before every flight. Violations carry serious penalties."
  },
  {
    id: "fc-4-dashed-magenta",
    moduleId: "4",
    topic: "Airspace",
    front: "Dashed magenta line",
    back: "Surface Class E airspace boundary. Part 107 authorization is required."
  },
  {
    id: "fc-4-dashed-blue",
    moduleId: "4",
    topic: "Airspace",
    front: "Dashed blue line",
    back: "Class D surface boundary around a towered airport. Authorization required while active."
  },
  {
    id: "fc-4-shelf-label",
    moduleId: "4",
    topic: "Airspace",
    front: "Class B/C shelf label 100/40",
    back: "Ceiling 10,000 ft MSL, floor 4,000 ft MSL. Shelf labels are normally hundreds of feet MSL."
  },
  {
    id: "fc-4-mef",
    moduleId: "4",
    topic: "Airspace",
    front: "MEF",
    back: "Maximum Elevation Figure — highest terrain or obstacle in a chart quadrangle, rounded up for safety, shown in hundreds of feet MSL."
  },
  {
    id: "fc-4-obstacle-label",
    moduleId: "4",
    topic: "Airspace",
    front: "Obstacle label 1549 (309)",
    back: "Top elevation is 1,549 ft MSL. Height above ground is 309 ft AGL."
  },
  {
    id: "fc-4-airport-color",
    moduleId: "4",
    topic: "Airspace",
    front: "Airport symbol colors",
    back: "Blue generally means towered airport. Magenta generally means non-towered airport. Always still check surrounding airspace."
  },
  {
    id: "fc-5-ctaf",
    moduleId: "5",
    topic: "Operations",
    front: "CTAF",
    back: "Common Traffic Advisory Frequency — used by pilots to self-announce position and intentions at non-towered airports."
  },
  {
    id: "fc-5-unicom",
    moduleId: "5",
    topic: "Operations",
    front: "UNICOM",
    back: "Universal Communications — frequency used to reach ground-based airport services like fuel, parking, and FBO. Often shares the CTAF frequency."
  },
  {
    id: "fc-5-traffic-pattern",
    moduleId: "5",
    topic: "Operations",
    front: "Standard traffic pattern legs",
    back: "Upwind → Crosswind → Downwind → Base → Final. Standard pattern uses left turns. RP on sectional = non-standard right pattern."
  },
  {
    id: "fc-5-beacon-civilian",
    moduleId: "5",
    topic: "Operations",
    front: "Civilian airport beacon",
    back: "Alternating white/green flashing. Indicates a civilian land airport. Military beacons add a second white flash (white/green/white)."
  },
  {
    id: "fc-5-multicom",
    moduleId: "5",
    topic: "Operations",
    front: "MULTICOM",
    back: "122.9 MHz — the fallback frequency for airports without a published CTAF or UNICOM."
  },
  {
    id: "fc-5-papi",
    moduleId: "5",
    topic: "Operations",
    front: "PAPI / VASI",
    back: "Visual glide slope indicators. Red and white light patterns tell pilots if they are high, low, or on the correct approach path."
  },
  {
    id: "fc-6-metar",
    moduleId: "6",
    topic: "Weather",
    front: "METAR",
    back: "Aviation routine weather report — updated hourly. Includes wind, visibility, clouds, temperature, dew point, and altimeter."
  },
  {
    id: "fc-6-taf",
    moduleId: "6",
    topic: "Weather",
    front: "TAF",
    back: "Terminal Aerodrome Forecast — 24-30 hour airport-specific forecast. FM = abrupt change, BECMG = gradual, TEMPO = temporary, PROB30 = 30% probability."
  },
  {
    id: "fc-6-density-altitude",
    moduleId: "6",
    topic: "Weather",
    front: "Density altitude formula",
    back: "Hot + high + humid = worst density altitude. All three reduce air density, which reduces propeller thrust, motor efficiency, and endurance."
  },
  {
    id: "fc-6-visibility-min",
    moduleId: "6",
    topic: "Weather",
    front: "Part 107 visibility minimum",
    back: "At least 3 statute miles from the control station. Must terminate flight if visibility drops below this."
  },
  {
    id: "fc-6-thunderstorm-stages",
    moduleId: "6",
    topic: "Weather",
    front: "Thunderstorm lifecycle",
    back: "Cumulus (building — updrafts) → Mature (most dangerous — updrafts + downdrafts + hail + lightning) → Dissipating (downdrafts, still turbulent)."
  },
  {
    id: "fc-6-fog-types",
    moduleId: "6",
    topic: "Weather",
    front: "Four fog types",
    back: "Radiation (clear night cooling), Advection (warm moist air over cold surface), Upslope (air forced up terrain), Steam (cold air over warm water)."
  },
  {
    id: "fc-7-rth",
    moduleId: "7",
    topic: "Operations",
    front: "RTH altitude setting",
    back: "Must be set above all known obstacles in the flight path before takeoff. If set too low, the aircraft WILL collide with obstacles during return."
  },
  {
    id: "fc-7-battery-storage",
    moduleId: "7",
    topic: "Operations",
    front: "LiPo battery storage",
    back: "Store at 3.8V per cell (storage voltage), not fully charged. Let batteries cool before charging. Transport in fireproof LiPo bags."
  },
  {
    id: "fc-7-lost-link",
    moduleId: "7",
    topic: "Operations",
    front: "Lost link procedure",
    back: "Aircraft executes pre-programmed RTH. Pilot should verify RTH altitude is set correctly before every flight. Re-link possible when signal returns."
  },
  {
    id: "fc-7-emergency-priority",
    moduleId: "7",
    topic: "Operations",
    front: "Emergency priority order",
    back: "1 — Protect people on the ground. 2 — Protect other aircraft. 3 — Protect property. Memorize this."
  },
  {
    id: "fc-7-flight-modes",
    moduleId: "7",
    topic: "Operations",
    front: "Flight modes (GPS vs ATTI)",
    back: "GPS: position hold, stable. ATTI: no GPS hold — altitude only, aircraft drifts with wind. Practice ATTI before you need it in a GPS failure."
  },
  {
    id: "fc-7-tailwind-risk",
    moduleId: "7",
    topic: "Operations",
    front: "Tailwind outbound risk",
    back: "Fast outbound = slow return against headwind. Plan return at 30-40% battery, not halfway. You may not have enough battery to get back."
  },
  {
    id: "fc-8-decide",
    moduleId: "8",
    topic: "Operations",
    front: "DECIDE model",
    back: "Detect → Estimate → Choose → Identify → Do → Evaluate. Six-step decision process for recognizing and responding to changes."
  },
  {
    id: "fc-8-pave",
    moduleId: "8",
    topic: "Operations",
    front: "PAVE checklist",
    back: "Pilot, Aircraft, enVironment, External pressures. Preflight risk assessment — run it before every flight."
  },
  {
    id: "fc-8-hazardous-5",
    moduleId: "8",
    topic: "Operations",
    front: "Five hazardous attitudes",
    back: "Anti-authority, Impulsivity, Invulnerability, Macho, Resignation. Each has an antidote. Most tested: Macho and Invulnerability."
  },
  {
    id: "fc-8-imsafe",
    moduleId: "8",
    topic: "Operations",
    front: "IMSAFE",
    back: "Illness, Medication, Stress, Alcohol (8+ hours), Fatigue, Emotion. Pilot fitness check. Any factor compromised = do not fly."
  },
  {
    id: "fc-8-anti-authority",
    moduleId: "8",
    topic: "Operations",
    front: "Anti-authority antidote",
    back: "Attitude: 'The rules don't apply to me.' Antidote: 'Follow the rules. They are usually right.'"
  },
  {
    id: "fc-8-invulnerability",
    moduleId: "8",
    topic: "Operations",
    front: "Invulnerability antidote",
    back: "Attitude: 'It won't happen to me.' Antidote: 'It could happen to me.'"
  },
  {
    id: "fc-9-alcohol-8hr",
    moduleId: "9",
    topic: "Operations",
    front: "Part 107 alcohol rule",
    back: "No alcohol within 8 hours before flight. No operation while under the influence, while using a drug that affects faculties contrary to safety, or with an alcohol concentration of 0.04 or greater in blood or breath."
  },
  {
    id: "fc-9-empty-myopia",
    moduleId: "9",
    topic: "Operations",
    front: "Empty-field myopia",
    back: "In featureless sky/water, eyes focus 10-30 ft ahead by default. Distant traffic becomes invisible. Scan deliberately to overcome this."
  },
  {
    id: "fc-9-hypoxia-types",
    moduleId: "9",
    topic: "Operations",
    front: "Four hypoxia types",
    back: "Hypoxic (altitude), Hypemic (CO poisoning), Stagnant (restricted blood flow), Histotoxic (alcohol/drugs). Drone pilots: hypemic from engine exhaust is the most practical threat."
  },
  {
    id: "fc-9-autokinesis",
    moduleId: "9",
    topic: "Operations",
    front: "Autokinesis",
    back: "Night illusion — a stationary light appears to move against a dark background. Most common night visual illusion."
  },
  {
    id: "fc-9-fatigue-cure",
    moduleId: "9",
    topic: "Operations",
    front: "The only cure for fatigue",
    back: "Rest. Not caffeine. Not cold air. Not determination. Fatigue impairs judgment like alcohol. If tired, do not fly."
  },
  {
    id: "fc-10-condition-safe",
    moduleId: "10",
    topic: "Operations",
    front: "Condition for safe operation",
    back: "Part 107 requirement: the remote PIC must determine the aircraft is safe to fly before every operation. Cannot be delegated."
  },
  {
    id: "fc-10-prop-replace",
    moduleId: "10",
    topic: "Operations",
    front: "Damaged propeller rule",
    back: "Replace, do not repair. Chips, cracks, deformation = immediate replacement. Propellers are cheap; crashes are not."
  },
  {
    id: "fc-10-firmware-test",
    moduleId: "10",
    topic: "Operations",
    front: "Firmware update timing",
    back: "Never update immediately before a commercial job. Updates can reset RTH altitude and other critical settings. Test first."
  },
  {
    id: "fc-10-postflight",
    moduleId: "10",
    topic: "Operations",
    front: "Post-flight steps",
    back: "Visual inspection, battery check, data offload, firmware behavior notes, proper storage. Post-flight IS the next preflight."
  },
  {
    id: "fc-10-wear-items",
    moduleId: "10",
    topic: "Operations",
    front: "Wear items to inspect",
    back: "Prop hubs, motor bearings, battery connectors, gimbal dampeners, arm pivots, landing gear mounts. Replace on a schedule, not just after failure."
  },
  {
    id: "fc-11-passing-score",
    moduleId: "11",
    topic: "Operations",
    front: "Part 107 passing score",
    back: "70% — 42 correct answers out of 60 questions. Train to 85%+ on practice exams."
  },
  {
    id: "fc-11-three-pass",
    moduleId: "11",
    topic: "Operations",
    front: "Three-pass exam strategy",
    back: "Pass 1: answer easy, skip hard. Pass 2: flagged questions — eliminate wrong answers. Pass 3: review all answers, check units/traps."
  },
  {
    id: "fc-11-topic-weight",
    moduleId: "11",
    topic: "Operations",
    front: "Exam topic weighting",
    back: `Current ACS ranges: Regulations ${ACS_TOPIC_WEIGHTS.regulations}, Airspace & Requirements ${ACS_TOPIC_WEIGHTS.airspace}, Weather ${ACS_TOPIC_WEIGHTS.weather}, Loading & Performance ${ACS_TOPIC_WEIGHTS.loadingPerformance}, Operations ${ACS_TOPIC_WEIGHTS.operations}.`
  },
  {
    id: "fc-11-exam-traps",
    moduleId: "11",
    topic: "Operations",
    front: "Common exam traps",
    back: "Unit confusion (SM vs NM, AGL vs MSL), NOT questions, nearly-correct distractors, weather code tricks, airspace boundary mix-ups."
  }
];

export function getFlashcardsForModule(moduleId: string) {
  return flashcards.filter((card) => card.moduleId === moduleId);
}
