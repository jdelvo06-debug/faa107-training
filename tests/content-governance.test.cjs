const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();
const registryPath = path.join(root, "lib/regulatory-sources.ts");
const cramDataPath = path.join(root, "lib/cram-sheet-data.ts");

function loadTypeScriptModule(relativePath) {
  const withExtension = relativePath.endsWith(".ts")
    ? relativePath
    : `${relativePath}.ts`;
  const absolutePath = path.join(root, withExtension);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).exports;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  }).outputText;
  const loaded = { exports: {} };
  moduleCache.set(absolutePath, loaded);

  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTypeScriptModule(specifier.slice(2));
    }
    if (specifier.startsWith("./")) {
      return loadTypeScriptModule(
        path.join(path.dirname(withExtension), specifier),
      );
    }
    return require(specifier);
  };

  new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    output,
  )(
    loaded.exports,
    localRequire,
    loaded,
    absolutePath,
    path.dirname(absolutePath),
  );
  return loaded.exports;
}

function questionById(id) {
  const { examQuestions, moduleQuestions } = loadTypeScriptModule(
    "lib/questions",
  );
  const question = [...moduleQuestions, ...examQuestions].find(
    (candidate) => candidate.id === id,
  );
  assert.ok(question, `Expected question ${id} to exist`);
  return question;
}

function slideById(id) {
  const { modules } = loadTypeScriptModule("lib/course-data");
  const slide = modules
    .flatMap((module) => module.slides)
    .find((candidate) => candidate.id === id);
  assert.ok(slide, `Expected slide ${id} to exist`);
  return slide;
}

function valueAtPath(value, dottedPath) {
  return dottedPath
    .split(".")
    .reduce((current, segment) => current?.[segment], value);
}

function markdownBullet(markdown, label) {
  const prefix = `- **${label}:** `;
  const line = markdown.split("\n").find((candidate) =>
    candidate.startsWith(prefix),
  );
  assert.ok(line, `Expected governed research bullet ${label}`);
  return line.slice(prefix.length);
}

test("the canonical regulatory registry exists", () => {
  assert.equal(
    fs.existsSync(registryPath),
    true,
    "Create lib/regulatory-sources.ts before governing learner-facing facts",
  );
});

test(
  "the registry covers every required high-risk topic exactly once",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const {
      REGULATORY_SOURCE_REGISTRY,
      REQUIRED_REGULATORY_TOPICS,
    } = loadTypeScriptModule("lib/regulatory-sources");
    const expectedTopics = [
      "part-107-operating-limitations",
      "registration",
      "alcohol-drug-restrictions",
      "recurrent-training-certificate-terminology",
      "operations-over-people",
      "airspace-weather-minimums",
      "faa-acs-weighting",
    ];

    assert.deepEqual([...REQUIRED_REGULATORY_TOPICS], expectedTopics);
    assert.deepEqual(
      REGULATORY_SOURCE_REGISTRY.map((record) => record.topic).sort(),
      [...expectedTopics].sort(),
    );
    assert.equal(
      new Set(REGULATORY_SOURCE_REGISTRY.map((record) => record.id)).size,
      REGULATORY_SOURCE_REGISTRY.length,
      "Registry IDs must be stable and unique",
    );
  },
);

