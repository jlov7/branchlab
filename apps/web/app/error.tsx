"use client";

import { Button, Card, Page } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Page>
      <Card className="page-header">
        <h1 style={{ margin: 0 }}>Something went wrong</h1>
        <p className="subtle">
          {error.message || "An unexpected client error occurred while rendering this view."}
        </p>
        <div className="ui-inline">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="ghost" onClick={() => window.location.assign("/")}>Go home</Button>
        </div>
      </Card>
    </Page>
  );
}
