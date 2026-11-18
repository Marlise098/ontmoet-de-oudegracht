import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import {
  ArrowRight, Check, CheckCircle2, ChevronRight,
  Clock3, Eye, Info, Map, MapPin, Save, X,
} from 'lucide-react';
import huaLogo from './assets/hua-logo-manual-2008.png';
import { ArchiveFilmPlayer } from './components/archive-film-player';

const queryClient = new QueryClient();
type Language = 'nl' | 'en';
type LocationData = {
  id: string;
  order: number;
  titleNl: string;
  titleEn: string;
  descriptionNl: string;
  descriptionEn: string;
  sourceReference: string;
  videoTimeSeconds: number;
  mapX: number;
  mapY: number;
  status: 'Concept' | 'Gepubliceerd';
};

const seedLocations: LocationData[] = [
  {
    id: 'gaardbrug', order: 1, titleNl: 'Gaardbrug', titleEn: 'Gaardbrug',
    descriptionNl: 'Deze plek hoort bij de route. De historische tekst volgt nog.',
    descriptionEn: 'This place is part of the route. The historical text is still to come.',
    sourceReference: '', videoTimeSeconds: 8, mapX: 23, mapY: 64, status: 'Concept',
  },
  {
    id: 'bezembrug', order: 2, titleNl: 'Bezembrug', titleEn: 'Bezembrug',
    descriptionNl: 'Deze plek hoort bij de route. De historische tekst volgt nog.',
    descriptionEn: 'This place is part of the route. The historical text is still to come.',
    sourceReference: '', videoTimeSeconds: 96, mapX: 78, mapY: 34, status: 'Concept',
  },
];

const copy = {
  nl: {
    visitor: 'Bezoekerservaring', subtitle: 'Een film. Een gracht. Jouw ontdekking.',
    skipToContent: 'Ga naar de bezoekerservaring', chooseLanguage: 'Kies een taal',
    headline: <>Kijk mee.<br />Ontdek de Oudegracht.</>,
    filmYearStatus: 'Film toegevoegd',
    map: 'Ontdek de plekken', mapSub: 'Kies een plek. De kaart is nog niet aan de film gekoppeld.',
    schematic: 'Schematische kaart · niet op schaal', stops: 'PLEKKEN',
    sourceTitle: 'Bron van deze plek', sourcePending: 'Bronvermelding volgt',
    placeCopy: 'Deze plek hoort bij de route. De historische tekst volgt nog.',
    sample: 'VOORBEELD · BRONNEN EN TEKST NOG NIET GECONTROLEERD',
    years: 'Kies een jaar of periode', otherPeriod: 'Andere jaren en perioden',
    periodPending: 'Informatie over andere jaren en perioden volgt na controle van bronnen.',
    info: 'Over deze demo', infoText: 'Een eerste ontwerp voor een interactieve ervaring bij Het Utrechts Archief.',
    disclaimer: 'De aangeleverde film staat in de speler. De bron, datering en rechten worden nog gecontroleerd. De kaart en plek-informatie zijn voorbeelden en zijn nog niet aan de film gekoppeld.',
    maker: 'Makers', makers: 'M&A Studio — Annelien en Marlise',
    linkPending: 'De film wordt later aan deze plek gekoppeld.', about: 'Info openen',
    selected: 'Gekozen', close: 'Sluiten', staff: 'CMS-demo',
  },
  en: {
    visitor: 'Visitor experience', subtitle: 'A film. A canal. Your discovery.',
    skipToContent: 'Skip to the visitor experience', chooseLanguage: 'Choose a language',
    headline: <>Watch.<br />Discover the Oudegracht.</>,
    filmYearStatus: 'Film added',
    map: 'Discover the places', mapSub: 'Choose a place. The map is not linked to the film yet.',
    schematic: 'Schematic map · not to scale', stops: 'PLACES',
    sourceTitle: 'Source for this place', sourcePending: 'Source credit to come',
    placeCopy: 'This place is part of the route. Historical text is still to come.',
    sample: 'SAMPLE · SOURCES AND TEXT NOT YET VERIFIED',
    years: 'Choose a year or period', otherPeriod: 'Other years and periods',
    periodPending: 'Information about other years and periods will follow after sources are checked.',
    info: 'About this demo', infoText: 'An early design for an interactive experience at Het Utrechts Archief.',
    disclaimer: 'The supplied film is in the player. Its source, date and usage rights still need checking. The map and place information are examples and are not linked to the film yet.',
    maker: 'Made by', makers: 'M&A Studio — Annelien and Marlise',
    linkPending: 'The film will be linked to this place later.', about: 'Open information',
    selected: 'Selected', close: 'Close', staff: 'CMS demo',
  },
};

