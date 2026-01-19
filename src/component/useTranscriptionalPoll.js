import { useState, useRef } from 'react';

export const useTranscriptionPoll = () => {
  const [data, setData] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  const startPolling = (jobId) => {
    setIsPolling(true);
    
    // Poll every 2 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/voice/status/${jobId}`);
        const result = await response.json();

        if (result.status === 'COMPLETED') {
          setData(result.transcript);
          stopPolling(); // Stop asking once we have the answer
        } else if (result.status === 'FAILED') {
          stopPolling();
          alert("Transcription failed");
        }
        // If PROCESSING, do nothing and wait for next interval
      } catch (error) {
        console.error("Polling error", error);
        // Optional: stopPolling() if too many errors
      }
    }, 2000);
  };

  const stopPolling = () => {
    clearInterval(intervalRef.current);
    setIsPolling(false);
  };

  return { startPolling, isPolling, data };
};