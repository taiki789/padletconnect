import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJ3k-qrPEEWE-OzAbPpG0QWe8-rHbzk00",
  authDomain: "keihinn.firebaseapp.com",
  projectId: "keihinn",
  storageBucket: "keihinn.firebasestorage.app",
  messagingSenderId: "779512460491",
  appId: "1:779512460491:web:f336171c4fc123febd574e",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
