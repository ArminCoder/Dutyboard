import { chromium } from 'playwright-core';
const SS='/private/tmp/claude-501/-Users-arminbalija-Projects-Sites-Dutyboard/27b42013-c051-42a5-931e-832ce9326039/scratchpad/rehearsal';
import {mkdirSync} from 'fs'; mkdirSync(SS,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
const ctx=await b.newContext({viewport:{width:1360,height:900}});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
const log=[]; const t0=Date.now();
const step=(s)=>{const el=((Date.now()-t0)/1000).toFixed(0); log.push(`[${el}s] ${s}`); };
const nav=async(name)=>{ await p.getByRole('link',{name,exact:false}).first().click(); await p.waitForTimeout(700); };
const shot=(n)=>p.screenshot({path:`${SS}/${n}.png`}).catch(()=>{});
const role=async(text)=>{ // Odjava -> role picker -> pick (router nav, store persists)
  await p.getByText('Odjava',{exact:false}).first().click(); await p.waitForTimeout(600);
  await p.getByText(text,{exact:false}).first().click(); await p.waitForTimeout(900);
};
const MARK='REHEARSAL-'+Date.now();

// GATE
await p.goto('http://localhost:3100/',{waitUntil:'networkidle'}); await p.waitForTimeout(400);
await p.locator('input').first().fill('DEMO-2026'); await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
step('gate passed → role picker');

// 1. POLICAJAC
await p.getByText('Amar Softić',{exact:false}).first().click(); await p.waitForTimeout(900);
step('policajac home (P01)');
await nav('Statistika'); step('P03 statistika');
await nav('Akademija'); await p.waitForTimeout(400);
// take a quiz
await p.getByRole('button',{name:/Započni/}).first().click().catch(()=>{}); await p.waitForTimeout(500);
for(let i=0;i<6;i++){ await p.locator('button:has-text("A ")').first().click().catch(()=>{});
  await p.getByRole('button',{name:/Sljedeće|Završi test/}).click().catch(()=>{}); await p.waitForTimeout(300); }
await p.waitForTimeout(400); await shot('01-akademija-rezultat'); step('P07 akademija: quiz completed');
// submit a tagged leave request
await nav('Zahtjevi');
await p.getByRole('button',{name:/Novi zahtjev/}).click(); await p.waitForTimeout(400);
await p.getByRole('button',{name:/Slobodan dan/}).click(); await p.waitForTimeout(200);
await p.locator('input[type=date]').first().fill('2026-09-05'); await p.waitForTimeout(150);
await p.locator('textarea').first().fill(MARK); await p.waitForTimeout(150);
await p.getByRole('button',{name:/Pošalji zahtjev/}).click(); await p.waitForTimeout(600);
step('P02: submitted tagged slobodan-dan request');

// 2. ŠEF SMJENE
await role('Damir Kovač'); step('šef smjene (K06 moja smjena)');
await nav('Aktivna'); await p.waitForTimeout(500); await shot('02-sef-aktivna'); step('K02 aktivna smjena');
await nav('Knjiga'); step('K04 knjiga');
await nav('Bilten'); step('K07 bilten');

// 3. KOMANDIR — cross-role: the officer request must be here
await role('Adnan Softić'); step('komandir (PC00 tabla)');
await nav('Odobrenja'); await p.waitForTimeout(700);
const komText = await p.locator('body').innerText();
const crossOk = komText.includes(MARK);
step('K03 odobrenja: officer request visible = '+crossOk);
await shot('03-komandir-odobrenja');
await nav('Raspored'); await p.waitForTimeout(700);
// generisi raspored for next month
await p.getByLabel('Sljedeći mjesec').click(); await p.waitForTimeout(500);
await p.getByRole('button',{name:/Generiši raspored/}).first().click().catch(()=>{}); await p.waitForTimeout(700);
await p.getByRole('button',{name:/Objavi raspored/}).click().catch(()=>{}); await p.waitForTimeout(400);
await p.getByRole('button',{name:/Objavi i obavijesti/}).click().catch(()=>{}); await p.waitForTimeout(700);
await shot('04-komandir-raspored-objavljen'); step('K01: generated + published next-month roster');
await nav('Naoružanje'); step('PC02 oprema');
await nav('Dokumenti'); step('PC03 dokumenti');

// 4. DEŽURNI
await role('Operativno-komunikacijski'); await p.waitForTimeout(800); await shot('05-dezurni-mapa'); step('OKC D01 mapa');
await nav('Bilteni'); step('D02 bilteni');
await nav('Brifing'); step('jutarnji brifing');

// 5. NAČELNIK
await role('Samir Begić'); await p.waitForTimeout(800); step('načelnik N01');
await nav('Analitika'); step('N02'); await nav('Kadar'); step('N03');

// 6. KOMESAR
await role('Uprava policije MUP DK'); await p.waitForTimeout(800); await shot('06-komesar-compstat'); step('komesar C01');
await nav('Prekovremeni'); step('C03'); await nav('Spremnost'); step('C04'); await nav('Kadrovi'); step('C05');

// 7. MINISTAR
await role('Kabinet ministra'); await p.waitForTimeout(700); step('ministar M01');
await nav('Simulacija'); step('M02'); await nav('Budžet'); await p.waitForTimeout(800); await shot('07-ministar-budzet'); step('M03 budžet (revenue lines)');
await nav('Resursi'); step('M04');

// 8. ADMINISTRACIJA (new role) — sees the citizen requests
await role('Administrativna služba'); await p.waitForTimeout(800); await shot('08-administracija'); step('administracija queue');

step('DONE — timeline complete');
console.log(log.join('\n'));
console.log('\nCROSS-ROLE (officer request seen by komandir):', crossOk);
console.log('TOTAL ERRORS:', errs.length);
if(errs.length) console.log(errs.slice(0,15).join('\n'));
await b.close();
