import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, GroundingSource } from '../types';

const SUGGESTIONS = [
  'Can I fly near BIA airport?',
  'How do I register a DJI Mini 3?',
  'What are Category B rules?',
  'Commercial photography permit process',
];

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
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSources([]);

    const result = await geminiService.askDroneQuestion(text);

    setMessages(prev => [...prev, { role: 'model', text: result.text, timestamp: new Date() }]);
    setSources(result.sources);
    setLoading(false);
  };

  const handleClear = () => {
    setMessages([]);
    setSources([]);
    geminiService.clearHistory();
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[700px] flex flex-col">
        {/* Header */}
        <div className="bg-[#030f27] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1388d1] flex items-center justify-center">
              <i className="fa fa-robot text-lg"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold m-0 leading-tight">CAASL Smart Drone Assistant</h3>
              <p className="text-[10px] text-blue-300 m-0">Powered by Gemini AI · Google Search Grounded</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-gray-300 hover:text-white bg-white/10 px-3 py-1 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center mt-16">
              <i className="fa fa-paper-plane text-5xl text-gray-200 mb-4 block"></i>
              <p className="text-gray-500 font-medium mb-2">Ask me about drone regulations in Sri Lanka</p>
              <p className="text-gray-400 text-xs mb-6">Answers are grounded with live Google Search results</p>
              <div className="flex flex-wrap justify-center gap-2 px-8">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-[#1388d1] hover:text-white hover:border-[#1388d1] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1388d1] text-white rounded-tr-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                }`}
              >
                {m.text}
                <p className={`text-[9px] mt-1 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 shadow-sm">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {sources.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1"
                  >
                    <i className="fa fa-link text-[8px]"></i> {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about drone laws, permits, restricted zones..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1388d1]"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-[#1388d1] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#030f27] transition-colors disabled:opacity-40 border-none cursor-pointer shadow-md"
            >
              <i className="fa fa-paper-plane text-sm"></i>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2 italic">
            AI responses are for guidance only. Refer to official CAASL Gazette for legal matters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
