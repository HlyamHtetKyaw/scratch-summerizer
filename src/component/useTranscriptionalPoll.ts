import { useState, useRef, useEffect, useCallback } from 'react';

export type JobStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ResultData {
  title?: string;
  content: string;
}

interface TranscriptionStatusResponse {
  status: JobStatus;
  title?: string;
  result?: string;
  error?: string;
}

export const useTranscriptionPoll = () => {
  const [data, setData] = useState<ResultData | null>(null);
  const [status, setStatus] = useState<JobStatus | 'IDLE'>('IDLE');
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    if (intervalRef.current) stopPolling();
    setStatus('PROCESSING');
    setData(null);

    intervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/voice/status/${jobId}`);
        if (!response.ok) throw new Error("Network response was not ok");

        const result: TranscriptionStatusResponse = await response.json();

        if (result.status === 'COMPLETED') {
          setData({
            title: result.title,
            content: result.result ?? "No content returned"
          });
          setStatus('COMPLETED');
          stopPolling();
        } else if (result.status === 'FAILED') {
          setStatus('FAILED');
          alert(`Failed: ${result.error || "Unknown error"}`);
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 2000);
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { startPolling, status, data };
};