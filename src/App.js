import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

function App() {
  const [textos, setTextos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
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
        titulo: novoTexto.titulo,
        conteudo: novoTexto.conteudo,
        timestamp: serverTimestamp()
      });
      setNovoTexto({ titulo: '', conteudo: '' });
      setMostrarForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] p-6 md:p-12 font-sans">
      <header className="max-w-5xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3 block">Arquivo Digital</span>
          <h1 className="text-5xl md:text-6xl font-serif italic text-gray-900 leading-tight">Onde o Silêncio não Chega</h1>
          <p className="text-gray-500 mt-4 font-light tracking-wide">André M. Fernandes</p>
        </div>
        <button 
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3 hover:bg-gray-800 transition-all shadow-lg text-sm"
        >
          <PlusCircle size={18} /> {mostrarForm ? 'Cancelar' : 'Criar Novo Registo'}
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        {mostrarForm && (
          <form onSubmit={enviarTexto} className="mb-12 bg-white p-8 border border-gray-100 shadow-xl max-w-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <input 
              type="text" 
              placeholder="Título da nota..."
              className="w-full text-2xl font-serif mb-6 outline-none border-b border-gray-100 pb-2 focus:border-black transition"
              value={novoTexto.titulo}
              onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})}
            />
            <textarea 
              placeholder="Escreve o que o silêncio não alcança..."
              className="w-full h-40 resize-none outline-none text-gray-600 leading-relaxed"
              value={novoTexto.conteudo}
              onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})}
            />
            <button type="submit" className="mt-4 bg-gray-900 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-black">
              Publicar no Mural
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {textos.map((t) => (
            <article key={t.id} className="bg-white p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[300px]">
              <div>
                <h2 className="text-2xl font-serif italic mb-6 text-gray-800 border-b border-gray-50 pb-4">{t.titulo}</h2>
                <p className="text-gray-600 leading-relaxed font-light whitespace-pre-wrap line-clamp-6 italic">{t.conteudo}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-50">
                <span className="text-[10px] text-gray-300 uppercase tracking-widest">Entrada registada</span>
              </div>
            </article>
          ))}
        </div>
        
        {textos.length === 0 && !mostrarForm && (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-gray-400 font-serif italic text-xl">O arquivo aguarda a primeira nota.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
