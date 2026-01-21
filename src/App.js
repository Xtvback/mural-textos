import React, { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock, Volume2, VolumeX, Quote, Feather } from "lucide-react"

const PALAVRA_PASSE_MESTRE = "23872387" 

function App() {
  const [textos, setTextos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [idSendoEditado, setIdSendoEditado] = useState(null)
  const [adminAtivo, setAdminAtivo] = useState(false)
  const [aTocar, setATocar] = useState(false)
  const audioRef = useRef(null)
  
  const [novoTexto, setNovoTexto] = useState({ 
    titulo: "", conteudo: "", imagemUrl: "",
    dataManual: new Date().toISOString().split("T")[0] 
  })

  useEffect(() => {
    const q = query(collection(db, "textos"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      dados.sort((a, b) => b.dataManual.localeCompare(a.dataManual))
      setTextos(dados)
    }, (error) => console.error(error))
    return unsubscribe
  }, [])

  const toggleMusica = () => {
    if (aTocar) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.log("Erro no áudio", e))
    }
    setATocar(!aTocar)
  }

  const fazerLogin = () => {
    if (adminAtivo) {
      setAdminAtivo(false)
      setMostrarForm(false)
      return
    }
    const senha = prompt("Introduz a palavra passe para gerir o arquivo:")
    if (senha === PALAVRA_PASSE_MESTRE) {
      setAdminAtivo(true)
    } else if (senha !== null) {
      alert("Palavra passe incorreta")
    }
  }

  const enviarTexto = async (e) => {
    e.preventDefault()
    if (!novoTexto.titulo.trim() || !novoTexto.conteudo.trim()) return
    setCarregando(true)
    try {
      if (idSendoEditado) {
        await updateDoc(doc(db, "textos", idSendoEditado), { ...novoTexto })
        setIdSendoEditado(null)
      } else {
        await addDoc(collection(db, "textos"), { ...novoTexto, criadoEm: new Date() })
      }
      setNovoTexto({ titulo: "", conteudo: "", imagemUrl: "", dataManual: new Date().toISOString().split("T")[0] })
      setMostrarForm(false)
    } catch (error) {
      alert("Erro ao processar o registo")
    } finally {
      setCarregando(false)
    }
  }

  const apagarTexto = async (id) => {
    if (window.confirm("Queres eliminar este fragmento?")) {
      await deleteDoc(doc(db, "textos", id))
    }
  }

  const prepararEdicao = (t) => {
    setNovoTexto({ titulo: t.titulo, conteudo: t.conteudo, imagemUrl: t.imagemUrl || "", dataManual: t.dataManual })
    setIdSendoEditado(t.id)
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const textosFiltrados = textos.filter(t => 
    t.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    t.conteudo.toLowerCase().includes(filtro.toLowerCase()) ||
    t.dataManual.includes(filtro)
  )

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return ""
    const [ano, mes, dia] = dataString.split("-")
    const data = new Date(ano, mes - 1, dia)
    return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] selection:bg-[#c4b5a2] selection:text-white transition-colors duration-700">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Navegação Superior - Efeito de Vidro Suave */}
      <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-xl z-50 border-b border-[#e5e0d8] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={toggleMusica} className={`flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-medium transition-all ${aTocar ? "text-[#8c7851]" : "text-gray-400 hover:text-black"}`}>
            {aTocar ? <div className="flex gap-1 items-end h-3"><div className="w-0.5 bg-current animate-[bounce_1s_infinite]"></div><div className="w-0.5 bg-current animate-[bounce_1.5s_infinite]"></div><div className="w-0.5 bg-current animate-[bounce_0.8s_infinite]"></div></div> : <VolumeX size={14} />}
            {aTocar ? "Ambiente Ativo" : "Silêncio"}
          </button>
          
          <div className="flex items-center gap-6">
            <button onClick={fazerLogin} className={`p-2 transition-colors ${adminAtivo ? "text-[#8c7851]" : "text-gray-300 hover:text-gray-500"}`}>
              {adminAtivo ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="border border-black text-black px-6 py-2 rounded-full text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                {mostrarForm ? "Recuar" : "Nova Memória"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Cabeçalho Editorial */}
      <header className="pt-40 pb-24 px-6 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <Feather size={20} className="text-[#8c7851]" />
                <span className="h-[1px] w-12 bg-[#8c7851]"></span>
                <span className="text-[10px] uppercase tracking-[0.5em] text-[#8c7851] font-bold">Fragmentos do Tempo</span>
              </div>
              <h1 className="text-7xl md:text-9xl font-serif italic mb-8 tracking-tighter leading-[0.85]">Onde o Silêncio<br/>não Chega</h1>
              <p className="text-xl md:text-2xl font-serif italic text-gray-400 leading-relaxed max-w-xl">
                O arquivo digital de André M. Fernandes. Textos que procuram habitar os espaços vazios entre as palavras.
              </p>
            </div>
            
            <div className="w-full md:w-72">
              <div className="group relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar fragmento..." 
                  className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-[#e5e0d8] text-sm focus:border-black outline-none transition-all placeholder:text-gray-300 italic font-serif"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mural Dinâmico */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        
        {mostrarForm && adminAtivo && (
          <div className="fixed inset-0 bg-[#fdfbf7]/90 backdrop-blur-md z-[60] flex items-center justify-center p-6">
            <form onSubmit={enviarTexto} className="bg-white border border-[#e5e0d8] p-12 shadow-2xl max-w-2xl w-full animate-in slide-in-from-bottom-8 duration-500 relative">
              <button onClick={() => setMostrarForm(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black">✕</button>
              <h3 className="font-serif italic text-3xl mb-12">Registar uma nova sombra</h3>
              
              <input type="text" placeholder="Título da entrada" className="w-full text-2xl font-serif mb-10 outline-none border-b border-[#f0eee9] pb-4 focus:border-[#8c7851] transition" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-gray-400">Data do pensamento</label>
                  <input type="date" className="w-full bg-[#fdfbf7] p-4 text-xs outline-none border border-transparent focus:border-[#e5e0d8]" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-gray-400">Ligação da Imagem</label>
                  <input type="text" placeholder="URL opcional" className="w-full bg-[#fdfbf7] p-4 text-xs outline-none border border-transparent focus:border-[#e5e0d8]" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
                </div>
              </div>

              <textarea placeholder="O que o silêncio não conseguiu dizer..." className="w-full h-72 outline-none text-gray-600 italic border-t border-[#f0eee9] pt-8 mb-10 resize-none leading-relaxed text-lg" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
              
              <button type="submit" disabled={carregando} className="w-full bg-black text-white py-5 hover:bg-[#8c7851] transition-all flex justify-center items-center gap-3 uppercase tracking-[0.3em] text-[10px] font-bold">
                {carregando ? <Loader2 className="animate-spin" size={16} /> : (idSendoEditado ? "Atualizar Fragmento" : "Lançar ao Mural")}
              </button>
            </form>
          </div>
        )}

        {/* Grelha Masonry Estilo Galeria */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-16 space-y-16">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="break-inside-avoid bg-white border border-[#f0eee9] p-10 hover:border-[#e5e0d8] hover:shadow-[0_20px_50px_rgba(140,120,81,0.08)] transition-all duration-700 group relative">
              {adminAtivo && (
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => prepararEdicao(t)} className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-black border border-gray-50"><Edit size={14} /></button>
                  <button onClick={() => apagarTexto(t.id)} className="p-2 bg-white rounded-full shadow-sm text-red-200 hover:text-red-500 border border-gray-50"><Trash2 size={14} /></button>
                </div>
              )}
              
              {t.imagemUrl && (
                <div className="mb-10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#8c7851]/5 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                  <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-[1.5s] ease-out scale-[1.02] group-hover:scale-100" onError={(e) => e.target.style.display = "none"} />
                </div>
              )}

              <div className="flex flex-col">
                <header className="mb-8">
                  <div className="text-[9px] text-[#8c7851] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 font-semibold">
                    {formatarDataExibicao(t.dataManual)}
                    <span className="w-1 h-1 rounded-full bg-[#8c7851]"></span>
                    F_#{t.id.slice(-4)}
                  </div>
                  <h2 className="text-3xl font-serif italic text-gray-900 leading-[1.15] group-hover:translate-x-1 transition-transform duration-500">{t.titulo}</h2>
                </header>
                
                <div className="relative">
                  <Quote className="absolute -left-6 -top-4 text-[#fdfbf7] z-0" size={60} fill="currentColor" />
                  <p className="text-gray-500 font-serif italic font-light whitespace-pre-wrap leading-[1.9] text-lg relative z-10">{t.conteudo}</p>
                </div>
                
                <footer className="mt-12 pt-8 border-t border-[#fcfaf7] flex items-center gap-4">
                  <span className="text-[8px] uppercase tracking-[0.5em] text-gray-300">André M. Fernandes</span>
                  <div className="h-[1px] flex-grow bg-[#fcfaf7]"></div>
                </footer>
              </div>
            </article>
          ))}
        </div>

        {textosFiltrados.length === 0 && (
          <div className="text-center py-48 border border-dashed border-[#e5e0d8] bg-white/50">
            <p className="text-gray-300 font-serif italic text-xl tracking-widest">Nenhuma memória encontrada sob este filtro.</p>
          </div>
        )}
      </main>

      <footer className="py-32 px-6 border-t border-[#e5e0d8] bg-white mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-serif italic mb-2 tracking-tighter">Onde o Silêncio não Chega</h2>
            <p className="text-[#8c7851] text-[9px] uppercase tracking-[0.5em] font-bold">Arquivo Literário • 2026</p>
          </div>
          <div className="flex gap-8 text-[9px] uppercase tracking-[0.2em] text-gray-400">
            <span className="hover:text-black transition-colors cursor-pointer">Início</span>
            <span className="hover:text-black transition-colors cursor-pointer">Sobre</span>
            <span className="hover:text-black transition-colors cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Voltar ao Topo</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
