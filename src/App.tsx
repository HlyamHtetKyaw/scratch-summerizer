import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BurmeseSummarizer from './component/BurmeseSummarizer'
import VoiceInput from './component/Transcribe'
import VoiceInputGS from './component/TranscribeByGS'
import AudioUploader from './component/AudioUploader'
import TextSummarizer from './component/TextSummarizer'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AudioUploader/>
      {/* <TextSummarizer voiceNoteDetailId={46}/> */}
    </>
  )
}

export default App
