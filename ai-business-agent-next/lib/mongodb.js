import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Reuse the connection during Next.js hot reloads.
  let globalWithMongo = global;

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Create a connection promise for production.
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;