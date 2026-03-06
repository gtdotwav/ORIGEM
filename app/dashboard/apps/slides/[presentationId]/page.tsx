"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSlidesStore } from "@/stores/slides-store";
import { SlideEditor } from "@/components/apps/slides/slide-editor";

export default function PresentationEditorPage({
  params,
}: {
  params: Promise<{ presentationId: string }>;
}) {
  const { presentationId } = use(params);
  const router = useRouter();
  const setActivePresentation = useSlidesStore((s) => s.setActivePresentation);
  const presentations = useSlidesStore((s) => s.presentations);

  useEffect(() => {
    const exists = presentations.some((p) => p.id === presentationId);
    if (exists) {
      setActivePresentation(presentationId);
    } else {
      router.replace("/dashboard/apps/slides");
    }
  }, [presentationId, presentations, setActivePresentation, router]);

  return <SlideEditor />;
}
