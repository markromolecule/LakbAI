// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBo8j4qFMDw3r17nETLA0vx-smvXzgNMeE",
  authDomain: "lakbai-d7010.firebaseapp.com",
  databaseURL: "https://lakbai-d7010-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lakbai-d7010",
  storageBucket: "lakbai-d7010.firebasestorage.app",
  messagingSenderId: "609343080574",
  appId: "1:609343080574:web:f1229a6ce90d655ec2f02f",
  measurementId: "G-JMKSF7G323"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);