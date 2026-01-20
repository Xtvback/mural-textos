import React, { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { PlusCircle, Image as ImageIcon, Calendar, Search, Loader2, Trash2, Edit, Lock, Unlock } from "lucide-react"

// A tua senha secreta personalizada
const PALAVRA_PASSE_MESTRE = "23872387" 

function App() {
  const [textos, setTextos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [idSendoEditado, setIdSendoEditado] = useState(null)
  const [adminAtivo, setAdminAtivo] = useState(false)
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
        const docRef = doc(db, "textos", idSendoEditado)
        await updateDoc(docRef, { ...novoTexto })
        setIdSendoEditado(null)
      } else {
        await addDoc(collection(db, "textos"), {
          ...novoTexto,
          criadoEm: new Date()
        })
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
    if (window.confirm("Tens a certeza que queres eliminar este registo para sempre?")) {
      try {
        await deleteDoc(doc(db, "textos", id))
      } catch (error) {
        alert("Erro ao eliminar")
      }
    }
  }

  const prepararEdicao = (t) => {
    setNovoTexto({
      titulo: t.titulo,
      conteudo: t.conteudo,
      imagemUrl: t.imagemUrl || "",
      dataManual: t.dataManual
    })
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
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 font-sans text-gray-900">
      <header className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif italic text-gray-900 leading-tight">Onde o Silêncio não Chega</h1>
            <p className="text-gray-500 mt-4 font-light tracking-wide">André M. Fernandes</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fazerLogin}
              className={`p-3 rounded-full transition shadow-sm ${adminAtivo ? "bg-green-100 text-green-700" : "bg-white text-gray-400 hover:text-gray-600"}`}
              title={adminAtivo ? "Modo Editor Ativo" : "Login de Administrador"}
            >
              {adminAtivo ? <Unlock size={20} /> : <Lock size={20} />}
            </button>
            {adminAtivo && (
              <button 
                onClick={() => {
                  setMostrarForm(!mostrarForm)
                  setIdSendoEditado(null)
                  if (!mostrarForm) setNovoTexto({ titulo: "", conteudo: "", imagemUrl: "", dataManual: new Date().toISOString().split("T")[0] })
                }} 
                className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-3 text-sm hover:bg-gray-800 transition shadow-lg"
              >
                <PlusCircle size={18} /> {mostrarForm ? "Cancelar" : "Criar Novo Registo"}
              </button>
            )}
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Pesquisar no arquivo..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-full text-sm outline-none shadow-sm focus:border-gray-300 transition" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {mostrarForm && adminAtivo && (
          <form onSubmit={enviarTexto} className="mb-12 bg-white p-8 border border-gray-100 shadow-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-6">{idSendoEditado ? "A Editar Registo" : "Novo Registo"}</h3>
            <input type="text" placeholder="Título..." className="w-full text-2xl font-serif mb-6 outline-none border-b border-gray-100 pb-2 focus:border-black transition" value={novoTexto.titulo} onChange={(e) => setNovoTexto({...novoTexto, titulo: e.target.value})} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input type="date" className="bg-gray-50 p-3 rounded text-sm text-gray-600 outline-none" value={novoTexto.dataManual} onChange={(e) => setNovoTexto({...novoTexto, dataManual: e.target.value})} required />
              <input type="text" placeholder="URL da imagem (opcional)" className="bg-gray-50 p-3 rounded text-sm text-gray-600 outline-none" value={novoTexto.imagemUrl} onChange={(e) => setNovoTexto({...novoTexto, imagemUrl: e.target.value})} />
            </div>
            <textarea placeholder="Escreve o teu texto..." className="w-full h-48 outline-none text-gray-600 italic border-t border-gray-50 pt-4 mb-4 resize-none leading-relaxed" value={novoTexto.conteudo} onChange={(e) => setNovoTexto({...novoTexto, conteudo: e.target.value})} required />
            <button type="submit" disabled={carregando} className="w-full bg-gray-900 text-white py-4 rounded hover:bg-black transition flex justify-center items-center gap-2 uppercase tracking-widest text-xs">
              {carregando ? <Loader2 className="animate-spin" size={18} /> : (idSendoEditado ? "Guardar Alterações" : "Publicar no Mural")}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {textosFiltrados.map((t) => (
            <article key={t.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative">
              {adminAtivo && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => prepararEdicao(t)} className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-gray-600">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => apagarTexto(t.id)} className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {t.imagemUrl && (
                <div className="h-64 overflow-hidden border-b border-gray-50">
                  <img src={t.imagemUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" onError={(e) => e.target.style.display = "none"} />
                </div>
              )}
              <div className="p-8 flex-grow">
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Calendar size={12} /> {formatarDataExibicao(t.dataManual)}
                </div>
                <h2 className="text-2xl font-serif italic mb-6 text-gray-800 leading-snug">{t.titulo}</h2>
                <p className="text-gray-600 font-light whitespace-pre-wrap italic leading-relaxed">{t.conteudo}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
