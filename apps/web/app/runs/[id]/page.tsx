"use client";

import { useParams } from "next/navigation";
import { RunReportClient } from "@/components/RunReportClient";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const runId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!runId) {
    return <section className="page-grid"><article className="card">Missing run id.</article></section>;
  }

  return <RunReportClient runId={runId} />;
}
