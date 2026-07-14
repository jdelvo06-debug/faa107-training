import {
  GOVERNED_FACTS,
  OPERATIONS_OVER_PEOPLE_SUMMARIES,
  SAFETY_EVENT_REPORTING_SUMMARY,
  SMALL_UAS_WEIGHT_SUMMARY,
} from "@/lib/regulatory-sources";

const { operatingLimitations, registration, recency, acsWeighting } =
  GOVERNED_FACTS;

export const CRAM_OPERATING_LIMITS = [
  {
    id: "max-altitude",
    label: "Max altitude",
    value: `${operatingLimitations.standardMaxAltitudeAglFeet} ft AGL; structure allowance requires remaining within ${operatingLimitations.structureRadiusFeet} ft and no more than ${operatingLimitations.maxHeightAboveStructureFeet} ft above the structure's uppermost limit`,
  },
  {
    id: "max-speed",
    label: "Max speed",
    value: `${operatingLimitations.maxGroundspeedMph} mph (${operatingLimitations.maxGroundspeedKnots} knots)`,
  },
  {
    id: "vlos",
    label: "VLOS",
    value: "Must maintain visual line of sight",
  },
  {
    id: "right-of-way",
    label: "Right of way",
    value: operatingLimitations.rightOfWaySummary,
  },
  {
    id: "alcohol",
    label: "Alcohol",
    value: `No use within ${GOVERNED_FACTS.alcoholDrugRestrictions.lookbackHours} hours; no operation while under the influence or at an alcohol concentration of ${GOVERNED_FACTS.alcoholDrugRestrictions.prohibitedConcentrationAtOrAbove} or greater`,
  },
  {
    id: "drugs",
    label: "Drugs",
    value: "No drug that affects faculties contrary to safety",
  },
  {
    id: "max-weight",
    label: "Max weight",
    value: SMALL_UAS_WEIGHT_SUMMARY,
  },
  {
    id: "registration",
    label: "Registration",
    value: registration.requiredForPart107
      ? "All drones operated under Part 107 must be registered"
      : "Check current FAA registration requirements",
  },
  {
    id: "night-ops",
    label: "Night ops",
    value: "Anti-collision light visible 3 SM",
  },
  {
    id: "safety-event-report",
    label: "Safety event report",
    value: SAFETY_EVENT_REPORTING_SUMMARY,
  },
  {
    id: "remote-id",
    label: "Remote ID",
    value: "Required for most operations",
  },
] as const;

export const CRAM_OPERATIONS_OVER_PEOPLE = OPERATIONS_OVER_PEOPLE_SUMMARIES;

export const CRAM_AIRSPACE_ROWS = [
  {
    className: "Class B",
    description: "Major-airport layered airspace",
    chart: "Solid blue",
    rule: "FAA authorization required",
  },
  {
    className: "Class C",
    description: "Two-tier airport airspace",
    chart: "Solid magenta",
    rule: "FAA authorization required",
  },
  {
    className: "Class D",
    description: "Towered-airport surface area",
    chart: "Dashed blue",
    rule: "FAA authorization required",
  },
  {
    className: "Class E",
    description: "Controlled (not B/C/D)",
    chart: "Dashed magenta / shaded blue or magenta",
    rule: `${GOVERNED_FACTS.airspaceWeather.authorizationSummary} ${GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance}`,
  },
  {
    className: "Class G",
    description: "Uncontrolled",
    chart: "Not separately bounded",
    rule: "No ATC authorization",
  },
] as const;

export const CRAM_AIRPORT_SYMBOL_COLORS = {
  id: "airport-symbol-colors",
  label: "Airport symbol colors",
  value: `Blue indicates a ${GOVERNED_FACTS.airspaceWeather.chartSymbols.blueAirport.toLowerCase()}; magenta indicates a ${GOVERNED_FACTS.airspaceWeather.chartSymbols.magentaAirport.toLowerCase()}. Color does not state whether IFR procedures exist.`,
} as const;

export const CRAM_WEATHER_MINIMUMS = [
  {
    id: "visibility",
    label: "Part 107 minimum visibility",
    value: `${GOVERNED_FACTS.airspaceWeather.minimumVisibilitySm} SM from the control station`,
  },
  {
    id: "cloud-clearance",
    label: "Part 107 cloud distance",
    value: `At least ${GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet} ft below and ${GOVERNED_FACTS.airspaceWeather.cloudClearanceHorizontalFeet.toLocaleString("en-US")} ft horizontally`,
  },
] as const;

function percentRange(range: { minPercent: number; maxPercent: number }) {
  return `${range.minPercent}–${range.maxPercent}%`;
}

function estimatedQuestionRange(range: {
  minPercent: number;
  maxPercent: number;
}) {
  const minimum = Math.round(
    (range.minPercent / 100) * acsWeighting.totalQuestions,
  );
  const maximum = Math.round(
    (range.maxPercent / 100) * acsWeighting.totalQuestions,
  );
  return `${minimum}–${maximum}`;
}

export const CRAM_ACS_ROWS = [
  {
    area: "I",
    topic: "Regulations",
    weight: percentRange(acsWeighting.ranges.regulations),
    estimatedQuestions: estimatedQuestionRange(acsWeighting.ranges.regulations),
  },
  {
    area: "II",
    topic: "Airspace & Operating Requirements",
    weight: percentRange(acsWeighting.ranges.airspace),
    estimatedQuestions: estimatedQuestionRange(acsWeighting.ranges.airspace),
  },
  {
    area: "III",
    topic: "Weather",
    weight: percentRange(acsWeighting.ranges.weather),
    estimatedQuestions: estimatedQuestionRange(acsWeighting.ranges.weather),
  },
  {
    area: "IV",
    topic: "Loading & Performance",
    weight: percentRange(acsWeighting.ranges.loadingPerformance),
    estimatedQuestions: estimatedQuestionRange(
      acsWeighting.ranges.loadingPerformance,
    ),
  },
  {
    area: "V",
    topic: "Operations",
    weight: percentRange(acsWeighting.ranges.operations),
    estimatedQuestions: estimatedQuestionRange(acsWeighting.ranges.operations),
  },
] as const;

export const CRAM_TEST_FORMAT = [
  {
    id: "questions",
    label: "Questions",
    value: `${acsWeighting.totalQuestions} multiple-choice questions`,
  },
  {
    id: "time",
    label: "Time",
    value: `${acsWeighting.testingTimeMinutes} minutes (2 hours)`,
  },
  {
    id: "passing",
    label: "Passing",
    value: "70% (42/60 correct)",
  },
  {
    id: "test-code",
    label: "Test code",
    value: "UAG — Unmanned Aircraft General — Small",
  },
  {
    id: "recency",
    label: "Aeronautical knowledge recency",
    value: `The certificate does not expire; to exercise its privileges, complete a qualifying § 107.65 event within the previous ${recency.periodCalendarMonths} calendar months (initial knowledge test, or applicable recurrent training: ${recency.allPart107CourseCode} for all Part 107 pilots; ${recency.currentPart61CourseCode} for ${recency.currentPart61Eligibility})`,
  },
  {
    id: "minimum-age",
    label: "Age",
    value: `${acsWeighting.minimumKnowledgeTestAge} for the UAG knowledge test; ${recency.minimumCertificateAge} for Remote Pilot Certificate eligibility`,
  },
] as const;
