import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwy6kjJAHwjbZ2KuBzSL-UDVQvt4_wLKE",
  authDomain: "smart-learning-planner-app.firebaseapp.com",
  projectId: "smart-learning-planner-app",
  storageBucket: "smart-learning-planner-app.firebasestorage.app",
  messagingSenderId: "275621851757",
  appId: "1:275621851757:web:8b486f8f8a63ccca744564",
  measurementId: "G-DWYF0F5X90"
  // <-- yahan Firebase console ka exact config paste
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);