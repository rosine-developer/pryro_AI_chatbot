import { useState, useEffect, useRef } from 'react';
import PryroLogo from '../components/common/PryroLogo';
import API_BASE from '../config/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const SUGGESTIONS = [
  'What is Pryro?',
  'What are your pricing plans?',
  'Tell me about the CRM features',
  'How do I get started?',
  'What is included in the free plan?',
  'How can I contact support?',
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const createSession = async () => {
      setSessionLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/chat/guest/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSessionId(data.sessionId);
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch {
        setError('Failed to start chat. Please refresh.');
      } finally {
        setSessionLoading(false);
      }
    };
    createSession();
  }, []);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !sessionId || loading) return;

    setMessages((prev) => [...prev, { id: Date.now().toString(), content: msg, role: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/chat/guest/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: msg }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: data.botResponse.id, content: data.botResponse.content, role: 'assistant', timestamp: new Date(data.botResponse.createdAt) },
      ]);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── Header ── */}
      <header className="bg-white flex-shrink-0">
        <div className="px-6 py-3 flex items-center gap-3">
          <PryroLogo size="md" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Welcome to Pryro AI Chatbot</h1>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              Online · Ask me anything about Pryro
            </p>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: suggestions (always visible) ── */}
        <aside className="w-64 flex-shrink-0 bg-white p-5 flex flex-col gap-2 overflow-y-auto">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Try Asking</p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={!sessionId || sessionLoading}
              className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </aside>

        {/* ── Right: chat area ── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Messages or welcome */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-1">{error}</p>
                <button onClick={() => window.location.reload()} className="text-sm text-red-600 underline">Retry</button>
              </div>
            )}

            {/* Welcome screen — logo + title in center, input below */}
            {!hasMessages && !sessionLoading && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                {/* Pryro welcome block */}
                <div className="flex flex-col items-center gap-3">
                  <PryroLogo size="lg" />
                  <h2 className="text-2xl font-bold text-gray-900">Welcome to Pryro AI Chatbot</h2>
                </div>

                {/* Input box — centered in the welcome area */}
                <div className="w-full max-w-lg">
                  <div className="flex gap-2 items-end bg-white border border-gray-300 rounded-2xl shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about Pryro ERP, pricing, features..."
                      disabled={loading || !sessionId || sessionLoading}
                      rows={1}
                      className="flex-1 resize-none bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={loading || !input.trim() || !sessionId || sessionLoading}
                      className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connecting spinner */}
            {sessionLoading && !error && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-400 text-sm">Connecting...</p>
              </div>
            )}

            {/* Chat messages */}
            {hasMessages && (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mr-2 mt-1"><PryroLogo size="sm" /></div>
                    )}
                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2"><PryroLogo size="sm" /></div>
                    <div className="bg-white shadow-sm border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1.5 items-center h-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Bottom input bar (only shown when chatting) ── */}
          {hasMessages && (
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-8 py-4">
              <div className="flex gap-2 items-end bg-white border border-gray-300 rounded-2xl shadow-sm px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about Pryro ERP, pricing, features..."
                  disabled={loading || !sessionId}
                  rows={1}
                  className="flex-1 resize-none bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || !sessionId}
                  className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 py-3 px-8 flex items-center justify-between border-t border-gray-100">
            <p className="text-xs text-gray-900">
              Powered by <span className="font-semibold text-blue-600">Pryro AI</span> · Visit{' '}
              <a href="https://pryro.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">pryro.com</a>
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-900">
              <span>All rights reserved.</span>
              <a href="https://pryro.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline">Privacy Policy</a>
              <a href="https://pryro.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline">Terms of Service</a>
              <a href="https://pryro.com/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline">Cookie Settings</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
