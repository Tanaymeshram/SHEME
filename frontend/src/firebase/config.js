/**
 * Smart Hospital Energy Management System (SHEMS)
 * Firebase Configuration Integration File
 * 
 * Instructions:
 * When integrating Firebase authentication and Firestore in Phase 2:
 * 1. Install Firebase dependency: `npm install firebase`
 * 2. Fill in the credentials block below with your Firebase web app config values.
 * 3. Uncomment the Firebase initialization block.
 */

// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "shems-enterprise.firebaseapp.com",
  projectId: "shems-enterprise",
  storageBucket: "shems-enterprise.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID_HERE",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase (To be activated in Phase 2)
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

export default firebaseConfig;
