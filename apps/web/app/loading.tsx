import { Card, Page, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <Page>
      <Card>
        <Skeleton style={{ height: 28, width: 220 }} />
        <div style={{ height: 12 }} />
        <Skeleton style={{ height: 14, width: "100%" }} />
        <div style={{ height: 8 }} />
        <Skeleton style={{ height: 14, width: "80%" }} />
      </Card>
    </Page>
  );
}
