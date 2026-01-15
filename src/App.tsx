import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BurmeseSummarizer from './component/BurmeseSummarizer'
import VoiceInput from './component/Transcribe'
import VoiceInputGS from './component/TranscribeByGS'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VoiceInputGS/>
    </>
  )
}

export default App
