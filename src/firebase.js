import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "A tua chave aqui",
  authDomain: "o-teu-projeto.firebaseapp.com",
  projectId: "o-teu-projeto",
  storageBucket: "o-teu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcde"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