test(
  "every governed record has review ownership, triggers, consumers, and official sources",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const {
      APPROVED_REGULATORY_SOURCE_HOSTS,
      GOVERNED_FACTS,
      OFFICIAL_REGULATORY_SOURCES,
      REGULATORY_SOURCE_REGISTRY,
    } = loadTypeScriptModule("lib/regulatory-sources");

    assert.deepEqual(
      [...APPROVED_REGULATORY_SOURCE_HOSTS],
      ["faa.gov", "ecfr.gov"],
    );
    const officialSources = Object.values(OFFICIAL_REGULATORY_SOURCES);
    assert.equal(
      new Set(officialSources.map((source) => source.id)).size,
      officialSources.length,
      "Official source IDs must be unique",
    );

    for (const record of REGULATORY_SOURCE_REGISTRY) {
      assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(record.ownerRole.trim(), `${record.id}: ownerRole`);
      assert.ok(record.reviewerRole.trim(), `${record.id}: reviewerRole`);
      assert.match(record.lastReviewed, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(record.reviewTrigger.cadence.trim(), `${record.id}: cadence`);
      assert.ok(record.reviewTrigger.events.length, `${record.id}: events`);
      assert.ok(record.factKeys.length, `${record.id}: factKeys`);
      assert.ok(record.consumerSurfaces.length, `${record.id}: consumers`);

      for (const factKey of record.factKeys) {
        assert.notEqual(
          valueAtPath(GOVERNED_FACTS, factKey),
          undefined,
          `${record.id}: unresolved fact key ${factKey}`,
        );
      }

      for (const consumer of record.consumerSurfaces) {
        assert.ok(consumer.notes.trim(), `${record.id}: consumer notes`);
        assert.equal(
          fs.existsSync(path.join(root, consumer.path)),
          true,
          `${record.id}: missing consumer ${consumer.path}`,
        );
      }

      assert.ok(record.sources.length, `${record.id}: sources`);
      for (const source of record.sources) {
        assert.match(source.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        const url = new URL(source.url);
        assert.equal(url.protocol, "https:", `${source.id}: HTTPS required`);
        assert.equal(
          APPROVED_REGULATORY_SOURCE_HOSTS.some(
            (host) =>
              url.hostname === host || url.hostname.endsWith(`.${host}`),
          ),
          true,
          `${source.id}: unapproved host ${url.hostname}`,
        );
        assert.ok(source.title.trim(), `${source.id}: title`);
        assert.ok(source.authority.trim(), `${source.id}: authority`);
        assert.ok(
          source.sourceEditionOrEffectiveDate.trim(),
          `${source.id}: source edition/effective date`,
        );
      }
    }
  },
);

test(
  "canonical high-risk numeric and terminology facts match the reviewed rules",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const { GOVERNED_FACTS, maximumStandardAglBelowCloudBase } =
      loadTypeScriptModule("lib/regulatory-sources");

    assert.deepEqual(GOVERNED_FACTS.operatingLimitations, {
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
    });
    assert.deepEqual(GOVERNED_FACTS.registration, {
      requiredForPart107: true,
      validityYears: 3,
      registrationIsPerAircraft: true,
      recreationalWeightExceptionAppliesToPart107: false,
    });
    assert.equal(GOVERNED_FACTS.alcoholDrugRestrictions.lookbackHours, 8);
    assert.equal(
      GOVERNED_FACTS.alcoholDrugRestrictions.prohibitedConcentrationAtOrAbove,
      0.04,
    );
    assert.equal(GOVERNED_FACTS.recency.certificateExpires, false);
    assert.equal(GOVERNED_FACTS.recency.periodCalendarMonths, 24);
    assert.equal(GOVERNED_FACTS.recency.initialKnowledgeTestQualifies, true);
    assert.equal(GOVERNED_FACTS.recency.allPart107CourseCode, "ALC-677");
    assert.equal(GOVERNED_FACTS.recency.currentPart61CourseCode, "ALC-515");
    assert.equal(GOVERNED_FACTS.recency.minimumCertificateAge, 16);
    assert.equal(
      GOVERNED_FACTS.recency.currentPart61Eligibility,
      "Part 107 pilots who hold a Part 61 pilot certificate other than a student pilot certificate and have a current flight review",
    );
    assert.equal(
      GOVERNED_FACTS.operationsOverPeople.category1MaxWeightPoundsInclusive,
      0.55,
    );
    assert.equal(
      GOVERNED_FACTS.operationsOverPeople.category2InjuryThresholdFootPounds,
      11,
    );
    assert.equal(
      GOVERNED_FACTS.operationsOverPeople.category3InjuryThresholdFootPounds,
      25,
    );
    assert.equal(GOVERNED_FACTS.airspaceWeather.minimumVisibilitySm, 3);
    assert.equal(GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet, 500);
    assert.equal(
      GOVERNED_FACTS.airspaceWeather.cloudClearanceHorizontalFeet,
      2_000,
    );
    assert.equal(
      GOVERNED_FACTS.airspaceWeather.authorizationSummary,
      "FAA authorization is required before Part 107 operations in Class B, C, or D airspace, or within the lateral boundaries of the Class E surface area designated for an airport (Class E2).",
    );
    assert.match(
      GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance,
      /symbol alone does not establish an authorization requirement/,
    );
    assert.equal(GOVERNED_FACTS.acsWeighting.minimumKnowledgeTestAge, 14);
    assert.equal(maximumStandardAglBelowCloudBase(800), 300);
    assert.equal(maximumStandardAglBelowCloudBase(3_000), 400);
  },
);

