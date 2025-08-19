import mongoose from "mongoose";

type ConnectionObject = {
  isConnected: boolean;
  connectionPromise?: Promise<typeof mongoose>;
};

const connection: ConnectionObject = {
  isConnected: false,
  connectionPromise: undefined,
};

export default async function connectToDatabase(): Promise<void> {
  if (connection.isConnected || Number(mongoose.connection.readyState) === 1) {
    connection.isConnected = true;
    return;
  }

  if (connection.connectionPromise) {
    await connection.connectionPromise;
    connection.isConnected = mongoose.connection.readyState === 1;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    connection.connectionPromise = mongoose.connect(uri);
    await connection.connectionPromise;
    connection.isConnected = mongoose.connection.readyState === 1;
    if (connection.isConnected) {
      console.log("Database connection established.");
    }
  } catch (error) {
    connection.isConnected = false;
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to connect to database.", message);
    }
    throw error;
  } finally {
    connection.connectionPromise = undefined;
  }
}