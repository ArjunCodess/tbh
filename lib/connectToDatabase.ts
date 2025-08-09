import mongoose from "mongoose";

type ConnectionObject = {
     isConnected?: number;
};

const connection: ConnectionObject = {};

export default async function connectToDatabase(): Promise<void> {
     if (connection.isConnected) {
          console.log("Already connected.");
          return;
     };

     try {
          const database = await mongoose.connect(process.env.MONGODB_URI || '');
          connection.isConnected = database.connections[0].readyState;

          console.log("Database connection established.")
     }
     
     catch {
          console.log("Failed to connect.");
          process.exit(1);
     };
}