test(
  "the structured cram sheet consumes governed facts instead of duplicating them",
  {
    skip:
      !fs.existsSync(registryPath) ||
      !fs.existsSync(cramDataPath),
  },
  () => {
    const {
      GOVERNED_FACTS,
      OPERATIONS_OVER_PEOPLE_SUMMARIES,
      SAFETY_EVENT_REPORTING_SUMMARY,
    } = loadTypeScriptModule("lib/regulatory-sources");
    const {
      CRAM_ACS_ROWS,
      CRAM_AIRPORT_SYMBOL_COLORS,
      CRAM_AIRSPACE_ROWS,
      CRAM_OPERATING_LIMITS,
      CRAM_OPERATIONS_OVER_PEOPLE,
      CRAM_TEST_FORMAT,
      CRAM_WEATHER_MINIMUMS,
    } = loadTypeScriptModule("lib/cram-sheet-data");

    const limits = Object.fromEntries(
      CRAM_OPERATING_LIMITS.map((item) => [item.id, item.value]),
    );
    assert.equal(
      limits["max-speed"],
      `${GOVERNED_FACTS.operatingLimitations.maxGroundspeedMph} mph (${GOVERNED_FACTS.operatingLimitations.maxGroundspeedKnots} knots)`,
    );
    assert.match(limits["max-weight"], /^Less than 55 lb on takeoff/);
    assert.equal(
      limits["right-of-way"],
      GOVERNED_FACTS.operatingLimitations.rightOfWaySummary,
    );
    assert.equal(
      limits.registration,
      "All drones operated under Part 107 must be registered",
    );
    assert.equal(
      limits["safety-event-report"],
      SAFETY_EVENT_REPORTING_SUMMARY,
    );
    assert.deepEqual(CRAM_OPERATIONS_OVER_PEOPLE, OPERATIONS_OVER_PEOPLE_SUMMARIES);
    assert.match(
      CRAM_OPERATIONS_OVER_PEOPLE.find((item) => item.id === "category-1").rule,
      new RegExp(
        `${GOVERNED_FACTS.operationsOverPeople.category1MaxWeightPoundsInclusive}`,
      ),
    );
    assert.match(
      CRAM_OPERATIONS_OVER_PEOPLE.find((item) => item.id === "category-2").rule,
      new RegExp(
        `${GOVERNED_FACTS.operationsOverPeople.category2InjuryThresholdFootPounds} foot-pounds`,
      ),
    );
    assert.match(
      CRAM_OPERATIONS_OVER_PEOPLE.find((item) => item.id === "category-3").rule,
      new RegExp(
        `${GOVERNED_FACTS.operationsOverPeople.category3InjuryThresholdFootPounds} foot-pounds`,
      ),
    );
    assert.match(
      CRAM_OPERATIONS_OVER_PEOPLE.find((item) => item.id === "category-3").rule,
      /closed\/restricted-access site where everyone is on notice, or no sustained flight over unprotected nonparticipants/,
    );
    assert.match(
      CRAM_OPERATIONS_OVER_PEOPLE.find((item) => item.id === "category-4").rule,
      /Part 21 airworthiness certificate/,
    );

    const classRows = Object.fromEntries(
      CRAM_AIRSPACE_ROWS.map((row) => [row.className, row]),
    );
    assert.equal(classRows["Class C"].chart, "Solid magenta");
    assert.equal(classRows["Class B"].rule, "FAA authorization required");
    assert.equal(classRows["Class G"].rule, "No ATC authorization");
    assert.equal(
      classRows["Class E"].rule,
      `${GOVERNED_FACTS.airspaceWeather.authorizationSummary} ${GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance}`,
    );
    assert.deepEqual(CRAM_AIRPORT_SYMBOL_COLORS, {
      id: "airport-symbol-colors",
      label: "Airport symbol colors",
      value:
        "Blue indicates a towered airport; magenta indicates a non-towered airport. Color does not state whether IFR procedures exist.",
    });

    assert.deepEqual(CRAM_WEATHER_MINIMUMS, [
      {
        id: "visibility",
        label: "Part 107 minimum visibility",
        value: "3 SM from the control station",
      },
      {
        id: "cloud-clearance",
        label: "Part 107 cloud distance",
        value: "At least 500 ft below and 2,000 ft horizontally",
      },
    ]);
    assert.equal(
      CRAM_TEST_FORMAT.find((row) => row.id === "recency").label,
      "Aeronautical knowledge recency",
    );
    assert.match(
      CRAM_TEST_FORMAT.find((row) => row.id === "recency").value,
      /initial knowledge test.*other than a student pilot certificate/,
    );
    assert.equal(
      CRAM_TEST_FORMAT.find((row) => row.id === "minimum-age").value,
      "14 for the UAG knowledge test; 16 for Remote Pilot Certificate eligibility",
    );
    assert.deepEqual(CRAM_ACS_ROWS, [
      {
        area: "I",
        topic: "Regulations",
        weight: "15–25%",
        estimatedQuestions: "9–15",
      },
      {
        area: "II",
        topic: "Airspace & Operating Requirements",
        weight: "15–25%",
        estimatedQuestions: "9–15",
      },
      {
        area: "III",
        topic: "Weather",
        weight: "11–16%",
        estimatedQuestions: "7–10",
      },
      {
        area: "IV",
        topic: "Loading & Performance",
        weight: "7–11%",
        estimatedQuestions: "4–7",
      },
      {
        area: "V",
        topic: "Operations",
        weight: "35–45%",
        estimatedQuestions: "21–27",
      },
    ]);
  },
);

