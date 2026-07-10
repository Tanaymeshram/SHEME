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

// const firebaseConfig = {
//   apiKey: "YOUR_FIREBASE_API_KEY_HERE",
//   authDomain: "shems-enterprise.firebaseapp.com",
//   projectId: "shems-enterprise",
//   storageBucket: "shems-enterprise.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID_HERE",
//   measurementId: "YOUR_MEASUREMENT_ID"
// };

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1tAplwyKZhlrMTpjQiSytAbuuNfJRol4",
  authDomain: "shems-9bf88.firebaseapp.com",
  projectId: "shems-9bf88",
  storageBucket: "shems-9bf88.firebasestorage.app",
  messagingSenderId: "1905898129",
  appId: "1:1905898129:web:3cd9c8ccc9cbf170f1c530",
  measurementId: "G-DBVCZWV6F1"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase (To be activated in Phase 2)
// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);

export default firebaseConfig;
