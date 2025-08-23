import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import './styles/admin.css'
import App from './App.jsx'
import { auth0ProviderOptions } from './config/auth0Config.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider {...auth0ProviderOptions}>
      <App />
    </Auth0Provider>
  </StrictMode>,
)
