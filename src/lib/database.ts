
import { ConnectionStates, Mongoose, connect } from "mongoose";

declare global {
  var _mongooseConnection: any;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'

const connection: { connPromise?: Mongoose; getConnection: () => ConnectionStates; isConnected: boolean; } = { getConnection: () => 99, isConnected: false }

export default async function connectDB() {
  if (connection.isConnected) {
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongooseConnection) {
      global._mongooseConnection = connect(MONGODB_URI)
    }
    const db = await global._mongooseConnection
    connection.getConnection = () => db.connections[0].readyState;
    connection.isConnected = await new Promise(async (resolve) => {
      while (connection.getConnection() === 2) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      resolve(connection.getConnection() === 1)
    })
  } else {
    const db = await connect(MONGODB_URI)
    connection.getConnection = () => db.connections[0].readyState;
    connection.isConnected = await new Promise(async (resolve) => {
      while (connection.getConnection() === 2) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      resolve(connection.getConnection() === 1)
    })
    connection.isConnected = db.connections[0].readyState === 1
  }
  if (connection.isConnected) {
    console.log("db connected")
  } else {
    console.log("db not connected")
  }
}