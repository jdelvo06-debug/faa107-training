export const APPROVED_REGULATORY_SOURCE_HOSTS = [
  "faa.gov",
  "ecfr.gov",
] as const;

export const REQUIRED_REGULATORY_TOPICS = [
  "part-107-operating-limitations",
  "registration",
  "alcohol-drug-restrictions",
  "recurrent-training-certificate-terminology",
  "operations-over-people",
  "airspace-weather-minimums",
  "faa-acs-weighting",
] as const;

export type RegulatoryTopic = (typeof REQUIRED_REGULATORY_TOPICS)[number];

export interface RegulatorySource {
  id: string;
  title: string;
  authority: "eCFR" | "FAA";
  url: string;
  sourceEditionOrEffectiveDate: string;
}

export interface RegulatoryConsumerSurface {
  path: string;
  notes: string;
}

export interface RegulatoryReviewTrigger {
  cadence: string;
  events: readonly string[];
}

export interface RegulatorySourceRecord {
  id: string;
  topic: RegulatoryTopic;
  ownerRole: string;
  reviewerRole: string;
  lastReviewed: string;
  reviewTrigger: RegulatoryReviewTrigger;
  sources: readonly RegulatorySource[];
  factKeys: readonly string[];
  consumerSurfaces: readonly RegulatoryConsumerSurface[];
}

const ECFR_TITLE_14_EDITION =
  "eCFR Title 14 current through 2026-07-10; Title 14 last amended 2026-07-06";

