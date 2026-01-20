import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDx8FnnjQL2Gio0OByhkmfwk5r_hGj39bc",
  authDomain: "onde-o-silencio-nao-chega.firebaseapp.com",
  projectId: "onde-o-silencio-nao-chega",
  storageBucket: "onde-o-silencio-nao-chega.firebasestorage.app",
  messagingSenderId: "100267491281",
  appId: "1:100267491281:web:545eb0fbf2a2ba74262af0",
  measurementId: "G-WVP02GEMRM"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
