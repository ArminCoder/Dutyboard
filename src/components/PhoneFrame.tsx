import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

// Telefon na desktopu. Sadržaj se renderuje kroz portal u iframe: iframe ima svoj
// viewport od 390 px, pa svi responzivni (sm:/lg:) stilovi i `fixed` elementi
// (donji tabovi, dijalozi, toast) rade tačno kao na pravom telefonu. Portal ostaje
// dio istog React stabla — dijeli store, router i kontekste s ostatkom aplikacije,
// pa tokovi kroz više uloga (zahtjev → odobrenje) i dalje rade.

const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const STATUS_H = 44;
const HOME_H = 22;

/** Kopira stilove i CSS varijable teme iz glavnog dokumenta u iframe (i prati izmjene). */
function mirrorDocument(src: Document, dst: Document): () => void {
  const syncHead = () => {
    dst.head.querySelectorAll('[data-mirrored]').forEach((n) => n.remove());
    src.head.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
      const copy = n.cloneNode(true) as HTMLElement;
      copy.setAttribute('data-mirrored', '');
      dst.head.appendChild(copy);
    });
  };
  const syncRoot = () => {
    dst.documentElement.setAttribute('style', src.documentElement.getAttribute('style') ?? '');
    dst.documentElement.lang = src.documentElement.lang;
  };
  syncHead();
  syncRoot();
  const headObs = new MutationObserver(syncHead);
  headObs.observe(src.head, { childList: true, subtree: true, characterData: true });
  const rootObs = new MutationObserver(syncRoot);
  rootObs.observe(src.documentElement, { attributes: true, attributeFilter: ['style', 'lang'] });
  return () => {
    headObs.disconnect();
    rootObs.disconnect();
  };
}

/** Umanjuje cijeli telefon da stane u visinu prozora (unutrašnji viewport ostaje 390×844). */
function usePhoneScale(): number {
  const total = SCREEN_H + BEZEL * 2;
  const calc = () => Math.min(1, (window.innerHeight - 48) / total);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const onResize = () => setScale(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  return Math.max(0.55, scale);
}

export function PhoneFrame({ clock, children }: { clock: string; children: ReactNode }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const scale = usePhoneScale();

  useEffect(() => {
    const iframe = frameRef.current;
    if (!iframe) return;
    let cleanup: (() => void) | undefined;
    const setup = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      cleanup?.();
      cleanup = mirrorDocument(document, doc);
      setMount(doc.body);
    };
    iframe.addEventListener('load', setup);
    if (iframe.contentDocument?.readyState === 'complete' && iframe.contentDocument.body?.dataset.ready) setup();
    return () => {
      iframe.removeEventListener('load', setup);
      cleanup?.();
    };
  }, []);

  const outerW = SCREEN_W + BEZEL * 2;
  const outerH = SCREEN_H + BEZEL * 2;

  return (
    <div style={{ width: outerW * scale, height: outerH * scale }} className="flex-none">
      <div
        style={{ width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left', padding: BEZEL }}
        className="relative rounded-[56px] bg-[#0b0d12] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_0_2px_#2a2e37]"
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[44px] bg-paper-0">
          {/* Statusna traka (sat, signal, baterija) + dinamičko ostrvo */}
          <div style={{ height: STATUS_H }} className="relative flex flex-none items-center justify-between px-8 text-[15px] font-semibold text-ink-800">
            <span className="tabular-nums">{clock}</span>
            <span className="absolute left-1/2 top-[11px] h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-[#0b0d12]" />
            <span className="flex items-center gap-1.5">
              <Signal className="h-4 w-4" />
              <Wifi className="h-4 w-4" />
              <BatteryFull className="h-5 w-5" />
            </span>
          </div>

          <iframe
            ref={frameRef}
            title="Mobilna aplikacija policajca"
            srcDoc='<!doctype html><html lang="bs"><head><meta charset="utf-8"></head><body data-ready="1"></body></html>'
            style={{ width: SCREEN_W, height: SCREEN_H - STATUS_H - HOME_H }}
            className="block flex-none border-0 bg-paper-50"
          />

          {/* Indikator početnog ekrana */}
          <div style={{ height: HOME_H }} className="flex flex-none items-center justify-center bg-paper-0">
            <span className="h-[5px] w-[134px] rounded-full bg-ink-800" />
          </div>
        </div>
      </div>
      {mount ? createPortal(children, mount) : null}
    </div>
  );
}
