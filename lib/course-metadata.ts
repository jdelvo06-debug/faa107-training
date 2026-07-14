import type { TopicArea } from "@/lib/types";

export interface CourseModuleMetadata {
  id: string;
  number: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  topicArea: TopicArea;
  slideIds: readonly string[];
}

export const courseModuleMetadata = [
  {
    id: "1",
    number: 1,
    title: "Welcome & Getting Started",
    description: "The certification path, test format, core terms, and how to use this course.",
    estimatedMinutes: 28,
    topicArea: "Operations",
    slideIds: ["m1-1", "m1-2", "m1-3", "m1-4", "m1-5", "m1-6", "m1-7", "m1-8"],
  },
  {
    id: "2",
    number: 2,
    title: "FAA Regulations",
    description: "The core Part 107 rules: certificate duties, registration, operating limits, waivers, Remote ID, and LAANC.",
    estimatedMinutes: 42,
    topicArea: "Regulations",
    slideIds: ["m2-1", "m2-2", "m2-3", "m2-4", "m2-5", "m2-6", "m2-7", "m2-8", "m2-9", "m2-10", "m2-11", "m2-12"],
  },
  {
    id: "3",
    number: 3,
    title: "National Airspace System",
    description: "Airspace classes, special use airspace, MTRs, TFRs, and NOTAMs.",
    estimatedMinutes: 35,
    topicArea: "Airspace",
    slideIds: ["m3-1", "m3-2", "m3-3", "m3-4", "m3-5", "m3-6", "m3-7", "m3-8", "m3-9", "m3-10"],
  },
  {
    id: "4",
    number: 4,
    title: "Reading Sectional Charts",
    description: "Chart symbols, airspace boundaries, latitude/longitude, MEFs, and obstacles.",
    estimatedMinutes: 40,
    topicArea: "Airspace",
    slideIds: ["m4-1", "m4-2", "m4-3", "m4-4", "m4-5", "m4-6", "m4-7", "m4-8", "m4-9", "m4-10"],
  },
  {
    id: "5",
    number: 5,
    title: "Airport Operations",
    description: "Towered and non-towered airports, runway markings, traffic patterns, CTAF, and UNICOM.",
    estimatedMinutes: 30,
    topicArea: "Operations",
    slideIds: ["m5-1", "m5-2", "m5-3", "m5-4", "m5-5", "m5-6", "m5-7", "m5-8", "m5-9", "m5-10"],
  },
  {
    id: "6",
    number: 6,
    title: "Weather & Micrometeorology",
    description: "Weather sources, METARs, TAFs, density altitude, wind, clouds, fog, and thunderstorms.",
    estimatedMinutes: 45,
    topicArea: "Weather",
    slideIds: ["m6-1", "m6-2", "m6-3", "m6-4", "m6-5", "m6-6", "m6-7", "m6-8", "m6-9", "m6-10"],
  },
  {
    id: "7",
    number: 7,
    title: "Drone Flight Operations",
    description: "Preflight planning, checklists, performance factors, emergencies, lost link, and battery safety.",
    estimatedMinutes: 35,
    topicArea: "Operations",
    slideIds: ["m7-1", "m7-2", "m7-3", "m7-4", "m7-5", "m7-6", "m7-7", "m7-8", "m7-9", "m7-10"],
  },
  {
    id: "8",
    number: 8,
    title: "Aeronautical Decision-Making & CRM",
    description: "DECIDE, PAVE, IMSAFE, hazardous attitudes, risk matrices, and crew resource management.",
    estimatedMinutes: 30,
    topicArea: "Operations",
    slideIds: ["m8-1", "m8-2", "m8-3", "m8-4", "m8-5", "m8-6", "m8-7", "m8-8", "m8-9", "m8-10"],
  },
  {
    id: "9",
    number: 9,
    title: "Physiology",
    description: "Alcohol, drugs, fatigue, vision, illusions, hypoxia, hyperventilation, and motion sickness.",
    estimatedMinutes: 22,
    topicArea: "Operations",
    slideIds: ["m9-1", "m9-2", "m9-3", "m9-4", "m9-5", "m9-6", "m9-7", "m9-8"],
  },
  {
    id: "10",
    number: 10,
    title: "Maintenance & Preflight Inspection",
    description: "Condition for safe operation, inspection habits, batteries, firmware, and maintenance records.",
    estimatedMinutes: 25,
    topicArea: "Operations",
    slideIds: ["m10-1", "m10-2", "m10-3", "m10-4", "m10-5", "m10-6", "m10-7", "m10-8"],
  },
  {
    id: "11",
    number: 11,
    title: "Practice Exams",
    description: "Timed exams, review flags, topic weighting, explanations, and weak-area identification.",
    estimatedMinutes: 120,
    topicArea: "Operations",
    slideIds: ["m11-1", "m11-2", "m11-3", "m11-4", "m11-5", "m11-6", "m11-7", "m11-8"],
  },
  {
    id: "12",
    number: 12,
    title: "Practical Flight Skills",
    description: "Drone hardware, controls, flight maneuvers, intelligent modes, camera settings, and simulators.",
    estimatedMinutes: 40,
    topicArea: "Operations",
    slideIds: ["m12-1", "m12-2", "m12-3", "m12-4", "m12-5", "m12-6", "m12-7"],
  },
  {
    id: "13",
    number: 13,
    title: "Industry Pathways & Careers",
    description: "Career paths, drone services businesses, insurance, portfolios, and job search resources.",
    estimatedMinutes: 28,
    topicArea: "Operations",
    slideIds: ["m13-1", "m13-2", "m13-3", "m13-4", "m13-5", "m13-6", "m13-7"],
  },
] satisfies CourseModuleMetadata[];

export function getCourseModuleMetadata(id: string) {
  return courseModuleMetadata.find((courseModule) => courseModule.id === id);
}
