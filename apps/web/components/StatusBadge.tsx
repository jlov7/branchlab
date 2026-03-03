import { Badge } from "@/components/ui";

export function StatusBadge({ status }: { status: "success" | "fail" | "unknown" }) {
  if (status === "success") {
    return <Badge tone="success">SUCCESS</Badge>;
  }
  if (status === "fail") {
    return <Badge tone="danger">FAIL</Badge>;
  }
  return <Badge tone="warning">UNKNOWN</Badge>;
}
