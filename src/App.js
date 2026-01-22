import React, { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock, Volume2, VolumeX, Feather, X, ArrowRight, Clock, Instagram } from "lucide-react"

const PALAVRA_PASSE_MESTRE = "23872387"

function App() {
  const [textos, setTextos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [mesFiltro, setMesFiltro] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [idSendoEditado, setIdSendoEditado] = useState(null)
  const [adminAtivo, setAdminAtivo] = useState(false)
  const [aTocar, setATocar] = useState(false)
  const [textoAberto, setTextoAberto] = useState(null)
  const audioRef = useRef(null)
  
  const [novoTexto, setNovoTexto] = useState({ 
    titulo: "", conteudo: "", imagemUrl: "",
    dataManual: new Date().toISOString().split("T")[0] 
  })

  useEffect(() => {
    const q = query(collection(db, "textos"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dados.sort((a, b) => b.dataManual.localeCompare(a.dataManual));
      setTextos(dados);
    }, (error) => console.error(error));
    return unsubscribe;
  }, [])

  const toggleMusica = () => {
    if (aTocar) { audioRef.current.pause() } 
    else { audioRef.current.play().catch(e => console.log("Erro no som", e)) }
    setATocar(!aTocar);
  }

  const fazerLogin = () => {
    if (adminAtivo) { setAdminAtivo(false); setMostrarForm(false); return }
    const senha = prompt("Introduz a palavra passe para gerir o arquivo:");
    if (senha === PALAVRA_PASSE_MESTRE) { setAdminAtivo(true) } 
    else if (senha !== null) { alert("Palavra passe incorreta") }
  }

  const enviarTexto = async (e) => {
    e.preventDefault();
    if (!novoTexto.titulo.trim() || !novoTexto.conteudo.trim()) return;
    setCarregando(true);
    try {
      if (idSendoEditado) {
        await updateDoc(doc(db, "textos", idSendoEditado), { ...novoTexto });
        setIdSendoEditado(null);
      } else {
        await addDoc(collection(db, "textos"), { ...novoTexto, criadoEm: new Date() });
      }
      setNovoTexto({ titulo: "", conteudo: "", imagemUrl: "", dataManual: new Date().toISOString().split("T")[0] });
      setMostrarForm(false);
    } catch (error) { alert("Erro ao processar") } 
    finally { setCarregando(false) }
  }

  const apagarTexto = async (id) => {
    if (window.confirm("Queres eliminar este fragmento?")) {
      await deleteDoc(doc(db, "textos", id));
    }
  }

  const obterEstatisticas = () => {
    return textos.reduce((acc, t) => {
      const data = new Date(t.dataManual);
      const ano = data.getFullYear();
      const mes = data.getMonth();
      if (!acc[ano]) acc[ano] = {};
      if (!acc[ano][mes]) acc[ano][mes] = 0;
      acc[ano][mes]++;
      return acc;
    }, {})
  }

  const estatisticas = obterEstatisticas();
  const anosOrdenados = Object.keys(estatisticas).sort((a, b) => b - a);
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const textosFiltrados = textos.filter(t => {
    const correspondePesquisa = t.titulo.toLowerCase().includes(filtro.toLowerCase()) || t.conteudo.toLowerCase().includes(filtro.toLowerCase());
    if (!mesFiltro) return correspondePesquisa;
    const dataT = new Date(t.dataManual);
    return correspondePesquisa && dataT.getFullYear() === mesFiltro.ano && dataT.getMonth() === mesFiltro.mes;
  })

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return "";
    const [ano, mes, dia] = dataString.split("-");
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#2d2a26] font-sans selection:bg-[#8c7851] selection:text-white transition-all duration-500">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Botão de Som Envolvente no Canto */}
      <div className="fixed bottom-8 left-8 z-[100] flex items-center gap-4 bg-white/40 backdrop-blur-md border border-[#2d2a26]/10 p-2 pr-6 rounded-full group hover:border-[#8c7851] transition-all cursor-pointer" onClick={toggleMusica}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${aTocar ? "bg-[#8c7851] text-white" : "bg-[#2d2a26] text-white"}`}>
          {aTocar ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 group-hover:text-[#8c7851]">Atmosfera</span>
          <span className="text-[10px] uppercase tracking-[0.1em] font-medium">{aTocar ? "Sinfonia Ativa" : "Ativar Som"}</span>
        </div>
      </div>

      {/* Navegação Superior Minimalista */}
      <nav className="fixed top-0 w-full bg-[#fcfaf7]/80 backdrop-blur-md z-50 border-b border-[#2d2a26]/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Feather size={14} className="text-[#8c7851]" />
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">André M. Fernandes</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/andre.f.m.fernandes/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black transition-colors">
              <Instagram size={18} />
            </a>
            <button onClick={fazerLogin} className="text-gray-300 hover:text-gray-600">
              {adminAtivo ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="text-[10px] uppercase tracking-widest font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-all">
                Escrever
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Cabeçalho Proporcional e Elegante */}
      <header className="pt-40 pb-20 px-8 border-b border-[#2d2a26]/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-end gap-12">
          <div>
            <span className="text-[9px] uppercase tracking-[0.6em] text-[#8c7851] font-bold block mb-6">Arquivos da Memória</span>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.1] text-[#2d2a26]">
              Onde o Silêncio não Chega
            </h1>
          </div>
          <div className="pb-2">
            <p className="text-lg md:text-xl font-serif italic text-gray-400 leading-relaxed border-l-2 border-[#8c7851]/20 pl-6">
              A curadoria literária de André M. Fernandes. Fragmentos que habitam o espaço entre a palavra e o sentir.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 py-24">
        
        {/* Cronologia Estruturada */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-36 space-y-12">
            <div className="border border-[#2d2a26]/10 p-8 bg-white/30">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-400 mb-8 flex items-center gap-2">
                <Clock size={12} /> Percursos
              </h3>
              <div className="space-y-10">
                {anosOrdenados.map(ano => (
                  <div key={ano} className="space-y-4">
                    <div className="text-xs font-bold text-gray-900 border-b border-[#2d2a26]/10 pb-2 flex justify-between uppercase tracking-widest">
                      {ano} <span className="text-[10px] text-[#8c7851]">{Object.values(estatisticas[ano]).reduce((a, b) => a + b, 0)}</span>
                    </div>
                    <ul className="space-y-2 pl-2">
                      {Object.keys(estatisticas[ano]).sort((a,b) => b-a).map(mes => (
                        <li key={mes}>
                          <button 
                            onClick={() => setMesFiltro(mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? null : { mes: parseInt(mes), ano: parseInt(ano) })}
                            className={`text-[10px] uppercase tracking-widest transition-all ${mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? "text-[#8c7851] font-bold border-l-2 border-[#8c7851] pl-3" : "text-gray-400 hover:text-black hover:pl-2"}`}
                          >
                            {nomesMeses[mes]} <span className="opacity-20 text-[8px]">[{estatisticas[ano][mes]}]</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#8c7851] transition-colors" size={14} />
              <input type="text" placeholder="Procurar fragmento..." className="w-full bg-transparent border-b border-[#2d2a26]/10 py-2 pl-6 text-sm outline-none focus:border-black transition-all italic font-serif" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>
          </div>
        </aside>

        {/* Mural de Fragmentos Estilo Galeria */}
        <main className="lg:col-span-9">
          <div className="columns-1 md:columns-2 gap-10 space-y-10">
            {textosFiltrados.map((t) => (
              <article key={t.id} className="break-inside-avoid bg-white border border-[#2d2a26]/5 p-8 transition-all duration-700 group relative hover:border-[#8c7851]/30 hover:shadow-xl">
                {adminAtivo && (
                  <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setIdSendoEditado(t.id); setNovoTexto({titulo: t.titulo, conteudo: t.conteudo, imagemUrl: t.imagemUrl || "", dataManual: t.dataManual}); setMostrarForm(true); }} className="text-gray-300 hover:text-black"><Edit size={14} /></button>
                    <button onClick={() => apagarTexto(t.id)} className="text-red-100 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                )}
                {t.imagemUrl && (
                  <div className="mb-8 overflow-hidden bg-[#fcfaf7] border border-[#2d2a26]/5">
                    <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale transition-all duration-[1.2s] group-hover:grayscale-0 group-hover:scale-105" />
                  </div>
                )}
                <div className="text-[9px] text-[#8c7851] uppercase tracking-[0.4em] mb-4 font-bold">{formatarDataExibicao(t.dataManual)}</div>
                <h2 className="text-2xl font-serif italic text-[#2d2a26] mb-8 leading-tight tracking-tight group-hover:text-[#8c7851] transition-colors">{t.titulo}</h2>
                <button onClick={() => setTextoAberto(t)} className="w-full pt-6 border-t border-[#fcfaf7] text-[10px] uppercase tracking-[0.3em] font-bold text-gray-300 hover:text-black transition-all flex items-center justify-between">
                  Explorar <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* Leitura Focada Estilo Página de Livro */}
      {textoAberto && (
        <div className="fixed inset-0 bg-[#fcfaf7]/98 z-[110] flex justify-center items-center overflow-y-auto p-6 md:p-20 animate-in fade-in duration-500">
          <div className="max-w-2xl w-full bg-white border border-[#2d2a26]/10 p-10 md:p-20 relative shadow-2xl">
            <button onClick={() => setTextoAberto(null)} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-colors">
              <X size={20} />
            </button>
            <header className="mb-16">
              <div className="text-[10px] text-[#8c7851] uppercase tracking-[0.5em] mb-8 font-bold text-center">{formatarDataExibicao(textoAberto.dataManual)}</div>
              <h1 className="text-4xl md:text-5xl font-serif italic mb-12 text-center leading-tight tracking-tight">{textoAberto.titulo}</h1>
              {textoAberto.imagemUrl && <img src={textoAberto.imagemUrl} alt="" className="w-full h-auto grayscale mb-12 shadow-sm border border-[#2d2a26]/5" />}
            </header>
            <p className="text-[#4a4540] font-serif italic text-xl md:text-2xl leading-[1.8] whitespace-pre-wrap max-w-xl mx-auto">
              {textoAberto.conteudo}
            </p>
            <footer className="mt-20 pt-10 border-t border-[#fcfaf7] text-center">
              <Feather className="mx-auto text-[#8c7851]/30 mb-6" size={20} />
              <p className="text-[9px] uppercase tracking-[0.6em] text-gray-300 font-bold">A. M. Fernandes</p>
            </footer>
          </div>
        </div>
      )}

      {/* Rodapé Editorial com Contacto */}
      <footer className="bg-white border-t border-[#2d2a26]/10 py-32 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-md text-center md:text-left">
            <h2 className="text-3xl font-serif italic text-[#2d2a26] mb-6 tracking-tight">Arquivos da Memória</h2>
            <p className="text-gray-400 font-serif italic text-lg leading-relaxed">
              Um espaço dedicado à preservação de pensamentos e fragmentos literários criados no silêncio da noite.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-10">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#8c7851] font-bold block mb-4">Autor e Criador</span>
              <h3 className="text-2xl font-serif italic text-black">André M. Fernandes</h3>
            </div>
            <a 
              href="https://www.instagram.com/andre.f.m.fernandes/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-4 border border-[#2d2a26]/10 px-10 py-5 rounded-full hover:bg-[#8c7851] hover:text-white hover:border-[#8c7851] transition-all group shadow-sm"
            >
              <Instagram size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Perfil Oficial</span>
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-[#fcfaf7] flex justify-between items-center">
          <p className="text-[8px] uppercase tracking-[0.8em] text-gray-300">© MMXXVI • Todos os Direitos Reservados</p>
          <div className="h-[1px] w-20 bg-[#2d2a26]/10"></div>
        </div>
      </footer>

      {/* Formulário de Admin Minimalista */}
      {mostrarForm && adminAtivo && (
        <div className="fixed inset-0 bg-[#fcfaf7]/95 backdrop-blur-md z-[120] flex items-center justify-center p-6">
          <form onSubmit={enviarTexto} className="bg-white border border-[#2d2a26]/10 p-12 shadow-2xl max-w-xl w-full relative">
            <button onClick={() => setMostrarForm(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black">✕</button>
            <h3 className="font-serif italic text-3xl mb-12 border-b border-[#fcfaf7] pb-6">Novo Fragmento</h3>
            <input type="text" placeholder="Título" className="w-full text-2xl font-serif mb-10 border-b border-[#fcfaf7] pb-4 outline-none focus:border-[#8c7851] transition-all" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-2 gap-8 mb-10">
              <input type="date" className="bg-[#fcfaf7] p-4 text-[10px] outline-none border border-transparent focus:border-[#2d2a26]/10" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              <input type="text" placeholder="URL Imagem" className="bg-[#fcfaf7] p-4 text-[10px] outline-none border border-transparent focus:border-[#2d2a26]/10" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
            </div>
            <textarea placeholder="O que o silêncio dita..." className="w-full h-64 border-t border-[#fcfaf7] pt-6 outline-none italic text-lg resize-none leading-relaxed bg-transparent" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" className="w-full bg-black text-white py-5 uppercase tracking-[0.4em] text-[10px] font-bold hover:bg-[#8c7851] transition-all">Lançar ao Mural</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
