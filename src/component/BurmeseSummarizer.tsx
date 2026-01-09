import React, { useState } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  ArrowRight, 
  ArrowDown, 
  RotateCcw,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';

const BurmeseSummarizer = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // --- UPDATED API CONFIGURATION ---
  // The endpoint from your curl command
  const API_URL = "https://jkbyioojeqmdkwdzeafe.supabase.co/functions/v1/smooth-action";
  // The key from your curl command (sb_publishable_...)
  const API_KEY = "sb_publishable_u_yp6NlMiFqakwUWuXCn1g_j3v6J5SZ";

  // --- Real Backend Function ---
  const generateSummary = async () => {
    if (!inputText) return;
    
    setIsLoading(true);
    setError('');
    setOutputText('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'apikey': API_KEY
        },
        // We still send 'text' because your backend logic expects it
        // (even though your curl example used "name", the summarizer code needs "text")
        body: JSON.stringify({ text: inputText }) 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status} ${response.statusText}`);
      }

      if (data.summary) {
        setOutputText(data.summary);
      } else if (data.message) {
        setOutputText(data.message); 
      } else {
        setOutputText(JSON.stringify(data, null, 2));
      }

    } catch (err: any) {
      console.error("API Call Failed:", err);
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
    setError('');
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-blue-600 fill-blue-100" />
            Burmese AI Summarizer
          </h1>
          <p className="text-sm text-slate-500 mt-1 hidden md:block">
            Powered by Gemini 1.5 Flash via Supabase
          </p>
        </div>
        
        <button 
          onClick={handleClearAll}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] min-h-[600px] grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] gap-4">
        
        {/* LEFT: INPUT */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
          <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
              <FileText size={16} className="text-blue-500"/> Input
            </span>
            {inputText && (
              <button onClick={() => setInputText('')} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea 
              className="w-full h-full p-5 resize-none outline-none text-slate-700 leading-relaxed placeholder:text-slate-300"
              placeholder="Paste Burmese text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none">
              {inputText.length} chars
            </div>
          </div>
        </div>

        {/* MIDDLE: BUTTON */}
        <div className="flex items-center justify-center">
          <button
            onClick={generateSummary}
            disabled={!inputText || isLoading}
            className={`
              group relative flex items-center justify-center
              w-full md:w-16 h-14 md:h-16 rounded-xl md:rounded-2xl
              bg-blue-600 text-white shadow-lg hover:shadow-blue-500/30
              hover:scale-105 active:scale-95 transition-all duration-200 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none
            `}
          >
            {isLoading ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRight className="hidden md:block w-6 h-6" />
                <ArrowDown className="md:hidden w-6 h-6" />
                <span className="md:hidden ml-2 font-semibold">Summarize</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full relative">
          <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
            <span className="font-semibold text-blue-800 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Sparkles size={16} /> Summary
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy} disabled={!outputText}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-30"
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-50/30 relative overflow-y-auto p-6">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="text-blue-500 w-6 h-6 animate-spin-slow" />
                </div>
                <p className="text-slate-400 text-sm">Processing with AI...</p>
              </div>
            ) : outputText ? (
              <div className="prose prose-slate max-w-none leading-loose text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500 whitespace-pre-wrap">
                {outputText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 select-none">
                <p className="text-sm">Summary will appear here</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BurmeseSummarizer;