export const OFFICIAL_REGULATORY_SOURCES = {
  smallUasDefinition: {
    id: "ecfr-14-cfr-1-1-small-unmanned-aircraft",
    title: "14 CFR § 1.1 — Small unmanned aircraft definition",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/section-1.1",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operatingLimitations: {
    id: "ecfr-14-cfr-107-51-operating-limitations",
    title: "14 CFR § 107.51 — Operating limitations for small unmanned aircraft",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.51",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  rightOfWay: {
    id: "ecfr-14-cfr-107-37-right-of-way",
    title: "14 CFR § 107.37 — Operation near aircraft; right-of-way rules",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.37",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  safetyEventReporting: {
    id: "ecfr-14-cfr-107-9-safety-event-reporting",
    title: "14 CFR § 107.9 — Safety event reporting",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.9",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  registration: {
    id: "faa-drone-registration-requirements",
    title: "FAA — Register Your Drone",
    authority: "FAA",
    url: "https://www.faa.gov/uas/getting_started/register_drone",
    sourceEditionOrEffectiveDate: "FAA page last updated 2024-03-18",
  },
  part107AlcoholDrugIncorporation: {
    id: "ecfr-14-cfr-107-27-alcohol-drugs",
    title: "14 CFR § 107.27 — Alcohol or drugs",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.27",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  alcoholDrugProhibitions: {
    id: "ecfr-14-cfr-91-17-alcohol-drugs",
    title: "14 CFR § 91.17 — Alcohol or drugs",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/section-91.17",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  aeronauticalKnowledgeRecency: {
    id: "ecfr-14-cfr-107-65-recency",
    title: "14 CFR § 107.65 — Aeronautical knowledge recency",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.65",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  remotePilotCertification: {
    id: "faa-become-certificated-remote-pilot",
    title: "FAA — Become a Certificated Remote Pilot",
    authority: "FAA",
    url: "https://www.faa.gov/uas/commercial_operators/become_a_drone_pilot",
    sourceEditionOrEffectiveDate: "FAA page last updated 2026-06-09",
  },
  remotePilotCertificateExpiration: {
    id: "faa-remote-pilot-certificate-expiration-faq",
    title: "FAA FAQ — Does recurrent training issue a new Remote Pilot Certificate?",
    authority: "FAA",
    url: "https://www.faa.gov/faq/after-part-107-pilot-completes-online-alc-training-course-renew-hisher-remote-pilot-currency",
    sourceEditionOrEffectiveDate:
      "FAA FAQ reviewed 2026-07-14; no edition date stated on page",
  },
  operationsOverPeopleCategory1: {
    id: "ecfr-14-cfr-107-110-category-1",
    title: "14 CFR § 107.110 — Category 1 operations",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.110",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeopleCategory2: {
    id: "ecfr-14-cfr-107-120-category-2",
    title: "14 CFR § 107.120 — Category 2 operations",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.120",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeopleCategory2Operating: {
    id: "ecfr-14-cfr-107-115-category-2-operating",
    title: "14 CFR § 107.115 — Category 2 operating requirements",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.115",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeopleCategory3: {
    id: "ecfr-14-cfr-107-130-category-3",
    title: "14 CFR § 107.130 — Category 3 operations",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.130",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeopleCategory3Operating: {
    id: "ecfr-14-cfr-107-125-category-3-operating",
    title: "14 CFR § 107.125 — Category 3 operating requirements",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.125",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeopleCategory4: {
    id: "ecfr-14-cfr-107-140-category-4",
    title: "14 CFR § 107.140 — Category 4 operations",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.140",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  operationsOverPeople: {
    id: "faa-operations-over-people",
    title: "FAA — Operations Over People General Overview",
    authority: "FAA",
    url: "https://www.faa.gov/uas/commercial_operators/operations_over_people",
    sourceEditionOrEffectiveDate:
      "Rule effective 2021-04-21; FAA page last updated 2022-11-10",
  },
  controlledAirspace: {
    id: "ecfr-14-cfr-107-41-controlled-airspace",
    title: "14 CFR § 107.41 — Operation in certain airspace",
    authority: "eCFR",
    url: "https://www.ecfr.gov/current/title-14/part-107/section-107.41",
    sourceEditionOrEffectiveDate: ECFR_TITLE_14_EDITION,
  },
  classEAirspaceDesignations: {
    id: "faa-order-jo-7210-3ee-class-e-designations",
    title: "FAA Order JO 7210.3EE, Chapter 19 § 6 — Class E airspace",
    authority: "FAA",
    url: "https://www.faa.gov/air_traffic/publications/atpubs/foa_html/chap19_section_6.html",
    sourceEditionOrEffectiveDate:
      "FAA Order JO 7210.3EE, Change 3, effective 2026-07-09",
  },
  chartUsersGuideIndex: {
    id: "faa-aeronautical-chart-users-guide-index",
    title: "FAA — Aeronautical Chart User's Guide current-edition page",
    authority: "FAA",
    url: "https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/",
    sourceEditionOrEffectiveDate: "FAA page modified 2026-07-09",
  },
  chartUsersGuide: {
    id: "faa-aeronautical-chart-users-guide-2026-07-09",
    title: "FAA — Aeronautical Chart User's Guide",
    authority: "FAA",
    url: "https://aeronav.faa.gov/user_guide/cug-complete_20260709.pdf",
    sourceEditionOrEffectiveDate:
      "Aeronautical Chart User's Guide effective 2026-07-09",
  },
  acsIndex: {
    id: "faa-airman-certification-standards-index",
    title: "FAA — Airman Certification Standards",
    authority: "FAA",
    url: "https://www.faa.gov/training_testing/testing/acs",
    sourceEditionOrEffectiveDate: "FAA index last updated 2025-11-19",
  },
  uasAcs: {
    id: "faa-s-acs-10b-small-uas",
    title: "FAA-S-ACS-10B — Remote Pilot Small Unmanned Aircraft Systems ACS",
    authority: "FAA",
    url: "https://www.faa.gov/sites/faa.gov/files/training_testing/testing/acs/uas_acs.pdf",
    sourceEditionOrEffectiveDate: "FAA-S-ACS-10B, effective 2021-04-06",
  },
} as const satisfies Record<string, RegulatorySource>;

