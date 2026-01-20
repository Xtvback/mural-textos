import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PlusCircle, Image as ImageIcon, Calendar, Search, Loader2 } from 'lucide-react';

function App() {
  const [textos, setTextos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [novoTexto, setNovoTexto] = useState({ 
    titulo: '', 
    conteudo: '', 
    imagemUrl: '',
    dataManual: new Date().toISOString().split('T')[0] 
  });

  // 1. Carregar o Arquivo do Firebase
  useEffect(() => {
    const q = query(collection(db, 'textos'), orderBy('dataManual', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTextos(dados);
    }, (error) => {
      console.error("Erro ao ler base de dados:", error);
    });

    return unsubscribe;
  }, []);

  // 2. Função para Publicar
  const enviarTexto = async (e) => {
    e.preventDefault();
    
    if (!novoTexto.titulo.trim() || !novoTexto.conteudo.trim()) {
      alert("Por favor, preenche o título e o conteúdo.");
      return;
    }

    setCarregando(true);
    try {
      await addDoc(collection(db, 'textos'), {
        titulo: novoTexto.titulo,
        conteudo: novoTexto.conteudo,
        imagemUrl: novoTexto.imagemUrl,
        dataManual: novoTexto.dataManual,
        criadoEm: new Date()
      });
      
      // Limpar formulário após sucesso
      setNovoTexto({ 
        titulo: '', 
        conteudo: '', 
        imagemUrl: '', 
        dataManual: new Date().toISOString().split('T')[0] 
      });
      setMostrarForm(false);
      alert("Publicado com sucesso no arquivo!");
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro de ligação: Verifica se as regras do Firebase estão abertas.");
    } finally {
      setCarregando(false);
    }
  };

  // 3. Lógica da Pesquisa
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
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] p-6 md:p-12 font-sans">
      <header className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
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
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar no arquivo..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-full text-sm outline-none focus:border-gray-300 transition shadow-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {mostrarForm && (
          <form onSubmit={enviarTexto} className="mb-12 bg-white p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
            <input 
              type="text" 
              placeholder="Título da nota..."
              className="w-full text-2xl font-serif mb-6 outline-none border-b border-gray-100 pb-2 focus:border-black transition"
              value={novoTexto.titulo}
              onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-gray-400 ml-1 font-bold">Data Histórica</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-100">
                  <Calendar size={18} className="text-gray-400" />
                  <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm text-gray-600 w-full"
                    value={novoTexto.dataManual}
                    onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-gray-400 ml-1 font-bold">Imagem (URL)</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-100">
                  <ImageIcon size={18} className="text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Link da imagem..."
                    className="bg-transparent outline-none text-sm text-gray-600 w-full"
                    value={novoTexto.imagemUrl}
                    onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <textarea 
              placeholder="Escreve o teu texto aqui..."
              className="w-full h-48 resize-none outline-none text-gray-600 leading-relaxed italic border-t border-gray-50 pt-4 mb-4"
              value={novoTexto.conteudo}
              onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})}
              required
            />
            
            <button 
              type="submit" 
              disabled={carregando}
              className="w-full bg-gray-900 text-white py-4 rounded hover:bg-black transition flex justify-center items-center gap-2 uppercase tracking-widest text-xs disabled:bg-gray-400"
            >
              {carregando ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar e Publicar'}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col">
              {t.imagemUrl && (
                <div className="h-64 overflow-hidden border-b border-gray-50">
                  <img 
                    src={t.imagemUrl} 
                    alt={t.titulo} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
              <div className="p-8 flex-grow">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 font-bold">
                  <Calendar size={12} />
                  {formatarDataExibicao(t.dataManual)}
                </div>
                <h2 className="text-2xl font-serif italic mb-6 text-gray-800 leading-snug">{t.titulo}</h2>
                <p className="text-gray-600 leading-relaxed font-light whitespace-pre-wrap italic">{t.conteudo}</p>
              </div>
            </article>
          ))}
        </div>

        {textosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-serif italic">O arquivo está em silêncio...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
