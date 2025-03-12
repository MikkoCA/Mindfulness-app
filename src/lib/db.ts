import clientPromise from './mongodb';

export async function getCollection(collectionName: string) {
  const client = await clientPromise;
  const db = client.db('mindfulness');
  return db.collection(collectionName);
}

// Example usage for users collection
export async function getUsers() {
  const collection = await getCollection('users');
  return collection.find({}).toArray();
}