test(
  "question and course structures preserve corrected operating, airspace, weather, and drug facts",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const {
      GOVERNED_FACTS,
      NON_CEILING_CLOUD_CLEARANCE_REMINDER,
      SAFETY_EVENT_REPORTING_SUMMARY,
      SMALL_UAS_WEIGHT_SUMMARY,
      STANDARD_ALTITUDE_LIMIT_SUMMARY,
      STANDARD_SPEED_LIMIT_SUMMARY,
      describeCloudCeilingLimit,
    } = loadTypeScriptModule("lib/regulatory-sources");

    const weight = questionById("m2-q1");
    assert.equal(weight.choices[weight.correctIndex], SMALL_UAS_WEIGHT_SUMMARY);

    const rightOfWay = questionById("m2-q4");
    assert.equal(
      rightOfWay.choices[rightOfWay.correctIndex],
      GOVERNED_FACTS.operatingLimitations.rightOfWaySummary,
    );
    assert.equal(
      rightOfWay.explanation,
      GOVERNED_FACTS.operatingLimitations.rightOfWaySummary,
    );

    const speed = questionById("exam-reg-3");
    const equivalentMaximumChoices = speed.choices.filter(
      (choice) => choice.includes("100 mph") || choice.includes("87 knots"),
    );
    assert.equal(equivalentMaximumChoices.length, 1);
    assert.equal(speed.choices[speed.correctIndex], "100 mph (87 knots)");

    const chart = questionById("exam-airspace-9");
    assert.equal(
      chart.choices[chart.correctIndex],
      GOVERNED_FACTS.airspaceWeather.chartSymbols.solidMagenta,
    );

    const authorization = questionById("m2-q8");
    assert.equal(
      authorization.choices[authorization.correctIndex],
      GOVERNED_FACTS.airspaceWeather.authorizationSummary,
    );
    assert.equal(
      authorization.explanation,
      GOVERNED_FACTS.airspaceWeather.authorizationSummary,
    );

    const dashedMagenta = questionById("m4-q1");
    assert.equal(
      dashedMagenta.explanation,
      GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance,
    );

    const safetyEvent = questionById("exam-reg-8");
    assert.equal(
      safetyEvent.choices[safetyEvent.correctIndex],
      SAFETY_EVENT_REPORTING_SUMMARY,
    );
    assert.equal(safetyEvent.explanation, SAFETY_EVENT_REPORTING_SUMMARY);

    const safetyEventSlide = slideById("m2-9");
    assert.equal(
      safetyEventSlide.blocks.find((block) => block.type === "callout").text,
      SAFETY_EVENT_REPORTING_SUMMARY,
    );

    const medication = questionById("exam-phys-1");
    assert.match(medication.prompt, /now feels drowsy/i);
    assert.equal(
      medication.choices[medication.correctIndex],
      GOVERNED_FACTS.alcoholDrugRestrictions.drugScenarioAnswer,
    );

    const weather = questionById("exam-weather-4");
    assert.match(weather.explanation, /400 ft AGL remains more restrictive/);

    const classB = slideById("m3-2");
    const classBTable = classB.blocks.find((block) => block.type === "table");
    const classBRows = Object.fromEntries(classBTable.rows);
    assert.equal(classBRows["Manned-aircraft entry"], "ATC clearance required");
    assert.equal(
      classBRows["Part 107 authorization"],
      "Required — LAANC or manual FAA authorization",
    );

    const classE = slideById("m3-5");
    const classEBullets = classE.blocks.find((block) => block.type === "bullets");
    const classECallout = classE.blocks.find((block) => block.type === "callout");
    assert.equal(
      classEBullets.items.includes(
        GOVERNED_FACTS.airspaceWeather.authorizationSummary,
      ),
      true,
    );
    assert.equal(
      classECallout.text,
      GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance,
    );

    const clouds = slideById("m6-5");
    const cloudTable = clouds.blocks.find((block) => block.type === "table");
    const cloudRows = Object.fromEntries(
      cloudTable.rows.map(([code, , meaning]) => [code, meaning]),
    );
    assert.equal(cloudRows.FEW, NON_CEILING_CLOUD_CLEARANCE_REMINDER);
    const cloudBullets = clouds.blocks.find((block) => block.type === "bullets");
    assert.equal(cloudBullets.items.includes(describeCloudCeilingLimit(800)), true);

    const { flashcards } = loadTypeScriptModule("lib/flashcards");
    assert.equal(
      flashcards.find((card) => card.id === "fc-2-400").back,
      STANDARD_ALTITUDE_LIMIT_SUMMARY,
    );
    assert.equal(
      flashcards.find((card) => card.id === "fc-2-speed").back,
      STANDARD_SPEED_LIMIT_SUMMARY,
    );
    assert.equal(
      flashcards.find((card) => card.id === "fc-3-surface-e").back,
      `A Class E surface area designated for an airport requires FAA authorization under § 107.41. ${GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance}`,
    );
    assert.equal(
      flashcards.find((card) => card.id === "fc-4-dashed-magenta").back,
      GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance,
    );
  },
);

