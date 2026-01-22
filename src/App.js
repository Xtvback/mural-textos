import React, { useState, useEffect, useRef } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock, Volume2, VolumeX, Feather, X, ArrowRight, Clock } from "lucide-react"

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
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      dados.sort((a, b) => b.dataManual.localeCompare(a.dataManual))
      setTextos(dados)
    }, (error) => console.error(error))
    return unsubscribe
  }, [])

  const toggleMusica = () => {
    if (aTocar) { audioRef.current.pause() } 
    else { audioRef.current.play().catch(e => console.log("Erro no som", e)) }
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

  const obterEstatisticas = () => {
    return textos.reduce((acc, t) => {
      const data = new Date(t.dataManual)
      const ano = data.getFullYear()
      const mes = data.getMonth()
      if (!acc[ano]) acc[ano] = {}
      if (!acc[ano][mes]) acc[ano][mes] = 0
      acc[ano][mes]++
      return acc
    }, {})
  }

  const estatisticas = obterEstatisticas()
  const anosOrdenados = Object.keys(estatisticas).sort((a, b) => b - a)
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const textosFiltrados = textos.filter(t => {
    const correspondePesquisa = t.titulo.toLowerCase().includes(filtro.toLowerCase()) || t.conteudo.toLowerCase().includes(filtro.toLowerCase())
    if (!mesFiltro) return correspondePesquisa
    const dataT = new Date(t.dataManual)
    return correspondePesquisa && dataT.getFullYear() === mesFiltro.ano && dataT.getMonth() === mesFiltro.mes
  })

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return ""
    const [ano, mes, dia] = dataString.split("-")
    const data = new Date(ano, mes - 1, dia)
    return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] font-sans">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Navegação Superior Discreta */}
      <nav className="fixed top-0 w-full bg-white/40 backdrop-blur-sm z-50 border-b border-[#ece8e1] px-8 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={toggleMusica} className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] font-semibold text-[#8c7851] hover:text-black transition-all">
            {aTocar ? "Arquivo Sonoro Ativo" : "Ativar Som"}
          </button>
          <div className="flex items-center gap-5">
            <button onClick={fazerLogin} className="text-gray-300 hover:text-gray-500 transition-colors">
              {adminAtivo ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="text-[9px] uppercase tracking-widest font-bold border-b border-black pb-1">
                Nova Memória
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Título Refinado e Menos Dominante */}
      <header className="pt-32 pb-16 px-8 max-w-7xl mx-auto text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
          <Feather size={16} className="text-[#8c7851]" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-[#8c7851] font-bold">Arquivo Pessoal</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif italic mb-6 tracking-tight leading-tight">
          Onde o Silêncio não Chega
        </h1>
        <p className="text-lg font-serif italic text-gray-400 max-w-lg leading-relaxed">
          Fragmentos e memórias registadas por André M. Fernandes.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-24">
        
        {/* Cronologia Lateral com Estética Minimalista */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-32 space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-300 flex items-center gap-2">
                <Clock size={12} /> Navegação Temporal
              </h3>
              {anosOrdenados.map(ano => (
                <div key={ano} className="space-y-3">
                  <div className="text-sm font-serif italic text-gray-900 border-b border-[#ece8e1] pb-1 w-full flex justify-between">
                    {ano} <span className="text-[9px] text-gray-300 not-italic">({Object.values(estatisticas[ano]).reduce((a, b) => a + b, 0)})</span>
                  </div>
                  <ul className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {Object.keys(estatisticas[ano]).sort((a,b) => b-a).map(mes => (
                      <li key={mes}>
                        <button 
                          onClick={() => setMesFiltro(mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? null : { mes: parseInt(mes), ano: parseInt(ano) })}
                          className={`text-[10px] uppercase tracking-widest transition-all ${mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? "text-[#8c7851] font-bold pl-2 border-l border-[#8c7851]" : "text-gray-400 hover:text-black hover:pl-1"}`}
                        >
                          {nomesMeses[mes]} <span className="opacity-40 text-[8px]">[{estatisticas[ano][mes]}]</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-[#ece8e1]">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                <input type="text" placeholder="Pesquisar..." className="w-full bg-transparent border-none pl-5 text-xs outline-none italic font-serif placeholder:text-gray-200" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
              </div>
            </div>
          </div>
        </aside>

        {/* Mural de Cartões com Proporções Melhoradas */}
        <main className="lg:col-span-9">
          <div className="columns-1 md:columns-2 gap-8 space-y-8">
            {textosFiltrados.map((t) => (
              <article key={t.id} className="break-inside-avoid bg-white border border-[#f0eee9] p-6 hover:border-[#8c7851]/20 transition-all duration-500 group relative">
                {adminAtivo && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setIdSendoEditado(t.id); setNovoTexto({titulo: t.titulo, conteudo: t.conteudo, imagemUrl: t.imagemUrl || "", dataManual: t.dataManual}); setMostrarForm(true); }} className="text-gray-300 hover:text-black"><Edit size={12} /></button>
                    <button onClick={() => apagarTexto(t.id)} className="text-red-100 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
                {t.imagemUrl && (
                  <div className="mb-5 overflow-hidden">
                    <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale transition-all duration-700" />
                  </div>
                )}
                <div className="text-[8px] text-[#8c7851] uppercase tracking-[0.2em] mb-3">{formatarDataExibicao(t.dataManual)}</div>
                <h2 className="text-xl font-serif italic text-gray-900 mb-5 leading-snug group-hover:text-[#8c7851] transition-colors">{t.titulo}</h2>
                <button onClick={() => setTextoAberto(t)} className="text-[9px] uppercase tracking-widest font-bold text-gray-300 group-hover:text-black flex items-center gap-2">
                  Ler Fragmento <ArrowRight size={12} />
                </button>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* Janela de Leitura Focada - Tamanho sentido e equilibrado */}
      {textoAberto && (
        <div className="fixed inset-0 bg-[#fdfbf7]/98 z-[100] flex justify-center items-start overflow-y-auto p-4 md:p-12 animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white border border-[#ece8e1] shadow-2xl my-auto relative p-8 md:p-16">
            <button onClick={() => setTextoAberto(null)} className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors">
              <X size={20} />
            </button>
            <header className="mb-12 text-center">
              <div className="text-[9px] text-[#8c7851] uppercase tracking-[0.3em] mb-6 font-bold">{formatarDataExibicao(textoAberto.dataManual)}</div>
              <h1 className="text-3xl md:text-5xl font-serif italic mb-10 leading-tight text-gray-900">{textoAberto.titulo}</h1>
              {textoAberto.imagemUrl && (
                <div className="w-full mb-10">
                  <img src={textoAberto.imagemUrl} alt="" className="w-full h-auto grayscale shadow-lg" />
                </div>
              )}
            </header>
            <div className="prose prose-sm mx-auto">
              <p className="text-gray-700 font-serif italic text-lg leading-relaxed whitespace-pre-wrap">
                {textoAberto.conteudo}
              </p>
            </div>
            <footer className="mt-16 pt-8 border-t border-[#fcfaf7] text-center">
              <Feather className="mx-auto text-[#8c7851]/30 mb-4" size={20} />
              <p className="text-[8px] uppercase tracking-[0.4em] text-gray-300 font-bold">André M. Fernandes</p>
            </footer>
          </div>
        </div>
      )}

      {/* Formulário Admin Flutuante */}
      {mostrarForm && adminAtivo && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <form onSubmit={enviarTexto} className="bg-white border border-[#ece8e1] p-10 shadow-2xl max-w-xl w-full relative animate-in zoom-in duration-300">
            <button onClick={() => setMostrarForm(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black">✕</button>
            <h3 className="font-serif italic text-2xl mb-8 border-b pb-4">Nova Memória</h3>
            <input type="text" placeholder="Título" className="w-full text-lg font-serif mb-6 border-b border-[#f0eee9] pb-2 outline-none focus:border-[#8c7851] transition-all" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-2 gap-6 mb-6">
              <input type="date" className="bg-[#fdfbf7] p-3 text-[10px] outline-none border border-transparent focus:border-[#ece8e1]" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              <input type="text" placeholder="URL da Imagem" className="bg-[#fdfbf7] p-3 text-[10px] outline-none border border-transparent focus:border-[#ece8e1]" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
            </div>
            <textarea placeholder="Escrever fragmento..." className="w-full h-56 border-t border-[#f0eee9] pt-4 outline-none italic text-base resize-none leading-relaxed" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" className="w-full bg-black text-white py-4 uppercase tracking-[0.2em] text-[9px] font-bold hover:bg-[#8c7851] transition-all">
              {carregando ? "A processar..." : "Lançar ao Mural"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
