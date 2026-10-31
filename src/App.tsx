import { HashRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataProvider } from '@/data/DataProvider'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import Firm from '@/pages/Firm'
import Home from '@/pages/Home'
import Methodology from '@/pages/Methodology'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <LocaleProvider>
    <HashRouter>
      <DataProvider>
        <TooltipProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/firm/:firmId" element={<Firm />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </TooltipProvider>
      </DataProvider>
    </HashRouter>
    </LocaleProvider>
  )
}
