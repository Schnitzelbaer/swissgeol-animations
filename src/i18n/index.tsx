import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEFAULT_LANG, messages, type Lang, type Messages } from './messages'

export { LANGS, type Lang } from './messages'

type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Messages
}

const I18nContext = createContext<I18n | null>(null)

function parseLang(value: string | null): Lang {
  return value === 'de' || value === 'en' ? value : DEFAULT_LANG
}

/**
 * Sprache der Oberfläche. Englisch ist Standard, Deutsch steht als ?lang=de in der URL, damit jeder Zustand
 * per URL aufrufbar bleibt. Navigationen in der App kennen den Parameter nicht; er wird hier nachgetragen.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => parseLang(new URLSearchParams(location.search).get('lang')))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const wanted = lang === DEFAULT_LANG ? null : lang
    if (params.get('lang') === wanted) return
    if (wanted) params.set('lang', wanted)
    else params.delete('lang')
    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true, state: location.state })
  }, [lang, location, navigate])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t: messages[lang] }), [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const i18n = useContext(I18nContext)
  if (!i18n) throw new Error('useI18n muss innerhalb von I18nProvider verwendet werden')
  return i18n
}
