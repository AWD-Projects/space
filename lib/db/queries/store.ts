import { connectToDatabase } from "@/lib/db/connection";
import { StoreModel } from "@/lib/db/models/store";
import { serializeDoc } from "@/lib/db/serialization";

export async function getStoreByOwnerId(ownerId: string) {
  await connectToDatabase();
  const store = await StoreModel.findOne({ owner_id: ownerId });
  return serializeDoc(store);
}

export async function getStoreBySlug(slug: string) {
  await connectToDatabase();
  const store = await StoreModel.findOne({ slug });
  return serializeDoc(store);
}
