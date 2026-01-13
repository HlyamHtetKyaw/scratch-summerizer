import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BurmeseSummarizer from './component/BurmeseSummarizer'
import VoiceInput from './component/Transcribe'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VoiceInput/>
    </>
  )
}

export default App
