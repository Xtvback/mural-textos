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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e1d8] font-sans selection:bg-[#a68b5b] selection:text-white">
      <audio ref={audioRef} src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" loop />

      {/* Botão de Som Imersivo */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-center gap-4">
        <span className={`text-[8px] uppercase tracking-[0.6em] font-bold transition-all duration-700 ${aTocar ? "text-[#a68b5b] opacity-100" : "text-white opacity-40 animate-pulse"}`}>
          {aTocar ? "Atmosfera Ativa" : "Entrar no Ambiente"}
        </span>
        <button 
          onClick={toggleMusica} 
          className={`w-16 h-16 border flex items-center justify-center transition-all duration-700 rounded-full ${aTocar ? "border-[#a68b5b] bg-transparent text-[#a68b5b] shadow-[0_0_20px_rgba(166,139,91,0.2)]" : "border-zinc-800 bg-white text-black hover:scale-110"}`}
        >
          {aTocar ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Navegação Superior - Dark Mode */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl z-50 border-b border-zinc-900 px-10 py-5">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Feather size={16} className="text-[#a68b5b]" />
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-[#e5e1d8]">A. M. Fernandes</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="https://www.instagram.com/andre.f.m.fernandes/" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-[#a68b5b] transition-all">
              <Instagram size={18} />
            </a>
            <button onClick={fazerLogin} className="text-zinc-700 hover:text-zinc-400 transition-colors">
              {adminAtivo ? <Unlock size={18} /> : <Lock size={18} />}
            </button>
            {adminAtivo && (
              <button onClick={() => { setMostrarForm(!mostrarForm); setIdSendoEditado(null); }} className="text-[10px] uppercase tracking-[0.4em] font-bold bg-[#a68b5b] text-white px-6 py-2">
                Novo Fragmento
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Cabeçalho Editorial Profundo */}
      <header className="pt-52 pb-32 px-10 border-b border-zinc-900">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <span className="text-[10px] uppercase tracking-[0.8em] text-[#a68b5b] font-bold block mb-10">Onde o Silêncio não Chega</span>
            <h1 className="text-6xl md:text-9xl font-serif italic mb-10 tracking-tighter leading-none text-white">
              Arquivos da Memória
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="text-xl font-serif italic text-zinc-500 leading-relaxed border-l border-zinc-800 pl-8">
              Um registo contínuo de fragmentos, onde André M. Fernandes explora a fronteira entre o que é dito e o que permanece na sombra.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-10 grid grid-cols-1 lg:grid-cols-12 gap-20 py-32">
        
        {/* Cronologia Lateral com Contorno */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-40 space-y-16">
            <div className="border border-zinc-900 p-8">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-600 mb-10 flex items-center gap-2">
                <Clock size={14} /> Cronologia
              </h3>
              <div className="space-y-12">
                {anosOrdenados.map(ano => (
                  <div key={ano} className="space-y-6">
                    <div className="text-sm font-bold uppercase tracking-widest text-[#a68b5b] border-b border-zinc-900 pb-3">
                      {ano}
                    </div>
                    <ul className="space-y-4">
                      {Object.keys(estatisticas[ano]).sort((a,b) => b-a).map(mes => (
                        <li key={mes}>
                          <button 
                            onClick={() => setMesFiltro(mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? null : { mes: parseInt(mes), ano: parseInt(ano) })}
                            className={`flex justify-between w-full text-[10px] uppercase tracking-[0.2em] transition-all ${mesFiltro?.mes === parseInt(mes) && mesFiltro?.ano === parseInt(ano) ? "text-white font-bold pl-3 border-l-2 border-[#a68b5b]" : "text-zinc-500 hover:text-white"}`}
                          >
                            <span>{nomesMeses[mes]}</span>
                            <span className="opacity-30">[{estatisticas[ano][mes]}]</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative border border-zinc-900 p-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
              <input type="text" placeholder="Pesquisar no arquivo..." className="w-full bg-transparent border-none pl-10 text-xs outline-none italic font-serif text-white placeholder:text-zinc-800" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>
          </div>
        </aside>

        {/* Mural de Fragmentos - Design de Galeria Noir */}
        <main className="lg:col-span-9">
          <div className="columns-1 md:columns-2 gap-12 space-y-12">
            {textosFiltrados.map((t) => (
              <article key={t.id} className="break-inside-avoid bg-[#111111] border border-zinc-900 p-10 transition-all duration-700 group relative hover:border-[#a68b5b]/30 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                {adminAtivo && (
                  <div className="absolute top-6 right-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setIdSendoEditado(t.id); setNovoTexto({titulo: t.titulo, conteudo: t.conteudo, imagemUrl: t.imagemUrl || "", dataManual: t.dataManual}); setMostrarForm(true); }} className="text-zinc-600 hover:text-[#a68b5b]"><Edit size={16} /></button>
                    <button onClick={() => apagarTexto(t.id)} className="text-zinc-800 hover:text-red-900"><Trash2 size={16} /></button>
                  </div>
                )}
                {t.imagemUrl && (
                  <div className="mb-10 overflow-hidden bg-black border border-zinc-900">
                    <img src={t.imagemUrl} alt="" className="w-full h-auto grayscale opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.5s]" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-[1px] w-6 bg-[#a68b5b]"></div>
                  <div className="text-[9px] text-[#a68b5b] uppercase tracking-[0.4em] font-bold">{formatarDataExibicao(t.dataManual)}</div>
                </div>
                <h2 className="text-3xl font-serif italic text-white mb-10 leading-[1.1]">{t.titulo}</h2>
                <button onClick={() => setTextoAberto(t)} className="w-full py-5 border-t border-zinc-900 text-[9px] uppercase tracking-[0.5em] font-bold text-zinc-600 group-hover:text-white transition-all flex items-center justify-between">
                  Explorar Fragmento <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* Leitura Solene */}
      {textoAberto && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex justify-center items-start overflow-y-auto p-4 md:p-24 animate-in fade-in duration-700">
          <div className="max-w-4xl w-full bg-[#111111] border border-zinc-900 relative p-12 md:p-24 shadow-2xl">
            <button onClick={() => setTextoAberto(null)} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-all">
              <X size={32} />
            </button>
            <header className="mb-24">
              <div className="text-[10px] text-[#a68b5b] uppercase tracking-[0.6em] mb-10 font-bold text-center">{formatarDataExibicao(textoAberto.dataManual)}</div>
              <h1 className="text-5xl md:text-8xl font-serif italic mb-16 leading-none text-white text-center">{textoAberto.titulo}</h1>
              {textoAberto.imagemUrl && <img src={textoAberto.imagemUrl} alt="" className="w-full h-auto grayscale opacity-80 border border-zinc-800" />}
            </header>
            <div className="max-w-2xl mx-auto">
              <p className="text-[#cccccc] font-serif italic text-xl md:text-3xl leading-[1.8] whitespace-pre-wrap">
                {textoAberto.conteudo}
              </p>
            </div>
            <footer className="mt-32 pt-16 border-t border-zinc-900 text-center">
              <Feather size={24} className="mx-auto text-[#a68b5b] mb-8" />
              <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-600 font-bold">André M. Fernandes</p>
            </footer>
          </div>
        </div>
      )}

      {/* Rodapé de Assinatura */}
      <footer className="bg-black border-t border-zinc-900 py-40 px-10">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-serif italic text-white mb-4 tracking-tighter">Onde o Silêncio não Chega</h2>
            <p className="text-zinc-700 text-[10px] uppercase tracking-[0.6em] font-bold">Direitos Reservados • MMXXVI</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-10">
            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600">Conectar com o Autor</span>
            <a 
              href="https://www.instagram.com/andre.f.m.fernandes/" 
              target="_blank" 
              rel="noreferrer"
              className="group flex items-center gap-6 border border-zinc-800 px-12 py-6 hover:bg-[#a68b5b] hover:border-[#a68b5b] transition-all duration-700"
            >
              <Instagram size={24} className="group-hover:text-white transition-colors" />
              <span className="text-xs uppercase tracking-[0.3em] font-bold group-hover:text-white">Instagram Oficial</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Painel Administrativo Moderno */}
      {mostrarForm && adminAtivo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[110] flex items-center justify-center p-6">
          <form onSubmit={enviarTexto} className="bg-[#111111] border border-zinc-800 p-16 shadow-2xl max-w-2xl w-full relative">
            <button onClick={() => setMostrarForm(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white">✕</button>
            <h3 className="font-serif italic text-4xl text-white mb-16 border-b border-zinc-900 pb-8 tracking-tighter text-center">Nova Inscrição</h3>
            <input type="text" placeholder="Título do fragmento" className="w-full text-2xl font-serif mb-12 border-b border-zinc-900 pb-4 outline-none focus:border-[#a68b5b] transition-all bg-transparent text-white" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-widest text-zinc-600">Data de Registo</label>
                <input type="date" className="w-full bg-black border border-zinc-900 p-4 text-xs text-white outline-none focus:border-[#a68b5b]" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              </div>
              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-widest text-zinc-600">Ligação de Imagem</label>
                <input type="text" placeholder="URL" className="w-full bg-black border border-zinc-900 p-4 text-xs text-white outline-none focus:border-[#a68b5b]" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
              </div>
            </div>
            <textarea placeholder="O que o silêncio dita agora..." className="w-full h-72 border-t border-zinc-900 pt-8 outline-none italic text-xl resize-none leading-relaxed bg-transparent text-zinc-400" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" className="w-full bg-[#a68b5b] text-white py-6 uppercase tracking-[0.4em] text-[10px] font-bold hover:bg-white hover:text-black transition-all">Registar para a Eternidade</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