export const GOVERNED_FACTS = {
  operatingLimitations: {
    standardMaxAltitudeAglFeet: 400,
    structureRadiusFeet: 400,
    maxHeightAboveStructureFeet: 400,
    maxGroundspeedMph: 100,
    maxGroundspeedKnots: 87,
    smallUasWeightLimitPoundsExclusive: 55,
    rightOfWaySummary:
      "Yield to all aircraft, airborne vehicles, and launch and reentry vehicles",
    safetyEventReportDays: 10,
    propertyDamageThresholdExclusiveDollars: 500,
  },
  registration: {
    requiredForPart107: true,
    validityYears: 3,
    registrationIsPerAircraft: true,
    recreationalWeightExceptionAppliesToPart107: false,
  },
  alcoholDrugRestrictions: {
    lookbackHours: 8,
    prohibitedConcentrationAtOrAbove: 0.04,
    drugScenarioAnswer:
      "No — the drug is affecting their faculties contrary to safety",
  },
  recency: {
    certificateExpires: false,
    periodCalendarMonths: 24,
    initialKnowledgeTestQualifies: true,
    allPart107CourseCode: "ALC-677",
    currentPart61CourseCode: "ALC-515",
    minimumCertificateAge: 16,
    currentPart61Eligibility:
      "Part 107 pilots who hold a Part 61 pilot certificate other than a student pilot certificate and have a current flight review",
  },
  operationsOverPeople: {
    category1MaxWeightPoundsInclusive: 0.55,
    category2InjuryThresholdFootPounds: 11,
    category3InjuryThresholdFootPounds: 25,
  },
  airspaceWeather: {
    authorizationClasses: [
      "Class B",
      "Class C",
      "Class D",
      "Class E airport surface areas",
    ],
    authorizationSummary:
      "FAA authorization is required before Part 107 operations in Class B, C, or D airspace, or within the lateral boundaries of the Class E surface area designated for an airport (Class E2).",
    dashedMagentaGuidance:
      "A dashed magenta boundary can also depict a Class E extension area, so the symbol alone does not establish an authorization requirement; verify the applicable airspace and UAS Facility Map.",
    minimumVisibilitySm: 3,
    cloudClearanceBelowFeet: 500,
    cloudClearanceHorizontalFeet: 2_000,
    chartSymbols: {
      solidBlue: "Class B airspace",
      solidMagenta: "Class C airspace",
      dashedBlue: "Class D airspace",
      dashedMagenta: "Class E airspace beginning at the surface",
      blueAirport: "Towered airport",
      magentaAirport: "Non-towered airport",
    },
  },
  acsWeighting: {
    edition: "FAA-S-ACS-10B",
    effectiveDate: "2021-04-06",
    totalQuestions: 60,
    testingTimeMinutes: 120,
    minimumKnowledgeTestAge: 14,
    ranges: {
      regulations: { minPercent: 15, maxPercent: 25 },
      airspace: { minPercent: 15, maxPercent: 25 },
      weather: { minPercent: 11, maxPercent: 16 },
      loadingPerformance: { minPercent: 7, maxPercent: 11 },
      operations: { minPercent: 35, maxPercent: 45 },
    },
  },
} as const;

export const SMALL_UAS_WEIGHT_SUMMARY =
  "Less than 55 lb on takeoff, including everything on board or otherwise attached";

export const STANDARD_ALTITUDE_LIMIT_SUMMARY =
  "400 ft AGL; the structure allowance requires remaining within a 400-ft radius and no more than 400 ft above the structure's immediate uppermost limit";

export const STANDARD_SPEED_LIMIT_SUMMARY = "100 mph (87 knots)";

export const SAFETY_EVENT_REPORTING_SUMMARY =
  "Report within 10 days after a qualifying serious injury or loss of consciousness, or damage to property other than the small unmanned aircraft when repair cost or fair-market value exceeds $500";

