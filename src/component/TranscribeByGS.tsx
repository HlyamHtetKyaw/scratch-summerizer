import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const VoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sampleRateRef = useRef<number>(48000); // Store rate here

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. Detect Real Sample Rate
      const audioContext = new AudioContext();
      sampleRateRef.current = audioContext.sampleRate;
      console.log("Microphone Rate:", sampleRateRef.current);
      audioContext.close(); // Clean up

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      setIsLoading(true);
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        try {
          const { data, error } = await supabase.functions.invoke('transcribe-flash', {
            body: { 
              audio: base64Audio, 
              rate: sampleRateRef.current // Send the rate!
            }
          });

          if (error) throw error;
          setTranscription(data.transcription);
        } catch (err) {
          console.error("API Error:", err);
          setTranscription("Error processing audio.");
        } finally {
          setIsLoading(false);
        }
      };
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    // Stop all tracks to turn off the red dot
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {isLoading && <p>Processing...</p>}
      <p>{transcription}</p>
    </div>
  );
};

export default VoiceInput;