test(
  "the governed research summary stays aligned with canonical facts",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const {
      GOVERNED_FACTS,
      SAFETY_EVENT_REPORTING_SUMMARY,
      STANDARD_ALTITUDE_LIMIT_SUMMARY,
      STANDARD_SPEED_LIMIT_SUMMARY,
    } = loadTypeScriptModule("lib/regulatory-sources");
    const research = fs.readFileSync(
      path.join(root, "research/regulations.md"),
      "utf8",
    );

    assert.equal(markdownBullet(research, "Max altitude"), STANDARD_ALTITUDE_LIMIT_SUMMARY);
    assert.equal(markdownBullet(research, "Max speed"), STANDARD_SPEED_LIMIT_SUMMARY);
    assert.equal(
      markdownBullet(research, "Right of way"),
      GOVERNED_FACTS.operatingLimitations.rightOfWaySummary,
    );
    assert.equal(
      markdownBullet(research, "Weather minima"),
      `At least ${GOVERNED_FACTS.airspaceWeather.minimumVisibilitySm} statute miles visibility from the control station; at least ${GOVERNED_FACTS.airspaceWeather.cloudClearanceBelowFeet} feet below and ${GOVERNED_FACTS.airspaceWeather.cloudClearanceHorizontalFeet.toLocaleString("en-US")} feet horizontally from clouds (14 CFR § 107.51)`,
    );
    assert.equal(
      markdownBullet(research, "Alcohol/drugs"),
      `Under §§ 107.27 and 91.17: no alcohol within ${GOVERNED_FACTS.alcoholDrugRestrictions.lookbackHours} hours; no operation while under the influence; no safety-impairing drug use; and no alcohol concentration of ${GOVERNED_FACTS.alcoholDrugRestrictions.prohibitedConcentrationAtOrAbove} or greater in blood or breath`,
    );
    assert.equal(
      markdownBullet(research, "Safety event reporting"),
      SAFETY_EVENT_REPORTING_SUMMARY.replace(/^Report within /, "Within "),
    );
    assert.equal(
      markdownBullet(research, "Registration"),
      "All drones operated under Part 107 must be registered; the 0.55-pound exception applies only to limited recreational operations",
    );
    assert.equal(
      markdownBullet(research, "Airspace"),
      `${GOVERNED_FACTS.airspaceWeather.authorizationSummary} ${GOVERNED_FACTS.airspaceWeather.dashedMagentaGuidance}`,
    );

    const lines = research.split("\n");
    assert.equal(
      lines.includes(
        `- The Remote Pilot Certificate itself does not expire; operating privileges require a qualifying recency event within the previous ${GOVERNED_FACTS.recency.periodCalendarMonths} calendar months`,
      ),
      true,
    );
    assert.equal(
      lines.includes(
        `- Part 107 Small UAS Recurrent (${GOVERNED_FACTS.recency.allPart107CourseCode}) — free, online, and available to all Part 107 remote pilots`,
      ),
      true,
    );
    assert.equal(
      lines.includes(
        `- Part 107 Small UAS Recurrent — Part 61 Pilots (${GOVERNED_FACTS.recency.currentPart61CourseCode}) — for ${GOVERNED_FACTS.recency.currentPart61Eligibility}`,
      ),
      true,
    );

    const { ACS_TOPIC_WEIGHTS } = loadTypeScriptModule("lib/acs-weights");
    assert.equal(
      lines.includes(`| I | Regulations | ${ACS_TOPIC_WEIGHTS.regulations} |`),
      true,
    );
    assert.equal(
      lines.includes(
        `| II | Airspace Classification & Operating Requirements | ${ACS_TOPIC_WEIGHTS.airspace} |`,
      ),
      true,
    );
    assert.equal(
      lines.includes(`| III | Weather | ${ACS_TOPIC_WEIGHTS.weather} |`),
      true,
    );
    assert.equal(
      lines.includes(
        `| IV | Loading & Performance | ${ACS_TOPIC_WEIGHTS.loadingPerformance} |`,
      ),
      true,
    );
    assert.equal(
      lines.includes(`| V | Operations | ${ACS_TOPIC_WEIGHTS.operations} |`),
      true,
    );
  },
);

