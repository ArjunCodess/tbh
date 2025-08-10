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

  if (Number(mongoose.connection.readyState) === 2 && connection.connectionPromise) {
    await connection.connectionPromise;
    const currentReadyState = Number(mongoose.connection.readyState);
    connection.isConnected = currentReadyState === 1;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    connection.connectionPromise = mongoose.connect(uri);
    await connection.connectionPromise;
    const currentReadyState = Number(mongoose.connection.readyState);
    connection.isConnected = currentReadyState === 1;
    if (connection.isConnected) {
      console.log("Database connection established.");
    }
  } catch (error) {
    connection.isConnected = false;
    connection.connectionPromise = undefined;
    console.error("Failed to connect to database.", error);
    throw error;
  }
}