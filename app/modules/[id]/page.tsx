import { notFound } from "next/navigation";
import { SlideViewer } from "@/components/slide-viewer";
import { getModule, modules } from "@/lib/course-data";

export function generateStaticParams() {
  return modules.map((courseModule) => ({ id: courseModule.id }));
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseModule = getModule(id);
  if (!courseModule) {
    notFound();
  }

  return <SlideViewer courseModule={courseModule} />;
}
