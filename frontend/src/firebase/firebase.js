import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore database reference
const db = getFirestore(app);

export { app, db };