function Brand({ cms = false }: { cms?: boolean }) {
  return <div className="brand-lockup">
    <img src={huaLogo} alt="Het Utrechts Archief" />
    <span className="brand-divider" />
    <span className="brand-project">Ontmoet<br />de Oudegracht</span>
    {cms && <span className="brand-badge">CMS · PREVIEW</span>}
  </div>;
}

function VisitorExperience() {
  const [language, setLanguage] = useState<Language>('nl');
  const [selected, setSelected] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [period, setPeriod] = useState<'1929' | 'pending'>('1929');
  const dialogRef = useRef<HTMLElement>(null);
  const dialogReturnFocusRef = useRef<HTMLElement | null>(null);
  const t = copy[language];
  const current = seedLocations[selected];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!showInfo) return;
    const previouslyFocused = dialogReturnFocusRef.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const getFocusable = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    dialogRef.current?.querySelector<HTMLElement>('.dialog-close')?.focus();
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowInfo(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
      dialogReturnFocusRef.current = null;
    };
  }, [showInfo]);

  const chooseLocation = (index: number) => {
    setSelected(index);
  };

  return (
    <main className="visitor-shell paper-grain">
      <a className="skip-link" href="#visitor-main-content">{t.skipToContent}</a>
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <span className="mode-label">{t.visitor}</span>
          <div className="language-switch" role="group" aria-label={t.chooseLanguage}>
            {(['nl', 'en'] as const).map((lang) => <button key={lang}
              data-testid={`button-language-${lang}`} aria-pressed={language === lang}
              onClick={() => setLanguage(lang)} className={language === lang ? 'active' : ''}>{lang}</button>)}
          </div>
          <button data-testid="button-about" onClick={(event) => { dialogReturnFocusRef.current = event.currentTarget; setShowInfo(true); }} aria-label={t.about} className="icon-button"><Info size={20} /></button>
        </div>
      </header>

      <div className="visitor-content" id="visitor-main-content" tabIndex={-1}>
        <section className="intro-row">
          <div>
            <p className="eyebrow">{t.subtitle}</p>
            <h1>{t.headline}</h1>
          </div>
          <div className="intro-note"><span className="slash-mark" aria-hidden="true">///</span><span>{language === 'nl' ? 'Een interactieve route langs het water' : 'An interactive route by the water'}</span></div>
        </section>

        <section className="period-bar" aria-label={t.years}>
          <div className="period-heading"><span className="step-number">01</span><span>{t.years}</span></div>
          <div className="period-options">
            <button data-testid="button-period-1929" aria-pressed={period === '1929'} onClick={() => setPeriod('1929')} className={`period-chip ${period === '1929' ? 'selected' : ''}`}>
              <span className="period-dot" /><span>1929</span><span className="period-status">{t.filmYearStatus}</span>
            </button>
            <button data-testid="button-period-pending" aria-pressed={period === 'pending'} onClick={() => setPeriod('pending')} className={`period-chip pending-chip ${period === 'pending' ? 'selected' : ''}`}>
              <span className="period-dot" /><span>{t.otherPeriod}</span><span className="period-status">{language === 'nl' ? 'Bronnen volgen' : 'Sources pending'}</span>
            </button>
          </div>
        </section>
        {period === 'pending' && <div className="period-notice" role="status"><Info size={18} />{t.periodPending}</div>}

        <section className="exhibit-grid">
          <ArchiveFilmPlayer language={language} unavailable={period === 'pending'} />

          <aside className="map-column">
            <section className="map-panel">
              <header className="map-heading"><div><p className="eyebrow">{t.stops}</p><h2>{t.map}</h2><p>{t.mapSub}</p></div><span className="map-icon"><Map size={21} /></span></header>
              <div className="map-canvas">
                <svg viewBox="0 0 500 290" role="group" aria-labelledby="route-map-title route-map-description" className="route-map">
                  <title id="route-map-title">{language === 'nl' ? 'Schematische routekaart' : 'Schematic route map'}</title>
                  <desc id="route-map-description">{language === 'nl' ? 'Kies Gaardbrug of Bezembrug. Deze voorbeeldkaart is nog niet aan de film gekoppeld.' : 'Choose Gaardbrug or Bezembrug. This example map is not linked to the film yet.'}</desc>
                  <rect width="500" height="290" rx="12" className="map-water" />
                  <path d="M13 20L112 8 146 45 118 86 29 81ZM378 13L485 28 471 83 398 102 360 56ZM10 207L99 187 142 236 103 278 18 271ZM386 203L482 182 493 271 398 282 354 237Z" className="map-land" />
                  <path d="M43 177Q92 147 142 158T219 151Q263 146 286 119T363 117Q410 115 463 65" className="map-route-outline" />
                  <path d="M43 177Q92 147 142 158T219 151Q263 146 286 119T363 117Q410 115 463 65" className="map-route" />
                  <path d="M0 103L500 196M180 0L130 290M342 0L377 290" className="map-street" />
                  <text x="181" y="242" className="map-river-label">OUDEGRACHT</text>
                  <text x="19" y="259" className="map-schematic-label">{language === 'nl' ? 'SCHEMATISCH' : 'SCHEMATIC'}</text>
                  <g className="map-node" role="button" tabIndex={0} aria-label="Gaardbrug" aria-pressed={selected === 0} onClick={() => chooseLocation(0)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseLocation(0); } }}>
                    <circle cx="43" cy="177" r="40" className="node-hit" /><circle cx="43" cy="177" r={selected === 0 ? 13 : 10} className={`node-dot ${selected === 0 ? 'node-active' : ''}`} /><circle cx="43" cy="177" r="3" className="node-core" />
                  </g>
                  <g className="map-node" role="button" tabIndex={0} aria-label="Bezembrug" aria-pressed={selected === 1} onClick={() => chooseLocation(1)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseLocation(1); } }}>
                    <circle cx="463" cy="65" r="40" className="node-hit" /><circle cx="463" cy="65" r={selected === 1 ? 13 : 10} className={`node-dot ${selected === 1 ? 'node-active' : ''}`} /><circle cx="463" cy="65" r="3" className="node-core" />
                  </g>
                </svg>
                <span className="map-stamp">{t.schematic}</span>
              </div>
              <div className="place-picker">
                {seedLocations.map((location, index) => <button key={location.id} data-testid={`button-map-location-${location.id}`} aria-pressed={selected === index} onClick={() => chooseLocation(index)} className={`place-choice ${selected === index ? 'chosen' : ''}`}>
                  <span className="place-index">0{index + 1}</span><span className="place-name">{language === 'nl' ? location.titleNl : location.titleEn}</span>{selected === index && <span className="selected-word"><Check size={16} aria-hidden="true" /></span>}
                </button>)}
              </div>
            </section>

            <section className="place-panel">
              <div className="place-art"><span className="art-slash" aria-hidden="true">///</span><MapPin size={28} strokeWidth={1.4} /><span>{language === 'nl' ? 'PLEK IN DE ROUTE' : 'PLACE ON THE ROUTE'}</span><small>{language === 'nl' ? 'Geen historische foto' : 'No historic photo'}</small></div>
              <div className="place-detail">
                <p className="eyebrow">{language === 'nl' ? `PLEK 0${current.order}` : `PLACE 0${current.order}`}</p>
                 <h3 aria-live="polite" aria-atomic="true">{language === 'nl' ? current.titleNl : current.titleEn}</h3>
                <p className="place-description">{t.placeCopy}</p>
                <div className="source-credit"><span>{t.sourceTitle}</span><strong>{t.sourcePending}</strong></div>
                <p className="sample-label">{t.sample}</p>
              </div>
              <div className="place-footer"><span>{t.linkPending}</span></div>
            </section>
          </aside>
        </section>

        <footer className="visitor-footer"><span>© Het Utrechts Archief · {language === 'nl' ? 'Demo-ontwerp' : 'Design demo'}</span><span className="footer-makers">{t.makers}</span><Link href="/cms" data-testid="link-cms" className="cms-link">{t.staff}<ArrowRight size={15} /></Link></footer>
      </div>
      {showInfo && <div className="dialog-backdrop" onClick={() => setShowInfo(false)}>
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="about-title" aria-describedby="about-description" tabIndex={-1} onClick={(event) => event.stopPropagation()} className="info-dialog">
          <button data-testid="button-close-about" onClick={() => setShowInfo(false)} aria-label={t.close} className="dialog-close"><X size={21} /></button>
          <img className="dialog-logo" src={huaLogo} alt="Het Utrechts Archief" />
          <p className="eyebrow"><span aria-hidden="true">/// </span>{t.visitor}</p><h2 id="about-title">{t.info}</h2><p id="about-description">{t.infoText}</p>
          <div className="dialog-disclaimer">{t.disclaimer}</div><h3>{t.maker}</h3><p>{t.makers}</p>
          <button data-testid="button-close-about-footer" onClick={() => setShowInfo(false)} className="primary-button">{t.close}</button>
        </section>
      </div>}
    </main>
  );
}

