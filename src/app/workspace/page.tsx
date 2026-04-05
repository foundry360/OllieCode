import { WorkspacePageClient } from "@/app/workspace/workspace-page-client";

/** Per-request render so `useSearchParams()` (e.g. `?mission=`) matches SSR HTML and hydration. */
export const dynamic = "force-dynamic";

export default function WorkspacePage() {
  return <WorkspacePageClient />;
}
