import { notFound } from "next/navigation";
import { SlideViewer } from "@/components/slide-viewer";
import { getModule, modules } from "@/lib/course-data";

export function generateStaticParams() {
  return modules.map((courseModule) => ({ id: courseModule.id }));
}

export default function ModulePage({ params }: { params: { id: string } }) {
  const courseModule = getModule(params.id);
  if (!courseModule) {
    notFound();
  }

  return <SlideViewer courseModule={courseModule} />;
}
