"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ReviewLoader } from "@/components/loaders/ReviewLoader";

function ReviewLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const matchId = searchParams.get("matchId");
    if (!matchId) return;

    const targetParams = new URLSearchParams();
    const puuid = searchParams.get("puuid");
    const gameName = searchParams.get("gameName");
    const tagLine = searchParams.get("tagLine");

    if (puuid) targetParams.set("puuid", puuid);
    if (gameName) targetParams.set("gameName", gameName);
    if (tagLine) targetParams.set("tagLine", tagLine);

    const target = `/review/${encodeURIComponent(matchId)}${targetParams.size ? `?${targetParams.toString()}` : ""}`;

    const timeoutId = window.setTimeout(() => {
      router.replace(target);
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [router, searchParams]);

  return <ReviewLoader />;
}

export default function ReviewLoadingRedirect() {
  return (
    <Suspense fallback={<ReviewLoader />}>
      <ReviewLoadingContent />
    </Suspense>
  );
}