function CMSPreview() {
  const [locations, setLocations] = useState(seedLocations);
  const [selectedId, setSelectedId] = useState('gaardbrug');
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const selected = locations.find((item) => item.id === selectedId) || locations[0];
  useEffect(() => {
    document.documentElement.lang = 'nl';
  }, []);
  const updateField = (key: keyof LocationData, value: string | number) => {
    setLocations((items) => items.map((item) => item.id === selectedId ? { ...item, [key]: value } : item));
    setSaved(false);
    setMessage('');
  };
  const save = () => { setSaved(true); setMessage('Wijzigingen alleen lokaal in deze preview bewaard.'); };
  const publish = () => {
    setLocations((items) => items.map((item) => item.id === selectedId ? { ...item, status: item.status === 'Gepubliceerd' ? 'Concept' : 'Gepubliceerd' } : item));
    setMessage(selected.status === 'Gepubliceerd' ? 'Status gewijzigd naar concept (demo).' : 'Preview-status gewijzigd. Er is niets gepubliceerd.');
    setSaved(false);
  };
  return <main className="cms-shell paper-grain">
    <a className="skip-link" href="#cms-main-content">Ga naar het contentbeheer</a>
    <header className="cms-topbar"><Brand cms /><Link href="/" data-testid="link-visitor-experience" className="visitor-link"><Eye size={18} /><span>Bezoekerservaring</span><ArrowRight size={16} /></Link></header>
    <div className="cms-warning"><Info size={18} /><span><strong>DEMO · NIET VERBONDEN</strong> Wijzigingen, afbeelding, opslaan en status zijn alleen lokaal. Er wordt niets opgeslagen of gepubliceerd.</span></div>
    <div className="cms-content" id="cms-main-content" tabIndex={-1}>
       <section className="cms-intro"><div><p className="eyebrow"><span aria-hidden="true">/// </span>CONTENT PREVIEW</p><h1>Beheer de route</h1><p>Twee opgegeven plekken · Gaardbrug en Bezembrug</p></div><div className="schematic-note"><Map size={18} />Kaart is schematisch · geen kaartdata</div></section>
      <div className="cms-layout">
        <aside className="location-sidebar">
          <div className="sidebar-heading"><span className="eyebrow">ROUTE-INHOUD</span><h2>Locaties</h2></div>
          {locations.map((location, index) => <button key={location.id} data-testid={`button-select-${location.id}`} aria-pressed={selectedId === location.id} onClick={() => { setSelectedId(location.id); setSaved(false); setMessage(''); }} className={`location-row ${selectedId === location.id ? 'active' : ''}`}>
            <span className="row-index">0{index + 1}</span><span className="row-label"><strong>{location.titleNl}</strong><small>{location.status} · 1929</small></span>{selectedId === location.id && <Check size={17} aria-hidden="true" />}<ChevronRight size={18} aria-hidden="true" />
          </button>)}
          <div className="sidebar-note"><Info size={16} />Nieuwe plekken en perioden voeg je pas toe als er gecontroleerde bronnen zijn.</div>
        </aside>
        <section className="editor-panel">
          <header className="editor-heading"><div className="editor-title"><span className="editor-pin"><MapPin size={19} /></span><div><p className="eyebrow">PLEK · 0{selected.order}</p><h2>{selected.titleNl}</h2></div></div><span className={`status-badge ${selected.status === 'Gepubliceerd' ? 'published' : ''}`}>{selected.status}</span></header>
          <div className="editor-grid">
            <div className="editor-main">
              <section className="editor-section">
                <div className="section-title"><h3>Tekst en vertaling</h3><span>NL / EN</span></div>
                <div className="fields-two">
                  <label className="form-label">Titel · Nederlands<input data-testid="input-title-nl" className="field" value={selected.titleNl} onChange={(e) => updateField('titleNl', e.target.value)} /></label>
                  <label className="form-label" lang="en">Title · English<input data-testid="input-title-en" className="field" value={selected.titleEn} onChange={(e) => updateField('titleEn', e.target.value)} /></label>
                  <label className="form-label">Beschrijving · Nederlands<textarea data-testid="input-description-nl" className="field textarea" value={selected.descriptionNl} onChange={(e) => updateField('descriptionNl', e.target.value)} /></label>
                  <label className="form-label" lang="en">Description · English<textarea data-testid="input-description-en" className="field textarea" value={selected.descriptionEn} onChange={(e) => updateField('descriptionEn', e.target.value)} /></label>
                </div>
                <p className="pending-copy">Gebruik korte, duidelijke B1-tekst. Controleer inhoud en vertaling vóór gebruik.</p>
              </section>
              <section className="editor-section">
                <div className="section-title"><h3>Jaar of periode</h3><span>BRONNEN CONTROLEREN</span></div>
                <label className="form-label compact-label">Filmjaar / periode<input className="field" value="1929" readOnly aria-label="Filmjaar 1929" /></label>
                <p className="field-help">1929 staat in de projectbrief. Andere jaren en perioden zijn nog niet ingevuld.</p>
              </section>
              <section className="editor-section">
                <div className="section-title"><h3>Filmfragment</h3><span>TIMECODE</span></div>
                <label className="form-label compact-label">Concepttijd in film (seconden)<div className="input-with-icon"><Clock3 size={17} /><input data-testid="input-video-timestamp" className="field" type="number" min="0" value={selected.videoTimeSeconds} onChange={(e) => updateField('videoTimeSeconds', Number(e.target.value))} /></div></label>
                 <p className="field-help">De video staat in de bezoekersspeler. Deze concepttijd is nog niet gecontroleerd en is niet aan de speler gekoppeld.</p>
              </section>
              <section className="editor-section">
                <div className="section-title"><h3>Bronvermelding</h3><span>VERPLICHT VÓÓR GEBRUIK</span></div>
                <label className="form-label">Bron / archiefreferentie<textarea data-testid="input-source-reference" className="field textarea source-field" placeholder="Nog niet aangeleverd — bronreferentie volgt" value={selected.sourceReference} onChange={(e) => updateField('sourceReference', e.target.value)} /></label>
                <p className="pending-copy">Deze bron wordt ook bij de gekozen plek in de bezoekerservaring getoond.</p>
              </section>
            </div>
            <aside className="editor-aside">
              <section className="editor-section">
                <div className="section-title"><h3>Afbeelding</h3><span>PLACEHOLDER</span></div>
                <div className="no-image"><div className="no-image-mark" aria-hidden="true">///</div><MapPin size={25} /><strong>Geen historische afbeelding</strong><span>Er zijn geen beelden aangeleverd.</span></div>
                <p className="field-help">Voeg geen beeld toe zonder gecontroleerde bron en gebruiksrecht.</p>
              </section>
              <section className="editor-section map-editor">
                <div className="section-title"><h3>Kaartpositie</h3><Map size={17} /></div>
                <div className="mini-map">
                  <svg viewBox="0 0 300 180" role="img" aria-label="Schematische kaartpositie">
                    <rect width="300" height="180" rx="9" className="map-water" />
                    <path d="M0 20L60 5 100 39 67 66 9 62ZM220 9L300 26 281 68 239 79 204 43ZM0 139L55 126 103 159 68 180 0 174ZM220 131L300 120 300 180 234 176 206 151Z" className="map-land" />
                    <path d="M20 117Q70 92 104 106T155 91T208 89T278 48" className="map-route-outline" /><path d="M20 117Q70 92 104 106T155 91T208 89T278 48" className="map-route" />
                    <circle cx={selected.mapX * 3} cy={selected.mapY * 1.8} r="10" className="node-dot node-active" /><path d="M0 78H300M145 0V180" className="map-street" />
                  </svg><span className="map-stamp">SCHEMATISCH · NIET OP SCHAAL</span>
                </div>
                <div className="fields-two coordinate-fields">
                  <label className="form-label">X · schematisch<input data-testid="input-map-x" className="field" type="number" min="0" max="100" value={selected.mapX} onChange={(e) => updateField('mapX', Number(e.target.value))} /></label>
                  <label className="form-label">Y · schematisch<input data-testid="input-map-y" className="field" type="number" min="0" max="100" value={selected.mapY} onChange={(e) => updateField('mapY', Number(e.target.value))} /></label>
                </div>
                <p className="field-help">Alleen visuele demo-coördinaten. Geen echte locatiegegevens.</p>
              </section>
            </aside>
          </div>
          <footer className="editor-footer"><div className="save-status" role="status" data-testid="status-save">{message || (saved ? <><CheckCircle2 size={16} /> Lokaal bewaard in preview</> : 'Niet bewaard · wijzigingen zijn tijdelijk')}</div><div className="editor-actions"><button data-testid="button-save" onClick={save} className="secondary-button">{saved ? <Check size={17} /> : <Save size={17} />}Bewaar preview</button><button data-testid="button-publish" onClick={publish} className="primary-button"><Eye size={17} />{selected.status === 'Gepubliceerd' ? 'Zet op concept' : 'Publiceer preview'}</button></div></footer>
        </section>
      </div>
      <footer className="cms-footer"><span>Ontmoet de Oudegracht · Contentbeheer demo</span><span>M&A Studio — Annelien en Marlise</span><span>Geen login, opslag of publicatieverbinding</span></footer>
    </div>
  </main>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={VisitorExperience} /><Route path="/cms" component={CMSPreview} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
