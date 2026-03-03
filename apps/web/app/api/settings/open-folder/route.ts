import { execFileSync } from "node:child_process";
import { badRequest, ok, serverError } from "@/lib/http";
import { ATL_DIR } from "@/lib/paths";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    if (process.platform === "darwin") {
      execFileSync("open", [ATL_DIR]);
      return ok({ opened: true, path: ATL_DIR });
    }

    if (process.platform === "linux") {
      execFileSync("xdg-open", [ATL_DIR]);
      return ok({ opened: true, path: ATL_DIR });
    }

    return badRequest("Open folder is only supported on macOS/Linux in this build");
  } catch (error) {
    return serverError("Failed to open folder", error);
  }
}
