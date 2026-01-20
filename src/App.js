import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, Image as ImageIcon, Calendar } from 'lucide-react';

function App() {
  const [textos, setTextos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTexto, setNovoTexto] = useState({ titulo: '', conteudo: '', imagemUrl: '' });

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
        imagemUrl: novoTexto.imagemUrl,
        timestamp: serverTimestamp()
      });
      setNovoTexto({ titulo: '', conteudo: '', imagemUrl: '' });
      setMostrarForm(false);
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] p-6 md:p-12 font-sans">
      <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
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

      <main className="max-w-6xl mx-auto">
        {mostrarForm && (
          <form onSubmit={enviarTexto} className="mb-12 bg-white p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
            <input 
              type="text" 
              placeholder="Título da nota..."
              className="w-full text-2xl font-serif mb-4 outline-none border-b border-gray-100 pb-2 focus:border-black transition"
              value={novoTexto.titulo}
              onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})}
            />
            <div className="flex items-center gap-2 mb-6 bg-gray-50 p-2 rounded">
              <ImageIcon size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Endereço da imagem (URL)..."
                className="w-full bg-transparent outline-none text-sm text-gray-600"
                value={novoTexto.imagemUrl}
                onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="Escreve o que o silêncio não alcança..."
              className="w-full h-40 resize-none outline-none text-gray-600 leading-relaxed italic"
              value={novoTexto.conteudo}
              onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})}
            />
            <button type="submit" className="mt-4 w-full bg-gray-900 text-white py-3 rounded hover:bg-black transition font-medium">
              Publicar no Mural
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {textos.map((t) => (
            <article key={t.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
              {t.imagemUrl && (
                <div className="h-64 overflow-hidden border-b border-gray-50">
                  <img 
                    src={t.imagemUrl} 
                    alt={t.titulo} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                  <Calendar size={12} />
                  {formatarData(t.timestamp)}
                </div>
                <h2 className="text-2xl font-serif italic mb-6 text-gray-800 leading-snug">{t.titulo}</h2>
                <p className="text-gray-600 leading-relaxed font-light whitespace-pre-wrap italic">{t.conteudo}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
