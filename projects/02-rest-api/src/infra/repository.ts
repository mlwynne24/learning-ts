import { StoredReading, SensorReading, ReadingFilter } from "../domain/reading.js";

interface Repository<
  TIn,
  TOut extends TIn & { id: string },
  Filter extends Record<string, unknown>,
> {
  insert(item: TIn): Promise<TOut>;
  findById(id: string): Promise<TOut | undefined>;
  list(filter: Filter): Promise<{ items: TOut[]; total: number }>;
  delete(id: string): Promise<boolean>;
}

export type ReadingRepository = Repository<SensorReading, StoredReading, ReadingFilter>;
