import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Maximize2, Send, CornerDownLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { AIQueryResponse } from '../../types';
import { AIResponseRenderer } from '../ai/AIResponseRenderer';
import ReactMarkdown from 'react-markdown';

interface FloatingAIProps {
  onExpandToFull: (query?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const FloatingAI: React.FC<FloatingAIProps> = ({
  onExpandToFull,
  isOpen,
  onClose,
  onOpen,
}) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; response?: AIQueryResponse }[]>([
    {
      sender: 'assistant',
      text: 'Ask me anything about Lakra Khurd demographics, age cohorts, or spatial locations.',
      response: {
        answer: 'Ask me anything about Lakra Khurd demographics, age cohorts, or spatial locations.',
        visualizations: [],
        suggestedFollowUps: ['Who is the oldest person?', 'Which family is the largest?'],
      },
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (q?: string) => {
    const text = (q || inputQuery).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.queryAI(text);
      setMessages((prev) => [...prev, { sender: 'assistant', text: res.answer, response: res }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Error retrieving analysis. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="floating-ai-trigger-btn"
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
          title="Ask Village AI Analyst"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="text-xs font-bold pr-1 hidden sm:inline">Ask AI Analyst</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping absolute top-1 right-1" />
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div
          id="floating-ai-drawer"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">AI Demographic Analyst</h4>
                <p className="text-[10px] text-emerald-400 font-medium">Gemini 3.7 & Relational DB</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  onClose();
                  onExpandToFull(inputQuery);
                }}
                title="Expand to Full Screen"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Drawer"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick chip bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSend('Who is the oldest person?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 whitespace-nowrap"
            >
              Oldest Person
            </button>
            <button
              onClick={() => handleSend('Which family is the largest?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 whitespace-nowrap"
            >
              Largest Family
            </button>
            <button
              onClick={() => handleSend('Show houses near house 20.')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 whitespace-nowrap"
            >
              Houses Near #20
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-xl text-xs max-w-[90%] ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  <div className="prose prose-xs max-w-none text-current">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  {m.response?.visualizations && (
                    <AIResponseRenderer visualizations={m.response.visualizations} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 p-2 bg-white border border-slate-200 rounded-xl max-w-[80%]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Analyzing village records...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-1.5"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-xs bg-slate-100 border-0 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