test(
  "registration, alcohol, over-people, and ACS duplicates remain tied to canonical values",
  { skip: !fs.existsSync(registryPath) },
  () => {
    const {
      ALCOHOL_DRUG_SUMMARY,
      GOVERNED_FACTS,
      OPERATIONS_OVER_PEOPLE_SUMMARIES,
    } = loadTypeScriptModule("lib/regulatory-sources");
    const { ACS_TOPIC_WEIGHT_RANGES, ACS_TOPIC_WEIGHTS, describeAcsRanges } =
      loadTypeScriptModule("lib/acs-weights");
    const { FAA_EXAM_TARGETS } = loadTypeScriptModule(
      "lib/assessment-engine",
    );
    const { flashcards } = loadTypeScriptModule("lib/flashcards");

    const operatingRecord = loadTypeScriptModule("lib/regulatory-sources")
      .REGULATORY_SOURCE_REGISTRY.find(
        (record) => record.topic === "part-107-operating-limitations",
      );
    assert.equal(
      operatingRecord.consumerSurfaces.some(
        (consumer) => consumer.path === "lib/flashcards.ts",
      ),
      true,
    );

    const registration = questionById("exam-reg-1");
    assert.equal(
      registration.choices[registration.correctIndex],
      `${GOVERNED_FACTS.registration.validityYears} years`,
    );
    assert.equal(
      flashcards.find((card) => card.id === "fc-9-alcohol-8hr").back,
      ALCOHOL_DRUG_SUMMARY,
    );

    const peopleSlide = slideById("m2-8");
    const peopleTable = peopleSlide.blocks.find((block) => block.type === "table");
    assert.deepEqual(
      peopleTable.rows,
      OPERATIONS_OVER_PEOPLE_SUMMARIES.map((item) => [
        item.category,
        item.rule,
      ]),
    );

    assert.equal(
      describeAcsRanges({
        regulations: "reg-range",
        airspace: "air-range",
        operations: "ops-range",
      }),
      "Operations has the largest current ACS range at ops-range. Regulations are reg-range and Airspace & Requirements are air-range.",
    );

    const acsQuestion = questionById("m11-q2");
    assert.equal(
      acsQuestion.explanation,
      describeAcsRanges(ACS_TOPIC_WEIGHTS),
    );

    const topicMap = {
      Regulations: "regulations",
      Airspace: "airspace",
      Weather: "weather",
      "Loading & Performance": "loadingPerformance",
      Operations: "operations",
    };
    assert.equal(
      Object.values(FAA_EXAM_TARGETS).reduce((sum, count) => sum + count, 0),
      GOVERNED_FACTS.acsWeighting.totalQuestions,
    );
    for (const [topic, target] of Object.entries(FAA_EXAM_TARGETS)) {
      const range = ACS_TOPIC_WEIGHT_RANGES[topicMap[topic]];
      const targetPercent =
        (target / GOVERNED_FACTS.acsWeighting.totalQuestions) * 100;
      assert.ok(
        targetPercent >= range.minPercent &&
          targetPercent <= range.maxPercent,
        `${topic} target ${target} (${targetPercent}%) must remain within its ACS range`,
      );
    }
  },
);
