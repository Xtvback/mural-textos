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
    <div className="min-h-screen bg-[#f7f5f0] text-[#2d2a26] font-sans">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Botão de Som Flutuante e Inesquecível */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
        {!aTocar && (
          <span className="bg-black text-white text-[9px] uppercase tracking-widest px-3 py-1 animate-bounce">
            Ouvir o Arquivo
          </span>
        )}
        <button 
          onClick={toggleMusica} 
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${aTocar ? "bg-[#8c7851] text-white" : "bg-black text-white hover:scale-110"}`}
        >
          {aTocar ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Navegação Superior */}
      <nav className="fixed top-0 w-full bg-[#f7f5f0]/80 backdrop-blur-md z-50 border-b border-[#e8e4d9] px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Feather size={14} className="text-[#8c7851]" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8c7851]">A. M. Fernandes</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/andre.f.m.fernandes/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-black transition-colors">
              <Instagram size={18} />
            </a>
            <button onClick={fazerLogin} className="text-gray-300 hover:text-gray-500 transition-colors">
              {adminAtivo ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="text-[9px] uppercase tracking-widest font-bold bg-black text-white px-4 py-2 rounded-full">
                Escrever
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Cabeçalho de Autor */}
      <header className="pt-40 pb-24 px-8 bg-white border-b border-[#e8e4d9]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-serif italic mb-8 tracking-tighter leading-tight text-[#1a1a1a]">
              Onde o Silêncio não Chega
            </h1>
            <p className="text-xl md:text-2xl font-serif italic text-[#8c7851] leading-relaxed">
              O repositório de fragmentos, memórias e pensamentos onde André M. Fernandes procura a voz do que permanece calado.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 py-20">
        
        {/* Cronologia */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-32 space-y-12">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-300 mb-8 flex items-center gap-2">
                <Clock size={12} /> O Tempo
              </h3>
              <div className="space-y-8">
                {anosOrdenados.map(ano => (
                  <div key={ano} className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-[#e8e4d9] pb-2">
                      {ano}
                    </div>
                    <ul className="space-y-3 pl-2">
                      {Object.keys(estatisticas[ano]).sort((a,b) => b-a).map(mes => (
                        <li key={mes}>
                          <button 
                            onClick={() => setMesFiltro(mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? null : { mes: parseInt(mes), ano: parseInt(ano) })}
                            className={`text-[10px] uppercase tracking-widest transition-all ${mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? "text-[#8c7851] font-bold" : "text-gray-400 hover:text-black"}`}
                          >
                            {nomesMeses[mes]} <span className="text-[8px] opacity-30">({estatisticas[ano][mes]})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-[#e8e4d9]">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input type="text" placeholder="Pesquisar no mural..." className="w-full bg-transparent border-none pl-6 text-sm outline-none italic font-serif placeholder:text-gray-200" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
              </div>
            </div>
          </div>
        </aside>

        {/* Mural de Fragmentos */}
        <main className="lg:col-span-9">
          <div className="columns-1 md:columns-2 gap-10 space-y-10">
            {textosFiltrados.map((t) => (
              <article key={t.id} className="break-inside-avoid bg-white border border-[#e8e4d9] p-8 transition-all duration-500 group relative shadow-sm hover:shadow-2xl">
                {adminAtivo && (
                  <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setIdSendoEditado(t.id); setNovoTexto({titulo: t.titulo, conteudo: t.conteudo, imagemUrl: t.imagemUrl || "", dataManual: t.dataManual}); setMostrarForm(true); }} className="text-gray-300 hover:text-black"><Edit size={14} /></button>
                    <button onClick={() => apagarTexto(t.id)} className="text-red-100 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                )}
                {t.imagemUrl && (
                  <div className="mb-8 overflow-hidden bg-gray-50">
                    <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000" />
                  </div>
                )}
                <div className="text-[9px] text-[#8c7851] uppercase tracking-[0.3em] mb-4 font-bold">{formatarDataExibicao(t.dataManual)}</div>
                <h2 className="text-2xl font-serif italic text-[#1a1a1a] mb-8 leading-tight">{t.titulo}</h2>
                <button onClick={() => setTextoAberto(t)} className="w-full py-4 border-t border-[#f7f5f0] text-[9px] uppercase tracking-[0.4em] font-bold text-gray-300 hover:text-[#8c7851] transition-colors flex items-center justify-between">
                  Abrir Fragmento <ArrowRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* Leitura Imersiva */}
      {textoAberto && (
        <div className="fixed inset-0 bg-[#f7f5f0] z-[100] flex justify-center items-start overflow-y-auto p-4 md:p-20 animate-in fade-in duration-500">
          <div className="max-w-2xl w-full bg-white border border-[#e8e4d9] shadow-2xl relative p-10 md:p-20">
            <button onClick={() => setTextoAberto(null)} className="absolute top-10 right-10 text-gray-300 hover:text-black transition-colors">
              <X size={24} />
            </button>
            <header className="mb-20 text-center">
              <div className="text-[10px] text-[#8c7851] uppercase tracking-[0.5em] mb-8 font-bold">{formatarDataExibicao(textoAberto.dataManual)}</div>
              <h1 className="text-4xl md:text-6xl font-serif italic mb-12 leading-tight">{textoAberto.titulo}</h1>
              {textoAberto.imagemUrl && <img src={textoAberto.imagemUrl} alt="" className="w-full h-auto grayscale shadow-xl" />}
            </header>
            <p className="text-[#3a3733] font-serif italic text-xl md:text-2xl leading-[2.2] whitespace-pre-wrap">
              {textoAberto.conteudo}
            </p>
            <footer className="mt-24 pt-12 border-t border-[#f7f5f0] text-center">
              <p className="text-[10px] uppercase tracking-[0.6em] text-[#8c7851] font-bold">André M. Fernandes</p>
            </footer>
          </div>
        </div>
      )}

      {/* Contacto e Rodapé */}
      <footer className="bg-[#1a1a1a] text-[#f7f5f0] py-32 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-serif italic mb-4">Onde o Silêncio não Chega</h2>
            <p className="text-gray-500 text-xs uppercase tracking-[0.5em]">Um arquivo por André M. Fernandes</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Contactar o Autor</span>
            <a 
              href="https://www.instagram.com/andre.f.m.fernandes/" 
              target="_blank" 
              rel="noreferrer"
              className="group flex items-center gap-4 border border-gray-800 px-8 py-4 rounded-full hover:bg-[#8c7851] hover:border-[#8c7851] transition-all duration-500"
            >
              <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Instagram</span>
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-gray-900 text-center">
          <p className="text-[8px] uppercase tracking-[0.8em] text-gray-700">© 2026 • Todos os direitos reservados</p>
        </div>
      </footer>

      {/* Formulário Admin */}
      {mostrarForm && adminAtivo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={enviarTexto} className="bg-white border border-[#e8e4d9] p-12 shadow-2xl max-w-xl w-full relative">
            <button onClick={() => setMostrarForm(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black">✕</button>
            <h3 className="font-serif italic text-3xl mb-12 border-b border-[#f7f5f0] pb-6">Novo Registo</h3>
            <input type="text" placeholder="Título da memória" className="w-full text-2xl font-serif mb-8 border-b border-[#f7f5f0] pb-4 outline-none focus:border-[#8c7851] transition-all bg-transparent" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-2 gap-8 mb-8">
              <input type="date" className="bg-[#f7f5f0] p-4 text-[10px] outline-none" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              <input type="text" placeholder="URL da Imagem" className="bg-[#f7f5f0] p-4 text-[10px] outline-none" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
            </div>
            <textarea placeholder="O silêncio aqui diz..." className="w-full h-64 border-t border-[#f7f5f0] pt-6 outline-none italic text-lg resize-none leading-relaxed bg-transparent" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" className="w-full bg-black text-white py-5 uppercase tracking-[0.3em] text-[10px] font-bold hover:bg-[#8c7851] transition-all">Lançar ao Mural</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
