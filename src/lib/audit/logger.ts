import { getAdminClient } from "@/lib/supabase/admin";

export async function logAuditEvent(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: params.actorId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    } as any);

    if (error) {
      console.warn("Failed to persist audit log to DB (fallback log):", error.message, params);
    }
  } catch (err) {
    console.error("Audit log error:", err, params);
  }
}
