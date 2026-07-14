import type { Module } from "@/lib/types";
import { ACS_TOPIC_WEIGHTS, FAA_UAS_ACS_SOURCE } from "@/lib/acs-weights";
import {
  GOVERNED_FACTS,
  NON_CEILING_CLOUD_CLEARANCE_REMINDER,
  OPERATIONS_OVER_PEOPLE_SUMMARIES,
  SAFETY_EVENT_REPORTING_SUMMARY,
  SMALL_UAS_WEIGHT_SUMMARY,
  describeCloudCeilingLimit,
} from "@/lib/regulatory-sources";

const faaPilotSource = {
  label: "FAA: Become a Certificated Remote Pilot",
  href: "https://www.faa.gov/uas/commercial_operators/become_a_drone_pilot"
};

const faaCommercialSource = {
  label: "FAA: Certificated Remote Pilots",
  href: "https://www.faa.gov/uas/commercial_operators"
};

const faaPeopleSource = {
  label: "FAA: Operations Over People",
  href: "https://www.faa.gov/uas/commercial_operators/operations_over_people"
};

const faaWaiverSource = {
  label: "FAA: Part 107 Waivers",
  href: "https://www.faa.gov/uas/commercial_operators/part_107_waivers"
};

const faaAirspaceSource = {
  label: "FAA: Airspace Classifications",
  href: "https://www.faa.gov/air_traffic/publications/"
};

const faaTfrSource = {
  label: "FAA: Temporary Flight Restrictions",
  href: "https://tfr.faa.gov/"
};

const faaSuasSource = {
  label: "FAA Aeronautical Chart User's Guide",
  href: "https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/"
};

const ecfrOperatingLimitsSource = {
  label: "eCFR: 14 CFR § 107.51 Operating Limitations",
  href: "https://www.ecfr.gov/current/title-14/part-107/section-107.51"
};

const ecfrPart107AlcoholSource = {
  label: "eCFR: 14 CFR § 107.27 Alcohol or Drugs",
  href: "https://www.ecfr.gov/current/title-14/part-107/section-107.27"
};

const ecfrPart91AlcoholSource = {
  label: "eCFR: 14 CFR § 91.17 Alcohol or Drugs",
  href: "https://www.ecfr.gov/current/title-14/part-91/section-91.17"
};

const faaSampleQuestionsSource = {
  label: "FAA: UAG Sample Questions and Testing Supplement Guidance",
  href: "https://www.faa.gov/sites/faa.gov/files/training_testing/testing/test_questions/uag_questions.pdf"
};

