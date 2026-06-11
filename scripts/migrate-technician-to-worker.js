/**
 * Migration: Technician → Worker
 *
 * Renames the `technicians` collection to `workers` and updates all
 * document references from `technicianProfile`/`technician` to `workerProfile`/`worker`.
 *
 * Usage:
 *   node scripts/migrate-technician-to-worker.js
 *
 * Requires: MONGODB_URI env var (or connection via mongoose default)
 */

const mongoose = require("mongoose");

async function migrate() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/cold-flyer";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log("Connected to MongoDB");

  // 1. Rename collection
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  if (collectionNames.includes("technicians")) {
    if (collectionNames.includes("workers")) {
      console.log("⚠ workers collection already exists — skipping rename");
    } else {
      await db.collection("technicians").renameCollection("workers");
      console.log("✓ Renamed technicians → workers collection");
    }
  } else {
    console.log("⚠ technicians collection not found");
  }

  // 2. Update User documents: technicianProfile → workerProfile
  const userResult = await db.collection("users").updateMany(
    { technicianProfile: { $exists: true } },
    { $rename: { technicianProfile: "workerProfile" } },
  );
  console.log(`✓ Updated ${userResult.modifiedCount} User documents`);

  // 3. Update ServiceBooking documents: technician → worker
  const bookingResult = await db.collection("servicebookings").updateMany(
    { technician: { $exists: true } },
    { $rename: { technician: "worker" } },
  );
  console.log(`✓ Updated ${bookingResult.modifiedCount} ServiceBooking documents`);

  // 4. Update Review documents: technician → worker
  const reviewResult = await db.collection("reviews").updateMany(
    { technician: { $exists: true } },
    { $rename: { technician: "worker" } },
  );
  console.log(`✓ Updated ${reviewResult.modifiedCount} Review documents`);

  console.log("Migration complete!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
