import connectDB from "./lib/database";
import { seed } from "./lib/seed";

export async function register() {
  await connectDB()
  await seed()
}