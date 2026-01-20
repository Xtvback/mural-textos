import React, { useState, useEffect, useRef } from "react";
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
  const [user, setUser] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro Auth"));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const textsCollection = collection(db, "data", appId, "public");
    const unsubscribe = onSnapshot(textsCollection, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTexts(docs.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "data", appId, "public"), {
        title: newTitle,
        content: newContent,
        imageUrl: newImageUrl || "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000",
        date: new Date().toISOString(),
        userId: user.uid
      });
      setIsAdding(false);
      setNewTitle("");
      setNewContent("");
    } catch (error) {
      alert("Erro ao guardar. Verifica as regras do Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-[10px] uppercase tracking-[0.4em] text-zinc-400">A carregar arquivo...</div>;

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-zinc-900 font-sans flex flex-col md:flex-row">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />
      
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-zinc-100 p-10 flex flex-col h-screen sticky top-0">
        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 block mb-4">Arquivo Digital</span>
          <h1 className="text-4xl font-light italic tracking-tighter leading-none mb-2">Onde o Silêncio não Chega</h1>
          <p className="text-sm font-serif text-zinc-500 italic">André M. Fernandes</p>
        </div>

        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
          <Plus size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Criar Novo Registo</span>
        </button>
      </aside>

      <main className="flex-grow p-6 md:p-12 lg:p-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {texts.length === 0 ? (
            <p className="col-span-full py-40 text-center text-zinc-300 font-serif italic text-2xl">O arquivo aguarda a primeira nota.</p>
          ) : (
            texts.map(text => (
              <div key={text.id} onClick={() => setSelectedText(text)} className="group cursor-pointer bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm hover:shadow-2xl transition-all">
                <h3 className="text-2xl font-light leading-tight mb-4 group-hover:italic">{text.title}</h3>
                <p className="text-zinc-500 text-sm font-serif leading-relaxed line-clamp-3 italic">{text.content}</p>
              </div>
            ))
          )}
        </div>
      </main>

      {isAdding && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light italic">Novo fragmento de memória</h2>
              <button type="button" onClick={() => setIsAdding(false)}><X size={20} /></button>
            </div>
            <input placeholder="Título..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full text-2xl font-light italic border-b border-zinc-100 outline-none pb-2" />
            <textarea placeholder="Escreve aqui..." value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full h-64 font-serif text-lg italic outline-none resize-none" />
            <button disabled={isSaving} className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
              {isSaving ? "A publicar..." : "Publicar no Mural"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