const moduleBlueprints = [
  {
    id: "1",
    number: 1,
    title: "Welcome & Getting Started",
    description: "The certification path, test format, core terms, and how to use this course.",
    estimatedMinutes: 28,
    topicArea: "Operations",
    slides: [
      {
        id: "m1-1",
        kicker: "Orientation",
        title: "Your Part 107 Flight Plan",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 is the FAA rule set for most non-recreational small UAS operations. This course is built as a practical study cockpit: short slides, knowledge checks, flashcards, and a timed exam mode."
          },
          {
            type: "bullets",
            items: [
              "Use slides for the main lesson.",
              "Use quizzes to test recall immediately after a module.",
              "Use flashcards for terms, limits, and process steps.",
              "Use the practice exam to build pace and topic awareness."
            ]
          },
          {
            type: "callout",
            title: "How to use this course",
            text: "Start with Module 1 for orientation and exam format. Work through modules in order or jump to weak areas identified by your practice exam results. All 13 modules are fully built."
          }
        ],
        sources: [faaPilotSource],
        takeaway: "Part 107 governs most commercial small UAS flights. Use these modules in any order, but aim to complete all 13 before attempting the practice exam."
      },
      {
        id: "m1-2",
        kicker: "Certificate Basics",
        title: "What Part 107 Means",
        blocks: [
          {
            type: "paragraph",
            text: "A Remote Pilot Certificate shows that you understand the operating rules, safety procedures, and airspace responsibilities required to fly a small UAS under Part 107."
          },
          {
            type: "bullets",
            items: [
              `Small UAS means an unmanned aircraft that is ${SMALL_UAS_WEIGHT_SUMMARY.toLowerCase()}.`,
              "Part 107 covers work, business, public safety, education, and many other non-recreational operations.",
              "Recreational flying has a separate rule path, but Part 107 is the professional credential."
            ]
          }
        ],
        sources: [faaPilotSource, faaCommercialSource]
      },
      {
        id: "m1-3",
        kicker: "Eligibility",
        title: "Who Can Become a Remote Pilot?",
        blocks: [
          {
            type: "table",
            headers: ["Requirement", "What it means"],
            rows: [
              ["Age", "Be at least 16 years old."],
              ["Language", "Be able to read, speak, write, and understand English."],
              ["Fitness", "Be in a physical and mental condition to safely fly a drone."],
              ["Knowledge", "Pass the Unmanned Aircraft General - Small knowledge test."]
            ]
          },
          {
            type: "callout",
            title: "Operational mindset",
            text: "The FAA is not only checking memory. It expects a pilot who can make safe decisions before and during a flight."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m1-4",
        kicker: "Process",
        title: "FTN to Certificate",
        blocks: [
          {
            type: "diagram",
            title: "First-time pilot sequence",
            items: [
              "Create an IACRA profile and get an FAA Tracking Number.",
              "Schedule the UAG knowledge test with an FAA-approved testing center.",
              "Pass the knowledge test.",
              "Complete FAA Form 8710-13 in IACRA.",
              "Complete TSA background processing.",
              "Print the temporary certificate, then wait for the permanent card."
            ]
          },
          {
            type: "callout",
            title: "Bring ID",
            text: "The FAA process points students to an approved testing center and requires a government-issued photo ID at the test appointment."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m1-5",
        kicker: "Test Format",
        title: "Know the Exam You Are Training For",
        blocks: [
          {
            type: "table",
            headers: ["Exam item", "Value"],
            rows: [
              ["Test code", "UAG - Unmanned Aircraft General - Small"],
              ["Questions", `${GOVERNED_FACTS.acsWeighting.totalQuestions} multiple-choice questions`],
              ["Time", `${GOVERNED_FACTS.acsWeighting.testingTimeMinutes} minutes`],
              ["Passing score", "70 percent"],
              ["Minimum correct", "42 of 60"]
            ]
          },
          {
            type: "bullets",
            items: [
              "Train to answer steadily, not just quickly.",
              "Read every answer choice before selecting.",
              "Flag hard questions and return after banking easier points."
            ]
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m1-6",
        kicker: "ACS Map",
        title: "What the FAA Expects You to Know",
        blocks: [
          {
            type: "bullets",
            items: [
              "Regulations, privileges, limitations, and flight operation.",
              "Airspace classification, operating requirements, and restrictions.",
              "Weather sources and weather effects on performance.",
              "Loading, performance, emergency procedures, and maintenance.",
              "Crew resource management, radio communication, physiology, and airport operations."
            ]
          },
          {
            type: "callout",
            title: "Study strategy",
            text: "Use the practice exam topic breakdown to spot weak areas, then return to the matching module."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m1-7",
        kicker: "Glossary",
        title: "Terms You Will See Immediately",
        blocks: [
          {
            type: "table",
            headers: ["Term", "Plain-language meaning"],
            rows: [
              ["Remote PIC", "The remote pilot in command responsible for the operation."],
              ["Small UAS", SMALL_UAS_WEIGHT_SUMMARY],
              ["VLOS", "Visual line of sight with unaided vision except corrective lenses."],
              ["LAANC", "The FAA system used for near real-time controlled airspace authorizations."],
              ["AGL", "Altitude above ground level."],
              ["NOTAM", "Notice to Air Missions with time-sensitive aviation information."]
            ]
          }
        ]
      },
      {
        id: "m1-8",
        kicker: "How to Study",
        title: "A Simple Weekly Rhythm",
        blocks: [
          {
            type: "bullets",
            items: [
              "Day 1: Read slides and make a first quiz attempt.",
              "Day 2: Review missed explanations and run flashcards.",
              "Day 3: Take a timed mini exam and review weak areas.",
              "Repeat the cycle until scores are consistently above passing."
            ]
          },
          {
            type: "callout",
            title: "Practical habit",
            text: "When a rule has a number in it, turn it into a flashcard. The real test loves operational limits."
          }
        ]
      }
    ]
  },
  {
    id: "2",
    number: 2,
    title: "FAA Regulations",
    description: "The core Part 107 rules: certificate duties, registration, operating limits, waivers, Remote ID, and LAANC.",
    estimatedMinutes: 42,
    topicArea: "Regulations",
    slides: [
      {
        id: "m2-1",
        kicker: "Rule Framework",
        title: "Part 107 Applies to Professional Small UAS Operations",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 is the FAA operating framework for small UAS flown for work or business. The rules cover who may operate, where flights may occur, and which limits require authorization or waiver."
          },
          {
            type: "bullets",
            items: [
              `Small UAS must be ${SMALL_UAS_WEIGHT_SUMMARY.toLowerCase()}.`,
              "The remote pilot certificate must be available during operations.",
              "The remote pilot is responsible for the safety of the operation.",
              "Operations outside normal limitations require a waiver or authorization where applicable."
            ]
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m2-2",
        kicker: "Registration",
        title: "Register the Aircraft Before You Fly",
        blocks: [
          {
            type: "bullets",
            items: [
              "Part 107 operators register through FAADroneZone.",
              "All drones operated under Part 107 must be registered, regardless of weight.",
              "The 0.55-pound threshold is a limited exception for recreational operations, not Part 107.",
              "Part 107 registration is tied to each aircraft, not one number for every drone.",
              `Registration is valid for ${GOVERNED_FACTS.registration.validityYears} years.`
            ]
          },
          {
            type: "callout",
            title: "Do not mix categories",
            text: "A drone registered only for recreational operations cannot be used under Part 107 until it is registered appropriately."
          }
        ],
        sources: [
          {
            label: "FAA: Drone Registration Requirements",
            href: "https://www.faa.gov/faq/do-i-need-register-my-drone-and-if-so-how-do-i-register"
          }
        ]
      },
      {
        id: "m2-3",
        kicker: "Operating Limits",
        title: "The Numbers You Must Know",
        blocks: [
          {
            type: "table",
            headers: ["Limit", "Part 107 baseline"],
            rows: [
              ["Altitude", `${GOVERNED_FACTS.operatingLimitations.standardMaxAltitudeAglFeet} ft AGL, or within ${GOVERNED_FACTS.operatingLimitations.structureRadiusFeet} ft of a structure and no more than ${GOVERNED_FACTS.operatingLimitations.maxHeightAboveStructureFeet} ft above its uppermost limit.`],
              ["Speed", `${GOVERNED_FACTS.operatingLimitations.maxGroundspeedMph} mph (${GOVERNED_FACTS.operatingLimitations.maxGroundspeedKnots} knots) groundspeed.`],
              ["Visibility", `At least ${GOVERNED_FACTS.airspaceWeather.minimumVisibilitySm} statute miles from the control station.`],
              ["Cloud clearance", `${GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet} ft below clouds and ${GOVERNED_FACTS.airspaceWeather.cloudClearanceHorizontalFeet.toLocaleString("en-US")} ft horizontally.`],
              ["Aircraft weight", `${SMALL_UAS_WEIGHT_SUMMARY}.`]
            ]
          },
          {
            type: "callout",
            title: "Exam clue",
            text: "When an answer choice changes miles to feet, knots to mph, or AGL to MSL, slow down."
          }
        ],
        sources: [ecfrOperatingLimitsSource]
      },
      {
        id: "m2-4",
        kicker: "Visual Line of Sight",
        title: "VLOS Is a Core Safety Rule",
        blocks: [
          {
            type: "bullets",
            items: [
              "The remote pilot or visual observer must be able to see the aircraft with unaided vision.",
              "Corrective lenses are allowed.",
              "VLOS supports traffic avoidance, attitude awareness, and hazard recognition.",
              "Beyond visual line of sight operations require a waiver."
            ]
          },
          {
            type: "callout",
            title: "Remote PIC responsibility",
            text: "A visual observer can help, but the remote pilot in command remains responsible for safe operation."
          }
        ],
        sources: [faaCommercialSource, faaWaiverSource]
      },
      {
        id: "m2-5",
        kicker: "Right of Way",
        title: "Other Aircraft and Vehicles Come First",
        blocks: [
          {
            type: "bullets",
            items: [
              `Small UAS must ${GOVERNED_FACTS.operatingLimitations.rightOfWaySummary.toLowerCase()}.`,
              "Never create a collision hazard.",
              "Avoid airport environments unless you understand the airspace and authorization requirements.",
              "If safety is uncertain, terminate or delay the flight."
            ]
          }
        ],
        sources: [faaCommercialSource, faaPeopleSource]
      },
      {
        id: "m2-6",
        kicker: "Crew Fitness",
        title: "Alcohol, Drugs, and Condition for Safe Flight",
        blocks: [
          {
            type: "table",
            headers: ["Rule area", "Operational takeaway"],
            rows: [
              ["Alcohol", `Do not operate within ${GOVERNED_FACTS.alcoholDrugRestrictions.lookbackHours} hours after consuming alcohol.`],
              ["Alcohol concentration", `Do not operate with an alcohol concentration of ${GOVERNED_FACTS.alcoholDrugRestrictions.prohibitedConcentrationAtOrAbove} or greater in blood or breath.`],
              ["Impairment", "Do not operate while under the influence of alcohol or while using any drug that affects faculties contrary to safety."],
              ["Medical fitness", "Do not fly when your physical or mental condition makes the operation unsafe."],
              ["Crew judgment", "Use IMSAFE-style self-checks before acting as remote PIC."]
            ]
          }
        ],
        sources: [ecfrPart107AlcoholSource, ecfrPart91AlcoholSource]
      },
      {
        id: "m2-7",
        kicker: "Night Operations",
        title: "Night Flight Is Routine Only Under Conditions",
        blocks: [
          {
            type: "bullets",
            items: [
              "Part 107 pilots may fly at night without a waiver when rule requirements are met.",
              "The remote pilot must have completed updated initial testing or recurrent training that includes night operations.",
              "The aircraft must have anti-collision lighting visible for at least 3 statute miles.",
              "Controlled airspace still requires authorization."
            ]
          }
        ],
        sources: [faaCommercialSource, faaPeopleSource]
      },
      {
        id: "m2-8",
        kicker: "People and Vehicles",
        title: "Operations Over People Use Categories",
        blocks: [
          {
            type: "table",
            headers: ["Category", "High-level idea"],
            rows: OPERATIONS_OVER_PEOPLE_SUMMARIES.map(({ category, rule }) => [
              category,
              rule,
            ])
          },
          {
            type: "callout",
            title: "Remote ID matters",
            text: "Sustained flight over open-air assemblies has Remote ID conditions in the FAA operations-over-people rule."
          }
        ],
        sources: [faaPeopleSource]
      },
      {
        id: "m2-9",
        kicker: "Reporting",
        title: "Safety Event Reporting",
        blocks: [
          {
            type: "bullets",
            items: [
              `Report qualifying safety events to the FAA within ${GOVERNED_FACTS.operatingLimitations.safetyEventReportDays} days.`,
              "A qualifying event includes serious injury or loss of consciousness.",
              `Property damage qualifies only when it is to property other than the small unmanned aircraft and repair cost or fair-market value exceeds $${GOVERNED_FACTS.operatingLimitations.propertyDamageThresholdExclusiveDollars}.`,
              "Good operational records make reporting faster and more accurate."
            ]
          },
          {
            type: "callout",
            title: "Study note",
            text: SAFETY_EVENT_REPORTING_SUMMARY
          }
        ]
      },
      {
        id: "m2-10",
        kicker: "Remote ID",
        title: "Remote ID Is the Digital License Plate",
        blocks: [
          {
            type: "paragraph",
            text: "Remote ID allows identification and location information from a drone in flight to be received by other parties. Most drones that require registration must comply unless an exception applies."
          },
          {
            type: "bullets",
            items: [
              "Standard Remote ID may be built into the aircraft.",
              "A broadcast module can be used for some aircraft.",
              "Part 107 pilots register each device separately in inventory.",
              "Remote ID supports airspace integration and public safety response."
            ]
          }
        ],
        sources: [
          {
            label: "FAA: Remote Identification of Drones",
            href: "https://www.faa.gov/uas/getting_started/remote_id"
          }
        ]
      },
      {
        id: "m2-11",
        kicker: "Authorization",
        title: "LAANC and Controlled Airspace",
        blocks: [
          {
            type: "bullets",
            items: [
              GOVERNED_FACTS.airspaceWeather.authorizationSummary,
              "LAANC can provide near real-time authorization in participating areas.",
              "Authorization is not the same thing as a waiver.",
              "Night operations in controlled airspace still need airspace authorization."
            ]
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m2-12",
        kicker: "Waivers",
        title: "Waivers Are for Operations Outside Published Limits",
        blocks: [
          {
            type: "paragraph",
            text: "A waiver is FAA approval to deviate from a specific Part 107 rule while still flying safely using alternative methods."
          },
          {
            type: "bullets",
            items: [
              "Examples include BVLOS, multiple small UAS, some moving vehicle operations, and operating beyond normal limits.",
              "The application must explain hazards, mitigations, personnel, aircraft, location, and procedures.",
              "Airspace authorization remains separate from operational waivers."
            ]
          }
        ],
        sources: [faaWaiverSource]
      }
    ]
  },
  {
    id: "3",
    number: 3,
    title: "National Airspace System",
    description: "Airspace classes, special use airspace, MTRs, TFRs, and NOTAMs.",
    estimatedMinutes: 35,
    topicArea: "Airspace",
    slides: [
      {
        id: "m3-1",
        kicker: "Airspace Basics",
        title: "Why Airspace Matters for Drone Pilots",
        blocks: [
          {
            type: "paragraph",
            text: "The FAA divides the sky into different classes of airspace — some controlled by air traffic control, some not. As a Part 107 pilot, knowing which airspace you're in determines whether you can fly freely or need authorization first."
          },
          {
            type: "bullets",
            items: [
              "Controlled airspace: Class B, C, D, and some Class E — ATC manages traffic here.",
              "Uncontrolled airspace: Class G — no ATC services, often your best bet for drone operations.",
              "Most Part 107 pilots fly in Class G most of the time. Authorization opens up the rest.",
              "Flying in controlled airspace without authorization can result in enforcement action."
            ]
          },
          {
            type: "callout",
            title: "Test tip",
            text: GOVERNED_FACTS.airspaceWeather.authorizationSummary
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m3-2",
        kicker: "Class B",
        title: "Class B — The Big One",
        blocks: [
          {
            type: "paragraph",
            text: "Class B airspace surrounds the nation's busiest airports. It is shaped like an upside-down wedding cake with multiple layers extending outward and upward. Think Atlanta, Chicago O'Hare, LAX."
          },
          {
            type: "table",
            headers: ["Characteristic", "Class B detail"],
            rows: [
              ["Shape", "Upside-down wedding cake — multiple layered shelves"],
              ["Top altitude", "Typically 10,000 ft MSL"],
              ["Manned-aircraft entry", "ATC clearance required"],
              ["Part 107 authorization", "Required — LAANC or manual FAA authorization"],
              ["Equipment", "Mode C transponder and two-way radio for manned aircraft"]
            ]
          },
          {
            type: "callout",
            title: "Drone reality",
            text: "Class B authorization for drones is restrictive. Most pilots avoid it unless they have a specific operational need and a solid LAANC approval in hand."
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m3-3",
        kicker: "Class C",
        title: "Class C — Mid-Size Airport Protection",
        blocks: [
          {
            type: "paragraph",
            text: "Class C airspace surrounds mid-size airports with operating control towers and radar services. It has a two-ring structure: an inner ring (5 NM radius) from surface to 1,200 AGL, and an outer ring (10 NM radius) from 1,200 to 4,000 AGL."
          },
          {
            type: "bullets",
            items: [
              "Inner ring: 5 NM radius, surface to 1,200 ft AGL.",
              "Outer ring: 10 NM radius, 1,200 ft AGL to 4,000 ft AGL.",
              "Part 107 authorization is required for operations in Class C.",
              "Two-way radio communication is required for manned aircraft entry."
            ]
          },
          {
            type: "callout",
            title: "Memory anchor",
            text: "Class C = \"Crowded\" but not the busiest. Two rings, authorization required."
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m3-4",
        kicker: "Class D",
        title: "Class D — The Towered Airport Ring",
        blocks: [
          {
            type: "paragraph",
            text: "Class D airspace surrounds airports with an operating control tower. It is typically a single cylinder with a 4-5 NM radius from surface to 2,500 ft AGL. The airspace only exists when the tower is operating."
          },
          {
            type: "table",
            headers: ["Characteristic", "Class D detail"],
            rows: [
              ["Shape", "Single cylinder around the airport"],
              ["Radius", "Typically 4-5 nautical miles"],
              ["Vertical limit", "Surface to 2,500 ft AGL (individually tailored)"],
              ["When active", "Only when the control tower is operating"],
              ["Drone authorization", "Required — LAANC or manual"]
            ]
          },
          {
            type: "callout",
            title: "Key exam concept",
            text: "When the Class D tower closes, the airspace typically reverts to Class E or G. Know which one — the exam tests this."
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m3-5",
        kicker: "Class E",
        title: "Class E — The Tricky One",
        blocks: [
          {
            type: "paragraph",
            text: "Class E is controlled airspace that is not Class A, B, C, or D. It exists in many configurations: airport surface areas, surface extension areas, transition areas starting at 700 or 1,200 ft AGL, and en route airspace above 14,500 ft MSL."
          },
          {
            type: "bullets",
            items: [
              "Class E at the surface: Dashed magenta boundaries can depict an airport surface area (Class E2) or an extension area.",
              GOVERNED_FACTS.airspaceWeather.authorizationSummary,
              "700 ft AGL Class E: Shaded magenta vignette. Most drone ops below this are unaffected.",
              "1,200 ft AGL Class E: Starts at 1,200 AGL in most of the country. Below 400 ft, you're clear.",
              "En route Class E: Above 14,500 ft MSL. Not relevant for small UAS."
            ]
          },
          {
            type: "callout",
            title: "Exam nuance",
            text: GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m3-6",
        kicker: "Class G",
        title: "Class G — Your Drone's Best Friend",
        blocks: [
          {
            type: "paragraph",
            text: "Class G is uncontrolled airspace — no ATC authority, no clearance required for manned or unmanned aircraft. It is where the vast majority of Part 107 drone operations take place."
          },
          {
            type: "table",
            headers: ["Element", "Class G detail"],
            rows: [
              ["ATC services", "None provided"],
              ["Part 107 authorization", "Not required"],
              ["Part 107 weather minimums", "3 statute miles visibility; 500 ft below and 2,000 ft horizontally from clouds"],
              ["Upper limit", "Varies — typically to 700 ft or 1,200 ft AGL, then becomes Class E"],
              ["Best practice", "Still check for TFRs and NOTAMs before flying"]
            ]
          },
          {
            type: "callout",
            title: "Operational habit",
            text: "Class G doesn't mean 'no rules.' Part 107 operating limits still apply: 400 ft AGL, VLOS, 3 miles visibility, right-of-way."
          }
        ],
        sources: [faaAirspaceSource, ecfrOperatingLimitsSource]
      },
      {
        id: "m3-7",
        kicker: "Special Use",
        title: "Special Use Airspace — Stay Alert",
        blocks: [
          {
            type: "paragraph",
            text: "Special use airspace designates areas where activities may be hazardous to non-participating aircraft. These are marked on sectional charts and often appear in exam questions."
          },
          {
            type: "table",
            headers: ["Type", "Description", "Drone impact"],
            rows: [
              ["Restricted Area", "Hazardous activities (artillery, missiles)", "Requires permission — avoid unless authorized"],
              ["Prohibited Area", "Flight not permitted for security reasons", "Do NOT fly"],
              ["MOA (Military Operations Area)", "Training activities, aerobatics", "Not prohibited but use extreme caution"],
              ["Warning Area", "Same as restricted but over international waters", "Avoid if possible"],
              ["Alert Area", "High volume of pilot training", "Be vigilant, no restriction"]
            ]
          },
          {
            type: "callout",
            title: "Exam pattern",
            text: "The FAA loves questions distinguishing 'restricted' from 'prohibited.' Restricted = permission possible. Prohibited = never."
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m3-8",
        kicker: "MTRs",
        title: "Military Training Routes — Low and Fast",
        blocks: [
          {
            type: "paragraph",
            text: "Military Training Routes are used by military aircraft for low-altitude, high-speed training. VR routes are for visual flight, IR routes for instrument flight. The numbers after the route tell you the segment width."
          },
          {
            type: "bullets",
            items: [
              "VR routes can go as low as the surface. IR routes typically at or above 1,500 AGL.",
              "Routes with 4-digit numbers have segments 4 NM or wider.",
              "Routes with 3-digit numbers have segments narrower than 4 NM — more confined.",
              "MTRs are depicted on sectional charts as gray lines with route numbers.",
              "Aircraft on MTRs may be moving at 250+ knots — you won't see them until they're on top of you."
            ]
          },
          {
            type: "callout",
            title: "Part 107 priority",
            text: "If you're flying near an MTR, stay low, stay visual, and yield right of way. Manned military traffic has priority."
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m3-9",
        kicker: "TFRs",
        title: "Temporary Flight Restrictions — Check Every Flight",
        blocks: [
          {
            type: "paragraph",
            text: "TFRs are temporary airspace restrictions issued for events like presidential movements, disaster response, major sporting events, and space launches. They can pop up with little notice and apply to all aircraft — including drones."
          },
          {
            type: "bullets",
            items: [
              "Check TFRs before every flight: tfr.faa.gov or UAS apps.",
              "Presidential/VIP TFRs: Typically 30 NM outer ring, 10 NM inner — zero tolerance.",
              "Disaster TFRs: Issued for wildfires, floods, hurricanes. Drone interference with firefighting is a federal offense.",
              "Stadium TFRs: Active 1 hour before through 1 hour after major sporting events — 3 NM radius, up to 3,000 AGL.",
              "Violating a TFR can result in certificate suspension, fines, and criminal charges."
            ]
          },
          {
            type: "callout",
            title: "Real-world consequence",
            text: "A drone over a wildfire TFR grounds all firefighting aircraft. The FAA does not go easy on this one."
          }
        ],
        sources: [faaTfrSource]
      },
      {
        id: "m3-10",
        kicker: "NOTAMs",
        title: "NOTAMs — The Preflight Must-Check",
        blocks: [
          {
            type: "paragraph",
            text: "NOTAMs (Notice to Air Missions) provide time-sensitive information about hazards, closures, or changes to the National Airspace System. They are a required preflight check for all pilots — including remote pilots."
          },
          {
            type: "table",
            headers: ["NOTAM type", "What it covers"],
            rows: [
              ["D NOTAM (Distant)", "Airport and facility changes, navaid outages"],
              ["FDC NOTAM", "Regulatory changes to procedures, routes, or airspace"],
              ["TFR NOTAM", "Temporary Flight Restrictions"],
              ["Pointer NOTAM", "Highlights another NOTAM of importance"]
            ]
          },
          {
            type: "bullets",
            items: [
              "Check NOTAMs through 1800wxbrief.com, aviation apps, or FSS.",
              "Filter for NOTAMs relevant to your operating area and altitude.",
              "A 'no NOTAMs' result doesn't mean you skip the check — it means you confirmed the airspace is clear.",
              "Document your NOTAM check as part of your preflight record."
            ]
          }
        ],
        sources: [faaAirspaceSource, faaTfrSource]
      }
    ]
  },
  {
    id: "4",
    number: 4,
    title: "Reading Sectional Charts",
    description: "Chart symbols, airspace boundaries, latitude/longitude, MEFs, and obstacles.",
    estimatedMinutes: 40,
    topicArea: "Airspace",
    slides: [
      {
        id: "m4-1",
        kicker: "Chart Basics",
        title: "Sectional Charts Are Aviation Maps",
        blocks: [
          {
            type: "paragraph",
            text: "A sectional chart is the pilot's map of the National Airspace System. It shows airspace boundaries, airports, obstacles, terrain, navigation aids, special use areas, and other features needed to plan a safe flight."
          },
          {
            type: "bullets",
            items: [
              "Sectionals are updated on a regular FAA chart cycle — use current charts only.",
              "They use colors, symbols, numbers, and line styles to encode information.",
              "Drone pilots use sectionals to identify controlled airspace, obstacles, terrain, and hazards.",
              "The FAA exam expects you to interpret chart excerpts, not just memorize rules."
            ]
          },
          {
            type: "callout",
            title: "Exam mindset",
            text: "Every chart question is a scavenger hunt: locate the symbol, read the surrounding labels, then apply Part 107 limits."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-2",
        kicker: "Latitude & Longitude",
        title: "Finding Position with Lat/Long",
        blocks: [
          {
            type: "paragraph",
            text: "Latitude and longitude identify precise positions on the earth. Latitude lines run east-west and measure north or south of the equator. Longitude lines run north-south and measure east or west of the prime meridian."
          },
          {
            type: "table",
            headers: ["Coordinate", "How to remember it"],
            rows: [
              ["Latitude", "Flatitude — lines run flat east-west; measures north/south"],
              ["Longitude", "Long lines from pole to pole; measures east/west"],
              ["Degrees", "Large divisions, shown with °"],
              ["Minutes", "1/60 of a degree, shown with '"],
              ["Seconds", "1/60 of a minute, shown with \" when used"]
            ]
          },
          {
            type: "callout",
            title: "Drone use",
            text: "Lat/long matters for documenting operating areas, emergency locations, and interpreting chart-based exam questions."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-3",
        kicker: "Airspace Boundaries",
        title: "Lines Tell You Where Controlled Airspace Starts",
        blocks: [
          {
            type: "paragraph",
            text: GOVERNED_FACTS.airspaceWeather.authorizationSummary
          },
          {
            type: "image",
            src: "/images/charts/airspace-boundaries.png",
            alt: "FAA sectional chart airspace boundary depictions showing Class B, C, D, and E boundaries",
            caption: "FAA Chart Users' Guide — airspace boundary depictions. Solid blue = Class B, solid magenta = Class C, dashed blue = Class D, dashed magenta = Class E at the surface (airport surface area or extension)."
          },
          {
            type: "table",
            headers: ["Chart feature", "Meaning"],
            rows: [
              ["Solid blue line", "Class B boundary"],
              ["Solid magenta line", "Class C boundary"],
              ["Dashed blue line", "Class D surface boundary"],
              ["Dashed magenta line", "Class E surface boundary — airport surface area or extension"],
              ["Fuzzy magenta shading", "Class E begins at 700 ft AGL"],
              ["Fuzzy blue shading", "Class E begins at 1,200 ft AGL"]
            ]
          },
          {
            type: "callout",
            title: "Authorization clue",
            text: GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance
          }
        ],
        sources: [faaSuasSource, faaAirspaceSource]
      },
      {
        id: "m4-4",
        kicker: "Class B/C Altitudes",
        title: "Reading Airspace Shelf Numbers",
        blocks: [
          {
            type: "paragraph",
            text: "Class B and C shelves are labeled with altitude limits. These labels show the floor and ceiling of that airspace segment, usually in hundreds of feet MSL."
          },
          {
            type: "bullets",
            items: [
              "A label like 100/40 means ceiling 10,000 ft MSL, floor 4,000 ft MSL.",
              "SFC means the airspace starts at the surface.",
              "A label like 40/SFC means from surface to 4,000 ft MSL.",
              "Part 107 pilots care most about whether the controlled airspace reaches the surface or covers the planned altitude.",
              "Always compare shelf floors to your planned drone altitude."
            ]
          },
          {
            type: "callout",
            title: "Exam trap",
            text: "Airspace shelf numbers are MSL, but drone altitude limits are usually AGL. The test may force you to think about both."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-5",
        kicker: "MEF",
        title: "Maximum Elevation Figures Keep You Terrain-Aware",
        blocks: [
          {
            type: "paragraph",
            text: "Maximum Elevation Figures (MEFs) are large blue numbers inside each quadrangle on a sectional chart. They show the highest elevation — terrain or obstacle — within that area, rounded up for safety."
          },
          {
            type: "image",
            src: "/images/charts/mef-terrain.png",
            alt: "FAA sectional chart MEF and terrain color legend",
            caption: "FAA Chart Users' Guide — MEF explanation and terrain color bands. Green = lower elevation, brown = higher. MEFs show the highest point in each quadrant in hundreds of feet MSL."
          },
          {
            type: "table",
            headers: ["MEF example", "Meaning"],
            rows: [
              ["12", "1,200 ft MSL"],
              ["28", "2,800 ft MSL"],
              ["154", "15,400 ft MSL"],
              ["First digits", "Thousands and hundreds of feet"],
              ["Purpose", "Terrain and obstacle awareness"]
            ]
          },
          {
            type: "callout",
            title: "Drone limitation",
            text: "MEF is MSL terrain/obstacle information. Your Part 107 altitude limit is 400 ft AGL, so don't confuse the two."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-6",
        kicker: "Obstacles",
        title: "Obstacle Symbols Show Towers and Hazards",
        blocks: [
          {
            type: "paragraph",
            text: "Sectionals mark obstacles like towers, antennas, wind turbines, and stacks. Obstacle labels often show two numbers: top elevation MSL and height AGL in parentheses."
          },
          {
            type: "image",
            src: "/images/charts/obstacle-symbols.png",
            alt: "FAA sectional chart obstacle symbols and airport beacons",
            caption: "FAA Chart Users' Guide — obstacle and obstruction symbols. Note how towers show MSL elevation and AGL height in parentheses."
          },
          {
            type: "bullets",
            items: [
              "Example: 1549 (309) means obstacle top is 1,549 ft MSL and height is 309 ft AGL.",
              "AGL in parentheses helps you understand how tall the obstacle is above local terrain.",
              "Lighted obstacles may have additional chart symbology.",
              "Drone pilots must maintain situational awareness around towers and guy wires.",
              "The 400-ft structure allowance depends on distance from the structure and remaining within 400 ft of it."
            ]
          },
          {
            type: "callout",
            title: "Real-world note",
            text: "Guy wires are hard to see and may extend far beyond the tower base. Give towers a wider berth than the symbol suggests."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-7",
        kicker: "Airport Symbols",
        title: "Airport Color and Shape Matter",
        blocks: [
          {
            type: "paragraph",
            text: "Airport symbols tell you whether an airport has a control tower, what type of airport it is, and whether services are available. For drone pilots, the key question is whether the airport sits inside controlled airspace requiring authorization."
          },
          {
            type: "image",
            src: "/images/charts/airport-symbols.png",
            alt: "FAA sectional chart airport symbols and cultural features",
            caption: "FAA Chart Users' Guide — airport and related symbols. Blue = towered, magenta = non-towered. Open circle = hard-surfaced runway; tick marks = services available."
          },
          {
            type: "table",
            headers: ["Symbol feature", "Meaning"],
            rows: [
              ["Blue airport symbol", "Towered airport"],
              ["Magenta airport symbol", "Non-towered airport"],
              ["Open circle", "Hard-surfaced runway longer than 1,500 ft"],
              ["Tick marks", "Fuel/services available"],
              ["Heliport symbol", "Helicopter landing area — expect low-level traffic"]
            ]
          },
          {
            type: "callout",
            title: "Do not assume",
            text: "A non-towered airport can still sit under controlled airspace. Always read the airspace boundary, not just the airport color."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-8",
        kicker: "Terrain & Topography",
        title: "Terrain Colors Show Elevation Changes",
        blocks: [
          {
            type: "paragraph",
            text: "Sectionals use color gradients and contour lines to show terrain elevation. Brown and tan areas indicate higher terrain; green areas generally show lower elevation."
          },
          {
            type: "image",
            src: "/images/charts/mef-terrain.png",
            alt: "FAA sectional chart terrain color bands and MEF legend",
            caption: "FAA Chart Users' Guide — terrain color bands from green (low) to brown (high). Contour lines connect equal elevation; tight spacing = steep terrain."
          },
          {
            type: "bullets",
            items: [
              "Contour lines connect points of equal elevation.",
              "Closer contour lines mean steeper terrain.",
              "Terrain matters for line of sight, signal reliability, emergency landing planning, and wind behavior.",
              "Operating in mountains can make 400 ft AGL harder to judge visually.",
              "Terrain can block your view of manned aircraft, roads, people, and obstacles."
            ]
          },
          {
            type: "callout",
            title: "Part 107 tie-in",
            text: "VLOS is not just seeing a dot. You must know the drone's location, attitude, altitude, and direction of flight. Terrain can defeat that quickly."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m4-9",
        kicker: "Special Symbols",
        title: "Special Use and Other Chart Markings",
        blocks: [
          {
            type: "paragraph",
            text: "Beyond basic airspace, sectionals show special use airspace, wildlife refuges, parachute areas, glider operations, and other hazards that should affect your flight planning."
          },
          {
            type: "image",
            src: "/images/charts/special-use-airspace.png",
            alt: "FAA sectional chart special use airspace symbols including restricted, prohibited, MOA, and SFRA",
            caption: "FAA Chart Users' Guide — special use airspace symbols. Restricted = permission possible, Prohibited = never. Also shows MTR symbols and special flight rules areas."
          },
          {
            type: "table",
            headers: ["Marking", "Why it matters"],
            rows: [
              ["Restricted/prohibited boundaries", "May prevent flight or require permission"],
              ["MOA boundaries", "Military training may be active"],
              ["Parachute symbols", "Jump aircraft and parachutists may be present"],
              ["Glider symbols", "Unpowered aircraft may operate nearby"],
              ["Wildlife refuge note", "Pilots are requested to remain at least 2,000 ft AGL"],
              ["MTR route lines", "Fast military traffic may transit low altitude"]
            ]
          },
          {
            type: "callout",
            title: "Drone pilot judgment",
            text: "Some chart markings are not legal prohibitions, but they are risk warnings. The FAA expects you to manage risk, not hunt loopholes."
          }
        ],
        sources: [faaSuasSource, faaAirspaceSource]
      },
      {
        id: "m4-10",
        kicker: "Chart Workflow",
        title: "A Simple Chart-Reading Flow for Every Flight",
        blocks: [
          {
            type: "diagram",
            title: "Chart review sequence",
            items: [
              "Locate the operating area using address, coordinates, or landmarks.",
              "Identify the airspace class and whether controlled airspace reaches your planned altitude.",
              "Check nearby airports, heliports, parachute areas, glider sites, and MTRs.",
              "Read MEFs and obstacle labels for terrain and tower hazards.",
              "Check TFRs and NOTAMs after the chart review because charts may not show temporary changes.",
              "Document the result in your preflight notes."
            ]
          },
          {
            type: "callout",
            title: "Operational bottom line",
            text: "The chart tells you what is normally there. NOTAMs and TFRs tell you what changed today. You need both."
          }
        ],
        sources: [faaSuasSource, faaTfrSource]
      }
    ]
  },
  {
    id: "5",
    number: 5,
    title: "Airport Operations",
    description: "Towered and non-towered airports, runway markings, traffic patterns, CTAF, and UNICOM.",
    estimatedMinutes: 30,
    topicArea: "Operations",
    slides: [
      {
        id: "m5-1",
        kicker: "Airport Types",
        title: "Towered vs. Non-Towered Airports",
        blocks: [
          {
            type: "paragraph",
            text: "Airports fall into two broad categories: towered (with an operating control tower) and non-towered (no tower or tower closed). Each type has different communication and operational expectations. Drone pilots need to understand both, especially when operating nearby."
          },
          {
            type: "table",
            headers: ["Characteristic", "Towered", "Non-Towered"],
            rows: [
              ["ATC services", "Full ATC instructions and clearances", "None — pilots self-announce"],
              ["Frequencies", "Tower, ground, clearance delivery", "CTAF (Common Traffic Advisory Frequency)"],
              ["Drone authorization", "Required if in Class B, C, or D airspace", "Not required if in Class G"],
              ["Pilot communication", "Required two-way radio for manned aircraft", "Self-announce position and intentions"],
              ["Sectional symbol", "Blue", "Magenta"]
            ]
          },
          {
            type: "callout",
            title: "Drone pilot rule",
            text: `You can operate near a non-towered airport without authorization if you are in Class G. But you still must ${GOVERNED_FACTS.operatingLimitations.rightOfWaySummary.toLowerCase()}.`
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m5-2",
        kicker: "Towered Ops",
        title: "Operating Near a Towered Airport",
        blocks: [
          {
            type: "paragraph",
            text: "Towered airports are surrounded by controlled airspace (Class B, C, or D). Part 107 pilots must obtain authorization before flying in that airspace. Even if operating just outside the boundary, maintain heightened awareness of arriving and departing traffic."
          },
          {
            type: "bullets",
            items: [
              "Class D authorization is typically the most accessible for drone pilots — LAANC often supports instant approval.",
              "Never fly across approach or departure corridors even if technically outside controlled airspace.",
              "Monitor the tower frequency if you have a capable receiver — situational awareness is free.",
              "A drone near a final approach path creates a collision hazard even if you are legally outside the airspace."
            ]
          },
          {
            type: "callout",
            title: "Practical wisdom",
            text: "Authorization gets you legal access. Good judgment keeps you safe. These are not the same thing."
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m5-3",
        kicker: "Non-Towered Ops",
        title: "Non-Towered Airports and CTAF",
        blocks: [
          {
            type: "paragraph",
            text: "At non-towered airports, pilots use a Common Traffic Advisory Frequency (CTAF) to self-announce their position and intentions. Manned aircraft call out taxiing, takeoff, pattern entry, and landing. Drone pilots operating nearby should listen when possible."
          },
          {
            type: "table",
            headers: ["CTAF component", "How pilots use it"],
            rows: [
              ["Frequency", "Published on sectional or in chart supplement — typically 122.7, 122.8, or 122.9 MHz"],
              ["Self-announce", "\"Summerville traffic, Cessna 172 five miles south, inbound for landing, Summerville\""],
              ["UNICOM", "May share the same frequency — used for airport services, fuel, parking"],
              ["MULTICOM", "122.9 MHz — used at airports without a dedicated UNICOM/CTAF"]
            ]
          },
          {
            type: "callout",
            title: "Drone pilot habit",
            text: "If you can hear the CTAF, you know who is in the pattern. This is gold for avoiding conflicts."
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m5-4",
        kicker: "Traffic Patterns",
        title: "Traffic Patterns at Public-Use Airports",
        blocks: [
          {
            type: "paragraph",
            text: "Manned aircraft fly a rectangular traffic pattern around the runway: upwind, crosswind, downwind, base, and final. Standard patterns use left turns unless right traffic is specified on the sectional."
          },
          {
            type: "bullets",
            items: [
              "Downwind leg: Parallel to the runway, opposite direction of landing. This is where most pattern traffic flies.",
              "Base leg: 90° turn from downwind toward the runway. Aircraft descending and slowing.",
              "Final approach: Straight-in toward the runway. Lowest altitude — prime conflict zone for drones.",
              "Pattern altitude: Typically 1,000 ft AGL for piston aircraft. Your 400 ft limit puts you well below pattern altitude, but not below the approach path.",
              "\"RP\" on a sectional means right pattern — all turns are to the right. Otherwise standard left pattern."
            ]
          },
          {
            type: "image",
            src: "/images/charts/traffic-pattern.png",
            alt: "FAA Chart Users' Guide traffic pattern legend showing RP notation for right pattern",
            caption: "FAA Chart Users' Guide — traffic pattern notation. RP indicates right traffic pattern. Absence of RP means standard left pattern."
          },
          {
            type: "callout",
            title: "Conflict zone",
            text: "A drone at 400 ft AGL one mile from a runway threshold is directly beneath the final approach path. Aircraft on final are committed to land and have limited ability to see or avoid."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m5-5",
        kicker: "Runway Markings",
        title: "Runway Markings You Should Recognize",
        blocks: [
          {
            type: "paragraph",
            text: "Runway markings tell pilots where the runway begins, where to aim, and where to hold short. Drone pilots operating near airports should recognize the key markings for situational awareness."
          },
          {
            type: "table",
            headers: ["Marking", "What it communicates"],
            rows: [
              ["Threshold markings", "Beginning of the runway available for landing — parallel white bars"],
              ["Runway numbers", "Magnetic heading rounded to nearest 10° — e.g., Runway 09 points ~090°"],
              ["Displaced threshold", "Landing area starts farther down — marked area before it is for taxi/takeoff only"],
              ["Hold short lines", "Where aircraft must stop before entering active runway — double solid, double dashed"],
              ["Centerline", "Dashed white line down the middle of the runway"]
            ]
          },
          {
            type: "callout",
            title: "Why it matters",
            text: "Knowing which direction the runway faces helps you anticipate where aircraft will come from. Runway 27 means traffic approaches from the west and departs to the west."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m5-6",
        kicker: "Airport Lighting",
        title: "Airport Lighting at Night",
        blocks: [
          {
            type: "paragraph",
            text: "Airport lighting helps pilots find the airport at night and navigate the taxi and runway environment. Understanding these lights helps drone pilots anticipate aircraft movements in the dark."
          },
          {
            type: "table",
            headers: ["Light system", "What it looks like"],
            rows: [
              ["Rotating beacon", "White/green flashing — marks a civilian land airport. White/green alternating."],
              ["Military beacon", "White/green/white — two white flashes between green. Military airfield."],
              ["Runway edge lights", "White lights along runway edges. Turns amber near the departure end."],
              ["PAPI/VASI", "Visual glide slope indicators — red/white light pattern shows if you are high, low, or on glide path."],
              ["REIL", "Runway End Identifier Lights — synchronized flashing lights at runway threshold."],
              ["Taxiway lights", "Blue edge lights along taxiways. Green centerline in some cases."]
            ]
          },
          {
            type: "image",
            src: "/images/charts/airport-beacons.png",
            alt: "FAA Chart Users' Guide airport beacon symbols and isolated location markers",
            caption: "FAA Chart Users' Guide — airport beacon symbols. Rotating beacons help identify airports at night. Green/white = civilian land airport."
          },
          {
            type: "callout",
            title: "Part 107 night ops",
            text: "Your anti-collision light must be visible for 3 SM. Airport beacons are not just landmarks — they mean an airport is nearby. Plan accordingly."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m5-7",
        kicker: "CTAF & UNICOM",
        title: "CTAF vs. UNICOM — Don't Confuse Them",
        blocks: [
          {
            type: "paragraph",
            text: "CTAF is the frequency pilots use to communicate with each other at non-towered airports. UNICOM is a frequency used to reach ground-based services (fuel, parking, FBO). At many small airports, the CTAF and UNICOM share the same frequency."
          },
          {
            type: "bullets",
            items: [
              "CTAF = pilot-to-pilot communication. Self-announce position, pattern entry, landings.",
              "UNICOM = pilot-to-ground communication. Fuel truck, parking, weather info.",
              "Shared frequency is common at airports with limited infrastructure.",
              "MULTICOM (122.9 MHz) is the fallback when no CTAF or UNICOM is published.",
              "Drone pilots: listening to CTAF gives you a mental picture of who is flying where."
            ]
          },
          {
            type: "callout",
            title: "Exam note",
            text: "The FAA test may ask you to distinguish between CTAF and UNICOM. CTAF = traffic, UNICOM = services."
          }
        ],
        sources: [faaAirspaceSource]
      },
      {
        id: "m5-8",
        kicker: "Airport Signs",
        title: "Signs and Surface Markings at the Airport",
        blocks: [
          {
            type: "paragraph",
            text: "If your drone operation takes you onto or near an airport surface (with proper authorization), you need to understand surface signs and markings. Even if you never taxi a drone, these help interpret the airport environment."
          },
          {
            type: "table",
            headers: ["Sign/marking", "Color and meaning"],
            rows: [
              ["Runway hold position", "Red background with white text — mandatory stop. Do not cross without clearance."],
              ["ILS critical area", "Red and white — hold here when ILS is in use for that runway."],
              ["Taxiway direction", "Yellow background with black text and arrow — shows taxiway designations."],
              ["Runway distance remaining", "Black background with white numbers — thousands of feet remaining."],
              ["Mandatory instruction sign", "Red/white. Never cross unless cleared by ATC or when safe at non-towered fields."]
            ]
          },
          {
            type: "callout",
            title: "Drone context",
            text: "If you need to access controlled airport property for a drone operation, coordinate with the airport manager and ATC in advance. Never drive onto a movement area without clearance."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m5-9",
        kicker: "Drone Near Airports",
        title: "Part 107 Considerations Near Airport Environments",
        blocks: [
          {
            type: "paragraph",
            text: "Airports create unique operating considerations for drone pilots — even when you are outside controlled airspace. Traffic density, altitude compression, and approach/departure corridors demand extra caution."
          },
          {
            type: "bullets",
            items: [
              "Class G areas near airports may have more manned traffic than you expect — especially near flight schools.",
              "Helicopters can operate at any altitude and do not follow runway traffic patterns.",
              "Flight training aircraft repeatedly fly the same pattern — learn the local rhythm.",
              "A visual observer who knows aviation can spot pattern traffic faster than you can.",
              "If you hear an engine getting louder, descend immediately and locate the aircraft."
            ]
          },
          {
            type: "callout",
            title: "Risk management",
            text: "The FAA is not asking you to avoid all airports. It is asking you to manage risk like a professional. Know the traffic, know the frequencies, and know when to stand down."
          }
        ],
        sources: [faaAirspaceSource, faaPilotSource]
      },
      {
        id: "m5-10",
        kicker: "Airport Workflow",
        title: "Preflight Airport Assessment Checklist",
        blocks: [
          {
            type: "diagram",
            title: "Airport proximity assessment",
            items: [
              "Check sectional: Is the operating site inside or near controlled airspace?",
              "Identify the nearest airports within 5 miles — note towered vs. non-towered.",
              "Check the chart supplement for frequencies, hours, and traffic pattern details.",
              "If Class B/C/D: obtain authorization via LAANC or manual application.",
              "If non-towered in Class G: monitor CTAF if possible, remain below pattern altitude.",
              "Document airport proximity in your preflight log."
            ]
          },
          {
            type: "callout",
            title: "Bottom line",
            text: "Airport awareness is not paranoia — it is professional discipline. Every pilot, manned or unmanned, shares this sky."
          }
        ],
        sources: [faaSuasSource, faaAirspaceSource]
      }
    ]
  },
  {
    id: "6",
    number: 6,
    title: "Weather & Micrometeorology",
    description: "Weather sources, METARs, TAFs, density altitude, wind, clouds, fog, and thunderstorms.",
    estimatedMinutes: 45,
    topicArea: "Weather",
    slides: [
      {
        id: "m6-1",
        kicker: "Weather Sources",
        title: "Where Pilots Get Weather Information",
        blocks: [
          {
            type: "paragraph",
            text: "Every flight starts with a weather check. The FAA provides multiple official sources. Drone pilots must know where to get reliable, current weather before takeoff."
          },
          {
            type: "table",
            headers: ["Source", "What it provides"],
            rows: [
              ["METAR", "Routine aviation weather observation — updated hourly or as conditions change"],
              ["TAF", "Terminal Aerodrome Forecast — 24-30 hour forecast for specific airports"],
              ["AWOS/ASOS", "Automated weather stations at airports — real-time data and broadcast"],
              ["ATIS", "Automatic Terminal Information Service — towered airport conditions, updated hourly"],
              ["1800wxbrief.com", "FAA-contracted online weather briefing service for pilots"],
              ["Area Forecast", "Regional weather outlook covering larger geographic areas"]
            ]
          },
          {
            type: "image",
            src: "/images/charts/awos-asos.png",
            alt: "FAA Chart Users' Guide AWOS and ASOS automated weather broadcast symbols",
            caption: "FAA Chart Users' Guide — AWOS/ASOS symbols. These automated stations transmit real-time weather on discrete frequencies."
          },
          {
            type: "callout",
            title: "Part 107 rule",
            text: "You must check weather sources before flight. Part 107 requires at least 3 SM visibility. If conditions deteriorate during flight, you must land safely."
          }
        ],
        sources: [faaAirspaceSource, faaSuasSource]
      },
      {
        id: "m6-2",
        kicker: "METARs",
        title: "Decoding METARs — The Standard Weather Report",
        blocks: [
          {
            type: "paragraph",
            text: "METAR is the international standard format for aviation weather observations. Every pilot learns to decode these — and the FAA exam will test you on them."
          },
          {
            type: "table",
            headers: ["METAR component", "Example", "Meaning"],
            rows: [
              ["Station ID", "KCAE", "Columbia Metropolitan Airport"],
              ["Date/time", "061553Z", "6th day, 15:53 UTC"],
              ["Wind", "24012G18KT", "From 240° at 12 knots, gusting 18"],
              ["Visibility", "10SM", "10 statute miles"],
              ["Weather", "-RA BR", "Light rain, mist"],
              ["Clouds", "BKN025 OVC040", "Broken at 2,500 ft, overcast at 4,000 ft"],
              ["Temp/Dew", "22/18", "Temperature 22°C, dew point 18°C"],
              ["Altimeter", "A2992", "29.92 inHg"]
            ]
          },
          {
            type: "callout",
            title: "Drone pilot focus",
            text: "For Part 107, the most important METAR elements are visibility (must be ≥3 SM), wind (affects performance), and cloud ceilings (clearance = 500 ft below)."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-3",
        kicker: "TAFs",
        title: "TAFs — Weather Forecasts for Airports",
        blocks: [
          {
            type: "paragraph",
            text: "A TAF is a weather forecast for a specific airport, typically covering 24 hours. It uses similar abbreviations to METARs but projects future conditions. TAFs are updated four times daily."
          },
          {
            type: "bullets",
            items: [
              "TAFs use date/time groups (e.g., 0606/0706 = 6th at 06Z to 7th at 06Z).",
              "\"FM\" = from (abrupt change), \"BECMG\" = becoming (gradual change), \"TEMPO\" = temporary fluctuation.",
              "\"PROB30\" = 30% probability of a condition. Low probability, but still worth noting.",
              "Pay attention to forecast visibility and ceiling. If either drops below Part 107 minimums, plan adjustments.",
              "TAF amendments (AMD) mean the forecast changed significantly — check the amended version."
            ]
          },
          {
            type: "callout",
            title: "Operational use",
            text: "A TAF that shows deterioration in the afternoon means plan your flight for the morning. Don't fight the forecast — work with it."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-4",
        kicker: "Wind",
        title: "Wind — Direction, Speed, and Effects on Small UAS",
        blocks: [
          {
            type: "paragraph",
            text: "Wind is reported as the direction the wind is coming FROM, in degrees true. Speed is in knots. A wind of 24012KT means the wind is blowing from 240° at 12 knots. Gusts are reported when speed varies by 10+ knots."
          },
          {
            type: "table",
            headers: ["Wind factor", "Effect on small UAS"],
            rows: [
              ["Headwind", "Increases time to destination, increases battery drain outbound"],
              ["Tailwind", "Decreases time to destination, may overshoot, reduces battery drain outbound"],
              ["Crosswind", "Affects stability, may cause drift — worst on launch and landing"],
              ["Gusts", "Sudden control demands — can overwhelm stabilization systems"],
              ["Wind shear", "Rapid change in wind speed/direction with altitude — dangerous"],
              ["Surface friction", "Wind at ground level is slower and more turbulent than wind at altitude"]
            ]
          },
          {
            type: "callout",
            title: "Safe limit",
            text: "Check your drone manual for its maximum wind rating. Most consumer drones handle 20-25 knots, but gusts near that limit are risky. When in doubt, don't fly."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-5",
        kicker: "Clouds & Ceilings",
        title: "Cloud Types, Coverage, and Clearance Requirements",
        blocks: [
          {
            type: "paragraph",
            text: "Clouds matter for two reasons under Part 107: cloud clearance minimums and visibility. Pilots report cloud coverage in oktas (eighths of sky), with key METAR codes: FEW (1-2/8), SCT scattered (3-4/8), BKN broken (5-7/8), OVC overcast (8/8)."
          },
          {
            type: "table",
            headers: ["Coverage code", "Coverage amount", "Part 107 meaning"],
            rows: [
              ["FEW", "1-2 oktas — few clouds", NON_CEILING_CLOUD_CLEARANCE_REMINDER],
              ["SCT", "3-4 oktas — scattered", NON_CEILING_CLOUD_CLEARANCE_REMINDER],
              ["BKN", "5-7 oktas — broken", "THIS IS A CEILING. Stay 500 ft below."],
              ["OVC", "8 oktas — overcast", "Ceiling. Stay 500 ft below."]
            ]
          },
          {
            type: "bullets",
            items: [
              "Part 107 cloud clearance: 500 ft below clouds, 2,000 ft horizontally from clouds.",
              describeCloudCeilingLimit(800),
              "Cloud types (cumulus, stratus, cirrus) tell you about stability, turbulence, and future weather.",
              "Towering cumulus = developing thunderstorms. Do not fly near them."
            ]
          },
          {
            type: "callout",
            title: "Exam trap",
            text: "BKN at 1,200 ft means the ceiling is 1,200 ft. Your drone can fly up to 400 ft AGL. That is fine, but you must also maintain 500 ft below the ceiling — meaning stay at or below 700 ft AGL. The exam may conflate these numbers."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-6",
        kicker: "Visibility",
        title: "Visibility — The 3 SM Rule and Its Limits",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 requires at least 3 statute miles visibility from the control station. This is a legal minimum — not a suggestion. If visibility drops below 3 SM during a flight, you must land."
          },
          {
            type: "table",
            headers: ["Condition", "METAR code", "Drone impact"],
            rows: [
              ["Haze", "HZ", "Reduces contrast — makes VLOS harder"],
              ["Mist", "BR", "Light fog — visibility 5/8 to 6 SM"],
              ["Fog", "FG", "Visibility below 5/8 SM — no-go for drones"],
              ["Smoke", "FU", "Similar to haze but may indicate nearby fires with TFR risk"],
              ["Rain", "RA (+ heavy, - light)", "Reduces visibility, may damage electronics if not weather-sealed"],
              ["Snow", "SN", "Very low visibility, cold battery issues, white-out risk"]
            ]
          },
          {
            type: "callout",
            title: "Practical check",
            text: "If you cannot clearly see an object 3 SM away, you cannot legally fly. Don't guess — use METAR data or visibility sensors."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-7",
        kicker: "Density Altitude",
        title: "Density Altitude — The Silent Performance Killer",
        blocks: [
          {
            type: "paragraph",
            text: "Density altitude is pressure altitude corrected for non-standard temperature. In simple terms: it is how high the aircraft thinks it is, based on air density. High density altitude = thin air = reduced performance."
          },
          {
            type: "bullets",
            items: [
              "Hot + high + humid = the three H's of bad density altitude. All three reduce air density.",
              "Thin air means propellers generate less thrust and motors work harder.",
              "Battery efficiency drops at high density altitude because cooling is less effective.",
              "Your drone that flies 25 minutes at sea level may get 15-18 minutes at 7,000 ft density altitude.",
              "Density altitude affects takeoff, climb rate, maneuverability, and endurance."
            ]
          },
          {
            type: "callout",
            title: "Exam favorite",
            text: "The FAA loves asking what combination creates the highest density altitude. Answer: high temperature, high elevation, high humidity. Every time."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-8",
        kicker: "Fog & Low Ceilings",
        title: "Fog Formation and Low Ceiling Hazards",
        blocks: [
          {
            type: "paragraph",
            text: "Fog is a surface-based cloud that reduces visibility to less than 5/8 SM. It forms when temperature and dew point converge — typically overnight and early morning. Low ceilings compound the problem by limiting vertical clearance."
          },
          {
            type: "table",
            headers: ["Fog type", "How it forms"],
            rows: [
              ["Radiation fog", "Ground cools at night, cooling air above it. Clear skies, light wind. Burns off after sunrise."],
              ["Advection fog", "Warm moist air moves over a cold surface. Common near coasts. Can persist all day."],
              ["Upslope fog", "Moist air is forced up terrain. Cools as it rises. Common in mountains."],
              ["Steam fog", "Cold air over warm water. Looks like steam rising."]
            ]
          },
          {
            type: "callout",
            title: "Drone decision",
            text: "If fog is forecast to clear by 10 AM, do not launch at 8 AM hoping it will clear early. Wait for actual conditions — not forecast conditions — to meet Part 107 minimums."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-9",
        kicker: "Thunderstorms",
        title: "Thunderstorms — Three Stages, Three Reasons to Stay Away",
        blocks: [
          {
            type: "paragraph",
            text: "Thunderstorms go through three lifecycle stages: cumulus (building), mature (most dangerous), and dissipating. All three stages present hazards to small UAS. The FAA expects you to recognize and avoid them."
          },
          {
            type: "table",
            headers: ["Stage", "Characteristics", "Drone hazard"],
            rows: [
              ["Cumulus (building)", "Updrafts dominate. Towering clouds. No precipitation yet.", "Strong updrafts can loft a drone well above 400 ft AGL."],
              ["Mature", "Updrafts + downdrafts + precipitation + possible hail. This is the dangerous stage.", "Downdrafts/microbursts can force a drone to the ground. Lightning. Hail."],
              ["Dissipating", "Downdrafts dominate. Precipitation tapers off.", "Still turbulent. Residual wind shear."]
            ]
          },
          {
            type: "bullets",
            items: [
              "Lightning can strike up to 10 miles from the storm center — outside visible rain.",
              "Microbursts can exceed 6,000 ft/min descent — no drone can out-climb this.",
              "Hail can destroy propellers, camera gimbals, and airframe in seconds.",
              "If you hear thunder, you are within lightning range. Land immediately."
            ]
          },
          {
            type: "callout",
            title: "Zero tolerance",
            text: "There is no safe distance from a thunderstorm for a small UAS. If storms are in the area, cancel or delay the flight."
          }
        ],
        sources: [faaSuasSource]
      },
      {
        id: "m6-10",
        kicker: "Weather Workflow",
        title: "The Complete Preflight Weather Checklist for Drone Pilots",
        blocks: [
          {
            type: "diagram",
            title: "Weather briefing sequence",
            items: [
              "Check METARs for the operating area and nearest airport — note visibility, wind, ceiling, temperature.",
              "Check TAFs for the operating period — look for deterioration trends.",
              "Check area forecasts and convective outlooks for thunderstorm potential.",
              "Check NOTAMs for any weather-related restrictions or equipment outages.",
              "Calculate density altitude if operating above 1,000 ft MSL or in high temperatures.",
              "Make the go/no-go decision: if any parameter violates Part 107 minimums, no-go."
            ]
          },
          {
            type: "callout",
            title: "Professional standard",
            text: "A written weather briefing takes 5 minutes. Defending a violation to the FAA takes months. The math is simple."
          }
        ],
        sources: [faaSuasSource, faaAirspaceSource]
      }
    ]
  },
  {
    id: "7",
    number: 7,
    title: "Drone Flight Operations",
    description: "Preflight planning, checklists, performance factors, emergencies, lost link, and battery safety.",
    estimatedMinutes: 35,
    topicArea: "Operations",
    slides: [
      {
        id: "m7-1",
        kicker: "Preflight Planning",
        title: "Preflight Planning Is a Regulatory Requirement",
        blocks: [
          {
            type: "paragraph",
            text: "Under Part 107, the remote pilot in command must conduct a thorough preflight assessment before every operation. This is not optional — it is a legal duty. The FAA expects documented, systematic planning."
          },
          {
            type: "bullets",
            items: [
              "Check weather: METARs, TAFs, visibility, wind, density altitude, and convective outlooks.",
              "Check airspace: Sectional chart review, controlled airspace boundaries, authorization status.",
              "Check NOTAMs and TFRs: Time-sensitive hazards, temporary restrictions.",
              "Assess the operating site: Obstacles, people, terrain, property boundaries, privacy considerations.",
              "Verify aircraft condition: Physical inspection, firmware updates, battery status, propeller integrity.",
              "Brief the crew: Visual observer roles, communication protocols, emergency procedures."
            ]
          },
          {
            type: "callout",
            title: "Professional standard",
            text: "A written preflight log is your best defense if anything goes wrong. The FAA will ask: 'What did you check before flight?' Be ready with an answer."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-2",
        kicker: "Checklists",
        title: "Use Checklists the Way Professional Aviators Do",
        blocks: [
          {
            type: "paragraph",
            text: "Checklists reduce human error. Even experienced pilots miss steps without them. For drone operations, a simple but complete checklist covers preflight, takeoff, in-flight monitoring, landing, and post-flight."
          },
          {
            type: "table",
            headers: ["Checklist phase", "What it covers"],
            rows: [
              ["Preflight", "Weather, airspace, NOTAMs, site survey, aircraft inspection, battery check"],
              ["Pre-takeoff", "Home point set, RTH altitude confirmed, compass calibrated, payload secure, VLOS confirmed"],
              ["In-flight", "Battery monitoring, signal strength, airspeed, altitude, attitude, surrounding airspace scan"],
              ["Landing", "Approach clear, landing zone clear of people and obstacles, ground effect awareness"],
              ["Post-flight", "Battery cooling, data offload, damage inspection, maintenance log update, flight log entry"]
            ]
          },
          {
            type: "callout",
            title: "Memory aid",
            text: "A checklist is not a suggestion. It is the difference between 'I think I checked that' and 'I know I checked that.'"
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-3",
        kicker: "Performance Factors",
        title: "Aircraft Performance Depends on Conditions",
        blocks: [
          {
            type: "paragraph",
            text: "Your drone's performance is not constant. Temperature, altitude, payload weight, battery age, wind, and flight mode all affect range, endurance, speed, and maneuverability. The pilot must account for all of these."
          },
          {
            type: "table",
            headers: ["Performance factor", "How it affects flight"],
            rows: [
              ["Payload weight", "More weight = shorter flight time, slower climb, reduced maneuverability"],
              ["Battery temperature", "Cold batteries deliver less power — keep batteries warm pre-flight in winter"],
              ["Altitude / density altitude", "Thinner air reduces thrust and cooling — expect shorter endurance"],
              ["Wind (headwind)", "Slower groundspeed outbound, faster return — plan for asymmetric battery use"],
              ["Wind (tailwind)", "Faster outbound, slower return — you may not have enough battery to get back"],
              ["Flight mode", "Sport/high-speed modes drain battery faster; GPS modes are more efficient"]
            ]
          },
          {
            type: "callout",
            title: "Return-to-home planning",
            text: "Never fly downwind on the outbound leg assuming you will have the same groundspeed coming back. Plan your return point at 30-40% battery, not 10%."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-4",
        kicker: "Battery Safety",
        title: "Lithium Polymer Battery Safety",
        blocks: [
          {
            type: "paragraph",
            text: "Nearly all small UAS use lithium polymer (LiPo) or lithium-ion batteries. These are energy-dense and potentially hazardous if mishandled. The FAA and manufacturers both emphasize battery safety."
          },
          {
            type: "bullets",
            items: [
              "Inspect batteries before each flight: swelling, damage, puffing, or corrosion = do not fly.",
              "Store batteries at storage voltage (~3.8V per cell), not fully charged, for longevity and safety.",
              "Never charge batteries unattended or immediately after flight — let them cool first.",
              "Transport batteries in fireproof LiPo bags, especially when traveling.",
              "Cold weather: batteries lose capacity. Warm them to ambient temperature before flight.",
              "A puffed battery is a fire waiting to happen. Dispose of it properly — do not attempt to 'fix' it."
            ]
          },
          {
            type: "callout",
            title: "Emergency protocol",
            text: "If a battery catches fire, it produces toxic smoke and extreme heat. Have a fire extinguisher rated for electrical fires (Class C) or a LiPo-safe containment method."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-5",
        kicker: "Lost Link",
        title: "Lost Link and Return-to-Home Procedures",
        blocks: [
          {
            type: "paragraph",
            text: "Lost link occurs when the drone loses communication with the controller — due to distance, interference, or terrain. Every Part 107 pilot must understand what their aircraft will do and what they should do when this happens."
          },
          {
            type: "table",
            headers: ["Lost link element", "What the pilot must know"],
            rows: [
              ["RTH altitude", "Must be set above all obstacles in the flight path — 400 ft is common but check terrain"],
              ["RTH behavior", "Does it climb to RTH alt, fly home, then descend? Or descend at current position? Know your drone."],
              ["Signal recovery", "Most drones re-link when back in range — the pilot can cancel RTH and resume manual control"],
              ["Battery during RTH", "If lost link happens far away, the drone may not have enough battery to return — plan around this"],
              ["Emergency landing", "If RTH fails or battery is critical, know where the drone will auto-land and assess site safety pre-flight"]
            ]
          },
          {
            type: "callout",
            title: "Preflight must-do",
            text: "Always set and confirm the RTH altitude before takeoff. If your RTH altitude is 100 ft and there is a 150 ft tower between you and the drone, the aircraft will hit it."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-6",
        kicker: "Emergency Procedures",
        title: "Emergency Procedures for Small UAS",
        blocks: [
          {
            type: "paragraph",
            text: "Emergencies in drone operations happen fast. The difference between a controlled outcome and a bad day is whether you rehearsed the response before you needed it."
          },
          {
            type: "table",
            headers: ["Emergency scenario", "Recommended immediate action"],
            rows: [
              ["Loss of control", "Stop stick input, assess attitude. If uncontrolled, initiate emergency landing if safe."],
              ["Flyaway", "Switch to ATTI mode if available. Kill motors as last resort over a clear area."],
              ["Low battery critical", "Initiate immediate landing. Do not try to 'make it back' — land safely wherever possible."],
              ["Manned aircraft incursion", "Descend immediately. Do not climb. Land as soon as safe."],
              ["Person or vehicle in landing zone", "Abort landing. Climb and orbit until zone is clear or divert to alternate landing site."],
              ["Fire or smoke on aircraft", "Land immediately away from people, structures, and flammable material."]
            ]
          },
          {
            type: "callout",
            title: "Priority order",
            text: "In every emergency, the priority is: protect people on the ground first, protect other aircraft second, protect property third."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-7",
        kicker: "Crew & VO",
        title: "Visual Observers and Crew Coordination",
        blocks: [
          {
            type: "paragraph",
            text: "A visual observer extends the remote PIC's situational awareness. Under Part 107, the VO must maintain VLOS and communicate aircraft position, nearby traffic, and hazards to the remote PIC."
          },
          {
            type: "bullets",
            items: [
              "A visual observer must be positioned to see the aircraft throughout the operation.",
              "Communication must be effective and continuous — verbal, hand signals, or radio.",
              "The VO does not relieve the remote PIC of responsibility for safe operation.",
              "Brief the VO on emergency procedures, lost link plan, and airspace boundaries before flight.",
              "If the VO loses sight of the aircraft, they must call it out immediately."
            ]
          },
          {
            type: "callout",
            title: "Crew concept",
            text: "The best VO knows aviation. They can call 'Cessna at your ten o'clock, low' before you hear the engine. That is worth more than any equipment."
          }
        ],
        sources: [faaCommercialSource, faaPeopleSource]
      },
      {
        id: "m7-8",
        kicker: "Flight Modes",
        title: "Understanding Flight Modes and Their Limits",
        blocks: [
          {
            type: "paragraph",
            text: "Most modern drones offer multiple flight modes — GPS, ATTI, sport, cinematic. Each mode changes how the aircraft responds to inputs, how it handles wind, and what automated features are active."
          },
          {
            type: "table",
            headers: ["Flight mode", "Characteristics", "Operational use"],
            rows: [
              ["GPS / P-Mode", "Position hold, speed limited, obstacle avoidance active", "Standard for most Part 107 ops — stable and predictable"],
              ["ATTI Mode", "GPS off — altitude hold only, aircraft drifts with wind", "Fallback if GPS fails. Requires active piloting. Harder in wind."],
              ["Sport Mode", "Maximum speed and agility. Obstacle avoidance disabled.", "Faster response. Drains battery faster. Higher crash risk."],
              ["Cinematic / Tripod", "Very slow, smooth movements. Speed and sensitivity reduced.", "Inspection work. Tight spaces. Not for general transit flying."]
            ]
          },
          {
            type: "callout",
            title: "Know your aircraft",
            text: "Some drones will switch to ATTI mode automatically if GPS is lost — and the handling changes dramatically. Practice ATTI flying before you need it."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m7-9",
        kicker: "Night Operations",
        title: "Night Flying Under Part 107",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 night operations are permitted without a waiver — IF you meet specific requirements. This was a significant rule change, but it does not mean night flying is casual."
          },
          {
            type: "bullets",
            items: [
              "Anti-collision lighting must be visible for at least 3 statute miles and have a flash rate adequate to avoid a collision.",
              "You must have completed an updated knowledge test or recurrent training that includes night operation content.",
              "VLOS is harder at night — position lights tell you where the drone is but not its attitude or direction.",
              "Depth perception is degraded in darkness. Obstacles are harder to judge.",
              "Night vision recovery from bright lights takes 5-30 minutes — avoid looking at bright screens or lights."
            ]
          },
          {
            type: "callout",
            title: "Risk escalation",
            text: "Everything is harder at night: spotting traffic, judging distance, finding a landing zone in an emergency. Plan conservatively."
          }
        ],
        sources: [faaCommercialSource, faaPeopleSource]
      },
      {
        id: "m7-10",
        kicker: "Ops Workflow",
        title: "The Complete Operational Flight Cycle",
        blocks: [
          {
            type: "diagram",
            title: "Mission cycle for Part 107 operations",
            items: [
              "Planning: Weather, airspace, NOTAMs, site assessment, crew briefing.",
              "Preflight: Aircraft and battery inspection, RTH altitude set, home point confirmed.",
              "Takeoff: Hover check, control response verified, visual observer scanning.",
              "Mission: Monitor battery, signal, conditions. If anything degrades, reassess.",
              "Recovery: Initiate return at planned battery threshold. Land into the wind.",
              "Post-flight: Log flight, inspect aircraft, note anomalies, file any reports."
            ]
          },
          {
            type: "callout",
            title: "Continuous loop",
            text: "Good operations are a cycle, not a checklist you do once. Assess, fly, reassess, adapt. This is what the FAA means by 'aeronautical decision-making.'"
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  },
  {
    id: "8",
    number: 8,
    title: "Aeronautical Decision-Making & CRM",
    description: "DECIDE, PAVE, IMSAFE, hazardous attitudes, risk matrices, and crew resource management.",
    estimatedMinutes: 30,
    topicArea: "Operations",
    slides: [
      {
        id: "m8-1",
        kicker: "ADM Fundamentals",
        title: "Aeronautical Decision-Making Is Your Job",
        blocks: [
          {
            type: "paragraph",
            text: "Aeronautical decision-making (ADM) is a systematic approach to the mental process used by pilots to consistently determine the best course of action in response to a given set of circumstances. The FAA considers it essential for safety — especially for remote pilots."
          },
          {
            type: "bullets",
            items: [
              "ADM is not instinct. It is a trained, practiced skill.",
              "Good decisions come from recognizing hazards, assessing risk, and choosing the safest option.",
              "Bad decisions often come from time pressure, complacency, or failing to recognize changing conditions.",
              "The FAA exam tests ADM through scenario-based questions — not just rote memory."
            ]
          },
          {
            type: "callout",
            title: "Drone relevance",
            text: "A drone pilot cannot rely on ATC to keep them safe. The remote PIC makes every safety decision independently. ADM is your first and last line of defense."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-2",
        kicker: "DECIDE Model",
        title: "The DECIDE Decision-Making Model",
        blocks: [
          {
            type: "paragraph",
            text: "DECIDE is a six-step decision-making framework used by pilots to process problems systematically. It works for preflight planning, in-flight contingencies, and post-flight analysis."
          },
          {
            type: "table",
            headers: ["Step", "Meaning", "Drone example"],
            rows: [
              ["Detect", "Recognize that something has changed", "Battery is draining faster than expected"],
              ["Estimate", "Determine the need to react", "At current rate, won't make it back to planned landing zone"],
              ["Choose", "Pick the safest outcome", "Divert to alternate landing site B"],
              ["Identify", "Identify actions to achieve that outcome", "Turn north, descend to 200 ft, reduce speed"],
              ["Do", "Execute the actions", "Execute the divert immediately"],
              ["Evaluate", "Monitor the result and adjust if needed", "Battery rate normalized — continue to alternate site B"]
            ]
          },
          {
            type: "callout",
            title: "Practice this",
            text: "DECIDE works in seconds. The more you practice it on the ground, the faster it works in the air."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-3",
        kicker: "PAVE Checklist",
        title: "PAVE — A Preflight Risk Assessment Tool",
        blocks: [
          {
            type: "paragraph",
            text: "PAVE divides risk into four categories: Pilot, Aircraft, enVironment, and External pressures. Running through PAVE before every flight helps identify hazards you might otherwise overlook."
          },
          {
            type: "table",
            headers: ["PAVE element", "Questions to ask"],
            rows: [
              ["Pilot", "Am I fit to fly? IMSAFE check. Recent experience? Currency?"],
              ["Aircraft", "Is the aircraft airworthy? Inspections current? Battery healthy? Firmware current?"],
              ["enVironment", "Weather, airspace, terrain, obstacles, people, NOTAMs, TFRs, time of day?"],
              ["External pressures", "Am I rushing? Client pressure? Social media pressure? 'Get-there-itis'?"]
            ]
          },
          {
            type: "callout",
            title: "Honest answer",
            text: "The most dangerous external pressure is usually self-imposed. 'I drove all the way out here' is not a reason to fly in bad conditions."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-4",
        kicker: "IMSAFE",
        title: "IMSAFE — The Pilot Fitness Self-Check",
        blocks: [
          {
            type: "paragraph",
            text: "IMSAFE is the standard pilot self-assessment: Illness, Medication, Stress, Alcohol, Fatigue, and Emotion. If any factor is compromised, do not fly."
          },
          {
            type: "table",
            headers: ["IMSAFE factor", "Self-check question"],
            rows: [
              ["Illness", "Am I sick? Even a cold degrades performance."],
              ["Medication", "Have I taken any medication that could impair cognition or reaction time?"],
              ["Stress", "Am I dealing with significant stress that could distract me?"],
              ["Alcohol", "Has it been at least 8 hours since my last drink? (And: am I under the influence?)"],
              ["Fatigue", "Am I tired? Fatigue impairs judgment as much as alcohol."],
              ["Emotion", "Am I angry, upset, or emotionally compromised?"]
            ]
          },
          {
            type: "callout",
            title: "Part 107 rule",
            text: "Alcohol: at least 8 hours from bottle to throttle. But the real standard is higher — impairment at any level is disqualifying."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-5",
        kicker: "Hazardous Attitudes",
        title: "The Five Hazardous Attitudes — And Their Antidotes",
        blocks: [
          {
            type: "paragraph",
            text: "The FAA identifies five hazardous attitudes that lead to poor pilot decision-making. Each has a specific antidote — a counter-thought that the pilot can use to recognize and correct the attitude."
          },
          {
            type: "table",
            headers: ["Attitude", "What it sounds like", "Antidote"],
            rows: [
              ["Anti-authority", "\"The rules don't apply to me\"", "\"Follow the rules. They are usually right.\""],
              ["Impulsivity", "\"Do something — quickly!\"", "\"Not so fast. Think first.\""],
              ["Invulnerability", "\"It won't happen to me\"", "\"It could happen to me.\""],
              ["Macho", "\"I can handle it — watch this\"", "\"Taking chances is foolish.\""],
              ["Resignation", "\"There's nothing I can do\"", "\"I'm not helpless. I can make a difference.\""]
            ]
          },
          {
            type: "callout",
            title: "Exam favorite",
            text: "The FAA absolutely tests the five hazardous attitudes. Memorize each one and its antidote. Macho and Invulnerability are the most commonly tested."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-6",
        kicker: "Risk Management",
        title: "Risk Matrices and Accepting vs. Mitigating Risk",
        blocks: [
          {
            type: "paragraph",
            text: "Risk management means identifying hazards, assessing the likelihood and severity of bad outcomes, and taking action to reduce risk to an acceptable level. Some risks can be eliminated; others must be managed."
          },
          {
            type: "bullets",
            items: [
              "A risk matrix plots likelihood (probable, possible, unlikely) against severity (catastrophic, critical, marginal, negligible).",
              "High likelihood + high severity = unacceptable risk. Do not fly.",
              "Moderate risk can be mitigated: e.g., flying near water? Add float gear and stay higher.",
              "Low risk is acceptable with standard procedures.",
              "Document your risk assessment. If something goes wrong, your assessment proves you thought about it."
            ]
          },
          {
            type: "callout",
            title: "Operational reality",
            text: "No flight has zero risk. The goal is not to eliminate risk — it is to reduce it to a level where the benefits of the operation outweigh the remaining hazard."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-7",
        kicker: "CRM",
        title: "Crew Resource Management for Drone Teams",
        blocks: [
          {
            type: "paragraph",
            text: "Crew Resource Management (CRM) is the effective use of all available resources — people, equipment, and information — to ensure safe and efficient operations. For drone pilots, CRM applies any time you have a visual observer, payload operator, or support crew."
          },
          {
            type: "table",
            headers: ["CRM principle", "Application for drone ops"],
            rows: [
              ["Communication", "Clear, standardized callouts. \"Aircraft left, low, one mile\""],
              ["Task allocation", "PIC flies, VO scans for traffic, payload operator manages camera"],
              ["Briefings", "Pre-mission brief covers emergency procedures, lost link, and go/no-go criteria"],
              ["Assertiveness", "Any crew member can and must call out hazards — regardless of rank or experience"],
              ["Debrief", "Post-mission: what went well, what could improve, any anomalies logged"]
            ]
          },
          {
            type: "callout",
            title: "Transfer prior experience",
            text: "If you have used formal crew coordination in another field, apply the same habits here: clear roles, standardized callouts, and a structured debrief."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-8",
        kicker: "Get-There-Itis",
        title: "Get-There-Itis — The Most Common Killer in Aviation",
        blocks: [
          {
            type: "paragraph",
            text: "Get-there-itis is the compulsion to complete a flight despite conditions that should prevent it. It has killed more pilots than most mechanical failures. It applies equally to drone pilots."
          },
          {
            type: "bullets",
            items: [
              "Client is waiting. You drove two hours. The light is perfect. You already told them the shots would be done today.",
              "These are all external pressures — and none of them matter if conditions are unsafe.",
              "Recognize the pressure, name it, and use your decision models (DECIDE, PAVE) to override it.",
              "Every pilot has felt it. The professional pilots override it. The others become statistics.",
              "Having a pre-established go/no-go criteria removes emotion from the decision."
            ]
          },
          {
            type: "callout",
            title: "Simple rule",
            text: "If you would not fly if no one was watching, you should not fly because someone is watching."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-9",
        kicker: "Scenario ADM",
        title: "ADM in Real Drone Operations",
        blocks: [
          {
            type: "paragraph",
            text: "ADM frameworks are tools, not checklists you fill out once. The key skill is recognizing when conditions have changed — and having the discipline to reassess."
          },
          {
            type: "table",
            headers: ["Scenario", "What ADM looks like"],
            rows: [
              ["Wind picks up mid-flight", "Reassess — is endurance still adequate? Is control stable? Should I land early?"],
              ["Battery draining faster than planned", "Run DECIDE: detect the anomaly, estimate consequences, choose a closer landing zone"],
              ["Unfamiliar person approaches, asking questions", "CRM: brief your VO to handle the person while you focus on flying"],
              ["Client asks for a risky shot", "PAVE check — is this external pressure? What is my go/no-go criteria?"]
            ]
          },
          {
            type: "callout",
            title: "Muscle memory",
            text: "ADM is like stick-and-rudder skills. It gets better with practice. Run through scenarios on the ground so your brain has seen them before."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m8-10",
        kicker: "ADM Workflow",
        title: "Building Your Personal ADM Routine",
        blocks: [
          {
            type: "diagram",
            title: "Personal ADM workflow",
            items: [
              "Preflight: Run PAVE and IMSAFE. Identify hazards. Set go/no-go criteria.",
              "Pre-takeoff: Final weather check. Confirm all mitigations are in place.",
              "In-flight: Continuously scan for changes. Run DECIDE for any anomaly.",
              "Hazard recognition: If you see a hazardous attitude in yourself, use the antidote.",
              "Post-flight: Debrief. Did anything surprise me? What would I do differently?"
            ]
          },
          {
            type: "callout",
            title: "Make it yours",
            text: "The FAA gives you frameworks. Your job is to internalize them until they become automatic. That is what 'professionalism' looks like."
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  },
  {
    id: "9",
    number: 9,
    title: "Physiology",
    description: "Alcohol, drugs, fatigue, vision, illusions, hypoxia, hyperventilation, and motion sickness.",
    estimatedMinutes: 22,
    topicArea: "Operations",
    slides: [
      {
        id: "m9-1",
        kicker: "Alcohol & Drugs",
        title: "Alcohol, Drugs, and Part 107",
        blocks: [
          {
            type: "paragraph",
            text: "For alcohol and drug fitness, § 107.27 makes the remote PIC, person manipulating the controls, and visual observer subject to § 91.17. Its prohibitions are independent: no alcohol within 8 hours, no operation while under the influence, no drug use that affects faculties contrary to safety, and no alcohol concentration of 0.04 or greater in blood or breath."
          },
          {
            type: "table",
            headers: ["Substance rule", "Part 107 requirement"],
            rows: [
              ["Alcohol — time", "No consumption within 8 hours before operating"],
              ["Alcohol — influence", "No operation while under the influence, even after 8 hours"],
              ["Alcohol — concentration", "No operation at 0.04 or greater in a blood or breath specimen"],
              ["Prescription drugs", "If the label says 'do not operate machinery,' do not fly"],
              ["OTC medication", "Even common medications (antihistamines, cold medicine) can impair"],
              ["Any substance", "If it affects your judgment, coordination, or alertness — you are grounded"]
            ]
          },
          {
            type: "callout",
            title: "8-hour rule is a floor, not a ceiling",
            text: "Even if 8 hours have passed, if you still feel any effect from alcohol — you are not legal to fly. 'Hung over' is impaired."
          }
        ],
        sources: [ecfrPart107AlcoholSource, ecfrPart91AlcoholSource]
      },
      {
        id: "m9-2",
        kicker: "Fatigue",
        title: "Fatigue — The Invisible Threat",
        blocks: [
          {
            type: "paragraph",
            text: "Fatigue degrades reaction time, attention, and decision-making as severely as alcohol — but pilots often underestimate it. Long drives to a job site, early mornings, and back-to-back flights compound fatigue."
          },
          {
            type: "bullets",
            items: [
              "Fatigue causes: reduced vigilance, slower reaction time, impaired judgment, and tunnel vision.",
              "Fatigue is cumulative — multiple short nights add up.",
              "Drone operations appear 'low effort,' but sustained concentration is mentally draining.",
              "Recognize the signs: yawning, head-nodding, difficulty tracking the aircraft.",
              "The only cure for fatigue is rest. Caffeine does not restore decision-making ability."
            ]
          },
          {
            type: "callout",
            title: "Self-check",
            text: "If you would not want a fatigued surgeon operating on you, do not be a fatigued pilot operating a drone over people."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-3",
        kicker: "Vision",
        title: "Vision and Visual Illusions",
        blocks: [
          {
            type: "paragraph",
            text: "Your eyes are your primary instrument — Part 107 demands VLOS with unaided vision. But vision is fallible. The FAA expects you to understand visual limitations and common illusions."
          },
          {
            type: "table",
            headers: ["Vision factor", "How it affects drone ops"],
            rows: [
              ["Empty-field myopia", "In featureless sky or water, eyes focus 10-30 ft ahead — you may not spot distant traffic"],
              ["Night vision recovery", "Looking at bright screens destroys night adaptation for 5-30 minutes"],
              ["Autokinesis", "A stationary light against a dark background appears to move — confusing at night"],
              ["Relative motion illusion", "A slow-moving object against a stationary background may appear stationary"],
              ["Size-distance illusion", "Your drone looks larger when close — you may misjudge its distance from obstacles"]
            ]
          },
          {
            type: "callout",
            title: "VLOS reality",
            text: "See and avoid means see, interpret, decide, and act. If you see a dot but cannot determine its direction of flight, you have not achieved see-and-avoid."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-4",
        kicker: "Hypoxia",
        title: "Hypoxia — Oxygen Deprivation",
        blocks: [
          {
            type: "paragraph",
            text: "Hypoxia is a deficiency of oxygen reaching the body's tissues. While most drone pilots operate at low altitude, the FAA includes hypoxia in Part 107 training because some operations occur at elevation."
          },
          {
            type: "table",
            headers: ["Hypoxia type", "Cause", "Drone relevance"],
            rows: [
              ["Hypoxic hypoxia", "Reduced oxygen at altitude — typically above 10,000 ft", "Pilots flying in mountains or high desert"],
              ["Hypemic hypoxia", "Blood cannot carry oxygen — carbon monoxide poisoning", "Operating near running engines, generators, or in enclosed spaces"],
              ["Stagnant hypoxia", "Blood flow restricted — G-forces, cold, tight clothing", "Rare for drone ops but included for situational awareness"],
              ["Histotoxic hypoxia", "Cells cannot use oxygen — alcohol or drug impairment", "Ties directly to the alcohol and drug rules"]
            ]
          },
          {
            type: "callout",
            title: "Drone context",
            text: "Hypoxia is unlikely at your 400 ft operating altitude. But the FAA wants you to recognize it — especially if you operate in mountains or near CO sources."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-5",
        kicker: "Hyperventilation",
        title: "Hyperventilation and Stress Response",
        blocks: [
          {
            type: "paragraph",
            text: "Hyperventilation is excessive breathing rate/depth, often triggered by stress or anxiety. It reduces CO2 in the blood, causing lightheadedness, tingling, and sometimes panic. It can happen on the ground or in flight."
          },
          {
            type: "bullets",
            items: [
              "Symptoms: lightheadedness, tingling in fingers and lips, muscle spasms, feeling of suffocation.",
              "The irony: you feel like you need more air, but you are actually over-breathing.",
              "Treatment: slow your breathing deliberately. Breathe into a paper bag if available.",
              "Hyperventilation can lead to panic, which leads to poor decisions — the chain breaks at the first link."
            ]
          },
          {
            type: "callout",
            title: "Prevention",
            text: "If you feel anxious before a flight, do not launch. Run through IMSAFE. Address the stress, then reassess."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-6",
        kicker: "Motion & Disorientation",
        title: "Motion Sickness and Spatial Disorientation",
        blocks: [
          {
            type: "paragraph",
            text: "Motion sickness is not just for passengers. Drone pilots can experience it from watching FPV feeds, head movement while tracking the aircraft, or vestibular conflicts. Spatial disorientation occurs when your senses give conflicting information."
          },
          {
            type: "table",
            headers: ["Condition", "Symptoms and response"],
            rows: [
              ["Motion sickness", "Nausea, dizziness, sweating. Land immediately if severe. Do not push through."],
              ["The leans", "False sensation of bank. Believe your instruments, not your inner ear."],
              ["Coriolis illusion", "Quick head movement while turning causes tumbling sensation — avoid rapid head turns in flight"],
              ["Flicker vertigo", "Sunlight through spinning propellers or strobe effects can cause disorientation"]
            ]
          },
          {
            type: "callout",
            title: "Pilot action",
            text: "If you feel disoriented in flight, stabilize the aircraft in a hover, look at the horizon to recalibrate your senses, and land if it persists."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-7",
        kicker: "Dehydration & Heat",
        title: "Dehydration and Heat Stress",
        blocks: [
          {
            type: "paragraph",
            text: "Flying in summer heat — common in South Carolina and similar climates — brings dehydration and heat stress risks. These degrade cognition as much as alcohol or fatigue."
          },
          {
            type: "bullets",
            items: [
              "Dehydration impairs concentration, short-term memory, and reaction time.",
              "Heat stress causes fatigue, dizziness, and nausea — symptoms that make flying unsafe.",
              "Bring water. Seek shade. Use a hat. These are not luxury items — they are pilot equipment.",
              "Your drone battery also hates heat. If you are uncomfortably hot standing still, your battery is struggling in flight."
            ]
          },
          {
            type: "callout",
            title: "Southern pilot reality",
            text: "A one-hour outdoor drone job in August South Carolina heat is physically demanding. Plan water, shade, and breaks. The client will survive. Your safety cannot be negotiated."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m9-8",
        kicker: "Physiology Workflow",
        title: "Physiological Self-Assessment Before Every Flight",
        blocks: [
          {
            type: "diagram",
            title: "Physiological readiness checklist",
            items: [
              "Alcohol: Has it been at least 8 hours? Do I feel any residual effect?",
              "Medication: Have I taken anything that warns against operating machinery?",
              "Fatigue: Am I well-rested? Would I feel safe driving a car right now?",
              "Vision: Can I clearly see objects at the planned operating distance? Night-adapted if flying in darkness?",
              "Hydration and heat: Am I prepared for the weather conditions?",
              "Overall: If any answer concerns me, I do not fly until it is resolved."
            ]
          },
          {
            type: "callout",
            title: "Simple standard",
            text: "The FAA standard is simple: if your physical or mental condition makes safe operation questionable, the only legal action is not flying."
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  },
  {
    id: "10",
    number: 10,
    title: "Maintenance & Preflight Inspection",
    description: "Condition for safe operation, inspection habits, batteries, firmware, and maintenance records.",
    estimatedMinutes: 25,
    topicArea: "Operations",
    slides: [
      {
        id: "m10-1",
        kicker: "Safe Condition",
        title: "Condition for Safe Operation",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 requires the remote pilot in command to ensure the small UAS is in a condition for safe operation before every flight. This is a legal duty — not a suggestion. If the aircraft is not airworthy, it cannot legally fly."
          },
          {
            type: "bullets",
            items: [
              "\"Condition for safe operation\" means the aircraft is free of defects that could affect safe flight.",
              "This includes physical condition, firmware status, battery health, and configuration.",
              "The FAA can ask: 'How did you determine the aircraft was safe to fly?' Have an answer.",
              "If you discover a defect during inspection, document it and ground the aircraft until resolved."
            ]
          },
          {
            type: "callout",
            title: "Pilot in command",
            text: "The remote PIC bears ultimate responsibility. You cannot delegate the determination that the aircraft is safe — you make the call."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-2",
        kicker: "Preflight Inspection",
        title: "The Systematic Preflight Walk-Around",
        blocks: [
          {
            type: "paragraph",
            text: "Every manned pilot does a preflight walk-around. Drone pilots should too. A systematic inspection catches issues before they become emergencies."
          },
          {
            type: "table",
            headers: ["Inspection area", "What to check"],
            rows: [
              ["Airframe / arms", "Cracks, loose joints, deformation. Flex and inspect. Any creaking = ground."],
              ["Propellers", "Chips, cracks, deformation, loose mounting. Replace if ANY damage. Do not 'just balance' broken props."],
              ["Motors", "Spin freely? Grinding or resistance? Debris inside? Check by hand before powering on."],
              ["Gimbal / camera", "Moves freely? Lens clean? No obstruction to gimbal range of motion?"],
              ["Landing gear", "Secure? Cracks? Will it absorb a hard landing?"],
              ["Sensors", "Obstacle avoidance sensors clean and unobstructed? Lens covers intact?"]
            ]
          },
          {
            type: "callout",
            title: "No shortcuts",
            text: "A chipped propeller that 'looks fine' can disintegrate at full RPM. Replace it. Propellers are cheap; crashes are not."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-3",
        kicker: "Battery Inspection",
        title: "Battery Health Check Before Every Flight",
        blocks: [
          {
            type: "paragraph",
            text: "Batteries are the most failure-prone component on a small UAS. A thorough battery check is the single most important preflight step."
          },
          {
            type: "bullets",
            items: [
              "Visual: Any swelling, puffing, deformation, or discoloration? Any of these = do not use.",
              "Connectors: Bent pins, corrosion, loose fit? Clean and check every time.",
              "Charge level: Fully charged for the planned flight? Verify, do not assume.",
              "Cell balance: Check individual cell voltages if your charger displays them. Large imbalance = battery is failing.",
              "Age and cycles: Batteries degrade with use. A battery with 200+ cycles may have significantly reduced capacity.",
              "Temperature: Battery should be at ambient temperature — not hot from a previous flight, not frozen from a cold car."
            ]
          },
          {
            type: "callout",
            title: "Replace on condition",
            text: "There is no fixed replacement interval for drone batteries. Replace when capacity degrades noticeably, when internal resistance rises, or at the first sign of physical change."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-4",
        kicker: "Firmware",
        title: "Firmware, Software, and Configuration Management",
        blocks: [
          {
            type: "paragraph",
            text: "Drone firmware updates can fix bugs, add features, or change behavior. Part 107 pilots must know what version their aircraft is running and whether updates affect safety or performance."
          },
          {
            type: "table",
            headers: ["Firmware consideration", "Best practice"],
            rows: [
              ["Check before flight", "Verify current firmware version. Check release notes for known issues."],
              ["Update timing", "Do not update firmware immediately before a paying job — test first."],
              ["Settings reset", "Firmware updates may reset RTH altitude, max altitude, and other settings. Verify after updates."],
              ["Geofencing", "Updates may change geofencing behavior. Confirm your authorized location is not newly restricted."],
              ["App version", "Ensure the controller app is compatible with the aircraft firmware version."]
            ]
          },
          {
            type: "callout",
            title: "Operational rule",
            text: "If a firmware update changes flight behavior, you must understand the change before flying with it. Read the release notes."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-5",
        kicker: "Maintenance Records",
        title: "Documentation and Maintenance Logs",
        blocks: [
          {
            type: "paragraph",
            text: "Part 107 does not require formal maintenance logbooks, but documentation is your strongest defense if something goes wrong. Professional operators keep records."
          },
          {
            type: "bullets",
            items: [
              "Log every flight: date, location, duration, battery used, any anomalies.",
              "Log every maintenance action: prop replacement, firmware update, repair, battery replacement.",
              "Log every inspection: preflight findings, post-flight damage assessment.",
              "Good records answer the FAA's questions before they ask them: 'When did you last inspect this aircraft?'",
              "A maintenance history also helps you spot patterns — recurring issues, aging components, performance trends."
            ]
          },
          {
            type: "callout",
            title: "CYA",
            text: "If an incident occurs and you have no records, the FAA assumes you did no maintenance. Paperwork is not busywork — it is professional armor."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-6",
        kicker: "Post-Flight",
        title: "Post-Flight Inspection and Data Review",
        blocks: [
          {
            type: "paragraph",
            text: "The flight does not end when the motors stop. A post-flight inspection catches damage that occurred during flight and feeds into the next preflight."
          },
          {
            type: "table",
            headers: ["Post-flight step", "What to do"],
            rows: [
              ["Visual inspection", "Check for new damage, debris ingestion, insect strikes on props/leading edges"],
              ["Battery check", "Temperature, swelling, voltage. Let batteries cool before charging."],
              ["Data offload", "Download flight logs and media. Review for anomalies."],
              ["Firmware notes", "Did the aircraft behave differently than expected? Note it."],
              ["Storage", "Remove battery for storage. Fold arms if applicable. Store in a dry, cool location."]
            ]
          },
          {
            type: "callout",
            title: "Continuous cycle",
            text: "Post-flight IS preflight for the next mission. What you find today prevents a problem tomorrow."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-7",
        kicker: "Common Defects",
        title: "Common Wear Items and Failure Points",
        blocks: [
          {
            type: "paragraph",
            text: "Every drone platform has known wear items. Knowing yours — and inspecting them deliberately — separates professional operators from hobbyists."
          },
          {
            type: "bullets",
            items: [
              "Propeller hubs: Stress fractures at the hub are invisible until they fail. Inspect under good light.",
              "Motor bearings: Gradual wear creates vibration that degrades video and eventually causes failure.",
              "Battery connectors: Repeated plug/unplug cycles wear connectors. Loose connection = voltage sag in flight.",
              "Gimbal dampeners: Rubber isolators degrade in heat and UV. Replace annually in heavy-use aircraft.",
              "Arm pivots and latches: Folding mechanisms wear. A loose arm in flight changes aerodynamics instantly.",
              "Landing gear mounts: Hard landings crack attachment points. Inspect after every rough touchdown."
            ]
          },
          {
            type: "callout",
            title: "Preventive replacement",
            text: "Replace wear items on a schedule, not just when they fail. A propeller that has hit something once should be replaced — period."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m10-8",
        kicker: "Inspection Workflow",
        title: "The Complete Inspection Routine",
        blocks: [
          {
            type: "diagram",
            title: "Inspection sequence for every flight",
            items: [
              "Pre-power: Visual airframe inspection, prop check, motor spin test, battery visual check.",
              "Power-on: Confirm home point, RTH altitude, battery level, firmware version, sensor status.",
              "Startup: Motor start sound check. Any unusual vibration? Shut down and inspect.",
              "Hover check: 30-second hover at 10 ft. Controls responsive? Stable? Any drift?",
              "Post-flight: Visual re-inspection, battery removal, damage assessment, log entry.",
              "If anything fails any step: the aircraft is grounded until the issue is resolved and re-inspected."
            ]
          },
          {
            type: "callout",
            title: "Trust but verify",
            text: "Your drone's self-diagnostics are helpful but incomplete. They cannot detect a cracked propeller hub. Your eyes can."
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  },
  {
    id: "11",
    number: 11,
    title: "Practice Exams",
    description: "Timed exams, review flags, topic weighting, explanations, and weak-area identification.",
    estimatedMinutes: 120,
    topicArea: "Operations",
    slides: [
      {
        id: "m11-1",
        kicker: "Exam Structure",
        title: "The Real Part 107 Exam — What You're Training For",
        blocks: [
          {
            type: "paragraph",
            text: `The FAA Unmanned Aircraft General - Small (UAG) knowledge test is ${GOVERNED_FACTS.acsWeighting.totalQuestions} multiple-choice questions with a ${GOVERNED_FACTS.acsWeighting.testingTimeMinutes}-minute time limit. You need 70% (42 correct) to pass. The test is taken at an FAA-approved testing center and costs approximately $175.`
          },
          {
            type: "table",
            headers: ["Exam fact", "What it means for you"],
            rows: [
              [`${GOVERNED_FACTS.acsWeighting.totalQuestions} questions, ${GOVERNED_FACTS.acsWeighting.testingTimeMinutes} minutes`, `You have ${GOVERNED_FACTS.acsWeighting.testingTimeMinutes / GOVERNED_FACTS.acsWeighting.totalQuestions} minutes per question. That is plenty if you are prepared.`],
              ["70% passing score", "You can miss 18 questions and still pass. But train to 85%+."],
              ["Single subject areas tested", "Airspace, weather, regulations, operations, loading/performance"],
              ["FAA testing supplement", "The proctor provides the supplement book used for figure questions; UAG figure references use FAA-CT-8080-2H graphics. Personal written or electronic materials are not allowed, and the proctor makes the final determination on test aids."],
              ["Photo ID required", "Government-issued photo ID at check-in. No exceptions."]
            ]
          },
          {
            type: "callout",
            title: "The goal",
            text: "Pass the real test on the first attempt. Re-tests cost time and money. This practice exam module trains you to walk in ready."
          }
        ],
        sources: [faaPilotSource, FAA_UAS_ACS_SOURCE, faaSampleQuestionsSource]
      },
      {
        id: "m11-2",
        kicker: "Topic Weighting",
        title: "Know Where the Points Are",
        blocks: [
          {
            type: "paragraph",
            text: "The FAA weights topic areas on the exam. Not every subject gets equal questions. Focus your study time where the points are densest."
          },
          {
            type: "table",
            headers: ["Topic area", "Approximate weight", "Priority"],
            rows: [
              ["Regulations", ACS_TOPIC_WEIGHTS.regulations, "Part 107 rules, privileges, and limitations"],
              ["Airspace & Requirements", ACS_TOPIC_WEIGHTS.airspace, "Airspace, authorization, and flight restrictions"],
              ["Weather", ACS_TOPIC_WEIGHTS.weather, "Sources, METARs, TAFs, and effects on performance"],
              ["Loading & Performance", ACS_TOPIC_WEIGHTS.loadingPerformance, "Aircraft loading and performance"],
              ["Operations", ACS_TOPIC_WEIGHTS.operations, "Largest range: procedures, ADM, airports, and maintenance"]
            ]
          },
          {
            type: "callout",
            title: "Study strategy",
            text: "Operations has the largest current ACS range. Use all five ranges to plan study time, then use practice results to target your own weak areas."
          }
        ],
        sources: [FAA_UAS_ACS_SOURCE]
      },
      {
        id: "m11-3",
        kicker: "Test Strategy",
        title: "A Battle-Tested Test-Taking Strategy",
        blocks: [
          {
            type: "diagram",
            title: "Three-pass approach to the 60-question exam",
            items: [
              "Pass 1: Answer every question you know immediately. Skip the hard ones. Flag uncertain answers.",
              "Pass 2: Return to flagged questions. Eliminate obviously wrong answers first. If still uncertain, go with your first instinct.",
              "Pass 3: Review all answers if time permits. Check for misread questions, changed unit conversions (SM vs NM, AGL vs MSL).",
              "Throughout: Watch the clock. If you spend more than 3 minutes on one question, flag it and move on."
            ]
          },
          {
            type: "bullets",
            items: [
              "Read every answer choice before selecting. The FAA often includes one nearly-correct distractor.",
              "If two answers are opposites, one of them is usually correct.",
              "Numbers matter: if a question gives you specific altitudes, distances, or times, the answer almost certainly depends on the exact number.",
              "If you genuinely do not know, eliminate the impossible answers and guess from the remainder. Never leave a question blank."
            ]
          },
          {
            type: "callout",
            title: "Military mindset",
            text: "You have taken harder tests under more pressure. This is a knowledge check, not a stress test. Breathe. Read. Think. Execute."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m11-4",
        kicker: "Using the Platform",
        title: "How to Use This Platform's Practice Exam",
        blocks: [
          {
            type: "paragraph",
            text: "The practice exam on this platform simulates the real thing: timed session, review flags, topic-tagged questions, and a detailed results breakdown. Use it deliberately, not casually."
          },
          {
            type: "bullets",
            items: [
              "Take the exam under real conditions: no distractions, no phone, no open reference tabs.",
              "Use the flag feature for questions you are unsure about — exactly as you will on test day.",
              "Review the topic breakdown on the results page. Weak areas (low percentage) are your study target.",
              "Track your score over multiple attempts. A rising trend means your studying is working.",
              "Aim for 85%+ consistently on practice exams before scheduling the real test."
            ]
          },
          {
            type: "callout",
            title: "Don't memorize the practice bank",
            text: "When you start scoring high because you have seen all the questions, you are no longer testing knowledge — you are testing memory. Switch to fresh question pools or increase the difficulty."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m11-5",
        kicker: "Common Traps",
        title: "Common Exam Traps and How to Avoid Them",
        blocks: [
          {
            type: "table",
            headers: ["Trap type", "Example", "How to beat it"],
            rows: [
              ["Unit confusion", "Switching SM to NM, AGL to MSL, knots to mph", "Circle the units in the question. Answer in those units."],
              ["'NOT' questions", "\"Which of the following is NOT required?\"", "Read the NOT. Flip the question mentally before answering."],
              ["Nearly correct distractor", "Answer B sounds right but swaps one number", "Read all four choices before picking. The difference is often one word."],
              ["Weather code trick", "METAR report with multiple cloud layers", "BKN/OVC = ceiling. SCT/FEW = not a ceiling. Count the oktas."],
              ["Airspace boundary", "\"Can you fly here?\" with sectional excerpt", "Trace the boundary line. Read the shelf label. Apply authorization rules."]
            ]
          },
          {
            type: "callout",
            title: "Slow down",
            text: "The FAA builds traps that catch fast readers. The pilot who finishes in 40 minutes and misses 20 questions fails. The pilot who uses 90 minutes and scores 85% passes."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m11-6",
        kicker: "Results Analysis",
        title: "Reading Your Results Like a Coach",
        blocks: [
          {
            type: "paragraph",
            text: "Your practice exam results page gives you a topic-by-topic breakdown. This is your study roadmap. Do not just look at the overall score — look at where you lost points."
          },
          {
            type: "table",
            headers: ["Result pattern", "What it means", "Corrective action"],
            rows: [
              ["High Regs, low Airspace", "You know the rules but cannot read charts", "Spend extra time in Modules 3 and 4"],
              ["High Airspace, low Weather", "You read charts well but misread METARs", "Revisit Module 6 — practice decoding METARs daily"],
              ["All scores borderline (65-75%)", "You know a little about everything but not enough", "Re-study the highest-weight topics first (Regs, Airspace)"],
              ["One topic dramatically below others", "You have a blind spot", "Run the flashcards for that module, then re-quiz"]
            ]
          },
          {
            type: "callout",
            title: "Continuous improvement",
            text: "Each exam attempt is a diagnostic. The goal is not '85% once.' The goal is '85% or higher, consistently, across multiple attempts with fresh questions.'"
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m11-7",
        kicker: "Study Schedule",
        title: "A 2-Week Study Plan for First-Time Test Takers",
        blocks: [
          {
            type: "diagram",
            title: "Two-week intensive study plan",
            items: [
              "Days 1-3: Modules 1-2 (Orientation and Regulations). Take Module 1 and 2 quizzes.",
              "Days 4-5: Modules 3-4 (Airspace and Sectional Charts). Practice reading real sectionals.",
              "Days 6-7: Modules 5-6 (Airports and Weather). Decode 10 METARs and 5 TAFs from real data.",
              "Days 8-9: Modules 7-10 (Operations, ADM, Physiology, Maintenance). Take all module quizzes.",
              "Days 10-12: Practice exams — one full exam per day. Review weak areas between each attempt.",
              "Days 13-14: Targeted review of weakest topics. Final practice exam. If 85%+, schedule the real test."
            ]
          },
          {
            type: "callout",
            title: "Adjust to you",
            text: "If you already know a topic area well, skip ahead. If one area is weak, spend extra days there. This is a template, not a contract."
          }
        ],
        sources: [faaPilotSource]
      },
      {
        id: "m11-8",
        kicker: "Ready to Test",
        title: "You Are Ready When This Is True",
        blocks: [
          {
            type: "bullets",
            items: [
              "You consistently score 85%+ on practice exams with fresh question pools.",
              "You can decode a METAR and TAF without looking up abbreviations.",
              "You can identify airspace classes, boundaries, and authorization requirements from a sectional chart excerpt.",
              "You know the five hazardous attitudes and their antidotes.",
              `You know the Part 107 operating limits: ${GOVERNED_FACTS.operatingLimitations.standardMaxAltitudeAglFeet} ft AGL, ${GOVERNED_FACTS.operatingLimitations.maxGroundspeedMph} mph, ${GOVERNED_FACTS.airspaceWeather.minimumVisibilitySm} SM visibility, less than ${GOVERNED_FACTS.operatingLimitations.smallUasWeightLimitPoundsExclusive} lb on takeoff, and the ${GOVERNED_FACTS.alcoholDrugRestrictions.lookbackHours}-hour alcohol rule.`,
              "You feel calm about the test — not because it is easy, but because you are prepared."
            ]
          },
          {
            type: "callout",
            title: "Final word",
            text: "The Part 107 test is a gate, not a wall. Walk through it with the confidence that comes from real preparation. You have the tools. Now use them."
          }
        ],
        sources: [faaPilotSource]
      }
    ]
  },
  {
    id: "12",
    number: 12,
    title: "Practical Flight Skills",
    description: "Drone hardware, controls, flight maneuvers, intelligent modes, camera settings, and simulators.",
    estimatedMinutes: 40,
    topicArea: "Operations",
    slides: [
      {
        id: "m12-1",
        kicker: "Hardware",
        title: "Know Your Aircraft Inside and Out",
        blocks: [
          {
            type: "paragraph",
            text: "A professional drone pilot knows their equipment the way a pilot knows their aircraft. You should understand every component, its function, its failure modes, and how it interacts with the rest of the system."
          },
          {
            type: "bullets",
            items: [
              "Flight controller: the brain — processes sensor data and pilot inputs to maintain stability.",
              "ESC (Electronic Speed Controller): translates flight controller commands into motor RPM.",
              "IMU (Inertial Measurement Unit): accelerometers and gyroscopes that sense attitude and movement.",
              "GPS/GLONASS module: positioning — requires clear sky view. Degraded near buildings and under tree canopy.",
              "Barometer: altitude reference. Sensitive to pressure changes and wind gusts at the sensor port.",
              "Obstacle avoidance sensors: infrared, ultrasonic, or visual. Each has range limits and blind spots."
            ]
          },
          {
            type: "callout",
            title: "Failure awareness",
            text: "Know what happens when each component fails. GPS loss = ATTI mode. IMU failure = uncontrollable. ESC failure = motor stops. You cannot respond to what you do not understand."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-2",
        kicker: "Controls",
        title: "Stick-and-Rudder Skills for Drone Pilots",
        blocks: [
          {
            type: "paragraph",
            text: "Basic control inputs translate to aircraft movement: throttle (altitude), yaw (rotation), pitch (forward/back tilt), and roll (side tilt). Coordinated use of all four is what separates smooth pilots from jerky ones."
          },
          {
            type: "table",
            headers: ["Control input", "Aircraft response", "Common mistake"],
            rows: [
              ["Throttle up", "Aircraft climbs", "Over-controlling — small adjustments are smoother"],
              ["Yaw left/right", "Aircraft rotates on vertical axis", "Using yaw for turns instead of coordinated banked turns"],
              ["Pitch forward", "Aircraft tilts forward and moves ahead", "Pitching too aggressively — smooth acceleration looks better"],
              ["Roll left/right", "Aircraft tilts and slides sideways", "Rolling without adjusting throttle — you lose altitude in a bank"]
            ]
          },
          {
            type: "callout",
            title: "Practice drill",
            text: "Hover at 10 ft. Fly a figure-8 pattern maintaining constant altitude and speed. This single drill builds throttle, yaw, pitch, and roll coordination simultaneously."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-3",
        kicker: "Flight Maneuvers",
        title: "Essential Flight Maneuvers for Professional Work",
        blocks: [
          {
            type: "paragraph",
            text: "Every commercial drone job requires specific maneuvers. Mastering these on demand — not just when conditions are perfect — is what clients pay for."
          },
          {
            type: "table",
            headers: ["Maneuver", "When you use it", "Key to doing it well"],
            rows: [
              ["Orbit / point of interest", "Real estate, inspection, cinematic shots", "Keep the subject centered while flying a perfect circle"],
              ["Fly-over / reveal", "Property tours, establishing shots", "Start low and tilted up, climb while pitching forward"],
              ["Top-down / nadir", "Mapping, roof inspection, orthomosaic capture", "Maintain consistent altitude and overlap — use grid patterns"],
              ["Dronie / pull-back", "Self-filming, group shots, event coverage", "Fly backward and upward while keeping subject framed"],
              ["Tracking shot", "Following vehicles, people, or animals", "Match subject speed smoothly. ActiveTrack helps but can fail"]
            ]
          },
          {
            type: "callout",
            title: "Rehearse before the job",
            text: "If a shot is critical, fly it once at a safe altitude to check framing and obstacles. Then fly it for real. The client sees the second take."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-4",
        kicker: "Intelligent Modes",
        title: "Understanding and Trusting (But Not Over-Trusting) Automation",
        blocks: [
          {
            type: "paragraph",
            text: "Modern drones offer intelligent flight modes: ActiveTrack, Waypoints, Hyperlapse, QuickShots, and more. These are powerful tools — and potential traps if you do not understand their limitations."
          },
          {
            type: "bullets",
            items: [
              "ActiveTrack follows a subject visually. It can lose lock in low contrast, backlight, or when the subject passes behind obstacles.",
              "Waypoints fly a pre-programmed route. Obstacles that were not there during programming WILL be hit.",
              "QuickShots execute pre-programmed maneuvers. They do not check for traffic — that is still your job.",
              "Return-to-Home is automation. A bad RTH altitude setting turns it into automation that flies into a tower.",
              "Treat every automated mode as if it could fail at any moment. Keep your hands on the sticks."
            ]
          },
          {
            type: "callout",
            title: "Automation rule",
            text: "Automation assists the pilot. It does not replace the pilot. If you cannot fly the maneuver manually, you should not trust the automation to do it for you."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-5",
        kicker: "Camera Settings",
        title: "Camera Basics for Drone Pilots",
        blocks: [
          {
            type: "paragraph",
            text: "Most commercial drone work is about the footage. Understanding basic camera settings makes the difference between usable results and wasted flight time."
          },
          {
            type: "table",
            headers: ["Setting", "What it controls", "Drone tip"],
            rows: [
              ["Shutter speed", "Motion blur — 2x frame rate is standard (1/60 for 30fps)", "Use ND filters in bright light to avoid overexposure"],
              ["ISO", "Sensor sensitivity — higher = more noise", "Keep as low as possible. 100-400 in daylight."],
              ["White balance", "Color temperature — match the light source", "Set manually. Auto WB shifts mid-shot and looks amateur."],
              ["Resolution & frame rate", "4K/30fps = standard. 60fps for slow motion.", "Higher frame rates need more light. Plan accordingly."],
              ["Photo interval", "For mapping: 2-second intervals at 30-40% overlap", "Check image sharpness mid-mission. Blurry photos ruin orthomosaics."]
            ]
          },
          {
            type: "callout",
            title: "Pre-flight camera check",
            text: "Format the SD card. Set manual exposure. Confirm ND filter is on. Check focus. These 30 seconds save entire missions."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-6",
        kicker: "Simulators",
        title: "Practice Without Risk Using Simulators",
        blocks: [
          {
            type: "paragraph",
            text: "Drone flight simulators let you practice maneuvers, emergency procedures, and new flight modes without risking your real aircraft. They are a professional development tool, not a toy."
          },
          {
            type: "bullets",
            items: [
              "DJI Flight Simulator: free, works with DJI controllers. Good for basic stick time.",
              "Zephyr, RealFlight, Liftoff: paid simulators with better physics and more scenarios.",
              "Practice ATTI mode extensively in the sim — it is hard to safely practice in real life.",
              "Simulate emergencies: lost link, low battery, flyaway. Build muscle memory.",
              "30 minutes of sim time per week maintains and improves stick skills, especially in bad-weather months."
            ]
          },
          {
            type: "callout",
            title: "Training mindset",
            text: "The best pilots in the world use simulators to stay sharp. You are not above it. Nobody is."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m12-7",
        kicker: "Skill Workflow",
        title: "Building and Maintaining Your Flight Proficiency",
        blocks: [
          {
            type: "diagram",
            title: "Proficiency maintenance plan",
            items: [
              "Weekly: 2-3 real flights practicing specific maneuvers (orbits, reveals, tracking).",
              "Monthly: One full mission simulation — planning through post-flight, as if a client were watching.",
              "Quarterly: Fly in a new environment or condition you are less comfortable with (wind, urban, night).",
              "As needed: Simulator practice for emergency procedures and ATTI mode handling.",
              "Always: Log every flight. Note what went well and what needs work. Review your logs periodically."
            ]
          },
          {
            type: "callout",
            title: "Never stop learning",
            text: "The day you think you have nothing left to learn as a pilot is the day you become dangerous. Stay humble. Stay sharp."
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  },
  {
    id: "13",
    number: 13,
    title: "Industry Pathways & Careers",
    description: "Career paths, drone services businesses, insurance, portfolios, and job search resources.",
    estimatedMinutes: 28,
    topicArea: "Operations",
    slides: [
      {
        id: "m13-1",
        kicker: "Career Landscape",
        title: "The Drone Industry Is Real and Growing",
        blocks: [
          {
            type: "paragraph",
            text: "The commercial drone industry has matured significantly. It is no longer just real estate photography. Opportunities exist in construction, inspection, surveying, public safety, agriculture, insurance, film, and defense contracting."
          },
          {
            type: "table",
            headers: ["Industry sector", "What drone pilots do"],
            rows: [
              ["Construction & Engineering", "Progress monitoring, site surveys, BIM integration, cut-fill analysis"],
              ["Infrastructure Inspection", "Cell towers, bridges, power lines, wind turbines, pipelines"],
              ["Real Estate & Marketing", "Property photos, video tours, 3D walkthroughs, community aerials"],
              ["Agriculture", "Crop health (NDVI), spraying, livestock monitoring, drainage mapping"],
              ["Public Safety", "Search and rescue, fire scene documentation, accident reconstruction"],
              ["Defense & Government", "C-UAS, TTP development, test range operations, ISR support"]
            ]
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-2",
        kicker: "Business Setup",
        title: "Starting a Drone Services Business",
        blocks: [
          {
            type: "paragraph",
            text: "Many Part 107 pilots operate as independent contractors or small business owners. Setting up correctly from day one avoids legal, tax, and insurance headaches."
          },
          {
            type: "bullets",
            items: [
              "Business structure: LLC provides liability protection. Sole proprietorship is simpler but exposes personal assets.",
              "Insurance: At minimum, general liability. Hull insurance covers your aircraft. Many clients require proof of coverage.",
              "Contracts: Always use a written agreement. Scope of work, deliverables, payment terms, weather contingencies.",
              "Pricing: Charge for your expertise, not just your flight time. Planning, travel, editing, and deliverables are all billable.",
              "Portfolio: Build a website or reel showcasing your best work. Clients hire based on what they can see you have done."
            ]
          },
          {
            type: "callout",
            title: "Professional-development resources",
            text: "Small-business and workforce-development resources can help with business planning, mentoring, and local networking. Evaluate each program against your own goals."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-3",
        kicker: "Certifications",
        title: "Additional Credentials That Increase Your Value",
        blocks: [
          {
            type: "paragraph",
            text: "A Part 107 certificate opens the door. Additional credentials open more doors — and higher rates."
          },
          {
            type: "table",
            headers: ["Credential", "What it adds"],
            rows: [
              ["FAA Part 61 (manned pilot)", "Deeper aviation knowledge and credibility"],
              ["FCC amateur radio license", "Legal operation on amateur-radio frequencies when applicable"],
              ["Project management certification", "Project planning and delivery credibility"],
              ["Thermography certification", "Infrared inspection skills for solar, roofing, and electrical work"],
              ["FAA Part 107 recurrent", "Keeps aeronautical knowledge current"]
            ]
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-4",
        kicker: "Job Search",
        title: "Finding Drone Work — Job Boards and Platforms",
        blocks: [
          {
            type: "paragraph",
            text: "Drone work comes through multiple channels: direct clients, staffing platforms, government contracts, and full-time employment. A smart job search uses all of them."
          },
          {
            type: "bullets",
            items: [
              "Drone-specific job boards: DroneBase, DroneDeploy, PrecisionHawk, FlyGuys.",
              "General platforms: Upwork (drone photography/video), Indeed/LinkedIn (search 'UAS' and 'Part 107').",
              "Government contracting: SAM.gov for federal contracts. State and local RFPs for infrastructure work.",
              "Networking: Build relationships through local aviation groups, industry events, and professional associations.",
              "Direct outreach: Contact construction companies, real estate agencies, and engineering firms. Most have never considered hiring a drone pilot. Show them what you can do."
            ]
          },
          {
            type: "callout",
            title: "Search deliberately",
            text: "Use job boards, USAJobs, direct company applications, and referrals as separate channels. Track applications and follow-up dates so opportunities do not get lost."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-5",
        kicker: "Portfolio",
        title: "Building a Portfolio That Wins Clients",
        blocks: [
          {
            type: "paragraph",
            text: "Your portfolio is your resume in visual form. It does not need to be massive — it needs to show quality, variety, and professionalism."
          },
          {
            type: "table",
            headers: ["Portfolio element", "What to include"],
            rows: [
              ["Hero reel", "60-90 second highlight video showing your best shots across different scenarios"],
              ["Project case studies", "3-5 projects: what the client needed, how you executed, the result"],
              ["Before/after examples", "Mapping outputs, inspection findings, progress comparisons"],
              ["Equipment list", "What you fly and what you can deliver — builds trust with technical clients"],
              ["Credentials section", "Part 107, relevant technical credentials, and insurance coverage"]
            ]
          },
          {
            type: "callout",
            title: "Website vs social",
            text: "A simple website (even a single page) looks more professional than an Instagram-only presence. Use both — the website for serious clients, social for visibility."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-6",
        kicker: "Rates & Contracts",
        title: "Pricing Your Work and Protecting Yourself",
        blocks: [
          {
            type: "paragraph",
            text: "Drone pilots range from $50/hour hobbyists to $250+/hour specialists. Your rate depends on your credentials, equipment, deliverables, and the value you provide — not just the time you spend flying."
          },
          {
            type: "bullets",
            items: [
              "Never quote an hourly 'flying rate.' Quote a project rate that includes planning, travel, flight time, editing, and deliverables.",
              "Typical real estate: $200-400 per property. Construction progress: $500-1,500/month retainer.",
              "Inspection work: $150-250/hour on-site. Mapping: $100-300/acre depending on resolution and deliverables.",
              "Specialized government and technical work varies widely by scope, contract terms, and required deliverables.",
              "Always have a contract. Scope creep is real — the contract defines what is and is not included."
            ]
          },
          {
            type: "callout",
            title: "Price the complete service",
            text: "Base pricing on scope, risk, planning, equipment, travel, processing, and deliverables—not flight time alone."
          }
        ],
        sources: [faaCommercialSource]
      },
      {
        id: "m13-7",
        kicker: "Next Steps",
        title: "A Practical Professional-Development Roadmap",
        blocks: [
          {
            type: "diagram",
            title: "Build momentum in stages",
            items: [
              "Now: Complete this training program. Score 85%+ on practice exams. Schedule your Part 107 test.",
              "Next 30 days: Pass the Part 107 exam. Build your portfolio website. Start networking on LinkedIn.",
              "Next 90 days: Apply to defense contractor UAS/program manager roles. Attend at least one industry event or UAS conference.",
              "Ongoing: Track applications or client leads, maintain currency, and add portfolio examples from completed work."
            ]
          },
          {
            type: "callout",
            title: "Review and adjust",
            text: "Set a regular review date, measure progress, and choose the next concrete action based on current results."
          }
        ],
        sources: [faaCommercialSource]
      }
    ]
  }
] satisfies Module[];

export const modules: Module[] = moduleBlueprints;

export function getModule(id: string) {
  return modules.find((courseModule) => courseModule.id === id);
}

export function getNextModule(id: string) {
  const index = modules.findIndex((courseModule) => courseModule.id === id);
  return index >= 0 ? modules[index + 1] : undefined;
}

export function getPreviousModule(id: string) {
  const index = modules.findIndex((courseModule) => courseModule.id === id);
  return index > 0 ? modules[index - 1] : undefined;
}
