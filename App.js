import React, { useState, useEffect, useRef } from "react"
import { Plus, Calendar, Trash2, BookOpen, X, ImageIcon, ArrowRight, Edit2, Feather, Music, Info, Play, Pause, Volume2, Loader2 } from "lucide-react"
import { initializeApp } from "firebase/app"
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  deleteDoc, 
  addDoc,
  updateDoc
} from "firebase/firestore"
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth"

// Configuração do Firebase injetada pelo ambiente
const firebaseConfig = JSON.parse(__firebase_config)
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const appId = typeof __app_id !== "undefined" ? __app_id : "mural-xtvback"

export default function App() {
  const [user, setUser] = useState(null)
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedText, setSelectedText] = useState(null)
  const [editId, setEditId] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  
  // Estados da Música
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const audioRef = useRef(null)
  
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])

  // Regra 3: Autenticação antes de qualquer operação
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token)
        } else {
          await signInAnonymously(auth)
        }
      } catch (error) {
        console.error("Erro na autenticação")
      }
    }
    initAuth()
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  // Regra 1 e 2: Carregamento de dados com caminho estrito e ordenação em memória
  useEffect(() => {
    if (!user) return

    const textsCollection = collection(db, "artifacts", appId, "public", "data", "texts")
    
    const unsubscribe = onSnapshot(
      textsCollection,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Ordenação manual para evitar necessidade de índices complexos no Firebase
        const sortedDocs = docs.sort((a, b) => new Date(b.date) - new Date(a.date))
        setTexts(sortedDocs)
        setLoading(false)
      },
      (error) => {
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Lógica do Áudio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      const progress = (audio.currentTime / audio.duration) * 100
      setAudioProgress(progress)
    }

    audio.addEventListener("timeupdate", updateProgress)
    return () => audio.removeEventListener("timeupdate", updateProgress)
  }, [])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => console.log("Interação necessária"))
    }
    setIsPlaying(!isPlaying)
  }

  const handleOpenNew = () => {
    setEditId(null)
    setNewTitle("")
    setNewContent("")
    setNewImageUrl("")
    setNewDate(new Date().toISOString().split("T")[0])
    setErrorMessage("")
    setIsAdding(true)
  }

  const handleEdit = (text) => {
    setEditId(text.id)
    setNewTitle(text.title)
    setNewContent(text.content)
    setNewImageUrl(text.imageUrl === "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000" ? "" : text.imageUrl)
    setNewDate(text.date.split("T")[0])
    setErrorMessage("")
    setIsAdding(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Verificações básicas antes de tentar guardar
    if (!user) {
      setErrorMessage("Utilizador não autenticado. Por favor, aguarda um momento.")
      return
    }
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMessage("Por favor, preenche o título e o conteúdo.")
      return
    }

    setIsSaving(true)
    setErrorMessage("")

    // Normalização da data para evitar problemas de fuso horário no browser
    const finalDate = new Date(newDate + 'T12:00:00').toISOString()
    
    const entryData = {
      title: newTitle.trim(),
      content: newContent.trim(),
      imageUrl: newImageUrl.trim() || "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000",
      date: finalDate,
      userId: user.uid
    }

    try {
      const textsCollection = collection(db, "artifacts", appId, "public", "data", "texts")
      
      if (editId) {
        const textDoc = doc(db, "artifacts", appId, "public", "data", "texts", editId)
        await updateDoc(textDoc, entryData)
        if (selectedText && selectedText.id === editId) {
          setSelectedText({ id: editId, ...entryData })
        }
      } else {
        await addDoc(textsCollection, entryData)
      }

      // Limpeza após sucesso
      setNewTitle("")
      setNewContent("")
      setNewImageUrl("")
      setEditId(null)
      setIsAdding(false)
    } catch (error) {
      console.error("Erro ao guardar no Firebase:", error)
      setErrorMessage("Ocorreu um erro ao guardar. Tenta novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!user) return

    try {
      const textDoc = doc(db, "artifacts", appId, "public", "data", "texts", id)
      await deleteDoc(textDoc)
      if (selectedText && selectedText.id === id) setSelectedText(null)
    } catch (error) {
      console.error("Erro ao apagar")
    }
  }

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("pt-PT", options)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <Feather className="w-10 h-10 text-zinc-200 animate-pulse" />
          <p className="text-zinc-400 font-light tracking-[0.4em] uppercase text-[9px]">A abrir o arquivo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col md:flex-row">
      
      <audio 
        ref={audioRef} 
        src="https://raw.githubusercontent.com/Xtvback/minha-primeira-app/main/Ambiente.mp3" 
        loop 
      />

      {/* Painel Lateral */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-zinc-100 flex flex-col md:h-screen sticky top-0 z-40 overflow-y-auto">
        <div className="p-10 flex flex-col h-full">
          <div className="mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 block mb-4">Arquivo Digital</span>
            <h1 className="text-4xl font-light italic tracking-tighter leading-none mb-2 text-zinc-900">
              Onde o Silêncio não Chega
            </h1>
            <p className="text-sm font-serif text-zinc-500 italic">André M. Fernandes</p>
          </div>

          <div className="space-y-8 flex-grow">
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 shadow-sm group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                  <Music size={14} className={isPlaying ? "animate-bounce" : ""} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Música do momento</span>
                  <span className="text-[10px] font-medium text-zinc-400">Ambiente de escrita</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm hover:scale-105 transition-all active:scale-95"
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </button>
                
                <div className="flex-grow flex flex-col gap-2">
                  <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-900 transition-all duration-300" 
                      style={{ width: `${audioProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{isPlaying ? "Em reprodução" : "Pausado"}</span>
                    <Volume2 size={10} className="text-zinc-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-zinc-100">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-zinc-300" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sobre</span>
              </div>
              <p className="text-[11px] font-serif leading-relaxed text-zinc-500 italic">
                Um espaço dedicado a tudo aquilo que as palavras conseguem traduzir e o silêncio não consegue conter. 
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-50 flex flex-col gap-4">
            <button 
              onClick={handleOpenNew}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-95"
            >
              <Plus size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Criar Novo Registo</span>
            </button>
            <p className="text-[8px] text-center font-bold text-zinc-300 uppercase tracking-[0.5em]">Arquivo de André M. Fernandes</p>
          </div>
        </div>
      </aside>

      {/* Galeria */}
      <main className="flex-grow p-6 md:p-12 lg:p-20 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">
            {texts.length === 0 ? (
              <div className="col-span-full py-40 text-center">
                <div className="w-16 h-px bg-zinc-200 mx-auto mb-8"></div>
                <p className="text-zinc-300 font-serif italic text-2xl">O arquivo aguarda a primeira nota.</p>
              </div>
            ) : (
              texts.map((text) => (
                <div 
                  key={text.id} 
                  onClick={() => setSelectedText(text)}
                  className="group cursor-pointer flex flex-col bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-8 bg-zinc-50 shadow-inner">
                    <img 
                      src={text.imageUrl} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt={text.title}
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000" }}
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/20">
                        <Calendar size={10} className="text-zinc-400" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                          {formatDate(text.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-light leading-tight mb-4 group-hover:italic transition-all duration-300">
                    {text.title}
                  </h3>
                  <p className="text-zinc-500 text-sm font-serif leading-relaxed line-clamp-3 mb-8 italic">
                    {text.content}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-zinc-50">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                      Explorar texto <ArrowRight size={10} />
                    </span>
                    <Feather size={14} className="text-zinc-100 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal de Escrita */}
      {isAdding && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[100] flex items-center justify-end p-0 md:p-8 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-white h-full md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="px-10 py-8 border-b border-zinc-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-light italic tracking-tight">
                  {editId ? "Ajustar o registo" : "Novo fragmento de memória"}
                </h2>
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-400">André M. Fernandes</span>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setEditId(null); setErrorMessage(""); }} 
                className="p-3 hover:bg-zinc-50 transition-colors rounded-full"
                disabled={isSaving}
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto flex-grow">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest">
                  {errorMessage}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Momento do registo</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-50 rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-zinc-100 transition-all text-sm border border-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Ligação visual</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                    <input 
                      type="text" 
                      placeholder="URL da imagem..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-zinc-50 rounded-xl px-5 py-3 pl-12 outline-none focus:ring-2 focus:ring-zinc-100 transition-all text-sm border border-zinc-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Título do Texto</label>
                <input 
                  type="text" 
                  placeholder="Dá um nome ao silêncio..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent py-4 outline-none border-b border-zinc-100 focus:border-zinc-900 transition-all text-3xl font-light tracking-tighter italic"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">O teu Conteúdo</label>
                <textarea 
                  placeholder="Onde o silêncio não chega, as palavras começam aqui..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full h-80 bg-transparent py-4 outline-none border-b border-zinc-100 focus:border-zinc-900 transition-all resize-none font-serif text-xl leading-relaxed italic"
                  required
                ></textarea>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-zinc-900 text-white font-bold py-5 rounded-2xl hover:bg-zinc-800 disabled:bg-zinc-400 transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-zinc-200 flex items-center justify-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      A guardar...
                    </>
                  ) : (
                    editId ? "Confirmar Alterações" : "Publicar no Mural"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leitura Imersiva */}
      {selectedText && (
        <div className="fixed inset-0 bg-white z-[80] overflow-y-auto animate-in slide-in-from-bottom-10 duration-700">
          <div className="max-w-4xl mx-auto px-8 py-20 md:py-32 relative">
            <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-[90] border-b border-zinc-50 flex items-center justify-between px-8 md:px-20">
              <button 
                onClick={() => setSelectedText(null)}
                className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                Regressar ao Mural
              </button>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleEdit(selectedText)}
                  className="text-zinc-400 hover:text-zinc-900 transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, selectedText.id)}
                  className="text-zinc-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </nav>

            <div className="flex flex-col items-center text-center mb-20 pt-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-px w-8 bg-zinc-100"></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.5em]">
                  {formatDate(selectedText.date)}
                </span>
                <div className="h-px w-8 bg-zinc-100"></div>
              </div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter mb-16 italic leading-tight text-zinc-900">
                {selectedText.title}
              </h2>
            </div>
            
            <div className="aspect-[21/9] mb-20 rounded-3xl overflow-hidden shadow-2xl border border-zinc-50">
              <img 
                src={selectedText.imageUrl} 
                className="w-full h-full object-cover shadow-inner"
                alt={selectedText.title}
              />
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="text-zinc-700 text-xl md:text-2xl lg:text-3xl leading-[2] whitespace-pre-wrap font-serif italic mb-32 selection:bg-zinc-100">
                {selectedText.content}
              </div>

              <div className="flex flex-col items-center text-center pt-20 border-t border-zinc-100">
                <Feather className="w-8 h-8 text-zinc-100 mb-8" />
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-300 mb-2">Registo de arquivo por</span>
                <span className="text-lg font-serif italic text-zinc-900">André M. Fernandes</span>
                <div className="mt-16">
                  <button 
                    onClick={() => setSelectedText(null)}
                    className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400 hover:text-zinc-900 flex items-center gap-4 transition-all hover:gap-8"
                  >
                    Voltar ao arquivo principal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
