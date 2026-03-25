import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7yUZrBmJHprDEfaV74X3KQYEYqWUlwJ0",
  authDomain: "horizonte-zingst.firebaseapp.com",
  projectId: "horizonte-zingst",
  storageBucket: "horizonte-zingst.firebasestorage.app",
  messagingSenderId: "429781684939",
  appId: "1:429781684939:web:1ed601e908861389efc14e",
  measurementId: "G-919JC8BXFY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
