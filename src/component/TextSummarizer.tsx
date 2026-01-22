import { useState, useEffect } from 'react';
import { useTranscriptionPoll } from './useTranscriptionalPoll';

type SummaryStyle = 'FORMAL' | 'INFORMAL' | 'NARRATIVE' | 'BULLET_POINTS';

interface TextSummarizerProps {
  voiceNoteDetailId: number;
  onSuccess?: () => void; 
}

const TextSummarizer = ({ voiceNoteDetailId, onSuccess }: TextSummarizerProps) => {
  const { startPolling, status, data } = useTranscriptionPoll();
  const [style, setStyle] = useState<SummaryStyle>('BULLET_POINTS');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'COMPLETED' && onSuccess) {
      onSuccess(); 
    }
  }, [status, onSuccess]);

  const handleSummarize = async () => {
    setError(null);
    try {
      const payload = {
        voiceNoteDetailId, 
        style
      };

      const res = await fetch('http://localhost:8080/api/voice/summarize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to start summarization");
      }

      const { jobId } = await res.json();
      startPolling(jobId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isProcessing = status === 'PROCESSING';
  
  return (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Actions
        </h4>
        {isProcessing && (
           <span className="text-xs text-purple-600 animate-pulse font-medium">
             AI is thinking...
           </span>
        )}
      </div>
      
      <div className="flex gap-2 items-center">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as SummaryStyle)}
          disabled={isProcessing}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow min-w-[140px]"
        >
          <option value="BULLET_POINTS">Bullet Points</option>
          <option value="FORMAL">Formal</option>
          <option value="INFORMAL">Casual</option>
          <option value="NARRATIVE">Narrative</option>
        </select>
        
        <button
          onClick={handleSummarize}
          disabled={isProcessing}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm transition-all
            ${isProcessing 
              ? 'bg-purple-300 cursor-wait' 
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-md active:transform active:scale-95'
            }`}
        >
          {isProcessing ? 'Generating...' : 'Summarize This'}
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {/* --- ADDED: Display the Result Text --- */}
      {data && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg shadow-sm animate-fade-in">
          <div className="flex justify-between items-start mb-3 pb-2 border-b border-purple-100">
            <div>
                <span className="block text-xs font-bold text-purple-800 uppercase tracking-wide">
                New {style} Summary
                </span>
                {data.title && (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                    {data.title}
                    </span>
                )}
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Done
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
                {data.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextSummarizer;