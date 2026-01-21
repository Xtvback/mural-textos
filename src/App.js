import React, { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Image as ImageIcon, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock, Volume2, VolumeX, Quote } from "lucide-react"

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
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] selection:bg-black selection:text-white">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Barra Superior Minimalista */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={toggleMusica} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition">
              {aTocar ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {aTocar ? "Som Ativo" : "Ativar Ambiente"}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fazerLogin} className={`p-2 rounded-full transition ${adminAtivo ? "text-green-600 bg-green-50" : "text-gray-300 hover:text-gray-600"}`}>
              {adminAtivo ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="bg-black text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-gray-800 transition">
                {mostrarForm ? "Fechar" : "Novo Texto"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Preenche o vácuo inicial */}
      <header className="pt-32 pb-20 px-6 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto text-center md:text-left">
          <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 block mb-4">Arquivo Pessoal e Literário</span>
          <h1 className="text-6xl md:text-8xl font-serif italic mb-6 tracking-tight">Onde o Silêncio não Chega</h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <p className="text-xl font-light text-gray-500 italic max-w-2xl leading-relaxed">
              Um espaço de memória dedicado a André M. Fernandes, onde cada fragmento de texto tenta alcançar o que as palavras sozinhas não conseguem descrever.
            </p>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="Procurar no arquivo..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-none text-sm focus:ring-1 focus:ring-black transition"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-20 px-6">
        {/* Formulário com design de cartão flutuante */}
        {mostrarForm && adminAtivo && (
          <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <form onSubmit={enviarTexto} className="bg-white p-10 shadow-2xl max-w-2xl w-full animate-in zoom-in duration-300 relative">
              <button onClick={() => setMostrarForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">✕</button>
              <h3 className="font-serif italic text-2xl mb-8 border-b pb-4">{idSendoEditado ? "Editar Memória" : "Nova Entrada no Mural"}</h3>
              <input type="text" placeholder="Título do Texto" className="w-full text-xl font-serif mb-6 outline-none border-b border-gray-100 pb-2 focus:border-black transition" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase text-gray-400">Data do Registo</label>
                  <input type="date" className="bg-gray-50 p-3 text-sm outline-none" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase text-gray-400">URL da Imagem</label>
                  <input type="text" placeholder="http://..." className="bg-gray-50 p-3 text-sm outline-none" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
                </div>
              </div>
              <textarea placeholder="Escreve aqui..." className="w-full h-64 outline-none text-gray-600 italic border-t border-gray-50 pt-6 mb-6 resize-none leading-relaxed" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
              <button type="submit" disabled={carregando} className="w-full bg-black text-white py-4 hover:bg-gray-900 transition flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-xs font-bold">
                {carregando ? <Loader2 className="animate-spin" size={18} /> : "Gravar no Arquivo"}
              </button>
            </form>
          </div>
        )}

        {/* Grelha de Conteúdo - Design Moderno */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="break-inside-avoid bg-white border border-gray-100 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-500 group relative flex flex-col">
              {adminAtivo && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => prepararEdicao(t)} className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-black"><Edit size={14} /></button>
                  <button onClick={() => apagarTexto(t.id)} className="p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              )}
              
              {t.imagemUrl && (
                <div className="mb-8 overflow-hidden">
                  <img src={t.imagemUrl} alt="" className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100" onError={(e) => e.target.style.display = "none"} />
                </div>
              )}

              <div className="flex flex-col flex-grow">
                <header className="mb-6">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 font-medium">
                    <span className="w-8 h-[1px] bg-gray-200"></span>
                    {formatarDataExibicao(t.dataManual)}
                  </div>
                  <h2 className="text-3xl font-serif italic text-gray-900 leading-tight group-hover:text-gray-600 transition-colors">{t.titulo}</h2>
                </header>
                
                <div className="relative">
                  <Quote className="absolute -left-4 -top-2 text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" size={40} />
                  <p className="text-gray-500 font-light whitespace-pre-wrap italic leading-[1.8] text-lg relative z-10">{t.conteudo}</p>
                </div>
              </div>

              <footer className="mt-10 pt-6 border-t border-gray-50 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-gray-300">
                <span>Fragmento #{t.id.slice(0, 4)}</span>
                <span className="group-hover:text-black transition-colors underline decoration-gray-100 underline-offset-4 cursor-default">Ler Completo</span>
              </footer>
            </article>
          ))}
        </div>

        {textosFiltrados.length === 0 && (
          <div className="text-center py-40 border-2 border-dashed border-gray-100">
            <p className="text-gray-300 font-serif italic text-2xl tracking-widest">O arquivo permanece em silêncio...</p>
          </div>
        )}
      </main>

      <footer className="py-20 px-6 border-t border-gray-100 bg-white text-center">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif italic mb-4">Onde o Silêncio não Chega</h2>
          <p className="text-gray-400 text-xs uppercase tracking-[0.4em]">© 2026 • Design por André M. Fernandes</p>
        </div>
      </footer>
    </div>
  )
}

export default App
