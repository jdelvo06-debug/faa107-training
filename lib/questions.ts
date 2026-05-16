import type { QuizQuestion } from "@/lib/types";

export const moduleQuestions: QuizQuestion[] = [
  {
    id: "m1-q1",
    moduleId: "1",
    topic: "Operations",
    prompt: "What is the minimum age to be eligible for a Remote Pilot Certificate under Part 107?",
    choices: ["14 years old", "16 years old", "18 years old", "21 years old"],
    correctIndex: 1,
    explanation: "First-time remote pilots must be at least 16 years old."
  },
  {
    id: "m1-q2",
    moduleId: "1",
    topic: "Operations",
    prompt: "What is the FAA knowledge test code for the initial Part 107 exam?",
    choices: ["PAR", "UAG", "IRA", "CAX"],
    correctIndex: 1,
    explanation: "The initial exam is Unmanned Aircraft General - Small, commonly identified as UAG."
  },
  {
    id: "m1-q3",
    moduleId: "1",
    topic: "Operations",
    prompt: "How many questions are on the initial Part 107 knowledge test?",
    choices: ["40", "50", "60", "80"],
    correctIndex: 2,
    explanation: "The initial knowledge test has 60 multiple-choice questions."
  },
  {
    id: "m1-q4",
    moduleId: "1",
    topic: "Operations",
    prompt: "What score is required to pass the initial Part 107 knowledge test?",
    choices: ["60 percent", "70 percent", "75 percent", "80 percent"],
    correctIndex: 1,
    explanation: "A passing score is 70 percent, which is 42 correct answers out of 60."
  },
  {
    id: "m1-q5",
    moduleId: "1",
    topic: "Operations",
    prompt: "What should a first-time applicant obtain before scheduling the knowledge test?",
    choices: ["A COA", "A TRUST certificate", "An FAA Tracking Number", "A medical certificate"],
    correctIndex: 2,
    explanation: "The applicant creates an IACRA profile and obtains an FAA Tracking Number before registering for the test."
  },
  {
    id: "m1-q6",
    moduleId: "1",
    topic: "Operations",
    prompt: "What does LAANC help Part 107 pilots obtain?",
    choices: ["Aircraft registration", "Controlled airspace authorization", "A recurrent test score", "Insurance coverage"],
    correctIndex: 1,
    explanation: "LAANC supports near real-time FAA authorization for eligible operations in controlled airspace."
  },
  {
    id: "m2-q1",
    moduleId: "2",
    topic: "Regulations",
    prompt: "What is the maximum small UAS weight under Part 107?",
    choices: ["Under 25 pounds", "Under 55 pounds", "Under 75 pounds", "Under 100 pounds"],
    correctIndex: 1,
    explanation: "Part 107 small UAS operations are for unmanned aircraft weighing less than 55 pounds."
  },
  {
    id: "m2-q2",
    moduleId: "2",
    topic: "Regulations",
    prompt: "What is the standard maximum groundspeed under Part 107?",
    choices: ["60 mph", "87 mph", "100 mph", "120 mph"],
    correctIndex: 2,
    explanation: "The standard operating limitation is 100 mph groundspeed."
  },
  {
    id: "m2-q3",
    moduleId: "2",
    topic: "Regulations",
    prompt: "What is the standard maximum altitude for most Part 107 operations?",
    choices: ["200 ft AGL", "300 ft AGL", "400 ft AGL", "1,200 ft AGL"],
    correctIndex: 2,
    explanation: "The standard limit is 400 ft AGL, with a structure-related allowance when applicable."
  },
  {
    id: "m2-q4",
    moduleId: "2",
    topic: "Regulations",
    prompt: "Who has right of way over a small UAS?",
    choices: ["Only emergency aircraft", "Only aircraft in controlled airspace", "All manned aircraft", "Only aircraft on final approach"],
    correctIndex: 2,
    explanation: "Small UAS must yield right of way to all manned aircraft."
  },
  {
    id: "m2-q5",
    moduleId: "2",
    topic: "Regulations",
    prompt: "What equipment is required for routine Part 107 night operations?",
    choices: ["Landing gear lights visible for 1 mile", "Anti-collision lighting visible for at least 3 statute miles", "A Mode C transponder", "A visual observer with night vision goggles"],
    correctIndex: 1,
    explanation: "Night operations require anti-collision lighting visible for at least 3 statute miles, with an adequate flash rate."
  },
  {
    id: "m2-q6",
    moduleId: "2",
    topic: "Regulations",
    prompt: "Within how many days must qualifying Part 107 accidents be reported to the FAA?",
    choices: ["3 days", "5 days", "10 days", "30 days"],
    correctIndex: 2,
    explanation: "Qualifying accidents must be reported within 10 days."
  },
  {
    id: "m2-q7",
    moduleId: "2",
    topic: "Regulations",
    prompt: "What is a Part 107 waiver used for?",
    choices: ["Replacing aircraft registration", "Approving a specific operation outside a listed rule limitation", "Skipping recurrent training", "Registering a recreational drone"],
    correctIndex: 1,
    explanation: "A waiver allows a specific operation outside certain Part 107 limits when the FAA accepts the safety case."
  },
  {
    id: "m2-q8",
    moduleId: "2",
    topic: "Airspace",
    prompt: "Which airspace types require authorization before Part 107 operations?",
    choices: ["Only Class G", "Class B, C, D, and surface Class E", "Only restricted areas", "Only MOAs"],
    correctIndex: 1,
    explanation: "Part 107 pilots need authorization for Class B, C, D, and surface Class E controlled airspace."
  },
  {
    id: "m3-q1",
    moduleId: "3",
    topic: "Airspace",
    prompt: "Which airspace classes require Part 107 authorization before flight?",
    choices: ["Only Class A", "Class B, C, D, and surface Class E", "Only Class G and E", "Class A, B, C, and D"],
    correctIndex: 1,
    explanation: "Part 107 requires authorization for Class B, C, D, and surface Class E. Class G and Class E above 700 ft do not require authorization."
  },
  {
    id: "m3-q2",
    moduleId: "3",
    topic: "Airspace",
    prompt: "What happens to Class D airspace when the control tower closes for the night?",
    choices: ["It becomes Class A", "It disappears entirely", "It typically reverts to Class E or G", "It becomes restricted airspace"],
    correctIndex: 2,
    explanation: "Class D airspace only exists when the tower is operating. When the tower closes, the airspace typically reverts to Class E or G — check the chart supplement for which applies."
  },
  {
    id: "m3-q3",
    moduleId: "3",
    topic: "Airspace",
    prompt: "What distinguishes a Prohibited Area from a Restricted Area?",
    choices: ["Restricted is over water, Prohibited is over land", "Prohibited means flight is never permitted; Restricted means permission may be possible", "There is no practical difference", "Prohibited only applies to commercial flights"],
    correctIndex: 1,
    explanation: "Prohibited Areas: flight is not permitted for security or national welfare reasons. Restricted Areas: hazardous activities occur, but permission to enter may be granted."
  },
  {
    id: "m3-q4",
    moduleId: "3",
    topic: "Airspace",
    prompt: "A stadium TFR for a major sporting event is typically active during which period?",
    choices: ["Only during the game", "1 hour before through 1 hour after the event", "24 hours before through 24 hours after", "Only when the team scores"],
    correctIndex: 1,
    explanation: "Stadium TFRs are active 1 hour before through 1 hour after qualifying events. The radius is 3 NM up to 3,000 ft AGL."
  },
  {
    id: "m3-q5",
    moduleId: "3",
    topic: "Airspace",
    prompt: "What does a 3-digit Military Training Route number indicate about the route?",
    choices: ["The route is over water", "Segments are narrower than 4 NM — more confined", "The route is IR only", "The route is VR only"],
    correctIndex: 1,
    explanation: "A 3-digit number means route segments are less than 4 NM wide. 4-digit numbers mean segments are 4 NM or wider."
  },
  {
    id: "m4-q1",
    moduleId: "4",
    topic: "Airspace",
    prompt: "On a sectional chart, what does a dashed magenta line indicate?",
    choices: ["Class B boundary", "Class C boundary", "Class D boundary", "Surface Class E boundary"],
    correctIndex: 3,
    explanation: "Dashed magenta lines mark surface Class E airspace. Part 107 authorization is required before operating there."
  },
  {
    id: "m4-q2",
    moduleId: "4",
    topic: "Airspace",
    prompt: "A Class B shelf is labeled 100/40. What does that mean?",
    choices: ["100 ft AGL to 40 ft AGL", "10,000 ft MSL ceiling and 4,000 ft MSL floor", "1,000 ft MSL ceiling and 400 ft MSL floor", "100 knots below 4,000 ft"],
    correctIndex: 1,
    explanation: "Class B/C shelf labels are usually hundreds of feet MSL. 100/40 means 10,000 ft MSL ceiling and 4,000 ft MSL floor."
  },
  {
    id: "m4-q3",
    moduleId: "4",
    topic: "Airspace",
    prompt: "An obstacle label reads 1549 (309). What does the number in parentheses mean?",
    choices: ["Height above ground level", "Distance from the airport", "Magnetic variation", "Height above sea level"],
    correctIndex: 0,
    explanation: "The first number is the obstacle top elevation in MSL. The number in parentheses is the obstacle height AGL."
  },
  {
    id: "m4-q4",
    moduleId: "4",
    topic: "Airspace",
    prompt: "What does a blue airport symbol generally indicate on a sectional chart?",
    choices: ["Non-towered airport", "Towered airport", "Private airport only", "Heliport"],
    correctIndex: 1,
    explanation: "Blue airport symbols generally indicate towered airports. Magenta symbols generally indicate non-towered airports."
  },
  {
    id: "m4-q5",
    moduleId: "4",
    topic: "Airspace",
    prompt: "What is the correct preflight relationship between sectional charts and NOTAMs/TFRs?",
    choices: ["Charts replace NOTAMs", "NOTAMs replace charts", "Charts show normal conditions; NOTAMs/TFRs show temporary changes", "Neither is needed in Class G"],
    correctIndex: 2,
    explanation: "Charts show the normal airspace and terrain picture. NOTAMs and TFRs show temporary or time-sensitive changes that may affect today’s flight."
  },
  {
    id: "m5-q1",
    moduleId: "5",
    topic: "Operations",
    prompt: "What does CTAF stand for and what is its primary purpose?",
    choices: ["Central Traffic Authorization Form — filing flight plans", "Common Traffic Advisory Frequency — pilot-to-pilot communication at non-towered airports", "Controlled Terminal Approach Fix — instrument approaches", "Commercial Traffic Access Frequency — airport business operations"],
    correctIndex: 1,
    explanation: "CTAF is the Common Traffic Advisory Frequency. Pilots use it at non-towered airports to self-announce position and intentions."
  },
  {
    id: "m5-q2",
    moduleId: "5",
    topic: "Operations",
    prompt: "In a standard traffic pattern, which leg is flown parallel to the runway in the opposite direction of landing?",
    choices: ["Upwind", "Crosswind", "Downwind", "Base"],
    correctIndex: 2,
    explanation: "The downwind leg is flown parallel to the runway in the opposite direction of landing. It is where most pattern traffic flies before turning base."
  },
  {
    id: "m5-q3",
    moduleId: "5",
    topic: "Operations",
    prompt: "What does RP indicate on a sectional chart near an airport?",
    choices: ["Restricted Pattern — military ops only", "Right Pattern — non-standard right traffic pattern", "Runway Prohibited — closed runway", "Remote Pilot — drone operating area"],
    correctIndex: 1,
    explanation: "RP means Right Pattern. It indicates a non-standard right-hand traffic pattern for that runway."
  },
  {
    id: "m5-q4",
    moduleId: "5",
    topic: "Operations",
    prompt: "What distinguishes a civilian land airport beacon from a military airport beacon?",
    choices: ["Civilian beacon flashes white only", "Civilian beacon is white/green alternating; military beacon is white/green/white", "There is no difference in the pattern", "Military beacon uses red only"],
    correctIndex: 1,
    explanation: "A civilian land airport beacon flashes white/green. A military airport beacon shows two white flashes between green — white/green/white."
  },
  {
    id: "m5-q5",
    moduleId: "5",
    topic: "Operations",
    prompt: "What is the correct relationship between UNICOM and CTAF?",
    choices: ["UNICOM replaces CTAF at towered airports", "CTAF is for traffic advisories; UNICOM is for airport services", "They are the same thing with different names", "UNICOM is only used by military aircraft"],
    correctIndex: 1,
    explanation: "CTAF = pilot-to-pilot traffic communication. UNICOM = pilot-to-ground for services like fuel and parking. They often share the same frequency."
  },
  {
    id: "m6-q1",
    moduleId: "6",
    topic: "Weather",
    prompt: "In a METAR, what does 'BKN025' mean?",
    choices: ["Broken clouds at 250 ft AGL", "Broken clouds at 2,500 ft AGL — ceiling", "Broken clouds at 25,000 ft MSL", "Broken visibility of 2.5 SM"],
    correctIndex: 1,
    explanation: "BKN025 means broken clouds at 2,500 ft AGL. BKN (5-7 oktas) constitutes a ceiling. The 025 is hundreds of feet — so 2,500 ft."
  },
  {
    id: "m6-q2",
    moduleId: "6",
    topic: "Weather",
    prompt: "What three conditions combine to create the highest density altitude?",
    choices: ["Cold temperature, low elevation, low humidity", "High temperature, high elevation, high humidity", "Moderate temperature, moderate elevation, dry air", "High temperature, low elevation, dry air"],
    correctIndex: 1,
    explanation: "Hot + high + humid = the three H's. All three reduce air density, which increases density altitude and reduces aircraft performance."
  },
  {
    id: "m6-q3",
    moduleId: "6",
    topic: "Weather",
    prompt: "What is the minimum visibility required for Part 107 operations?",
    choices: ["1 statute mile", "2 statute miles", "3 statute miles", "5 statute miles"],
    correctIndex: 2,
    explanation: "Part 107 requires at least 3 statute miles of visibility from the control station. If visibility drops below this, the flight must be terminated."
  },
  {
    id: "m6-q4",
    moduleId: "6",
    topic: "Weather",
    prompt: "Which type of fog typically forms on clear nights with light wind and burns off after sunrise?",
    choices: ["Advection fog", "Upslope fog", "Radiation fog", "Steam fog"],
    correctIndex: 2,
    explanation: "Radiation fog forms when the ground cools at night under clear skies with light wind. It typically burns off within a few hours after sunrise."
  },
  {
    id: "m6-q5",
    moduleId: "6",
    topic: "Weather",
    prompt: "At which stage of a thunderstorm lifecycle are microbursts and hail most likely?",
    choices: ["Cumulus stage", "Mature stage", "Dissipating stage", "All stages equally"],
    correctIndex: 1,
    explanation: "The mature stage has both updrafts and downdrafts, producing the most dangerous conditions: microbursts, hail, lightning, and heavy precipitation."
  },
  {
    id: "m7-q1",
    moduleId: "7",
    topic: "Operations",
    prompt: "What is the correct pre-takeoff procedure for return-to-home altitude?",
    choices: ["Set RTH altitude to 100 ft — obstacles don't matter", "Set RTH altitude above all known obstacles in the flight path", "RTH altitude is set automatically — no pilot action needed", "Set RTH altitude to maximum legal altitude of 400 ft"],
    correctIndex: 1,
    explanation: "RTH altitude must be set above all obstacles in the flight path. If set too low, the aircraft will fly into towers, trees, or terrain during return."
  },
  {
    id: "m7-q2",
    moduleId: "7",
    topic: "Operations",
    prompt: "What is the primary hazard of a tailwind on the outbound leg of a drone flight?",
    choices: ["Faster outbound but slower return — battery may not be sufficient to get back", "The drone will fly too slowly", "GPS accuracy is degraded", "Obstacle avoidance is disabled"],
    correctIndex: 0,
    explanation: "A tailwind outbound means you will cover more distance quickly, but the return leg will face a headwind. Plan your return point at 30-40% battery, not at the halfway point."
  },
  {
    id: "m7-q3",
    moduleId: "7",
    topic: "Operations",
    prompt: "What should a drone pilot do if they see a manned aircraft approaching during a Part 107 flight?",
    choices: ["Climb to get above it", "Descend immediately and land as soon as safe", "Continue flying — the manned pilot will avoid the drone", "Increase speed to leave the area"],
    correctIndex: 1,
    explanation: "Small UAS must yield right of way to all manned aircraft. The correct response is to descend immediately and land when safe."
  },
  {
    id: "m7-q4",
    moduleId: "7",
    topic: "Loading & Performance",
    prompt: "What effect does carrying a heavy payload have on drone performance?",
    choices: ["Increased flight time and faster climb", "Reduced flight time, slower climb, and reduced maneuverability", "No effect on performance", "Improved battery efficiency"],
    correctIndex: 1,
    explanation: "A heavier payload reduces endurance, climb rate, and maneuverability. More weight requires more power to maintain flight."
  },
  {
    id: "m7-q5",
    moduleId: "7",
    topic: "Operations",
    prompt: "What is the correct procedure for a puffed or swollen LiPo battery?",
    choices: ["Charge it fully to see if the puffing goes away", "Use it only for short flights", "Dispose of it properly — do not attempt to use or charge it", "Store it at full charge to stabilize it"],
    correctIndex: 2,
    explanation: "A puffed battery is damaged and dangerous. It is a fire hazard. Properly dispose of it — never attempt to charge, use, or 'fix' a swollen battery."
  },
  {
    id: "m8-q1",
    moduleId: "8",
    topic: "Operations",
    prompt: "A pilot thinks 'The rules don't really apply to me.' Which hazardous attitude is this?",
    choices: ["Impulsivity", "Invulnerability", "Anti-authority", "Resignation"],
    correctIndex: 2,
    explanation: "Anti-authority is the attitude that rules do not apply to me. The antidote is: 'Follow the rules. They are usually right.'"
  },
  {
    id: "m8-q2",
    moduleId: "8",
    topic: "Operations",
    prompt: "In the DECIDE model, what does the first 'D' stand for?",
    choices: ["Do", "Detect", "Decide", "Delay"],
    correctIndex: 1,
    explanation: "DECIDE: Detect a change, Estimate the need to react, Choose a safe outcome, Identify actions, Do the actions, Evaluate the result."
  },
  {
    id: "m8-q3",
    moduleId: "8",
    topic: "Operations",
    prompt: "What is the primary purpose of the IMSAFE checklist?",
    choices: ["Aircraft inspection", "Weather briefing", "Pilot fitness self-assessment", "Airspace authorization"],
    correctIndex: 2,
    explanation: "IMSAFE (Illness, Medication, Stress, Alcohol, Fatigue, Emotion) is a pilot fitness self-check. If any factor is compromised, do not fly."
  },
  {
    id: "m8-q4",
    moduleId: "8",
    topic: "Operations",
    prompt: "A pilot says 'It won't happen to me.' Which hazardous attitude is this, and what is its antidote?",
    choices: ["Macho — 'Taking chances is foolish'", "Invulnerability — 'It could happen to me'", "Resignation — 'I'm not helpless'", "Impulsivity — 'Not so fast. Think first'"],
    correctIndex: 1,
    explanation: "Invulnerability makes pilots believe accidents only happen to others. The antidote: 'It could happen to me.'"
  },
  {
    id: "m8-q5",
    moduleId: "8",
    topic: "Operations",
    prompt: "What is the biggest danger of get-there-itis?",
    choices: ["It improves decision-making under pressure", "It causes pilots to continue a flight despite unsafe conditions", "It is only a problem for student pilots", "It is easily managed by flying faster"],
    correctIndex: 1,
    explanation: "Get-there-itis is the compulsion to complete a flight when conditions should prevent it. It overrides good judgment and is a leading cause of aviation accidents."
  },
  {
    id: "m9-q1",
    moduleId: "9",
    topic: "Operations",
    prompt: "What is the Part 107 rule regarding alcohol consumption before flight?",
    choices: ["No alcohol within 4 hours", "No alcohol within 8 hours, and no flying while under the influence or impaired", "No alcohol within 12 hours", "Alcohol is permitted as long as BAC is below 0.04%"],
    correctIndex: 1,
    explanation: "Part 107: no alcohol within 8 hours before operating AND no operation while under the influence. BAC does not matter — impairment is the standard."
  },
  {
    id: "m9-q2",
    moduleId: "9",
    topic: "Operations",
    prompt: "What is empty-field myopia?",
    choices: ["A condition where the pilot cannot see colors", "The eyes' tendency to focus 10-30 ft ahead in featureless environments, making distant traffic hard to spot", "A type of hypoxia", "A medication side effect"],
    correctIndex: 1,
    explanation: "In featureless sky or water, with nothing to focus on, the eyes default to a near focal distance. Distant aircraft become hard to see — a real hazard for drone VLOS."
  },
  {
    id: "m9-q3",
    moduleId: "9",
    topic: "Operations",
    prompt: "Which type of hypoxia is caused by carbon monoxide poisoning?",
    choices: ["Hypoxic hypoxia", "Hypemic hypoxia", "Stagnant hypoxia", "Histotoxic hypoxia"],
    correctIndex: 1,
    explanation: "Hypemic hypoxia occurs when the blood cannot carry oxygen — most commonly from carbon monoxide binding to hemoglobin. Avoid operating near running engines or generators."
  },
  {
    id: "m9-q4",
    moduleId: "9",
    topic: "Operations",
    prompt: "A pilot is flying at night and notices a stationary light on the horizon appears to be moving. What is this illusion called?",
    choices: ["Empty-field myopia", "The leans", "Autokinesis", "Flicker vertigo"],
    correctIndex: 2,
    explanation: "Autokinesis is the illusion that a stationary point of light is moving against a dark background. It is a well-known night flying hazard."
  },
  {
    id: "m9-q5",
    moduleId: "9",
    topic: "Operations",
    prompt: "What is the only effective cure for fatigue?",
    choices: ["Caffeine", "Cold air", "Rest", "Adrenaline"],
    correctIndex: 2,
    explanation: "There is no substitute for rest. Caffeine and other stimulants may temporarily mask symptoms but do not restore decision-making ability or reaction time."
  },
  {
    id: "m10-q1",
    moduleId: "10",
    topic: "Operations",
    prompt: "What is the Part 107 requirement regarding the condition of the aircraft before flight?",
    choices: ["The manufacturer determines airworthiness", "The remote PIC must ensure the small UAS is in a condition for safe operation", "The FAA inspects all commercial drones annually", "Only the battery needs to be checked"],
    correctIndex: 1,
    explanation: "The remote pilot in command is responsible for determining that the aircraft is in a condition for safe operation before every flight."
  },
  {
    id: "m10-q2",
    moduleId: "10",
    topic: "Operations",
    prompt: "What should you do with a propeller that has a visible chip?",
    choices: ["Balance it and continue using it", "Replace it — any damage is grounds for replacement", "Fly only at low speed", "Sand down the chip and rebalance"],
    correctIndex: 1,
    explanation: "A damaged propeller should be replaced, not repaired. Even a small chip creates imbalance and stress that can cause catastrophic failure in flight."
  },
  {
    id: "m10-q3",
    moduleId: "10",
    topic: "Operations",
    prompt: "Why should you not update firmware immediately before a paid job?",
    choices: ["Firmware updates always fail", "Updates may change behavior or settings — test before relying on them", "It is illegal to update firmware", "Firmware updates drain the battery"],
    correctIndex: 1,
    explanation: "Firmware updates can reset settings (RTH altitude, geofencing) or change flight behavior. Always test after an update before flying a commercial mission."
  },
  {
    id: "m10-q4",
    moduleId: "10",
    topic: "Operations",
    prompt: "What is the correct procedure after a hard landing?",
    choices: ["Continue flying if it seems fine", "Inspect landing gear mounts and airframe for cracks before the next flight", "Pack up immediately to avoid embarrassment", "Only inspect if the drone won't power on"],
    correctIndex: 1,
    explanation: "A hard landing can crack airframe components that may not be immediately visible. Inspect thoroughly before the next flight, even if the drone appears functional."
  },
  {
    id: "m10-q5",
    moduleId: "10",
    topic: "Operations",
    prompt: "Are formal maintenance logbooks legally required under Part 107?",
    choices: ["Yes — the FAA requires a specific format", "No — but documentation is your strongest defense in an incident", "Only for aircraft over 25 pounds", "Only for night operations"],
    correctIndex: 1,
    explanation: "Part 107 does not mandate a specific logbook format, but documented maintenance and inspections are your best evidence of professional operation if the FAA investigates."
  },
  {
    id: "m11-q1",
    moduleId: "11",
    topic: "Operations",
    prompt: "What is the passing score on the FAA Part 107 knowledge test?",
    choices: ["60%", "70%", "80%", "85%"],
    correctIndex: 1,
    explanation: "The passing score is 70%, which means 42 correct answers out of 60 questions."
  },
  {
    id: "m11-q2",
    moduleId: "11",
    topic: "Operations",
    prompt: "Which two topic areas combined make up the majority of the Part 107 exam?",
    choices: ["Weather and Physiology", "Regulations and Airspace", "Loading and Maintenance", "Operations and CRM"],
    correctIndex: 1,
    explanation: "Regulations (30-40%) and Airspace/Charts (25-35%) together make up 55-75% of the exam. Master these first."
  },
  {
    id: "m11-q3",
    moduleId: "11",
    topic: "Operations",
    prompt: "What is the best strategy when you encounter a difficult question on the real exam?",
    choices: ["Spend unlimited time until you solve it", "Flag it, skip it, and return after answering the easier questions", "Leave it blank — skipping is better than guessing", "Ask the proctor for help"],
    correctIndex: 1,
    explanation: "Flag hard questions and return to them after banking points on questions you know. Never leave a question blank — guess if you have to."
  },
  {
    id: "m11-q4",
    moduleId: "11",
    topic: "Operations",
    prompt: "Why is it a waste of time to take the practice exam over and over without studying between attempts?",
    choices: ["Practice exams are inaccurate", "You start memorizing the specific questions instead of learning the underlying material", "The FAA changes the exam daily", "Practice exams count against your real test attempts"],
    correctIndex: 1,
    explanation: "When you score high because you recognize the questions, you are testing memory, not knowledge. Study weak areas between attempts to build real understanding."
  }
];

