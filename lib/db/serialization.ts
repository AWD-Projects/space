import type { Types } from "mongoose";

function mapValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(mapValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.reduce<Record<string, unknown>>((acc, [key, val]) => {
      acc[key] = mapValue(val);
      return acc;
    }, {});
  }
  return value;
}

export function serializeDoc<T extends { _id?: Types.ObjectId | string }>(doc: T | null) {
  if (!doc) return null;
  const raw = typeof (doc as any).toObject === "function" ? (doc as any).toObject() : doc;
  const mapped = mapValue(raw) as Record<string, unknown>;
  if (mapped._id) {
    mapped.id = String(mapped._id);
    delete mapped._id;
  }
  if (mapped.__v !== undefined) {
    delete mapped.__v;
  }
  return mapped;
}
