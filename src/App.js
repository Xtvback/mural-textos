import React, { useState, useEffect } from "react";
import { Plus, Calendar, Trash2, ArrowRight, Edit2, Feather, Music, Play, Pause, Volume2, Loader2, X, Info, ImageIcon } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDx8FnnjQL2Gio0OByhkmfwk5r_hGj39bc",
  authDomain: "onde-o-silencio-nao-chega.firebaseapp.com",
  projectId: "onde-o-silencio-nao-chega",
  storageBucket: "onde-o-silencio-nao-chega.firebasestorage.app",
  messagingSenderId: "100267491281",
  appId: "1:100267491281:web:545eb0fbf2a2ba74262af0",
  measurementId: "G-WVP02GEMRM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "mural-textos";

export default function App() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro Auth:", err));
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const textsCollection = collection(db, "data", appId, "public");
        const unsubscribeData = onSnapshot(textsCollection, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTexts(docs.sort((a, b) => new Date(b.date) - new Date(a.date)));
          setLoading(false);
        });
        return () => unsubscribeData();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-zinc-400 uppercase tracking-[0.4em] text-[10px]">A carregar arquivo...</div>;

  return (
    <div className="min-h-screen bg-[#f8f8f8] p-10">
      <header className="mb-20 text-center">
        <h1 className="text-4xl font-light italic tracking-tighter text-zinc-900">Onde o Silêncio não Chega</h1>
        <p className="text-sm font-serif text-zinc-500 italic">Arquivo de André M. Fernandes</p>
      </header>
      
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {texts.map(text => (
          <div key={text.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <h2 className="text-xl mb-2 font-light italic">{text.title}</h2>
            <p className="text-zinc-500 text-sm font-serif italic mb-4">{text.content}</p>
            <span className="text-[10px] text-zinc-300 uppercase tracking-widest">{new Date(text.date).toLocaleDateString("pt-PT")}</span>
          </div>
        ))}
      </main>

      <button 
        onClick={() => alert("Função de escrita ativa! Clique em novo registo.")}
        className="fixed bottom-10 right-10 bg-zinc-900 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
