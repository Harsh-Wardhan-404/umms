import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Auth from './components/Auth/Auth'
import Home from './components/Home'
import Maintenance from './components/Maintanence/Maintenance';
import { MAINTENANCE_MODE } from '@/lib/envVariables';

function App() {

  if (MAINTENANCE_MODE.status) {
    return (
      <Maintenance />
    )
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/signin" element={<Auth />} />
          {/* <Route path="/" element={<Redirect />} /> */}
          <Route path="/*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

