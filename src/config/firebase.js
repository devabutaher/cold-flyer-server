const fs = require("fs");
const path = require("path");

const admin = require("firebase-admin");

const serviceAccountPath = path.join(
  __dirname,
  "../../firebase-service-account.json",
);

let serviceAccount = {};

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccountStr = fs.readFileSync(serviceAccountPath, "utf8");
    serviceAccount = JSON.parse(serviceAccountStr);

    if (
      serviceAccount.private_key &&
      serviceAccount.private_key.includes("\\n")
    ) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }
    console.log("Firebase service account loaded from file");
    console.log("Client email:", serviceAccount.client_email);
  } else {
    console.log("Firebase service account file not found, trying env var...");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (
      serviceAccount.private_key &&
      serviceAccount.private_key.includes("\\n")
    ) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n",
      );
    }
  }
} catch (e) {
  console.error("Failed to load Firebase service account:", e.message);
}

const isConfigured = serviceAccount.client_email && serviceAccount.private_key;

if (isConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase admin initialized successfully");
  } catch (initError) {
    console.error("Failed to initialize Firebase admin:", initError.message);
  }
} else if (!isConfigured) {
  console.warn("Firebase not configured");
}

const isFirebaseConfigured = () => admin.apps.length > 0;

module.exports = admin;
module.exports.isFirebaseConfigured = isFirebaseConfigured;
