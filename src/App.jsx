import './App.css'
import Pages from "@/pages/index.jsx"
import LocalDevBanner from "./components/LocalDevBanner"

function App() {
  return (
    <>
      <LocalDevBanner />
      <Pages />
    </>
  )
}

export default App 