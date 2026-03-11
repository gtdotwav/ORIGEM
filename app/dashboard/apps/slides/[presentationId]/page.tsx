"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSlidesStore } from "@/stores/slides-store";
import { SlideEditor } from "@/components/apps/slides/slide-editor";
import { useClientMounted } from "@/hooks/use-client-mounted";

export default function PresentationEditorPage({
  params,
}: {
  params: Promise<{ presentationId: string }>;
}) {
  const { presentationId } = use(params);
  const router = useRouter();
  const mounted = useClientMounted();
  const setActivePresentation = useSlidesStore((s) => s.setActivePresentation);
  const presentations = useSlidesStore((s) => s.presentations);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const exists = presentations.some((p) => p.id === presentationId);
    if (exists) {
      setActivePresentation(presentationId);
    } else {
      router.replace("/dashboard/apps/slides");
    }
  }, [mounted, presentationId, presentations, setActivePresentation, router]);

  if (!mounted) {
    return <div className="min-h-[70vh]" />;
  }

  return <SlideEditor />;
}
