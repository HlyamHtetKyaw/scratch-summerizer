import { useState, useRef } from 'react';
import { useTranscriptionPoll} from './useTranscriptionalPoll';
import TextSummarizer from './TextSummarizer';

// Types matching Backend Enums
type TaskType = 'TRANSCRIBE' | 'SUMMARIZE';
type SummaryStyle = 'FORMAL' | 'INFORMAL' | 'NARRATIVE' | 'BULLET_POINTS';
const PROJECT_ID = "fzcsemkxbccsflypzhqn"; 

export const getPlayableUrl = (internalUrl: string) => {
  if (!internalUrl) return "";
  const cleanPath = internalUrl.replace("supabase://", "");
  return `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${cleanPath}`;
};
const AudioPlayer = ({ url }: { url: string }) => {
  // Convert the URL on the fly
  const playableUrl = getPlayableUrl(url);

  return (
    <div className="rounded-lg overflow-hidden bg-black shadow-md mt-2">
      {/* video tag handles .m4a files better than audio tag on some browsers */}
      <video 
        controls 
        className="w-full h-12" 
      >
        <source src={playableUrl} type="video/mp4" />
        <source src={playableUrl} type="audio/mp4" />
        Your browser does not support the audio element.
      </video>
      
      {/* Optional: Debug text to verify the URL is correct */}
      {/* <div className="text-[10px] text-gray-400 p-1 truncate">{playableUrl}</div> */}
    </div>
  );
};
const AudioUploader = ({ userId = 1 }: { userId?: number }) => {
  const { startPolling, status, data } = useTranscriptionPoll();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [taskType, setTaskType] = useState<TaskType>('TRANSCRIBE');
  const [style, setStyle] = useState<SummaryStyle>('BULLET_POINTS');
  
  // Need to store the voiceNoteId returned from the backend if we want to chain actions
  // IMPORTANT: You need to update your Backend JobInitResponse to return voiceNoteId if possible,
  // OR fetch it separately. For now, let's assume the user knows the ID or we mock it for the demo flow.
  // In a real app, the `data` object from polling should probably contain the `voiceNoteId`.
  const [voiceNoteId, setVoiceNoteId] = useState<number | null>(null); 

  // For Demo purposes, I'm hardcoding ID=100. 
  // *TODO: Update your Backend Poll Response to include 'voiceNoteId'*
  const tempDemoId = 100; 

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", taskType);
    formData.append("userId", userId.toString());
    formData.append("style", taskType === 'SUMMARIZE' ? style : "NONE");

    try {
      const res = await fetch('http://localhost:8080/api/voice', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Upload failed");
      
      const { jobId } = await res.json();
      startPolling(jobId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isProcessing = status === 'PROCESSING';

  return (
    <div className="p-6 border rounded-lg shadow-lg max-w-lg mx-auto bg-white">
      <AudioPlayer url='supabase://audio-uploads/9ef69470-6405-44b3-9e8b-0860e41d228b_zu.m4a'/>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Voice Note AI</h2>
      
      {/* --- Existing Controls (Omitted for brevity, kept same as your code) --- */}
      <div className="flex gap-4 mb-4">
        {/* ... Select inputs for TaskType and Style ... */}
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
      </div>

      {/* File Upload Button */}
      <div className="flex gap-2 mb-6 items-center">
        <input type="file" ref={fileInputRef} accept="audio/*" disabled={isProcessing} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <button onClick={handleUpload} disabled={isProcessing} className={`px-4 py-2 rounded text-white font-medium transition-colors ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isProcessing ? 'Processing...' : 'Start'}
        </button>
      </div>

      {/* Result Display */}
      {data && status === 'COMPLETED' && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <div className="flex justify-between items-start mb-3 border-b pb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{data.title}</h3>
              <span className="text-xs text-gray-500">Original Result</span>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Done</span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-4">
            {data.content}
          </div>

          {/* NEW FEATURE: 
              If the user just Transcribed, show the option to Summarize that transcription immediately.
          */}
             {/* <TextSummarizer 
                voiceNoteId={tempDemoId} // Replace with actual ID from backend response
                // sourceDetailId={...} // Optional: Pass if backend returns the detail ID
             /> */}
        </div>
      )}
    </div>
  );
};

export default AudioUploader;