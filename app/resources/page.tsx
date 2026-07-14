import { BookOpen, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OFFICIAL_REGULATORY_SOURCES } from "@/lib/regulatory-sources";
import styles from "@/components/modern-flight-school.module.css";

const resources = [
  {
    label: "FAA Remote Pilot Certification",
    href: OFFICIAL_REGULATORY_SOURCES.remotePilotCertification.url,
    description: "Eligibility, FTN, test scheduling, IACRA, recurrent training, and official process guidance."
  },
  {
    label: "FAA Certificated Remote Pilots",
    href: "https://www.faa.gov/uas/commercial_operators",
    description: "Part 107 overview, commercial operator steps, controlled airspace, and registration links."
  },
  {
    label: "FAA Operations Over People",
    href: OFFICIAL_REGULATORY_SOURCES.operationsOverPeople.url,
    description: "Night operations, operations over people, moving vehicles, and recurrent knowledge updates."
  },
  {
    label: "Current Part 107 Operating Limitations",
    href: OFFICIAL_REGULATORY_SOURCES.operatingLimitations.url,
    description: "Current eCFR rule text for standard speed, altitude, visibility, and cloud-clearance limits."
  },
  {
    label: "FAA Small UAS Airman Certification Standards",
    href: OFFICIAL_REGULATORY_SOURCES.uasAcs.url,
    description: "The current FAA-listed ACS edition and official topic weighting ranges for the UAG knowledge test."
  },
  {
    label: "FAA Part 107 Waivers",
    href: "https://www.faa.gov/uas/commercial_operators/part_107_waivers",
    description: "Waiver categories, safety explanation guidance, and operational limitation references."
  },
  {
    label: "FAA Remote ID",
    href: "https://www.faa.gov/uas/getting_started/remote_id",
    description: "Remote ID concepts and Part 107 device inventory guidance."
  }
];

export default function ResourcesPage() {
  return (
    <div className={`${styles.coursePage} grid gap-6`}>
      <div>
        <h1 className="text-4xl font-bold tracking-normal">Resources</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Official FAA links used as source anchors for the curriculum.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  {resource.label}
                  <ExternalLink className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{resource.description}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Built-in study aids</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
            <Link href="/cram-sheet">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Part 107 Cram Sheet</div>
                <div className="text-xs text-muted-foreground">One-page quick reference — print-friendly</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
            <Link href="/study-plan">
              <BookOpen className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-semibold">7 &amp; 14-Day Study Plans</div>
                <div className="text-xs text-muted-foreground">Structured day-by-day roadmap</div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
