const admin = require("firebase-admin");

let serviceAccount = {};

try {
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
  if (serviceAccount.client_email) {
    console.log("Firebase service account loaded from env");
    console.log("Client email:", serviceAccount.client_email);
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
