"use client";

import Link from "next/link";
import { Button, Card, Page } from "@/components/ui";

export default function NotFound() {
  return (
    <Page>
      <Card className="page-header">
        <h1 style={{ margin: 0 }}>Page not found</h1>
        <p className="subtle">The requested page does not exist in this local workspace.</p>
        <Link href="/" className="ui-button">Return home</Link>
        <Button variant="ghost" onClick={() => history.back()}>Go back</Button>
      </Card>
    </Page>
  );
}
