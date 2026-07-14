import {
  GOVERNED_FACTS,
  OFFICIAL_REGULATORY_SOURCES,
} from "@/lib/regulatory-sources";

export const ACS_TOPIC_WEIGHT_RANGES = GOVERNED_FACTS.acsWeighting.ranges;

function formatRange(range: { minPercent: number; maxPercent: number }) {
  return `${range.minPercent}–${range.maxPercent}%`;
}

export const ACS_TOPIC_WEIGHTS = {
  regulations: formatRange(ACS_TOPIC_WEIGHT_RANGES.regulations),
  airspace: formatRange(ACS_TOPIC_WEIGHT_RANGES.airspace),
  weather: formatRange(ACS_TOPIC_WEIGHT_RANGES.weather),
  loadingPerformance: formatRange(ACS_TOPIC_WEIGHT_RANGES.loadingPerformance),
  operations: formatRange(ACS_TOPIC_WEIGHT_RANGES.operations),
} as const;

export function describeAcsRanges(weights: {
  regulations: string;
  airspace: string;
  operations: string;
}) {
  return `Operations has the largest current ACS range at ${weights.operations}. Regulations are ${weights.regulations} and Airspace & Requirements are ${weights.airspace}.`;
}

export const FAA_UAS_ACS_SOURCE = {
  label: OFFICIAL_REGULATORY_SOURCES.uasAcs.title,
  href: OFFICIAL_REGULATORY_SOURCES.uasAcs.url,
} as const;