export const ALCOHOL_DRUG_SUMMARY =
  "No alcohol within 8 hours before flight. No operation while under the influence, while using a drug that affects faculties contrary to safety, or with an alcohol concentration of 0.04 or greater in blood or breath.";

export const NON_CEILING_CLOUD_CLEARANCE_REMINDER =
  "No ceiling — cloud clearance still applies";

export const OPERATIONS_OVER_PEOPLE_SUMMARIES = [
  {
    id: "category-1",
    category: "Category 1",
    rule: "0.55 lb or less on takeoff and throughout the operation, including attachments; no exposed rotating parts that would lacerate skin. Sustained flight over open-air assemblies requires Remote ID compliance.",
  },
  {
    id: "category-2",
    category: "Category 2",
    rule: "Must not cause injury equivalent to or greater than a rigid-object impact transferring 11 foot-pounds; no exposed lacerating rotating parts or safety defect; FAA-accepted declaration, label, and instructions required. Sustained flight over open-air assemblies requires Remote ID compliance.",
  },
  {
    id: "category-3",
    category: "Category 3",
    rule: "Must not cause injury equivalent to or greater than a rigid-object impact transferring 25 foot-pounds; no exposed lacerating rotating parts or safety defect; FAA-accepted declaration, label, and instructions required. No open-air assemblies; closed/restricted-access site where everyone is on notice, or no sustained flight over unprotected nonparticipants.",
  },
  {
    id: "category-4",
    category: "Category 4",
    rule: "Part 21 airworthiness certificate; follow approved operating limitations and maintenance requirements. Sustained flight over open-air assemblies requires Remote ID compliance.",
  },
] as const;

export function maximumStandardAglBelowCloudBase(cloudBaseAglFeet: number) {
  if (!Number.isFinite(cloudBaseAglFeet) || cloudBaseAglFeet < 0) {
    throw new RangeError("Cloud-base altitude must be a nonnegative finite number");
  }

  const clearanceLimitedAltitude =
    cloudBaseAglFeet - GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet;
  if (clearanceLimitedAltitude < 0) return null;
  return Math.min(
    GOVERNED_FACTS.operatingLimitations.standardMaxAltitudeAglFeet,
    clearanceLimitedAltitude,
  );
}

export function describeCloudCeilingLimit(cloudBaseAglFeet: number) {
  const maximumAltitude = maximumStandardAglBelowCloudBase(cloudBaseAglFeet);
  if (maximumAltitude === null) {
    return `A cloud base at ${cloudBaseAglFeet} ft AGL does not leave the required ${GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet}-ft vertical clearance above the surface.`;
  }

  return `A cloud base at ${cloudBaseAglFeet} ft AGL limits the standard operation to ${maximumAltitude} ft AGL to remain ${GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet} ft below; the ${GOVERNED_FACTS.operatingLimitations.standardMaxAltitudeAglFeet}-ft AGL ceiling does not override cloud clearance.`;
}

const CONTENT_OWNER_ROLE = "FAA 107 course content maintainer";
const INDEPENDENT_REVIEWER_ROLE = "Independent FAA regulatory content reviewer";
const LAST_REVIEWED = "2026-07-14";

