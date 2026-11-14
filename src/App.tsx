import { HashRouter, Route, Routes } from 'react-router'
import { AnalyticsBridge } from '@/components/AnalyticsBridge'
import { AppShell } from '@/components/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataProvider } from '@/data/DataProvider'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { ANALYTICS_ENABLED } from '@/lib/analytics'
import Firm from '@/pages/Firm'
import Home from '@/pages/Home'
import Methodology from '@/pages/Methodology'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'

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
              {ANALYTICS_ENABLED && <Route path="/privacy" element={<Privacy />} />}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
          <AnalyticsBridge />
        </TooltipProvider>
      </DataProvider>
    </HashRouter>
    </LocaleProvider>
  )
}
