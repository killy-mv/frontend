/* ==========================================================================
   The entry point — where a React app actually begins.
   --------------------------------------------------------------------------
   index.html contains one empty <div id="root"></div> and one <script> tag
   pointing here. These ten lines are the bridge between the two worlds:

     document.getElementById('root')   the last DOM node you touch by hand
     createRoot(...)                   hand it to React
     .render(<App />)                  React owns everything below it from now on

   From this point nothing else in the app calls a DOM API to build UI. You
   describe what the screen should look like and React works out the DOM edits.
   ========================================================================== */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing <div id="root">')

createRoot(root).render(
  // StrictMode is a development-only wrapper. It deliberately renders every
  // component twice and runs every effect twice to surface impure code and
  // missing cleanup. It disappears from production builds.
  // The Purity lesson explains what it is catching.
  <StrictMode>
    <App />
  </StrictMode>,
)
