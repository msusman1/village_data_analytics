import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { AIQueryResponse } from '../types';
import { AIResponseRenderer } from '../components/ai/AIResponseRenderer';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  MapPin,
  Users,
  Home,
  UserCheck,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AIQueryResponse;
  timestamp: string;
}

const PRESET_QUERIES = [
  {
    category: 'Age & Demographics',
    icon: Calendar,
    queries: [
      'Who is the oldest person?',
      'Who is the youngest person?',
      'Who is 18 years old?',
      'Who will turn 18 this year?',
      'Whose birthday is this month?',
      'How many children are under 5?',
      'How many children are under 10?',
      'What percentage of the village is under 18?',
      'Show everyone above 60.',
      'What is the average age?',
    ],
  },
  {
    category: 'Families & Lineage',
    icon: Users,
    queries: [
      'Which family is the largest?',
      'Show families with more than 8 people.',
      'Show families with more than 3 children.',
      'Which family has the highest average age?',
      'What is the average family size?',
    ],
  },
  {
    category: 'Houses & Compounds',
    icon: Home,
    queries: [
      'Which house has the most people?',
      'How many families are in house 20?',
      'What is the location of house 20?',
      'Show houses with more than 3 families.',
      'Show all families on Parcel ID 60116.',
    ],
  },
  {
    category: 'Guardians & Contacts',
    icon: UserCheck,
    queries: [
      'List all guardians.',
      'Which guardians do not have phone numbers?',
      'Find the guardian of Muhammad Imran Malhi’s family.',
      'What is the phone number of guardian Rizwan Malhi?',
      'Where does Rizwan Malhi live?',
      'Rizwan Malhi',
    ],
  },
  {
    category: 'GIS & Proximity',
    icon: MapPin,
    queries: [
      'Show houses within 500 meters of house 20.',
      'Show houses within 1 kilometer of house 20.',
    ],
  },
];

interface AIAssistantViewProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  initialQuery: propInitialQuery,
  onClearInitialQuery,
}) => {
  const location = useLocation();
  const stateInitialQuery = location.state?.initialQuery;
  const initialQuery = propInitialQuery || stateInitialQuery;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI Data Analyst for **Lakra Khurd**. You can ask me any question about village demographics, age groups, families, guardians, houses, or geospatial proximity.',
      response: {
        answer:
          'Hello! I am your AI Data Analyst for **Lakra Khurd**. You can ask me any question about village demographics, age groups, families, guardians, houses, or geospatial proximity.',
        visualizations: [],
        suggestedFollowUps: [
          'Who is the oldest person?',
          'Which family is the largest?',
          'Show houses within 500 meters of house 20.',
          'Find the guardian of Muhammad Imran Malhi’s family.',
        ],
      },
      timestamp: 'Now',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && initialQuery !== '') {
      handleSend(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
      // Clear the location state so it doesn't re-run on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [initialQuery]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // Build conversation history for API
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        }));

      const res = await api.queryAI(text, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, an error occurred while analyzing the query: ${err.message || 'Unknown error'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history reset. How can I help you analyze Lakra Khurd village data?',
        response: {
          answer: 'Chat history reset. How can I help you analyze Lakra Khurd village data?',
          visualizations: [],
          suggestedFollowUps: [
            'Who is the oldest person?',
            'Which family is the largest?',
            'Show houses near house 20.',
          ],
        },
        timestamp: 'Now',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-6xl mx-auto space-y-4">
      {/* Preset Query Chips Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Curated Analytical Questions</span>
          </div>
          <button
            onClick={handleResetChat}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset Chat
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {PRESET_QUERIES.flatMap((cat) => cat.queries.slice(0, 2)).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 space-y-6 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-white font-semibold text-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isUser ? 'YOU' : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble & Rich Visualizer */}
              <div className={`max-w-3xl min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="prose prose-sm max-w-none text-current prose-p:leading-relaxed prose-strong:text-current">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Disambiguation Clarification Chips */}
                  {msg.response?.clarificationOptions && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        Select a person to view their details:
                      </p>
                      <div className="space-y-1.5">
                        {msg.response.clarificationOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleSend(`Show details for ${opt.label}`)}
                            className="w-full text-left p-2 rounded-lg bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200/80 transition-colors flex flex-col"
                          >
                            <span className="text-xs font-semibold text-emerald-900">
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="text-[11px] text-emerald-700">
                                {opt.description}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Adaptive Visualizations (KPI, Table, Chart, Map) */}
                  {msg.response?.visualizations && (
                    <AIResponseRenderer visualizations={msg.response.visualizations} />
                  )}

                  {/* Suggested Follow-Up Prompts */}
                  {msg.response?.suggestedFollowUps && msg.response.suggestedFollowUps.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Suggested Follow-Up Queries:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.response.suggestedFollowUps.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSend(prompt)}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 transition-colors"
                          >
                            &rarr; {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1 block">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs text-xs text-slate-500 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Querying Lakra Khurd demographic records & synthesizing answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs flex items-center space-x-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            id="ai-query-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything (e.g. 'Who is the oldest person?', 'Where does Rizwan Malhi live?', 'Show houses within 500m of House 20')..."
            className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent border-0 focus:outline-hidden text-slate-900 placeholder:text-slate-400"
            disabled={loading}
          />
        </div>

        <button
          id="ai-send-btn"
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
