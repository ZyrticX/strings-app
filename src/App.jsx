import './App.css'
import Pages from "@/pages/index.jsx"
import LocalDevBanner from "./components/LocalDevBanner"
import ErrorBoundary from "./components/ErrorBoundary"

function App() {
  return (
    <ErrorBoundary>
      <LocalDevBanner />
      <Pages />
    </ErrorBoundary>
  )
}

export default App 