'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Loader2, Sparkles, Package, ShoppingCart, AlertTriangle, RefreshCw, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Message { role: 'user'|'assistant'; content: string; time: Date; }
const suggestions = [
  'Which items are critically low on stock?',
  'What is the total inventory value?',
  'Show purchase recommendations for this month',
  'Which items have not moved in 3 months?',
  "Summarize this week's GRN activity",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['ai-dashboard-summary'],
    queryFn: () => api.get('/v1/ai/dashboard-summary').then(r => r.data),
  });
  
  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => api.get('/v1/ai/recommendations').then(r => r.data),
  });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg: Message = { role: 'user', content: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // placeholder response
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'This is a placeholder response.', time: new Date() }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Bot size={32} className="text-primary" />
        <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-muted-foreground text-sm">Ask me anything about your inventory data.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-xl bg-card">
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles size={48} className="mb-4 text-primary/50" />
                <p>Hello! I am your ANTIGRAVITY AI assistant.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {suggestions.map(s => (
                        <button key={s} onClick={() => setInput(s)} className="px-3 py-1.5 text-sm border rounded-full hover:bg-muted transition">
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        ) : (
            messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 rounded-xl max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {m.content}
                    </div>
                </div>
            ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" disabled={!input.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50">
            <Send size={20} />
        </button>
      </form>
    </div>
  );
}
