
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, GroundingSource } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSources([]);

    const result = await geminiService.askDroneQuestion(input);
    
    const modelMsg: ChatMessage = { role: 'model', text: result.text, timestamp: new Date() };
    setMessages(prev => [...prev, modelMsg]);
    setSources(result.sources);
    setLoading(false);
  };

  return (
    <div className="container max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[700px] flex flex-col">
        {/* Chat Header */}
        <div className="bg-caaslNavy text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-caaslBlue flex items-center justify-center">
              <i className="fa fa-robot text-lg"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold m-0 leading-tight">CAASL Smart Drone Assistant</h3>
              <p className="text-[10px] text-blue-300 m-0">Powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([])}
            className="text-xs text-gray-300 hover:text-white bg-white/10 px-2 py-1 rounded"
          >
            Clear Chat
          </button>
        </div>

        {/* Chat Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center mt-20">
              <i className="fa fa-paper-plane text-4xl text-gray-200 mb-4"></i>
              <p className="text-gray-500 font-medium">Ask me about drone laws in Sri Lanka</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 px-8">
                {["Can I fly near BIA?", "Registering a DJI Mini 3", "Category B rules"].map(suggest => (
                  <button 
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full hover:bg-caaslBlue hover:text-white transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate__animated animate__fadeInUp animate__faster`}>
              <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                m.role === 'user' ? 'bg-caaslBlue text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[9px] mt-1 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 animate__animated animate__fadeIn">
              <p className="text-[10px] font-bold text-blue-800 uppercase mb-2">Sources Found:</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, idx) => (
                  <a 
                    key={idx}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                  >
                    <i className="fa fa-link"></i> {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-caaslBlue"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-caaslBlue text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-caaslNavy transition-colors disabled:opacity-50"
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 italic">
            Disclaimer: AI responses are for guidance only. Refer to current CAASL Gazette for official laws.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
