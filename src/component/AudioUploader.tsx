import { useState, useRef, useEffect, useCallback } from 'react';

// --- Types matching your Backend Enums ---
type JobStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';
type TaskType = 'TRANSCRIBE' | 'SUMMARIZE';
type SummaryStyle = 'FORMAL' | 'INFORMAL' | 'NARRATIVE' | 'BULLET_POINTS' | 'NONE';

// UPDATED: Matches your Java JobStatusResponse
interface TranscriptionStatusResponse {
  status: JobStatus;
  title?: string;   // Backend now returns title
  result?: string;  // Backend returns 'result', not 'transcript'
  error?: string;
}

interface ResultData {
  title?: string;
  content: string;
}

// --- Polling Hook (Refined) ---
const useTranscriptionPoll = () => {
  // Changed: data is now an object, not just a string
  const [data, setData] = useState<ResultData | null>(null);
  const [status, setStatus] = useState<JobStatus | 'IDLE'>('IDLE');
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus((prev) => (prev === 'PROCESSING' ? 'FAILED' : prev));
  }, []);

  const startPolling = useCallback((jobId: string) => {
    // Reset state
    if (intervalRef.current) stopPolling();
    setStatus('PROCESSING');
    setData(null);

    intervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/voice/status/${jobId}`
        );

        if (!response.ok) throw new Error("Network response was not ok");

        const result: TranscriptionStatusResponse = await response.json();

        if (result.status === 'COMPLETED') {
          // UPDATED: Map backend fields 'title' and 'result'
          setData({
            title: result.title,
            content: result.result ?? "No content returned"
          });
          setStatus('COMPLETED');
          if (intervalRef.current) window.clearInterval(intervalRef.current);
        } else if (result.status === 'FAILED') {
          setStatus('FAILED');
          alert(`Failed: ${result.error || "Unknown error"}`);
          if (intervalRef.current) window.clearInterval(intervalRef.current);
        }
        // If PROCESSING, do nothing (keep polling)
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 2000); // 2 seconds polling interval
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { startPolling, status, data };
};

// --- Main Component ---
const AudioUploader = ({ userId = 1 }: { userId?: number }) => {
  const { startPolling, status, data } = useTranscriptionPoll();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [taskType, setTaskType] = useState<TaskType>('TRANSCRIBE');
  const [style, setStyle] = useState<SummaryStyle>('BULLET_POINTS');

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", taskType);
    formData.append("userId", userId.toString());
    
    if (taskType === 'SUMMARIZE') {
        formData.append("style", style);
    } else {
        formData.append("style", "NONE");
    }

    try {
      const res = await fetch('http://localhost:8080/api/voice', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Upload failed");
      }

      const { jobId } = await res.json();
      startPolling(jobId);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload file");
    }
  };

  const isProcessing = status === 'PROCESSING';

  return (
    <div className="p-6 border rounded-lg shadow-lg max-w-lg mx-auto bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Voice Note AI</h2>
      
      {/* Configuration Controls */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <select 
                className="w-full p-2 border rounded"
                value={taskType} 
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                disabled={isProcessing}
            >
                <option value="TRANSCRIBE">Transcribe (Exact)</option>
                <option value="SUMMARIZE">Summarize</option>
            </select>
        </div>

        {taskType === 'SUMMARIZE' && (
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select 
                    className="w-full p-2 border rounded"
                    value={style} 
                    onChange={(e) => setStyle(e.target.value as SummaryStyle)}
                    disabled={isProcessing}
                >
                    <option value="BULLET_POINTS">Bullet Points</option>
                    <option value="FORMAL">Formal</option>
                    <option value="INFORMAL">Informal</option>
                    <option value="NARRATIVE">Narrative</option>
                </select>
            </div>
        )}
      </div>

      {/* File Upload & Button */}
      <div className="flex gap-2 mb-6 items-center">
        <input 
            type="file" 
            ref={fileInputRef} 
            accept="audio/*" 
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={isProcessing}
          className={`px-4 py-2 rounded text-white font-medium transition-colors ${
             isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Start'}
        </button>
      </div>

      {/* Result Display */}
      {isProcessing && (
        <div className="text-center py-4">
            <p className="text-blue-600 animate-pulse font-medium">AI is working on your audio...</p>
            <span className="text-xs text-gray-400">Polling for status...</span>
        </div>
      )}
      
      {data && status === 'COMPLETED' && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <div className="flex justify-between items-start mb-3 border-b pb-2">
            <div>
              {/* UPDATED: Display Title */}
              <h3 className="font-bold text-lg text-gray-800">{data.title || "Untitled Note"}</h3>
              <span className="text-xs text-gray-500">Generated by AI</span>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
          </div>
          {/* UPDATED: Display Content */}
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {data.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;