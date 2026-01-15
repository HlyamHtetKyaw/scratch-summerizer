import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const VoiceInputGS: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Properly typed refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 1️⃣ Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied.");
    }
  };

  // 2️⃣ Stop Recording & Send to Supabase
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      setIsLoading(true);

      const audioBlob = new Blob(chunksRef.current, {
        type: 'audio/webm'
      });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        if (!reader.result) return;

        const base64Audio = reader.result
          .toString()
          .split(',')[1]; // remove data prefix

        try {
          const { data, error } = await supabase.functions.invoke('transcribe', {
            body: {
              audio: base64Audio,
              mimeType: 'audio/webm'
            }
          });

          if (error) throw error;

          setTranscription(data?.transcription ?? "");
        } catch (err) {
          console.error("Transcription error:", err);
          setTranscription("Error transcribing audio.");
        } finally {
          setIsLoading(false);
        }
      };
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    // ✅ Release microphone
    mediaRecorderRef.current.stream
      .getTracks()
      .forEach(track => track.stop());
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h3>Hold Spacebar or Button to Record</h3>

      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        style={{
          padding: '20px 40px',
          fontSize: '18px',
          borderRadius: '50px',
          border: 'none',
          backgroundColor: isRecording ? '#ff4d4d' : '#007bff',
          color: 'white',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.1s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isRecording ? "Listening..." : "Hold to Speak"}
      </button>

      <div style={{ marginTop: '20px' }}>
        {isLoading && <p>Processing audio...</p>}

        {transcription && (
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          >
            <strong>Transcription:</strong>
            <p>{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInputGS;