export const REGULATORY_SOURCE_REGISTRY: readonly RegulatorySourceRecord[] = [
  {
    id: "part-107-operating-limitations",
    topic: "part-107-operating-limitations",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each curriculum release",
      events: [
        "Any amendment to 14 CFR §§ 1.1, 107.9, 107.37, or 107.51",
        "Any FAA notice changing standard operating limitations",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.smallUasDefinition,
      OFFICIAL_REGULATORY_SOURCES.operatingLimitations,
      OFFICIAL_REGULATORY_SOURCES.rightOfWay,
      OFFICIAL_REGULATORY_SOURCES.safetyEventReporting,
    ],
    factKeys: [
      "operatingLimitations.standardMaxAltitudeAglFeet",
      "operatingLimitations.structureRadiusFeet",
      "operatingLimitations.maxHeightAboveStructureFeet",
      "operatingLimitations.maxGroundspeedMph",
      "operatingLimitations.maxGroundspeedKnots",
      "operatingLimitations.smallUasWeightLimitPoundsExclusive",
      "operatingLimitations.rightOfWaySummary",
      "operatingLimitations.safetyEventReportDays",
      "operatingLimitations.propertyDamageThresholdExclusiveDollars",
    ],
    consumerSurfaces: [
      { path: "lib/course-data.ts", notes: "Module 2 limits and Module 11 readiness summary" },
      { path: "lib/questions.ts", notes: "Operating-limit assessment items" },
      { path: "lib/flashcards.ts", notes: "Altitude and groundspeed review cards" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable operating-limit summary" },
      { path: "components/study-plan.tsx", notes: "Day-one numeric memory prompt" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
  {
    id: "part-107-registration",
    topic: "registration",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each curriculum release",
      events: [
        "FAA DroneZone registration fee, term, eligibility, or category changes",
        "Any amendment to registration rules applicable to Part 107 aircraft",
      ],
    },
    sources: [OFFICIAL_REGULATORY_SOURCES.registration],
    factKeys: [
      "registration.requiredForPart107",
      "registration.validityYears",
      "registration.registrationIsPerAircraft",
      "registration.recreationalWeightExceptionAppliesToPart107",
    ],
    consumerSurfaces: [
      { path: "lib/course-data.ts", notes: "Module 2 registration lesson" },
      { path: "lib/questions.ts", notes: "Registration assessment items" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable registration statement" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
  {
    id: "part-107-alcohol-drug-restrictions",
    topic: "alcohol-drug-restrictions",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each curriculum release",
      events: [
        "Any amendment to 14 CFR §§ 107.27 or 91.17",
        "Any FAA guidance changing how these independent prohibitions are taught",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.part107AlcoholDrugIncorporation,
      OFFICIAL_REGULATORY_SOURCES.alcoholDrugProhibitions,
    ],
    factKeys: [
      "alcoholDrugRestrictions.lookbackHours",
      "alcoholDrugRestrictions.prohibitedConcentrationAtOrAbove",
      "alcoholDrugRestrictions.drugScenarioAnswer",
    ],
    consumerSurfaces: [
      { path: "lib/course-data.ts", notes: "Modules 2 and 9 crew-fitness instruction" },
      { path: "lib/questions.ts", notes: "Alcohol and medication scenarios" },
      { path: "lib/flashcards.ts", notes: "Alcohol/drug rule flashcard" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable alcohol/drug summary" },
      { path: "components/study-plan.tsx", notes: "Day-one numeric memory prompt" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
  {
    id: "part-107-recency-certificate-terminology",
    topic: "recurrent-training-certificate-terminology",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each curriculum release",
      events: [
        "Any amendment to 14 CFR § 107.65",
        "FAA course-code, eligibility-path, or certificate-status guidance changes",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.aeronauticalKnowledgeRecency,
      OFFICIAL_REGULATORY_SOURCES.remotePilotCertification,
      OFFICIAL_REGULATORY_SOURCES.remotePilotCertificateExpiration,
    ],
    factKeys: [
      "recency.certificateExpires",
      "recency.periodCalendarMonths",
      "recency.initialKnowledgeTestQualifies",
      "recency.allPart107CourseCode",
      "recency.currentPart61CourseCode",
      "recency.minimumCertificateAge",
      "recency.currentPart61Eligibility",
    ],
    consumerSurfaces: [
      { path: "lib/cram-sheet-data.ts", notes: "Printable exam and recency terminology" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
  {
    id: "part-107-operations-over-people",
    topic: "operations-over-people",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each curriculum release",
      events: [
        "Any amendment to Part 107 Subpart D",
        "Any FAA declaration-of-compliance, category, Remote ID, or open-air-assembly guidance change",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory1,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory2Operating,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory2,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory3Operating,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory3,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeopleCategory4,
      OFFICIAL_REGULATORY_SOURCES.operationsOverPeople,
    ],
    factKeys: [
      "operationsOverPeople.category1MaxWeightPoundsInclusive",
      "operationsOverPeople.category2InjuryThresholdFootPounds",
      "operationsOverPeople.category3InjuryThresholdFootPounds",
    ],
    consumerSurfaces: [
      { path: "lib/course-data.ts", notes: "Module 2 category table" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable category snapshot" },
    ],
  },
  {
    id: "part-107-airspace-weather-minimums",
    topic: "airspace-weather-minimums",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly, at each chart-guide edition, and before each curriculum release",
      events: [
        "Any amendment to 14 CFR §§ 107.41 or 107.51",
        "A revision or change to FAA Order JO 7210.3 Class E designation criteria",
        "A new FAA Aeronautical Chart User's Guide edition",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.controlledAirspace,
      OFFICIAL_REGULATORY_SOURCES.classEAirspaceDesignations,
      OFFICIAL_REGULATORY_SOURCES.operatingLimitations,
      OFFICIAL_REGULATORY_SOURCES.chartUsersGuideIndex,
      OFFICIAL_REGULATORY_SOURCES.chartUsersGuide,
    ],
    factKeys: [
      "airspaceWeather.authorizationClasses",
      "airspaceWeather.authorizationSummary",
      "airspaceWeather.dashedMagentaGuidance",
      "airspaceWeather.minimumVisibilitySm",
      "airspaceWeather.cloudClearanceBelowFeet",
      "airspaceWeather.cloudClearanceHorizontalFeet",
      "airspaceWeather.chartSymbols",
    ],
    consumerSurfaces: [
      { path: "lib/course-data.ts", notes: "Airspace, chart, and weather lessons" },
      { path: "lib/questions.ts", notes: "Airspace symbol and weather assessment items" },
      { path: "lib/flashcards.ts", notes: "Airspace and weather review cards" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable airspace and weather tables" },
      { path: "components/study-plan.tsx", notes: "Study-plan weather-minimum reminder" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
  {
    id: "faa-uas-acs-weighting",
    topic: "faa-acs-weighting",
    ownerRole: CONTENT_OWNER_ROLE,
    reviewerRole: INDEPENDENT_REVIEWER_ROLE,
    lastReviewed: LAST_REVIEWED,
    reviewTrigger: {
      cadence: "Quarterly and before each exam-content release",
      events: [
        "A new FAA UAS ACS edition or revised FAA ACS index entry",
        "A change to the UAG test question count, time, or topic ranges",
      ],
    },
    sources: [
      OFFICIAL_REGULATORY_SOURCES.acsIndex,
      OFFICIAL_REGULATORY_SOURCES.uasAcs,
    ],
    factKeys: [
      "acsWeighting.edition",
      "acsWeighting.effectiveDate",
      "acsWeighting.totalQuestions",
      "acsWeighting.testingTimeMinutes",
      "acsWeighting.minimumKnowledgeTestAge",
      "acsWeighting.ranges",
    ],
    consumerSurfaces: [
      { path: "lib/acs-weights.ts", notes: "Canonical display adapter for ACS ranges" },
      { path: "lib/assessment-engine.ts", notes: "Fixed 60-question app allocation within ACS ranges" },
      { path: "lib/course-data.ts", notes: "Module 11 ACS table" },
      { path: "lib/questions.ts", notes: "ACS range assessment explanations" },
      { path: "lib/flashcards.ts", notes: "ACS range flashcard" },
      { path: "lib/cram-sheet-data.ts", notes: "Printable ACS table" },
      { path: "components/practice-exam.tsx", notes: "Timed-exam count and duration" },
      { path: "components/study-plan.tsx", notes: "Study-tip count and duration" },
      { path: "research/regulations.md", notes: "Regulatory research summary" },
    ],
  },
] as const;
