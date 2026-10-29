import { memoryStore, loadStoreFromDisk, saveStoreToDisk } from "@/lib/data/store";

export async function logAuditEvent(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    loadStoreFromDisk();
    memoryStore.auditLogs.push({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_id: params.actorId || "usr-super-admin-1",
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    });
    saveStoreToDisk();
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
