import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Auth from './components/Auth/Auth'
import Home from './components/Home'
import Maintenance from './components/Maintanence/Maintenance';
import { MAINTENANCE_MODE } from '@/lib/envVariables';
import { AuthProvider } from '@/contexts/AuthContext';

function App() {

  if (MAINTENANCE_MODE.status) {
    return (
      <Maintenance />
    )
  }

  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/signin" element={<Auth />} />
            <Route path="/*" element={<Home />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App

