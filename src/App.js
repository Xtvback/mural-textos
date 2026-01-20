import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { PlusCircle, Image as ImageIcon, Calendar, Search, Loader2 } from 'lucide-react';

function App() {
  const [textos, setTextos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [novoTexto, setNovoTexto] = useState({ 
    titulo: '', conteudo: '', imagemUrl: '',
    dataManual: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    // REMOVIDO O ORDERBY: Agora o Firebase aceita a publicação na hora!
    const q = query(collection(db, 'textos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenamos aqui no seu telemóvel em vez de pedir ao Firebase
      dados.sort((a, b) => b.dataManual.localeCompare(a.dataManual));
      setTextos(dados);
    }, (error) => console.error(error));
    return unsubscribe;
  }, []);

  const enviarTexto = async (e) => {
    e.preventDefault();
    if (!novoTexto.titulo.trim() || !novoTexto.conteudo.trim()) return;

    setCarregando(true);
    try {
      await addDoc(collection(db, 'textos'), {
        titulo: novoTexto.titulo,
        conteudo: novoTexto.conteudo,
        imagemUrl: novoTexto.imagemUrl,
        dataManual: novoTexto.dataManual,
        criadoEm: new Date()
      });
      setNovoTexto({ titulo: '', conteudo: '', imagemUrl: '', dataManual: new Date().toISOString().split('T')[0] });
      setMostrarForm(false);
      alert("Publicado com sucesso!");
    } catch (error) {
      alert("Erro: Verifica se as Regras do Firebase estão como 'true'");
    } finally {
      setCarregando(false);
    }
  };

  const textosFiltrados = textos.filter(t => 
    t.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    t.conteudo.toLowerCase().includes(filtro.toLowerCase()) ||
    t.dataManual.includes(filtro)
  );

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 font-sans">
      <header className="max-w-6xl mx-auto mb-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-serif italic text-gray-900">Onde o Silêncio não Chega</h1>
            <p className="text-gray-500 mt-2 tracking-wide font-light">André M. Fernandes</p>
          </div>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3 text-sm">
            <PlusCircle size={18} /> {mostrarForm ? 'Cancelar' : 'Criar Novo Registo'}
          </button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Pesquisar no arquivo..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-full text-sm outline-none shadow-sm" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {mostrarForm && (
          <form onSubmit={enviarTexto} className="mb-12 bg-white p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in fade-in duration-500">
            <input type="text" placeholder="Título..." className="w-full text-2xl font-serif mb-6 outline-none border-b border-gray-100 pb-2" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input type="date" className="bg-gray-50 p-3 rounded text-sm text-gray-600" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              <input type="text" placeholder="URL da imagem..." className="bg-gray-50 p-3 rounded text-sm text-gray-600" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
            </div>
            <textarea placeholder="Escreve o teu texto..." className="w-full h-48 outline-none text-gray-600 italic border-t border-gray-50 pt-4 mb-4" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" disabled={carregando} className="w-full bg-gray-900 text-white py-4 rounded hover:bg-black transition flex justify-center items-center gap-2 uppercase tracking-widest text-xs">
              {carregando ? <Loader2 className="animate-spin" size={18} /> : 'Publicar no Mural'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
              {t.imagemUrl && (
                <div className="h-64 overflow-hidden border-b border-gray-50">
                  <img src={t.imagemUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
              <div className="p-8 flex-grow">
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Calendar size={12} /> {formatarDataExibicao(t.dataManual)}
                </div>
                <h2 className="text-2xl font-serif italic mb-6 text-gray-800">{t.titulo}</h2>
                <p className="text-gray-600 font-light whitespace-pre-wrap italic">{t.conteudo}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