export const examQuestions: QuizQuestion[] = [
  ...moduleQuestions,
  {
    id: "exam-airspace-1",
    topic: "Airspace",
    prompt: "A Part 107 pilot wants to fly in Class D airspace near an airport. What is required before flight?",
    choices: ["No action if below 400 ft", "FAA airspace authorization", "Only a visual observer", "Only a NOTAM check"],
    correctIndex: 1,
    explanation: "Class D controlled airspace requires FAA authorization for Part 107 operations."
  },
  {
    id: "exam-weather-1",
    topic: "Weather",
    prompt: "Which condition is a standard Part 107 visibility minimum?",
    choices: ["1 statute mile", "2 statute miles", "3 statute miles", "5 nautical miles"],
    correctIndex: 2,
    explanation: "Part 107 requires at least 3 statute miles of visibility from the control station."
  },
  {
    id: "exam-weather-2",
    topic: "Weather",
    prompt: "What can high density altitude do to a small UAS?",
    choices: ["Improve climb performance", "Reduce aircraft performance", "Remove battery limits", "Increase GPS accuracy"],
    correctIndex: 1,
    explanation: "High density altitude reduces air density and can degrade aircraft and propeller performance."
  },
  {
    id: "exam-performance-1",
    topic: "Loading & Performance",
    prompt: "Why does center of gravity matter on a drone?",
    choices: ["It only changes camera color", "It affects stability and controllability", "It replaces the need for registration", "It controls Remote ID range"],
    correctIndex: 1,
    explanation: "Improper loading or center of gravity can reduce stability, controllability, and available performance."
  },
  {
    id: "exam-ops-1",
    topic: "Operations",
    prompt: "What should the remote PIC do if continuing a flight would create an unsafe condition?",
    choices: ["Continue if the battery is above 50 percent", "Land or otherwise safely terminate the operation", "Only notify the visual observer", "Switch to sport mode"],
    correctIndex: 1,
    explanation: "The remote pilot in command must avoid unsafe operation and should terminate the flight safely when needed."
  },
  {
    id: "exam-ops-2",
    topic: "Operations",
    prompt: "Which crew concept helps divide duties and improve safety during a UAS operation?",
    choices: ["Crew resource management", "Maximum elevation figure", "Density altitude", "Magnetic variation"],
    correctIndex: 0,
    explanation: "Crew resource management improves coordination, communication, and decision-making."
  },
  {
    id: "exam-reg-1",
    topic: "Regulations",
    prompt: "How long is FAA drone registration generally valid?",
    choices: ["1 year", "2 years", "3 years", "5 years"],
    correctIndex: 2,
    explanation: "FAA drone registration is generally valid for 3 years."
  },
  {
    id: "exam-reg-2",
    topic: "Regulations",
    prompt: "What is Remote ID often compared to?",
    choices: ["A digital license plate", "An airport weather sensor", "A battery charger", "A sectional chart"],
    correctIndex: 0,
    explanation: "Remote ID broadcasts identification and location information, similar in concept to a digital license plate."
  },
  {
    id: "exam-airspace-2",
    topic: "Airspace",
    prompt: "What source should a pilot check for temporary flight restrictions?",
    choices: ["Only the drone battery app", "NOTAM/TFR resources before flight", "Only the registration certificate", "Only old sectional charts"],
    correctIndex: 1,
    explanation: "Pilots should check current NOTAM and TFR information before flight."
  },
  {
    id: "exam-weather-3",
    topic: "Weather",
    prompt: "What is one reason thunderstorms are hazardous to small UAS?",
    choices: ["They improve signal strength", "They can produce strong wind, turbulence, and precipitation", "They lower all obstacle heights", "They remove cloud clearance requirements"],
    correctIndex: 1,
    explanation: "Thunderstorms can create severe wind, turbulence, precipitation, and rapidly changing conditions."
  },
  {
    id: "exam-performance-2",
    topic: "Loading & Performance",
    prompt: "Which preflight factor can reduce endurance?",
    choices: ["Cold battery temperature", "A current registration number", "A printed certificate", "A lower camera resolution"],
    correctIndex: 0,
    explanation: "Cold batteries can reduce available power and endurance."
  },
  {
    id: "exam-ops-3",
    topic: "Operations",
    prompt: "What does IMSAFE help evaluate?",
    choices: ["Pilot readiness", "Airspace class boundaries", "Registration cost", "Camera shutter speed"],
    correctIndex: 0,
    explanation: "IMSAFE is a personal readiness check covering illness, medication, stress, alcohol, fatigue, and emotion."
  },
  {
    id: "exam-airspace-3",
    topic: "Airspace",
    prompt: "Class C airspace has a two-ring structure. What are the dimensions of the inner ring?",
    choices: ["3 NM radius, surface to 700 AGL", "5 NM radius, surface to 1,200 AGL", "10 NM radius, 1,200 to 4,000 AGL", "4 NM radius, surface to 2,500 AGL"],
    correctIndex: 1,
    explanation: "Class C inner ring is 5 NM radius from surface to 1,200 ft AGL. The outer ring is 10 NM from 1,200 to 4,000 AGL."
  },
  {
    id: "exam-airspace-4",
    topic: "Airspace",
    prompt: "A Part 107 pilot is operating at 300 ft AGL in Class E airspace that begins at 700 ft AGL. What authorization is required?",
    choices: ["Full LAANC authorization", "None — the operation is below the Class E floor", "A waiver for airspace operations", "Manual FAA authorization only"],
    correctIndex: 1,
    explanation: "Only surface Class E requires authorization. Class E beginning at 700 ft AGL or higher does not restrict operations below that floor."
  },
  {
    id: "exam-airspace-5",
    topic: "Airspace",
    prompt: "Which of the following is true about Military Operations Areas?",
    choices: ["Entry is prohibited for all drones", "MOAs are not prohibited, but pilots should exercise extreme caution", "MOAs only exist over water", "MOAs require a special waiver for Part 107"],
    correctIndex: 1,
    explanation: "MOAs are not prohibited airspace, but they contain military training activities. Use extreme caution and monitor for military traffic."
  },
  {
    id: "exam-airspace-6",
    topic: "Airspace",
    prompt: "What is the best source to check for Temporary Flight Restrictions before a Part 107 flight?",
    choices: ["Yesterday's sectional chart", "tfr.faa.gov or an approved UAS app", "The drone manufacturer's website", "Local news"],
    correctIndex: 1,
    explanation: "Check tfr.faa.gov or an approved UAS service provider app before every flight. TFRs can appear with short notice."
  },
  {
    id: "exam-airspace-7",
    topic: "Airspace",
    prompt: "A wildfire is burning in Class G airspace where you planned to fly. What should you do?",
    choices: ["Fly anyway below 100 ft", "Check for a disaster TFR — if one exists, do not fly", "Call the fire department for permission", "Fly only if you use a visual observer"],
    correctIndex: 1,
    explanation: "Wildfires often trigger disaster TFRs. Flying a drone in a firefighting TFR area grounds all firefighting aircraft and is a federal offense."
  },
  {
    id: "exam-chart-1",
    topic: "Airspace",
    prompt: "On a sectional chart, which line style indicates Class D airspace?",
    choices: ["Solid blue", "Solid magenta", "Dashed blue", "Dashed magenta"],
    correctIndex: 2,
    explanation: "Class D airspace is shown with a dashed blue boundary. Class E surface is dashed magenta."
  },
  {
    id: "exam-chart-2",
    topic: "Airspace",
    prompt: "A fuzzy magenta vignette around an airport indicates what Class E floor?",
    choices: ["Surface", "700 ft AGL", "1,200 ft AGL", "14,500 ft MSL"],
    correctIndex: 1,
    explanation: "Fuzzy magenta shading indicates Class E begins at 700 ft AGL. Fuzzy blue shading indicates Class E begins at 1,200 ft AGL."
  },
  {
    id: "exam-chart-3",
    topic: "Airspace",
    prompt: "An MEF of 28 on a sectional chart means what?",
    choices: ["280 ft MSL", "2,800 ft MSL", "28,000 ft MSL", "2,800 ft AGL"],
    correctIndex: 1,
    explanation: "MEFs are shown in hundreds of feet MSL. 28 means 2,800 ft MSL."
  },
  {
    id: "exam-chart-4",
    topic: "Airspace",
    prompt: "Why are towers especially hazardous for small UAS operations?",
    choices: ["They always create Class B airspace", "Guy wires can extend far from the tower and may be hard to see", "They eliminate VLOS requirements", "They automatically authorize higher altitude flight"],
    correctIndex: 1,
    explanation: "Towers often have guy wires that are difficult to see and may extend far beyond the tower base."
  },
  {
    id: "exam-chart-5",
    topic: "Airspace",
    prompt: "Which statement about chart use is correct for Part 107 preflight planning?",
    choices: ["If the chart is clear, TFR checks are optional", "A current chart plus NOTAM/TFR checks gives both normal and temporary airspace information", "Only Google Maps is needed", "Charts are only required for manned aircraft"],
    correctIndex: 1,
    explanation: "Sectionals show the normal aviation picture. NOTAMs and TFRs show temporary changes that may affect today’s flight."
  },
  {
    id: "exam-ops-4",
    topic: "Operations",
    prompt: "At a non-towered airport, where should a drone pilot operating nearby tune to hear manned traffic?",
    choices: ["ATIS frequency", "CTAF", "Approach control", "Ground control"],
    correctIndex: 1,
    explanation: "CTAF is used at non-towered airports for pilot-to-pilot communication. Monitoring it helps drone pilots track traffic in the pattern."
  },
  {
    id: "exam-ops-5",
    topic: "Operations",
    prompt: "A drone pilot is flying at 300 ft AGL one mile from a runway threshold in Class G. What is the primary hazard?",
    choices: ["FAA radar tracking", "Aircraft on final approach may pass through that altitude", "Battery overheating", "GPS signal loss"],
    correctIndex: 1,
    explanation: "Aircraft on final approach descend through 300 ft near the runway. A drone at that location and altitude is in a high-conflict zone."
  },
  {
    id: "exam-ops-6",
    topic: "Operations",
    prompt: "What frequency does a pilot use at an airport with no published CTAF or UNICOM?",
    choices: ["121.5 MHz emergency", "122.9 MHz MULTICOM", "123.45 MHz air-to-air", "126.7 MHz FSS"],
    correctIndex: 1,
    explanation: "122.9 MHz is the MULTICOM frequency — the standard fallback for airports without a published CTAF or UNICOM."
  },
  {
    id: "exam-ops-7",
    topic: "Operations",
    prompt: "Which lighting system helps a drone pilot identify a nearby airport at night?",
    choices: ["Strobe lights on towers", "Rotating beacon with white/green pattern", "Red obstruction lights on buildings", "Highway approach lighting"],
    correctIndex: 1,
    explanation: "Civilian land airports use a rotating white/green beacon. Recognizing this pattern tells you an airport — and possible traffic — is nearby."
  },
  {
    id: "exam-weather-4",
    topic: "Weather",
    prompt: "A METAR reports SCT015 BKN030. What does this tell a Part 107 pilot?",
    choices: ["Scattered clouds at 150 ft — no ceiling", "Scattered at 1,500 ft, broken at 3,000 ft — ceiling is 3,000 ft", "Severe clear — no restrictions", "Ceiling at 1,500 ft"],
    correctIndex: 1,
    explanation: "SCT is not a ceiling. BKN030 means broken at 3,000 ft — that IS a ceiling. The pilot must stay 500 ft below 3,000 ft (i.e., at or below 2,500 ft)."
  },
  {
    id: "exam-weather-5",
    topic: "Weather",
    prompt: "A TAF includes 'TEMPO 0608/0610 2SM BR OVC005.' What should a Part 107 pilot do?",
    choices: ["Fly as planned — it is only temporary", "The 2 SM visibility is below Part 107 minimums during that window — plan around it", "Ignore TAFs entirely", "Only fly at night when visibility doesn't matter"],
    correctIndex: 1,
    explanation: "TEMPO 0608/0610 means temporary conditions from 08:00 to 10:00 UTC. 2SM visibility violates the 3 SM Part 107 minimum. Don't fly during that window."
  },
  {
    id: "exam-weather-6",
    topic: "Weather",
    prompt: "What is the primary hazard of a microburst to a small UAS?",
    choices: ["Improved GPS accuracy", "Extremely strong downdrafts that can force the aircraft to the ground", "Battery overcharging", "Increased radio range"],
    correctIndex: 1,
    explanation: "Microbursts produce intense downward wind that can exceed 6,000 ft/min. No small UAS can out-climb a microburst."
  },
  {
    id: "exam-weather-7",
    topic: "Weather",
    prompt: "Temperature is 25°C and dew point is 23°C at sunset with clear skies. What should concern a drone pilot planning a morning flight?",
    choices: ["High density altitude", "Radiation fog formation overnight", "Thunderstorm development", "Excessive battery performance"],
    correctIndex: 1,
    explanation: "When temperature and dew point are close (2°C spread) on a clear night with light wind, radiation fog is likely to form by morning."
  },
  {
    id: "exam-ops-8",
    topic: "Operations",
    prompt: "A drone pilot is flying with a 15-knot tailwind on the outbound leg. At what battery percentage should the return be initiated?",
    choices: ["10% — the drone will make it back easily", "50% — battery usage is symmetrical", "30-40% — to account for the headwind on return", "15% — tailwind return will help"],
    correctIndex: 2,
    explanation: "Tailwind outbound means headwind return. Initiate return at 30-40% battery to ensure sufficient power to fight the wind back."
  },
  {
    id: "exam-ops-9",
    topic: "Operations",
    prompt: "What is the primary risk of cold-weather flying with lithium polymer batteries?",
    choices: ["Increased battery capacity", "Reduced power output and shorter flight time", "Improved motor efficiency", "Longer flight time"],
    correctIndex: 1,
    explanation: "Cold temperatures reduce LiPo power output. Keep batteries warm before flight and expect shorter endurance in cold conditions."
  },
  {
    id: "exam-ops-10",
    topic: "Operations",
    prompt: "During flight, the remote pilot notices the drone has lost GPS and switched to ATTI mode. What should the pilot expect?",
    choices: ["The drone will hold position perfectly", "The drone will drift with the wind — active piloting is required", "RTH is still available", "Obstacle avoidance is enhanced"],
    correctIndex: 1,
    explanation: "In ATTI mode, the drone maintains altitude only. It will drift with wind and requires active stick input to maintain position. GPS-dependent features are unavailable."
  },
  {
    id: "exam-ops-11",
    topic: "Operations",
    prompt: "A Part 107 pilot observes smoke coming from the drone battery during preflight. What is the correct action?",
    choices: ["Fly a short test flight to see if it clears up", "Charge it fully and check again", "Do not fly — isolate the battery in a safe location away from flammable materials", "Tape over the damaged area and proceed"],
    correctIndex: 2,
    explanation: "Smoke during preflight is a sign of catastrophic battery failure. Isolate the battery in a fire-safe location. Do not fly. Do not charge. Do not ignore."
  },
  {
    id: "exam-adm-1",
    topic: "Operations",
    prompt: "A drone pilot is feeling pressure from a client to fly despite deteriorating weather. What ADM tool directly addresses this?",
    choices: ["METAR decoding", "PAVE — External pressures", "Weight and balance", "Firmware update procedure"],
    correctIndex: 1,
    explanation: "PAVE includes External pressures — like client demands. Recognizing that this is an external pressure, not a safety justification, is the key."
  },
  {
    id: "exam-adm-2",
    topic: "Operations",
    prompt: "A remote pilot notices their battery draining faster than expected mid-flight. Which DECIDE step comes first?",
    choices: ["Choose a new landing zone", "Detect that the battery rate has changed", "Evaluate whether the plan worked", "Do the divert"],
    correctIndex: 1,
    explanation: "DECIDE starts with Detect — recognizing that something has changed. You cannot solve a problem you have not noticed."
  },
  {
    id: "exam-adm-3",
    topic: "Operations",
    prompt: "A pilot says 'I've done this a hundred times, I can handle any situation.' Which hazardous attitude does this reflect?",
    choices: ["Resignation", "Anti-authority", "Invulnerability", "Impulsivity"],
    correctIndex: 2,
    explanation: "Invulnerability is the belief that accidents happen to others but not to me. The antidote is: 'It could happen to me.'"
  },
  {
    id: "exam-adm-4",
    topic: "Operations",
    prompt: "What is the key principle of Crew Resource Management for drone operations?",
    choices: ["Only the remote PIC makes decisions", "All crew members can and should call out hazards", "Visual observers only assist with payload", "CRM does not apply to small UAS"],
    correctIndex: 1,
    explanation: "CRM leverages all crew members. Anyone can and must call out hazards — regardless of role. This applies to VO, payload operator, and support personnel."
  },
  {
    id: "exam-phys-1",
    topic: "Operations",
    prompt: "A remote pilot took a common antihistamine for allergies this morning. The label says 'may cause drowsiness.' Can they legally fly under Part 107?",
    choices: ["Yes — it is over-the-counter, not prescription", "Yes — as long as they consumed it more than 8 hours ago", "No — any medication that may impair faculties makes operation illegal", "Yes — if they drink coffee to counteract the drowsiness"],
    correctIndex: 2,
    explanation: "Part 107 prohibits operation if any drug affects faculties in any way contrary to safety. 'May cause drowsiness' on the label = do not fly. Prescription vs OTC does not matter."
  },
  {
    id: "exam-phys-2",
    topic: "Operations",
    prompt: "A drone pilot has been scanning the sky for traffic over open water for 15 minutes. Why might they miss a distant aircraft?",
    choices: ["The aircraft has a transponder failure", "Empty-field myopia — their eyes have focused close with nothing to lock onto", "Salt spray on the controller screen", "GPS interference over water"],
    correctIndex: 1,
    explanation: "Over featureless water or sky, the eyes default to a 10-30 ft focal distance. Distant objects blur. Deliberately refocus on the horizon periodically."
  },
  {
    id: "exam-phys-3",
    topic: "Operations",
    prompt: "What should a drone pilot do if feeling dizzy and disoriented during an FPV flight?",
    choices: ["Push through — the feeling will pass", "Switch to VLOS, stabilize in hover, and land if symptoms persist", "Increase speed to finish the mission faster", "Remove the headset and continue by instruments"],
    correctIndex: 1,
    explanation: "Motion sickness or disorientation in flight requires immediate action: stabilize, switch to VLOS if possible, look at the horizon to recalibrate, and land if symptoms continue."
  },
  {
    id: "exam-phys-4",
    topic: "Operations",
    prompt: "A Part 107 pilot is operating near a running generator at a construction site. What physiological hazard should they be most concerned about?",
    choices: ["Hypoxic hypoxia from altitude", "Hypemic hypoxia from carbon monoxide", "Hyperventilation from stress", "The leans from head movement"],
    correctIndex: 1,
    explanation: "Running engines and generators produce carbon monoxide. CO causes hypemic hypoxia by binding to hemoglobin. Operate upwind and maintain distance from exhaust sources."
  },
  {
    id: "exam-maint-1",
    topic: "Operations",
    prompt: "A drone pilot notices a propeller has a hairline crack near the hub during preflight. The only spare propeller available is a different brand with the same size and pitch rating. What should the pilot do?",
    choices: ["Use the cracked propeller — it is a hairline crack and will hold", "Use the different-brand propeller as a temporary fix", "Replace with the available propeller of the same size and pitch, then re-test hover stability before the mission", "Cancel the entire job — only exact OEM parts are legal"],
    correctIndex: 2,
    explanation: "A cracked propeller must be replaced — never flown. A same-size, same-pitch propeller from a different brand is acceptable IF a hover check confirms stability. Document the change."
  },
  {
    id: "exam-maint-2",
    topic: "Operations",
    prompt: "After a firmware update, the drone's RTH altitude reset to the factory default of 100 ft. The pilot has a 180 ft tower on the planned route. What should happen?",
    choices: ["Fly anyway — the drone will detect the tower", "Reset RTH altitude above 180 ft and verify the setting before takeoff", "Disable RTH for this flight", "Call the manufacturer for permission"],
    correctIndex: 1,
    explanation: "Firmware updates can reset critical settings. Always verify RTH altitude after an update. In this case, set RTH above 180 ft to clear the tower."
  },
  {
    id: "exam-maint-3",
    topic: "Operations",
    prompt: "During a post-flight inspection, the pilot notices the battery is slightly warmer than usual but not swollen. What is the correct procedure?",
    choices: ["Immediately charge it for the next flight", "Let it cool to ambient temperature, then inspect again. Note the temperature anomaly in the log.", "Dispose of the battery — any warmth is a failure", "Place it in a LiPo bag and store it in a hot car"],
    correctIndex: 1,
    explanation: "A warmer-than-usual battery after flight is worth noting but not necessarily a failure. Let it cool, re-inspect, and log the observation. If the pattern repeats, investigate further."
  },
  {
    id: "exam-maint-4",
    topic: "Operations",
    prompt: "The FAA investigates an incident involving your drone. The investigator asks for your maintenance records. You have none. What is the likely outcome?",
    choices: ["No records needed — Part 107 does not require them", "The FAA will assume no maintenance was performed, which weakens your position considerably", "You have 30 days to create retrospective records", "Only flight hours matter, not maintenance"],
    correctIndex: 1,
    explanation: "While Part 107 does not mandate a specific logbook, the absence of any records strongly suggests to the FAA that no systematic inspection or maintenance was conducted. This is not a position you want to be in."
  },
  {
    id: "exam-strat-1",
    topic: "Operations",
    prompt: "A pilot scores 72% on a practice exam. The passing score for the real test is 70%. Should the pilot schedule the real exam now?",
    choices: ["Yes — 72% is above the minimum", "No — train to 85%+ on practice exams to build margin for test-day pressure and unfamiliar questions", "Yes — practice scores are always lower than real scores", "No — you need FAA permission to schedule"],
    correctIndex: 1,
    explanation: "72% is too close to the line. Practice exam score should be 85%+ consistently because real test questions may differ and test-day nerves can lower performance. Build a margin of safety."
  },
  {
    id: "exam-strat-2",
    topic: "Operations",
    prompt: "On the Part 107 exam, a question asks 'Which of the following is NOT a requirement for night operations?' What is the first thing you should do?",
    choices: ["Skim for keywords and guess", "Mentally flip the question: 'What ARE the requirements?' Then cross off those that are requirements.", "Skip the question — NOT questions are too hard", "Read the first answer choice and select it if it sounds right"],
    correctIndex: 1,
    explanation: "NOT questions trick fast readers. Flip the question mentally: find the three true statements first, then the remaining one must be false — and that is your answer."
  },
  {
    id: "exam-airspace-8",
    topic: "Airspace",
    prompt: "A Part 107 pilot wants to fly from the surface inside Class B airspace. What must be obtained before the operation?",
    choices: ["A weather briefing only", "FAA authorization for the controlled airspace", "A Remote ID broadcast module waiver", "Permission from any nearby airport business"],
    correctIndex: 1,
    explanation: "Class B is controlled airspace. Part 107 operations there require FAA airspace authorization before flight."
  },
  {
    id: "exam-airspace-9",
    topic: "Airspace",
    prompt: "On a sectional chart, what does a solid magenta line generally indicate?",
    choices: ["Class B airspace", "Class C airspace", "Class E airspace beginning at the surface", "A military training route"],
    correctIndex: 2,
    explanation: "A solid magenta boundary indicates Class E airspace that starts at the surface. Part 107 pilots need authorization to operate there."
  },
  {
    id: "exam-airspace-10",
    topic: "Airspace",
    prompt: "A blue segmented circle is shown around an airport on a sectional chart. What airspace is normally indicated?",
    choices: ["Class B", "Class C", "Class D", "Class G"],
    correctIndex: 2,
    explanation: "Class D airspace is normally shown by a dashed blue segmented boundary around a towered airport."
  },
  {
    id: "exam-airspace-11",
    topic: "Airspace",
    prompt: "A sectional chart shows a magenta airport symbol with no control tower. What does the magenta airport color generally mean?",
    choices: ["The airport is non-towered", "The airport is military only", "The airport is closed permanently", "The airport is inside Class B airspace"],
    correctIndex: 0,
    explanation: "Magenta airport symbols generally identify non-towered airports. Blue airport symbols generally identify towered airports."
  },
  {
    id: "exam-airspace-12",
    topic: "Airspace",
    prompt: "What does a maximum elevation figure of 46 mean on a sectional chart?",
    choices: ["460 ft AGL", "4,600 ft MSL", "46,000 ft MSL", "4,600 ft AGL"],
    correctIndex: 1,
    explanation: "Maximum elevation figures are shown in hundreds of feet MSL. An MEF of 46 means 4,600 ft MSL."
  },
  {
    id: "exam-airspace-13",
    topic: "Airspace",
    prompt: "A runway has a right traffic pattern noted in the chart supplement. Why does that matter to a nearby drone operation?",
    choices: ["Manned aircraft may fly the pattern on the opposite side than expected", "The runway is closed to all traffic", "Part 107 altitude limits no longer apply", "The airport automatically becomes Class B"],
    correctIndex: 0,
    explanation: "Right traffic means aircraft pattern turns are to the right, so traffic may be on the opposite side of the runway from a standard left pattern."
  },
  {
    id: "exam-airspace-14",
    topic: "Airspace",
    prompt: "A restricted area is active along the planned route. What is the safest Part 107 decision?",
    choices: ["Enter if flying below 400 ft AGL", "Avoid it unless the controlling agency grants permission", "Enter only if Remote ID is working", "Enter if there are no clouds nearby"],
    correctIndex: 1,
    explanation: "Restricted areas may contain hazardous activity. Do not enter an active restricted area unless the controlling agency authorizes the operation."
  },
  {
    id: "exam-airspace-15",
    topic: "Airspace",
    prompt: "A charted Alert Area lies near the planned flight location. What does that tell the remote pilot?",
    choices: ["Flight is prohibited without a waiver", "High volume or unusual aerial activity may be present", "The airport tower is closed", "Only military aircraft may use the area"],
    correctIndex: 1,
    explanation: "Alert Areas warn pilots about high-volume training or unusual aerial activity. They are not automatically prohibited, but they require extra vigilance."
  },
  {
    id: "exam-weather-8",
    topic: "Weather",
    prompt: "A METAR wind group reads 21012G22KT. What does it mean?",
    choices: ["Wind from 210 degrees at 12 knots gusting to 22 knots", "Wind toward 210 degrees at 22 knots gusting to 12 knots", "Wind from 210 degrees at 12 mph gusting to 22 mph", "Wind variable from 210 to 220 degrees"],
    correctIndex: 0,
    explanation: "METAR winds are reported by direction from which the wind is blowing and speed in knots. G22KT means gusts to 22 knots."
  },
  {
    id: "exam-weather-9",
    topic: "Weather",
    prompt: "A METAR reports 1 1/2SM visibility. What does this mean for a standard Part 107 flight?",
    choices: ["It is legal if the drone stays below 100 ft", "It is below the 3 statute mile minimum", "It is legal only with a visual observer", "It is acceptable in Class G airspace"],
    correctIndex: 1,
    explanation: "Standard Part 107 operations require at least 3 statute miles of visibility from the control station."
  },
  {
    id: "exam-weather-10",
    topic: "Weather",
    prompt: "What weather condition most increases the risk of mechanical turbulence near buildings and trees?",
    choices: ["Calm wind under clear skies", "Strong gusty wind flowing around obstacles", "Low humidity on a cold morning", "High pressure with light winds"],
    correctIndex: 1,
    explanation: "Strong, gusty wind over and around obstacles creates mechanical turbulence and rotor zones that can upset a small UAS."
  },
  {
    id: "exam-weather-11",
    topic: "Weather",
    prompt: "What is the best interpretation of a small temperature-dew point spread?",
    choices: ["The air is dry and visibility will improve", "The air is near saturation and fog or low clouds are more likely", "Thunderstorms are impossible", "Density altitude is always low"],
    correctIndex: 1,
    explanation: "When temperature and dew point are close, relative humidity is high and fog or low clouds become more likely if cooling continues."
  },
  {
    id: "exam-weather-12",
    topic: "Weather",
    prompt: "Which cloud type is most associated with thunderstorms and severe turbulence?",
    choices: ["Cirrus", "Stratus", "Cumulonimbus", "Altostratus"],
    correctIndex: 2,
    explanation: "Cumulonimbus clouds are thunderstorm clouds and can contain severe turbulence, lightning, hail, and microbursts."
  },
  {
    id: "exam-weather-13",
    topic: "Weather",
    prompt: "A cold front passes the area just before a planned drone flight. What weather change is commonly expected?",
    choices: ["Stable air with no wind shift", "Abrupt wind shift, gusts, and possible turbulence", "Permanent improvement in visibility only", "No weather effect below 400 ft"],
    correctIndex: 1,
    explanation: "Cold fronts often bring wind shifts, gusty surface winds, turbulence, and precipitation near the frontal passage."
  },
  {
    id: "exam-weather-14",
    topic: "Weather",
    prompt: "What does OVC008 in a METAR indicate?",
    choices: ["Overcast clouds at 800 ft AGL", "Overcast clouds at 8,000 ft MSL", "Visibility of 0.8 statute miles", "Wind from 008 degrees"],
    correctIndex: 0,
    explanation: "Cloud heights in METARs are reported in hundreds of feet AGL. OVC008 means an overcast ceiling at 800 ft AGL."
  },
  {
    id: "exam-weather-15",
    topic: "Weather",
    prompt: "Why can a valley be hazardous for a morning UAS flight after a calm, clear night?",
    choices: ["Valleys prevent fog formation", "Cold air can drain into low areas and produce fog or localized low visibility", "All winds stop below ridge height", "GPS signals are stronger in valleys"],
    correctIndex: 1,
    explanation: "Cold, dense air can settle in valleys overnight. This can create fog, frost, and localized low visibility even when nearby higher terrain is clear."
  },
  {
    id: "exam-performance-3",
    topic: "Loading & Performance",
    prompt: "What happens to propeller and motor performance as density altitude increases?",
    choices: ["Performance improves because the air is thinner", "More power may be required and climb performance can decrease", "Battery voltage automatically increases", "Center of gravity moves forward"],
    correctIndex: 1,
    explanation: "High density altitude means thinner air. Propellers produce less thrust, motors work harder, and climb performance can decrease."
  },
  {
    id: "exam-performance-4",
    topic: "Loading & Performance",
    prompt: "A payload shifts aft during flight. What is the main performance concern?",
    choices: ["Improved stability", "Changed center of gravity and reduced controllability", "Higher visibility minimums", "Automatic Remote ID failure"],
    correctIndex: 1,
    explanation: "A shifting payload moves the center of gravity. That can reduce stability, controllability, and the margin available for the flight controller."
  },
  {
    id: "exam-performance-5",
    topic: "Loading & Performance",
    prompt: "Why should a remote pilot verify the manufacturer's maximum takeoff weight before adding accessories?",
    choices: ["Accessories always improve endurance", "Exceeding weight limits can reduce performance and may move the aircraft outside small UAS limits", "Weight only matters above 1,200 ft AGL", "The FAA requires every payload to be painted"],
    correctIndex: 1,
    explanation: "Extra equipment increases weight, can degrade performance, and must keep the aircraft within manufacturer limits and under the Part 107 small UAS weight limit."
  },
  {
    id: "exam-performance-6",
    topic: "Loading & Performance",
    prompt: "How does operating near the low-voltage limit affect a small UAS?",
    choices: ["It improves reserve power", "Voltage sag under load can trigger forced landing or loss of control", "It turns off wind effects", "It increases lift from the propellers"],
    correctIndex: 1,
    explanation: "Low battery voltage can sag under load, especially during climbs or gusts, causing reduced power, forced landing, or loss of control."
  },
  {
    id: "exam-performance-7",
    topic: "Loading & Performance",
    prompt: "What is the practical effect of a heavier aircraft during a braking or avoidance maneuver?",
    choices: ["It stops in a shorter distance", "It has more inertia and may need more distance to stop or turn", "It ignores wind gusts completely", "It no longer needs VLOS"],
    correctIndex: 1,
    explanation: "More mass means more inertia. A heavier aircraft may respond more slowly and require more distance to stop, turn, or recover."
  },
  {
    id: "exam-performance-8",
    topic: "Loading & Performance",
    prompt: "A drone is launched from a rooftop on a hot day. Why can performance be worse than expected?",
    choices: ["High temperature lowers density altitude", "Rooftop heat and high temperature can increase density altitude and reduce thrust", "Altitude above ground improves battery chemistry", "The aircraft is exempt from weight limits on roofs"],
    correctIndex: 1,
    explanation: "Hot air over surfaces and higher launch elevation increase density altitude. Thinner air reduces propeller thrust and climb performance."
  },
  {
    id: "exam-performance-9",
    topic: "Loading & Performance",
    prompt: "Why should the remote PIC account for wind when estimating battery reserve?",
    choices: ["Groundspeed and power required can change significantly on the return leg", "Wind only affects fixed-wing aircraft", "Wind always improves battery endurance", "Battery reserve is unrelated to flight path"],
    correctIndex: 0,
    explanation: "A headwind reduces groundspeed and can require more power. Battery planning must include enough reserve to return against the wind."
  },
  {
    id: "exam-performance-10",
    topic: "Loading & Performance",
    prompt: "What is the safest way to evaluate performance after installing a new payload mount?",
    choices: ["Start the paid mission immediately", "Perform a controlled hover and maneuver check in a safe area before the mission", "Assume the autopilot will compensate for all changes", "Only check that the camera feed works"],
    correctIndex: 1,
    explanation: "A new mount can affect balance, vibration, and control response. Test hover, climb, braking, and maneuvering in a safe area first."
  },
  {
    id: "exam-performance-11",
    topic: "Loading & Performance",
    prompt: "What is one likely effect of propeller damage on a small UAS?",
    choices: ["Reduced vibration and better efficiency", "Imbalance, vibration, and possible motor stress", "Automatic airspace authorization", "More accurate compass calibration"],
    correctIndex: 1,
    explanation: "Damaged propellers can create imbalance and vibration, which can stress motors, degrade sensor readings, and cause loss of control."
  },
  {
    id: "exam-performance-12",
    topic: "Loading & Performance",
    prompt: "Which condition most reduces available climb performance?",
    choices: ["Cool dry air at sea level with a light payload", "Hot humid air at high elevation with a heavy payload", "Cold air with a fully charged battery", "Low elevation with no wind"],
    correctIndex: 1,
    explanation: "Hot, high, humid conditions reduce air density, and a heavy payload increases power required. Together they sharply reduce climb performance."
  },
  {
    id: "exam-performance-13",
    topic: "Loading & Performance",
    prompt: "A small UAS repeatedly tilts to one side while hovering after a payload change. What should the remote PIC suspect first?",
    choices: ["A TFR has activated", "The payload may be unbalanced or mounted off center", "Visibility is below minimum", "The exam score is too low"],
    correctIndex: 1,
    explanation: "A hover bias after a payload change suggests a balance or mounting issue. Land and correct the loading before continuing."
  },
  {
    id: "exam-performance-14",
    topic: "Loading & Performance",
    prompt: "Why is takeoff from tall grass or loose gravel a performance and safety concern?",
    choices: ["It can obstruct propellers, ingest debris, or destabilize the aircraft", "It increases battery capacity", "It eliminates the need for a preflight inspection", "It improves GPS reception"],
    correctIndex: 0,
    explanation: "Grass and debris can contact propellers or be thrown into the aircraft. Use a clear, stable launch surface."
  },
  {
    id: "exam-performance-15",
    topic: "Loading & Performance",
    prompt: "What is the most conservative action if actual flight time is consistently shorter than planned?",
    choices: ["Reduce reserve requirements", "Shorten the mission profile and investigate battery, payload, wind, and temperature factors", "Disable low-battery warnings", "Fly farther to recalibrate the estimate"],
    correctIndex: 1,
    explanation: "Unexpected endurance loss needs investigation. Reduce mission demands and check battery condition, payload weight, wind, and temperature before relying on the aircraft."
  },
  {
    id: "exam-reg-3",
    topic: "Regulations",
    prompt: "What is the maximum groundspeed allowed for standard Part 107 operations?",
    choices: ["60 mph", "87 knots", "100 mph", "120 knots"],
    correctIndex: 2,
    explanation: "Standard Part 107 operations are limited to 100 mph groundspeed unless a waiver applies."
  },
  {
    id: "exam-reg-4",
    topic: "Regulations",
    prompt: "What is the normal maximum altitude for a Part 107 flight away from structures?",
    choices: ["200 ft AGL", "400 ft AGL", "700 ft AGL", "1,200 ft AGL"],
    correctIndex: 1,
    explanation: "The standard Part 107 altitude limit is 400 ft AGL unless a structure-related allowance or waiver applies."
  },
  {
    id: "exam-reg-5",
    topic: "Regulations",
    prompt: "How close may a Part 107 aircraft operate to a structure above 400 ft AGL under the standard structure allowance?",
    choices: ["Within 100 ft laterally", "Within 400 ft laterally", "Within 1 NM", "No closer than 500 ft"],
    correctIndex: 1,
    explanation: "Part 107 allows operation within 400 ft of a structure and not higher than 400 ft above the structure's immediate uppermost limit."
  },
  {
    id: "exam-reg-6",
    topic: "Regulations",
    prompt: "Who is directly responsible for and has final authority over a Part 107 operation?",
    choices: ["The visual observer", "The remote pilot in command", "The property owner", "The aircraft manufacturer"],
    correctIndex: 1,
    explanation: "The remote PIC has final authority and responsibility for the safe conduct of the small UAS operation."
  },
  {
    id: "exam-reg-7",
    topic: "Regulations",
    prompt: "Under Part 107, what must the remote PIC do before flight regarding the aircraft?",
    choices: ["Ask the FAA to inspect it", "Ensure it is in a condition for safe operation", "Remove all manufacturer labels", "File a flight plan for every operation"],
    correctIndex: 1,
    explanation: "Before flight, the remote PIC must ensure the small UAS is in a condition for safe operation."
  },
  {
    id: "exam-reg-8",
    topic: "Regulations",
    prompt: "When must a Part 107 accident be reported to the FAA?",
    choices: ["Only when the aircraft is destroyed", "Within 10 days if it causes serious injury, loss of consciousness, or qualifying property damage", "Within 24 hours for every hard landing", "Only if it occurs in controlled airspace"],
    correctIndex: 1,
    explanation: "Part 107 accident reports are due within 10 days when the event meets the injury or property-damage reporting threshold."
  },
  {
    id: "exam-reg-9",
    topic: "Regulations",
    prompt: "What is required for routine Part 107 night operations?",
    choices: ["A medical certificate", "Anti-collision lighting visible for at least 3 statute miles", "An instrument rating", "A visual observer with night vision goggles"],
    correctIndex: 1,
    explanation: "Routine night operations require anti-collision lighting visible for at least 3 statute miles and with a flash rate sufficient to avoid collision."
  },
  {
    id: "exam-reg-10",
    topic: "Regulations",
    prompt: "May a person who does not hold a remote pilot certificate manipulate the controls during a Part 107 operation?",
    choices: ["No, never", "Yes, if directly supervised by a remote PIC who can immediately take control", "Yes, only in Class G and below 100 ft", "Yes, if the person owns the property"],
    correctIndex: 1,
    explanation: "A non-certificated person may manipulate the controls if under the direct supervision of a remote PIC who can immediately take control."
  },
  {
    id: "exam-reg-11",
    topic: "Regulations",
    prompt: "What is the rule for dropping an object from a small UAS?",
    choices: ["It is always prohibited", "It is allowed only if it does not create an undue hazard to people or property", "It is allowed only over water", "It requires a medical certificate"],
    correctIndex: 1,
    explanation: "Part 107 permits dropping objects only if the operation does not create an undue hazard to people or property."
  },
  {
    id: "exam-reg-12",
    topic: "Regulations",
    prompt: "Which operation normally requires a Part 107 waiver?",
    choices: ["Flying in Class G below 400 ft AGL with VLOS", "Operating beyond visual line of sight", "Checking NOTAMs before flight", "Using a visual observer"],
    correctIndex: 1,
    explanation: "Beyond visual line of sight is outside standard Part 107 operating limits and normally requires a waiver."
  },
  {
    id: "exam-reg-13",
    topic: "Regulations",
    prompt: "What does Part 107 require for visual line of sight?",
    choices: ["The aircraft must be visible to the remote PIC or visual observer without vision aids other than corrective lenses", "The aircraft may be tracked only on a map display", "Binoculars may be used as the primary viewing method", "VLOS is required only in controlled airspace"],
    correctIndex: 0,
    explanation: "Part 107 requires visual line of sight using unaided vision, except for corrective lenses. Displays do not replace VLOS."
  },
  {
    id: "exam-reg-14",
    topic: "Regulations",
    prompt: "What is the maximum allowed weight for a small unmanned aircraft operated under Part 107?",
    choices: ["Less than 25 pounds", "Less than 55 pounds including anything attached or carried", "55 pounds empty weight plus payload", "Less than 100 pounds with registration"],
    correctIndex: 1,
    explanation: "A small unmanned aircraft under Part 107 must weigh less than 55 pounds, including everything attached to or carried by the aircraft."
  },
  {
    id: "exam-reg-15",
    topic: "Regulations",
    prompt: "Can a remote PIC operate multiple small UAS at the same time under standard Part 107 rules?",
    choices: ["Yes, if each drone is below 250 grams", "No, a person may not act as remote PIC or visual observer for more than one small UAS at the same time", "Yes, if all drones remain below 100 ft", "Yes, only in Class G airspace"],
    correctIndex: 1,
    explanation: "Standard Part 107 prohibits a person from acting as remote PIC or visual observer for more than one small UAS operation at a time."
  },
  {
    id: "exam-ops-12",
    topic: "Operations",
    prompt: "A visual observer loses sight of the drone while the remote PIC is watching the controller screen. What is the correct response?",
    choices: ["Continue if telemetry is normal", "Reestablish VLOS immediately or safely terminate the flight", "Climb until the drone is visible", "Switch to map view and continue"],
    correctIndex: 1,
    explanation: "Telemetry does not replace VLOS. If VLOS cannot be maintained, the crew must regain it immediately or safely terminate the operation."
  },
  {
    id: "exam-ops-13",
    topic: "Operations",
    prompt: "What is the best reason to brief emergency landing zones before takeoff?",
    choices: ["It satisfies aircraft registration", "It reduces decision time if a battery, link, or propulsion problem occurs", "It replaces weather planning", "It allows flight over people without limits"],
    correctIndex: 1,
    explanation: "Preselecting emergency landing zones makes a time-critical failure response faster and more deliberate."
  },
  {
    id: "exam-ops-14",
    topic: "Operations",
    prompt: "What should a remote pilot do after a lost-link event if the aircraft returns and lands normally?",
    choices: ["Launch again immediately", "Stop and diagnose the cause before further flight", "Disable return-to-home", "Only replace the propellers"],
    correctIndex: 1,
    explanation: "A lost-link event indicates a control or signal problem. Diagnose distance, interference, antennas, settings, and equipment before flying again."
  },
  {
    id: "exam-ops-15",
    topic: "Operations",
    prompt: "Why should a remote pilot brief a visual observer on sterile cockpit expectations?",
    choices: ["To prevent nonessential conversation during critical phases or abnormal events", "To make the observer responsible for the certificate", "To eliminate the need for checklists", "To replace the site survey"],
    correctIndex: 0,
    explanation: "Sterile cockpit discipline keeps crew attention on safety-critical tasks during takeoff, landing, traffic conflicts, and abnormal situations."
  },
  {
    id: "exam-adm-5",
    topic: "Operations",
    prompt: "A pilot says, 'I need to decide right now before the client gets upset.' Which hazardous attitude is most involved?",
    choices: ["Impulsivity", "Macho", "Resignation", "Anti-authority"],
    correctIndex: 0,
    explanation: "Impulsivity is the urge to act without thinking. The antidote is to slow down and think first."
  },
  {
    id: "exam-adm-6",
    topic: "Operations",
    prompt: "In the PAVE checklist, which category includes a forecast for gusty winds and low ceilings?",
    choices: ["Pilot", "Aircraft", "enVironment", "External pressures"],
    correctIndex: 2,
    explanation: "PAVE stands for Pilot, Aircraft, enVironment, and External pressures. Weather and airspace conditions are part of the environment."
  },
  {
    id: "exam-adm-7",
    topic: "Operations",
    prompt: "A pilot feels there is nothing they can do after the drone begins drifting toward trees. Which hazardous attitude is this?",
    choices: ["Macho", "Resignation", "Invulnerability", "Anti-authority"],
    correctIndex: 1,
    explanation: "Resignation is the belief that the pilot is helpless. The antidote is: 'I am not helpless. I can make a difference.'"
  },
  {
    id: "exam-phys-5",
    topic: "Operations",
    prompt: "Which scanning technique improves the chance of seeing other aircraft while maintaining VLOS?",
    choices: ["Stare at one point without moving the eyes", "Use short, regularly spaced eye movements and pause to focus", "Look only at the controller screen", "Scan only when the visual observer speaks"],
    correctIndex: 1,
    explanation: "Effective visual scanning uses short eye movements with brief pauses, allowing the eyes to detect traffic instead of sweeping past it."
  },
  {
    id: "exam-phys-6",
    topic: "Operations",
    prompt: "A pilot slept poorly and feels irritable before a complex flight. Which IMSAFE factor is most directly involved?",
    choices: ["Illness", "Medication", "Fatigue", "Alcohol"],
    correctIndex: 2,
    explanation: "Poor sleep and irritability point to fatigue, which degrades attention, judgment, and reaction time."
  },
  {
    id: "exam-maint-5",
    topic: "Operations",
    prompt: "Why should compass calibration be done only when needed and away from metal objects or power lines?",
    choices: ["Nearby magnetic interference can teach the compass the wrong reference", "Calibration legally replaces Remote ID", "Power lines improve calibration accuracy", "Calibration is only for camera color balance"],
    correctIndex: 0,
    explanation: "Magnetic interference can corrupt calibration. Calibrate only when needed and in an area free of metal structures, vehicles, and power lines."
  }
];

export function getQuestionsForModule(moduleId: string) {
  return moduleQuestions.filter((question) => question.moduleId === moduleId);
}
