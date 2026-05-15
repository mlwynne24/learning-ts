import { SensorReading, ReadingFilter, StoredReading } from "../domain/reading.js";
import { ReadingRepository } from "./repository.js";

class InMemoryReadingRepository implements ReadingRepository {
  private readings: Array<StoredReading> = [];

  async insert(reading: SensorReading): Promise<StoredReading> {
    const newStoredReading = {
      ...reading,
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    };
    this.readings.push(newStoredReading);
    return newStoredReading;
  }

  async findById(id: string): Promise<StoredReading | undefined> {
    const reading = this.readings.filter((r) => r.id === id);
    if (reading.length === 0) {
      throw new Error(`No readings found with id ${id}`);
    } else if (reading.length > 1) {
      throw new Error(`Duplicate readings found with id ${id}`);
    } else {
      return reading[0];
    }
  }

  async list(filter: ReadingFilter): Promise<{ items: StoredReading[]; total: number }> {
    const readings = this.readings.filter((r) => {
      r.deviceId === filter.deviceId &&
        r.metric === filter.metric &&
        r.timestamp >= filter.since &&
        r.timestamp < filter.until;
    });
    return {
      items: readings.slice(filter.offset).slice(0, filter.limit),
      total: readings.length,
    };
  }

  async delete(id: string): Promise<boolean> {
    const filteredReadings = this.readings.filter((r) => r.id !== id);
    if (filteredReadings === this.readings) {
      return false;
    }
    this.readings = filteredReadings;
    return true;
  }
}
