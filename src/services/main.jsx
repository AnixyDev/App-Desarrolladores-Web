import { useState } from 'react';
import { askGemini } from './services/gemini';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // Guardamos el historial
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await askGemini(input);
      setMessages((prev) => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error: No se pudo conectar con la API.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 md:p-8">
      <header className="max-w-4xl mx-auto w-full mb-8">
        <h1 className="text-2xl font-bold text-blue-400">DevFreelancer AI Auditor</h1>
        <p className="text-slate-400 text-sm">Conectado a Gemini 1.5 Flash</p>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full bg-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-700">
        {/* Área de Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700 border border-slate-600'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && <div className="text-blue-400 animate-pulse text-sm">Gemini está procesando...</div>}
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Haz una consulta técnica..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;