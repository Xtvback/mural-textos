import React, { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock, Volume2, VolumeX, Feather, X, ArrowRight } from "lucide-react"

const PALAVRA_PASSE_MESTRE = "23872387" 

function App() {
  const [textos, setTextos] = useState([])
  const [filtro, setFiltro] = useState("")
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
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      dados.sort((a, b) => b.dataManual.localeCompare(a.dataManual))
      setTextos(dados)
    }, (error) => console.error(error))
    return unsubscribe
  }, [])

  const toggleMusica = () => {
    if (aTocar) { audioRef.current.pause() } 
    else { audioRef.current.play().catch(e => console.log("Erro no áudio", e)) }
    setATocar(!aTocar)
  }

  const fazerLogin = () => {
    if (adminAtivo) { setAdminAtivo(false); setMostrarForm(false); return }
    const senha = prompt("Introduz a palavra passe para gerir o arquivo:")
    if (senha === PALAVRA_PASSE_MESTRE) { setAdminAtivo(true) } 
    else if (senha !== null) { alert("Palavra passe incorreta") }
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
    } catch (error) { alert("Erro ao processar") } 
    finally { setCarregando(false) }
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
    setTextoAberto(null)
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
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a]">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Navegação Superior */}
      <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-xl z-50 border-b border-[#e5e0d8] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={toggleMusica} className={`flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-medium transition-all ${aTocar ? "text-[#8c7851]" : "text-gray-400 hover:text-black"}`}>
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
      <header className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <Feather size={20} className="text-[#8c7851]" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-[#8c7851] font-bold">Arquivo Literário</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-serif italic mb-8 tracking-tighter leading-[0.85]">Onde o Silêncio<br/>não Chega</h1>
            <p className="text-xl md:text-2xl font-serif italic text-gray-400 max-w-xl">Memórias e fragmentos de André M. Fernandes.</p>
          </div>
          <div className="w-full md:w-72">
            <input type="text" placeholder="Pesquisar..." className="w-full bg-transparent border-b border-[#e5e0d8] py-2 outline-none focus:border-black transition-all italic font-serif" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
        </div>
      </header>

      {/* Grelha de Cartões (Visão Resumida) */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="break-inside-avoid bg-white border border-[#f0eee9] p-8 hover:shadow-[0_20px_50px_rgba(140,120,81,0.05)] transition-all duration-700 group relative">
              {adminAtivo && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => prepararEdicao(t)} className="p-2 bg-white rounded-full border border-gray-100 text-gray-400 hover:text-black"><Edit size={14} /></button>
                  <button onClick={() => apagarTexto(t.id)} className="p-2 bg-white rounded-full border border-gray-100 text-red-200 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              )}
              {t.imagemUrl && (
                <div className="mb-6 overflow-hidden">
                  <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000" />
                </div>
              )}
              <div className="text-[9px] text-[#8c7851] uppercase tracking-[0.3em] mb-4">{formatarDataExibicao(t.dataManual)}</div>
              <h2 className="text-2xl font-serif italic text-gray-900 mb-6 leading-tight">{t.titulo}</h2>
              <button 
                onClick={() => setTextoAberto(t)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-black transition-colors"
              >
                Ler Fragmento <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>

        {/* Modal de Leitura Completa */}
        {textoAberto && (
          <div className="fixed inset-0 bg-[#fdfbf7] z-[100] overflow-y-auto animate-in fade-in duration-500">
            <nav className="sticky top-0 w-full bg-[#fdfbf7]/80 backdrop-blur-md border-b border-[#e5e0d8] px-6 py-6 z-10">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#8c7851] font-bold">A ler fragmento</span>
                <button onClick={() => setTextoAberto(null)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-[#8c7851] transition-colors">
                  Fechar <X size={16} />
                </button>
              </div>
            </nav>

            <article className="max-w-3xl mx-auto py-24 px-6">
              <header className="mb-16 text-center">
                <div className="text-[10px] text-[#8c7851] uppercase tracking-[0.4em] mb-6">{formatarDataExibicao(textoAberto.dataManual)}</div>
                <h1 className="text-5xl md:text-7xl font-serif italic mb-12 leading-tight">{textoAberto.titulo}</h1>
                {textoAberto.imagemUrl && (
                  <img src={textoAberto.imagemUrl} alt="" className="w-full h-auto grayscale mb-16 shadow-2xl" />
                )}
              </header>
              <div className="prose prose-lg mx-auto">
                <p className="text-gray-700 font-serif italic text-xl md:text-2xl leading-[2] whitespace-pre-wrap">
                  {textoAberto.conteudo}
                </p>
              </div>
              <footer className="mt-24 pt-12 border-t border-[#e5e0d8] text-center">
                <Feather className="mx-auto text-[#8c7851] mb-6" size={24} />
                <p className="text-[10px] uppercase tracking-[0.5em] text-gray-400">André M. Fernandes</p>
              </footer>
            </article>
          </div>
        )}

        {/* Formulário de Admin */}
        {mostrarForm && adminAtivo && (
          <div className="fixed inset-0 bg-[#fdfbf7]/95 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <form onSubmit={enviarTexto} className="bg-white border border-[#e5e0d8] p-12 shadow-2xl max-w-2xl w-full">
              <button onClick={() => setMostrarForm(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black">✕</button>
              <h3 className="font-serif italic text-3xl mb-10">Novo Fragmento</h3>
              <input type="text" placeholder="Título" className="w-full text-2xl font-serif mb-8 border-b border-[#f0eee9] pb-4 outline-none focus:border-[#8c7851]" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
              <div className="grid grid-cols-2 gap-8 mb-8">
                <input type="date" className="bg-[#fdfbf7] p-4 text-xs outline-none" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
                <input type="text" placeholder="URL Imagem" className="bg-[#fdfbf7] p-4 text-xs outline-none" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
              </div>
              <textarea placeholder="Escrever..." className="w-full h-64 border-t border-[#f0eee9] pt-6 outline-none italic text-lg resize-none" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
              <button type="submit" className="w-full bg-black text-white py-5 uppercase tracking-[0.3em] text-[10px] font-bold hover:bg-[#8c7851] transition-all">
                {carregando ? "A gravar..." : "Lançar ao Mural"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
