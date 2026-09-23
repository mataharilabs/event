"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-2">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground mb-8">
          Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu.
        </p>
        <Button onClick={reset}>Coba Lagi</Button>
      </div>
    </main>
  );
}
