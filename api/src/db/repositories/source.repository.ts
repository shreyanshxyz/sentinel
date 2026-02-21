import { eq, desc } from "drizzle-orm";
import { db } from "../index.js";
import { 
  sources, 
  type SourceRow, 
  type NewSourceRow,
  type SourceType,
  type SourceStatus 
} from "../schema.js";
import { logger } from "../../utils/logger.js";

export interface UpsertSourceInput {
  id: string;
  name: string;
  type?: SourceType;
  status?: SourceStatus;
  config?: Record<string, string>;
  lastSeen?: string;
}

class SourceRepository {
  async upsert(input: UpsertSourceInput): Promise<SourceRow> {
    const now = new Date().toISOString();
    
    const existingSource = await this.getById(input.id);
    
    if (existingSource) {
      const updateData: Partial<NewSourceRow> = {
        lastSeen: input.lastSeen ?? now,
        status: input.status ?? "active",
      };

      await db
        .update(sources)
        .set(updateData)
        .where(eq(sources.id, input.id));

      logger.debug("Source updated in database", { sourceId: input.id });

      return {
        ...existingSource,
        ...updateData,
      } as SourceRow;
    }

    const newSource: NewSourceRow = {
      id: input.id,
      name: input.name,
      type: input.type ?? "api",
      status: input.status ?? "active",
      config: input.config ?? {},
      lastSeen: input.lastSeen ?? now,
      createdAt: now,
    };

    await db.insert(sources).values(newSource);

    logger.debug("Source created in database", { sourceId: input.id });

    return newSource as SourceRow;
  }

  async getAll(): Promise<SourceRow[]> {
    return db.select().from(sources).orderBy(desc(sources.lastSeen));
  }

  async getActive(): Promise<SourceRow[]> {
    return db
      .select()
      .from(sources)
      .where(eq(sources.status, "active"))
      .orderBy(desc(sources.lastSeen));
  }

  async getById(id: string): Promise<SourceRow | null> {
    const result = await db
      .select()
      .from(sources)
      .where(eq(sources.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  async updateStatus(id: string, status: SourceStatus): Promise<void> {
    await db
      .update(sources)
      .set({ status })
      .where(eq(sources.id, id));

    logger.debug("Source status updated", { sourceId: id, status });
  }

  async count(): Promise<number> {
    const result = await db
      .select({ count: sources.id })
      .from(sources);

    return result.length;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const result = await db.select().from(sources);

    const counts: Record<string, number> = {
      active: 0,
      inactive: 0,
      error: 0,
    };

    for (const source of result) {
      const status = source.status ?? "active";
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return counts;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(sources)
      .where(eq(sources.id, id))
      .returning({ id: sources.id });

    if (result.length > 0) {
      logger.debug("Source deleted from database", { sourceId: id });
      return true;
    }

    return false;
  }
}

export const sourceRepository = new SourceRepository();
