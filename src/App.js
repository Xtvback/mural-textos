import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Garante que tens o firebase.js configurado
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PlusCircle, Send } from 'lucide-react';

function App() {
  const [textos, setTextos] = useState([]);
  const [novoTexto, setNovoTexto] = useState({ titulo: '', conteudo: '' });

  useEffect(() => {
    const q = query(collection(db, 'textos'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTextos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const enviarTexto = async (e) => {
    e.preventDefault();
    if (novoTexto.titulo && novoTexto.conteudo) {
      await addDoc(collection(db, 'textos'), {
        ...novoTexto,
        timestamp: new Date()
      });
      setNovoTexto({ titulo: '', conteudo: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <p className="text-gray-500 uppercase tracking-widest text-sm mb-2">Arquivo Digital</p>
          <h1 className="text-5xl font-serif font-light text-gray-900">Onde o Silêncio não Chega</h1>
          <p className="text-gray-400 mt-2 italic">André M. Fernandes</p>
        </div>
        <button className="bg-black text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-gray-800 transition">
          <PlusCircle size={20} /> Criar Novo Registo
        </button>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {textos.map((t) => (
          <article key={t.id} className="bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-serif mb-4 text-gray-800">{t.titulo}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{t.conteudo}</p>
          </article>
        ))}
        {textos.length === 0 && (
          <p className="text-gray-400 font-serif italic">O arquivo aguarda a primeira nota.</p>
        )}
      </main>
    </div>
  );
}

export default App;
