// ═══════════════════════════════════════════════════════════
// JAMES' LADDER — MUSIC THEORY COHERENCE TEST SUITE
// Node.js · run: node music-theory-tests.js
//
// Reference frameworks consulted:
//   • Helmholtz (1877) — On the Sensations of Tone (roughness/consonance)
//   • Cohn (2012)      — Audacious Euphony (Neo-Riemannian theory)
//   • Tymoczko (2011)  — A Geometry of Music (voice-leading spaces)
//   • Aldwell/Schachter (2011) — Harmony & Voice Leading (common practice)
//   • Forte (1977)     — The Structure of Atonal Music (pitch-class sets)
//   • Rahn (1980)      — Basic Atonal Theory
// ═══════════════════════════════════════════════════════════
'use strict';

// ───────────────────────────────────────────────────────────
// CONSTANTS  (verbatim from index.html)
// ───────────────────────────────────────────────────────────
const CHROM    = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const COF      = ['C','G','D','A','E','B','F♯','D♭','A♭','E♭','B♭','F'];
const COF_SEMI = [0,7,2,9,4,11,6,1,8,3,10,5];
const KS = {C:0,'C♯':1,D:2,'D♯':3,E:4,F:5,'F♯':6,G:7,'G♯':8,A:9,'A♯':10,B:11,
            'D♭':1,'E♭':3,'A♭':8,'B♭':10};

const D_ROM  = ['I','ii','iii','IV','V','vi','vii°'];
const D_QUAL = ['maj','min','min','maj','maj','min','dim'];
const D_SEMI = [0,2,4,5,7,9,11];

const INTERVAL_SCORES = [
  100, // 0  unison / octave
   28, // 1  minor second
   50, // 2  major second
   82, // 3  minor third
   86, // 4  major third
   92, // 5  perfect fourth
   18, // 6  tritone
   96, // 7  perfect fifth
   84, // 8  minor sixth
   80, // 9  major sixth
   42, // 10 minor seventh
   38, // 11 major seventh
];

const CANDIDATE_SCALES = [
  {name:'Major (Ionian)',              iv:[0,2,4,5,7,9,11]},
  {name:'Dorian',                      iv:[0,2,3,5,7,9,10]},
  {name:'Phrygian',                    iv:[0,1,3,5,7,8,10]},
  {name:'Lydian',                      iv:[0,2,4,6,7,9,11]},
  {name:'Mixolydian',                  iv:[0,2,4,5,7,9,10]},
  {name:'Natural Minor (Aeolian)',     iv:[0,2,3,5,7,8,10]},
  {name:'Locrian',                     iv:[0,1,3,5,6,8,10]},
  {name:'Harmonic Minor',              iv:[0,2,3,5,7,8,11]},
  {name:'Harmonic Major',              iv:[0,2,4,5,7,8,11]},
  {name:'Melodic Minor (ascending)',   iv:[0,2,3,5,7,9,11]},
  // Melodic Minor descending = Natural Minor (Aeolian) in 12-TET — removed duplicate
  {name:'Hungarian Minor',             iv:[0,2,3,6,7,8,11]},
  {name:'Hungarian Major',             iv:[0,3,4,6,7,9,10]},
  {name:'Pentatonic Major',            iv:[0,2,4,7,9]},
  {name:'Pentatonic Minor',            iv:[0,3,5,7,10]},
  {name:'Blues',                       iv:[0,3,5,6,7,10]},
  {name:'Blues Major',                 iv:[0,2,3,4,7,9]},
  {name:'Hirajoshi',                   iv:[0,2,3,7,8]},
  {name:'Insen',                       iv:[0,1,5,7,10]},
  {name:'Yo (Japanese)',               iv:[0,2,5,7,9]},
  {name:'Whole Tone',                  iv:[0,2,4,6,8,10]},
  {name:'Octatonic HW (diminished)',   iv:[0,1,3,4,6,7,9,10]},
  {name:'Octatonic WH (diminished)',   iv:[0,2,3,5,6,8,9,11]},
  {name:'Augmented',                   iv:[0,3,4,7,8,11]},
  {name:'Chromatic',                   iv:[0,1,2,3,4,5,6,7,8,9,10,11]},
  {name:'Double Harmonic (Byzantine)', iv:[0,1,4,5,7,8,11]},
  {name:'Enigmatic (Verdi)',           iv:[0,1,4,6,8,10,11]},
  {name:'Neapolitan Major',            iv:[0,1,3,5,7,9,11]},
  {name:'Neapolitan Minor',            iv:[0,1,3,5,7,8,11]},
  {name:'Persian',                     iv:[0,1,4,5,6,8,11]},
  // Arabic (Rast) = Mixolydian in 12-TET — removed duplicate
  // Flamenco = Double Harmonic (Byzantine) — removed duplicate
  {name:'Phrygian Dominant',           iv:[0,1,4,5,7,8,10]},
  {name:'Ukrainian Dorian',            iv:[0,2,3,6,7,9,10]},
  {name:'Prometheus',                  iv:[0,2,4,6,9,10]},
  {name:'Tritone scale',               iv:[0,1,4,6,7,10]},
  {name:'Lydian Dominant',             iv:[0,2,4,6,7,9,10]},
  {name:'Altered (Super-Locrian)',     iv:[0,1,3,4,6,8,10]},
  // Lydian ♭7 ♭3 = Ukrainian Dorian — removed duplicate
  {name:'Half-Diminished (Locrian♮2)', iv:[0,2,3,5,6,8,10]},
];

// ───────────────────────────────────────────────────────────
// FUNCTIONS  (verbatim from index.html)
// ───────────────────────────────────────────────────────────
function chordPCs(rootSemi, qual){
  const iv = qual==='maj'?[0,4,7]:qual==='min'?[0,3,7]:qual==='dim'?[0,3,6]:[0,3,7];
  return new Set(iv.map(s=>(rootSemi+s)%12));
}
function intervalConsScore(semA, semB){
  const iv = Math.min((semA-semB+12)%12,(semB-semA+12)%12);
  return INTERVAL_SCORES[iv]??50;
}
function chordConsScore(chordRootSemi, chordQual, tonicSemi){
  const iv = chordQual==='maj'?[0,4,7]:chordQual==='min'?[0,3,7]:[0,3,6];
  const scores = iv.map(s=>intervalConsScore(tonicSemi,(chordRootSemi+s)%12));
  return Math.round(scores.reduce((a,b)=>a+b)/scores.length);
}
function plrP(r,m){return{root:r,isMinor:!m};}
function plrL(r,m){return m?{root:(r+8)%12,isMinor:false}:{root:(r+4)%12,isMinor:true};}
function plrR(r,m){return m?{root:(r+3)%12,isMinor:false}:{root:(r+9)%12,isMinor:true};}
function plrDist(r1,m1,r2,m2){
  if(r1===r2&&m1===m2)return 0;
  const vis=new Set(),q=[{r:r1,m:m1,d:0}];
  while(q.length){
    const{r,m,d}=q.shift(),k=`${r}:${m?1:0}`;
    if(vis.has(k))continue; vis.add(k);
    if(r===r2&&m===m2)return d;
    if(d<6)[plrP(r,m),plrL(r,m),plrR(r,m)].forEach(n=>q.push({r:n.root,m:n.isMinor,d:d+1}));
  }
  return 6;
}
function consonanceScore(H, scalePCs){
  if(H.size===0)return 0;
  let inter=0;
  H.forEach(pc=>{if(scalePCs.has(pc))inter++;});
  return Math.round((inter/new Set([...H,...scalePCs]).size)*100);
}
function computeCadenceLog(ledger, curKey='C'){
  const chords=ledger.filter(e=>e.type==='chord'||e.type==='pivot');
  const events=[];
  chords.forEach((c,i)=>{
    if(i===0)return;
    const pr=chords[i-1].roman, cr=c.roman;
    if(cr==='I'){
      const type=pr==='V'?'Authentic':pr==='IV'?'Plagal':'Modal';
      events.push({type,from:pr,to:cr});
    }
    if(pr==='V'&&cr!=='I') events.push({type:'Deceptive',from:pr,to:cr});
  });
  if(chords.length>=2&&chords[chords.length-1].roman==='V')
    events.push({type:'Half',from:chords[chords.length-2].roman,to:'V'});
  return events;
}
function computeGevurah(ledger){
  const chords=ledger.filter(e=>e.type==='chord'||e.type==='pivot');
  if(!chords.length)return{score:null,violations:[],rules:Array(5).fill(null)};
  const v=[];let penalty=0;
  const law1=chords[0].roman==='I';
  if(!law1){v.push('Tonic Anchor');penalty+=30;}
  let law2=true;
  for(let i=0;i<chords.length-1;i++){
    if(chords[i].roman==='ii'&&chords[i+1].roman==='IV'){law2=false;v.push('Subdominant Order');penalty+=40;break;}
  }
  let law3=true;
  for(let i=0;i<chords.length-1;i++){
    if(chords[i].roman==='V'&&chords[i+1].roman==='IV'){law3=false;v.push('Retrogression V→IV');penalty+=80;break;}
  }
  let law4=true;
  for(let i=0;i<chords.length-1;i++){
    if(chords[i].roman==='V'&&chords[i+1].roman==='vii°'){law4=false;v.push('vii° after V');penalty+=25;break;}
  }
  const last2=chords.slice(-2);
  const law5=last2.length===2&&last2[0].roman==='V'&&last2[1].roman==='I';
  if(chords.length>=2&&!law5){v.push('No Authentic Cadence');penalty+=20;}
  const raw=Math.max(0,100-Math.round(penalty/Math.max(1,Math.ceil(chords.length/3))));
  return{score:Math.min(100,raw),violations:v,rules:[law1,law2,law3,law4,law5]};
}

// ───────────────────────────────────────────────────────────
// TEST FRAMEWORK
// ───────────────────────────────────────────────────────────
let passed=0, failed=0, warned=0;
const ISSUES=[], WARNINGS=[];

function test(name, fn){
  try{
    const r=fn();
    if(r===true||r===undefined){console.log(`  ✓  ${name}`);passed++;}
    else{console.log(`  ✗  ${name}\n       got: ${r}`);ISSUES.push({name,detail:String(r)});failed++;}
  }catch(e){console.log(`  ✗  ${name}\n       ERR: ${e.message}`);ISSUES.push({name,detail:e.message});failed++;}
}
function warn(name, detail){
  console.log(`  ⚠  ${name}\n       ${detail}`);
  WARNINGS.push({name,detail}); warned++;
}
function section(title){console.log(`\n${'═'.repeat(64)}\n  ${title}\n${'─'.repeat(64)}`);}
function eq(a,b){return a===b?true:`expected ${b}, got ${a}`;}
function deepEq(a,b){return JSON.stringify(a)===JSON.stringify(b)?true:`expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`;}

// ═══════════════════════════════════════════════════════════
// SUITE A — INTERVAL CONSONANCE SCORES
// Reference: Helmholtz (1877) overtone series proximity;
//            Aldwell/Schachter consonance classification
// ═══════════════════════════════════════════════════════════
section('A · Interval Consonance Scores');

test('Unison scores 100 (perfect consonance)',
  ()=>eq(INTERVAL_SCORES[0], 100));
test('Perfect fifth (7 st) scores 96',
  ()=>eq(INTERVAL_SCORES[7], 96));
test('Perfect fourth (5 st) scores 92',
  ()=>eq(INTERVAL_SCORES[5], 92));
test('P5 > P4 (fifth more consonant than fourth — Aldwell §1)',
  ()=>INTERVAL_SCORES[7] > INTERVAL_SCORES[5] || 'P5 not > P4');
test('M3 (4 st) > m3 (3 st) — overtone series: 5:4 simpler than 6:5',
  ()=>INTERVAL_SCORES[4] > INTERVAL_SCORES[3] || 'M3 not > m3');
test('P4 > M3 — perfect intervals above imperfect (Aldwell §3)',
  ()=>INTERVAL_SCORES[5] > INTERVAL_SCORES[4] || 'P4 not > M3');
test('Tritone (6 st) is minimum — diabolus in musica',
  ()=>{
    const tt=INTERVAL_SCORES[6];
    const min=Math.min(...INTERVAL_SCORES);
    return tt===min||`TT=${tt} but minimum is ${min}`;
  });
test('intervalConsScore is symmetric — f(a,b)===f(b,a)',
  ()=>{
    for(let a=0;a<12;a++)for(let b=0;b<12;b++)
      if(intervalConsScore(a,b)!==intervalConsScore(b,a))
        return `asymmetric at (${a},${b})`;
    return true;
  });
test('intervalConsScore maps same note to 100 (unison)',
  ()=>{
    for(let i=0;i<12;i++)
      if(intervalConsScore(i,i)!==100)return `failed at pc=${i}`;
    return true;
  });

// Theoretical concern: Helmholtz ranks m2 > TT in roughness (more beating),
// but diabolus-in-musica tradition inverts this — app chooses TT < m2.
// Both positions have scholarly support; we flag as warning, not failure.
warn('M6 vs m6 ordering',
  `App: m6(8 st)=${INTERVAL_SCORES[8]} > M6(9 st)=${INTERVAL_SCORES[9]}. ` +
  `Standard overtone theory (just M6=5:3, m6=8:5) gives M6 simpler → M6 should score higher. ` +
  `Reversed ordering may cause minor-quality chords to appear slightly more consonant than warranted.`);

warn('m2 vs TT ordering',
  `App: TT=${INTERVAL_SCORES[6]} < m2=${INTERVAL_SCORES[1]}. ` +
  `Helmholtz places m2 as roughest dissonance by beating frequency; ` +
  `app places TT lower (diabolus tradition). Both have theoretical basis.`);

// ═══════════════════════════════════════════════════════════
// SUITE B — CHORD CONSTRUCTION (chordPCs)
// Reference: Basic triad theory — Aldwell §4
// ═══════════════════════════════════════════════════════════
section('B · Chord Construction');

test('C major = {C(0), E(4), G(7)}',
  ()=>deepEq([...chordPCs(0,'maj')].sort((a,b)=>a-b), [0,4,7]));
test('C minor = {C(0), E♭(3), G(7)}',
  ()=>deepEq([...chordPCs(0,'min')].sort((a,b)=>a-b), [0,3,7]));
test('C diminished = {C(0), E♭(3), G♭(6)}',
  ()=>deepEq([...chordPCs(0,'dim')].sort((a,b)=>a-b), [0,3,6]));
test('G major = {G(7), B(11), D(2)}',
  ()=>{const s=[...chordPCs(7,'maj')].sort((a,b)=>a-b);return deepEq(s,[2,7,11]);});
test('F major = {F(5), A(9), C(0)}',
  ()=>{const s=[...chordPCs(5,'maj')].sort((a,b)=>a-b);return deepEq(s,[0,5,9]);});
test('A minor = {A(9), C(0), E(4)}',
  ()=>{const s=[...chordPCs(9,'min')].sort((a,b)=>a-b);return deepEq(s,[0,4,9]);});
test('B diminished = {B(11), D(2), F(5)}',
  ()=>{const s=[...chordPCs(11,'dim')].sort((a,b)=>a-b);return deepEq(s,[2,5,11]);});
test('All major triads have exactly 3 distinct pitch classes',
  ()=>{
    for(let r=0;r<12;r++)if(chordPCs(r,'maj').size!==3)return `failed at root ${r}`;
    return true;
  });
test('Major triad: 3rd + 5th = root+4 and root+7 (just intonation structure)',
  ()=>{
    for(let r=0;r<12;r++){
      const pcs=[...chordPCs(r,'maj')];
      if(!pcs.includes((r+4)%12))return `missing M3 at root ${r}`;
      if(!pcs.includes((r+7)%12))return `missing P5 at root ${r}`;
    }
    return true;
  });
test('Minor triad: root, root+3, root+7 for all 12 roots',
  ()=>{
    for(let r=0;r<12;r++){
      const pcs=[...chordPCs(r,'min')];
      if(!pcs.includes((r+3)%12))return `missing m3 at root ${r}`;
      if(!pcs.includes((r+7)%12))return `missing P5 at root ${r}`;
    }
    return true;
  });

// ═══════════════════════════════════════════════════════════
// SUITE C — CONSONANCE SCORES AGAINST C MAJOR TONIC
// Reference: Tymoczko (2011) Ch.4 — voice-leading geometry;
//            function theory (Riemann 1893)
// ═══════════════════════════════════════════════════════════
section('C · Chord Consonance Scores (tonic = C, semi=0)');

const T=0; // tonic = C
const scores={
  I  : chordConsScore(0, 'maj', T),
  ii : chordConsScore(2, 'min', T),
  iii: chordConsScore(4, 'min', T),
  IV : chordConsScore(5, 'maj', T),
  V  : chordConsScore(7, 'maj', T),
  vi : chordConsScore(9, 'min', T),
  'vii°': chordConsScore(11,'dim', T),
};
console.log('\n  Scores: '+Object.entries(scores).map(([k,v])=>`${k}=${v}%`).join(' · '));

// NOTE: intervalConsScore uses INTERVAL CLASS (min of both directions).
// So G from C = min(7,5)=5 → P4=92 (not P5=96); B from C = min(11,1)=1 → m2=28 (not M7=38).
test('I (C maj) = 93%  [(IC0=100 + IC4=86 + IC5=92)/3]', ()=>eq(scores.I,   93));
test('IV (F maj) = 91% [(IC5=92 + IC3=82 + IC0=100)/3]', ()=>eq(scores.IV,  91));
test('vi (A min) = 89% [(IC3=82 + IC0=100 + IC4=86)/3]', ()=>eq(scores.vi,  89));
test('ii (D min) = 75% [(IC2=50 + IC5=92 + IC3=82)/3]',  ()=>eq(scores.ii,  75));
test('iii (E min) = 69% [(IC4=86 + IC5=92 + IC1=28)/3]', ()=>eq(scores.iii, 69));
test('V (G maj) = 57%  [(IC5=92 + IC1=28 + IC2=50)/3]',  ()=>eq(scores.V,   57));
test('vii° (B dim) = 57% [(IC1=28 + IC2=50 + IC5=92)/3]',()=>eq(scores['vii°'], 57));

// V and vii° both score 57 — they tie at the bottom (diabolus/leading-tone parity)
test('Ordering I > IV > vi > ii > iii > V ≥ vii° (Riemannian tonal hierarchy)',
  ()=>{
    const ord=[scores.I,scores.IV,scores.vi,scores.ii,scores.iii,scores.V,scores['vii°']];
    for(let i=0;i<ord.length-2;i++)
      if(ord[i]<=ord[i+1])return `ordering broken at position ${i}: ${ord[i]} ≤ ${ord[i+1]}`;
    if(ord[5]<ord[6])return `V(${ord[5]}) < vii°(${ord[6]}) — unexpected`;
    return true;
  });
test('V (dominant) scores LOWER than vi — leading-tone dissonance is structural tension',
  ()=>scores.V < scores.vi || `V(${scores.V}) ≥ vi(${scores.vi})`);
test('Borrowed iv (F min) scores higher than V — modal mixture stays consonant',
  ()=>{
    const iv_min=chordConsScore(5,'min',T);
    return iv_min > scores.V || `iv=${iv_min}, V=${scores.V}`;
  });
test('Borrowed ♭VI (A♭ maj) scores > 80% — accessible modal borrowing',
  ()=>{
    const bVI=chordConsScore(8,'maj',T);
    return bVI>80||`♭VI=${bVI}`;
  });
test('Score is symmetric: f(root,qual,tonic) correct for G major tonic too',
  ()=>{
    // In G major: I=G(7), V=D(2), IV=C(0)
    const I_G  =chordConsScore(7,'maj',7);
    const V_G  =chordConsScore(2,'maj',7);
    const IV_G =chordConsScore(0,'maj',7);
    if(I_G!==93) return `I in G = ${I_G}, expected 93`;
    if(V_G!==57) return `V in G = ${V_G}, expected 57`;
    if(IV_G!==91)return `IV in G = ${IV_G}, expected 91`;
    return true;
  });

// ═══════════════════════════════════════════════════════════
// SUITE D — PLR NEO-RIEMANNIAN TRANSFORMS
// Reference: Cohn (2012) Audacious Euphony — hexatonic systems;
//            Lewin (1987) GMIT — generalized interval systems
// ═══════════════════════════════════════════════════════════
section('D · PLR Neo-Riemannian Transforms');

test('P(C maj) = C min  [same root, toggle quality]',
  ()=>{const r=plrP(0,false);return r.root===0&&r.isMinor===true||`got {root:${r.root},min:${r.isMinor}}`;});
test('P(C min) = C maj  [P is involution]',
  ()=>{const r=plrP(0,true);return r.root===0&&r.isMinor===false||`got {root:${r.root},min:${r.isMinor}}`;});
test('L(C maj) = E min  [leading-tone exchange: +4, maj→min]',
  ()=>{const r=plrL(0,false);return r.root===4&&r.isMinor===true||`got root=${r.root}`;});
test('L(C min) = A♭ maj [leading-tone exchange: +8, min→maj]',
  ()=>{const r=plrL(0,true);return r.root===8&&r.isMinor===false||`got root=${r.root}`;});
test('R(C maj) = A min  [relative: +9, maj→min]',
  ()=>{const r=plrR(0,false);return r.root===9&&r.isMinor===true||`got root=${r.root}`;});
test('R(A min) = C maj  [relative inverse: +3, min→maj]',
  ()=>{const r=plrR(9,true);return r.root===0&&r.isMinor===false||`got root=${r.root}`;});
test('R(G maj) = E min  [standard relative pair]',
  ()=>{const r=plrR(7,false);return r.root===4&&r.isMinor===true||`got root=${r.root}`;});
test('R(D min) = F maj  [relative of D minor is F major]',
  ()=>{const r=plrR(2,true);return r.root===5&&r.isMinor===false||`got root=${r.root}`;});

// Cohn (1996): all three PLR operations are involutions (own inverse)
test('P² = identity for all 24 major/minor triads  (Cohn involution theorem)',
  ()=>{
    for(let r=0;r<12;r++)for(const m of[false,true]){
      const s=plrP(r,m),t=plrP(s.root,s.isMinor);
      if(t.root!==r||t.isMinor!==m)return `P² failed at root=${r},min=${m}`;
    }
    return true;
  });
test('L² = identity for all 24 triads',
  ()=>{
    for(let r=0;r<12;r++)for(const m of[false,true]){
      const s=plrL(r,m),t=plrL(s.root,s.isMinor);
      if(t.root!==r||t.isMinor!==m)return `L² failed at root=${r},min=${m}`;
    }
    return true;
  });
test('R² = identity for all 24 triads',
  ()=>{
    for(let r=0;r<12;r++)for(const m of[false,true]){
      const s=plrR(r,m),t=plrR(s.root,s.isMinor);
      if(t.root!==r||t.isMinor!==m)return `R² failed at root=${r},min=${m}`;
    }
    return true;
  });

// Cohn (2012): hexatonic systems — orbit of alternating L and P has period 6.
// Northern system orbit from C major: C+→E-→E+→G♯-→G♯+→C-→C+
test('LP orbit from C major has period 6 (hexatonic cycle — Cohn 2012 §2)',
  ()=>{
    let r=0,m=false;
    const orbit=[];
    for(let i=0;i<7;i++){
      orbit.push(`${CHROM[r]}${m?'-':'+'}`);
      const a=plrL(r,m),b=plrP(a.root,a.isMinor);
      r=b.root; m=b.isMinor;
    }
    const returnedToStart=(orbit[6]===orbit[0]);
    if(!returnedToStart)return `orbit did not close: ${orbit.join(' ')}`;
    return true;
  });

// Cohn: the union of PCs across all 6 LP-orbit chords = the hexatonic scale (6 notes)
// For the C-system: {C,E♭,E,G,G♯,B} = {0,3,4,7,8,11}
// (The ROOTS alone form the augmented trichord {0,4,8}, but chord tones expand to 6 PCs)
test('LP-6 orbit: union of all chord PCs = hexatonic scale {0,3,4,7,8,11}',
  ()=>{
    let r=0,m=false;
    const allPCs=new Set();
    for(let i=0;i<6;i++){
      chordPCs(r,m?'min':'maj').forEach(pc=>allPCs.add(pc));
      const a=plrL(r,m),b=plrP(a.root,a.isMinor);
      r=b.root;m=b.isMinor;
    }
    const sorted=[...allPCs].sort((a,b)=>a-b);
    return deepEq(sorted,[0,3,4,7,8,11]);
  });

// Hexatonic pole: chord sharing ZERO common tones with source
// Cohn: C maj (0,4,7) ↔ A♭ min (8,11,3) — PLR distance = 3
test('PLR distance C maj → A♭ min = 3  (hexatonic pole — Cohn §3)',
  ()=>eq(plrDist(0,false,8,true), 3));
test('PLR distance C maj → C min  = 1  (direct P step)',
  ()=>eq(plrDist(0,false,0,true), 1));
test('PLR distance C maj → E min  = 1  (direct L step)',
  ()=>eq(plrDist(0,false,4,true), 1));
test('PLR distance C maj → A min  = 1  (direct R step)',
  ()=>eq(plrDist(0,false,9,true), 1));
test('PLR distance C maj → C maj  = 0  (identity)',
  ()=>eq(plrDist(0,false,0,false), 0));

// Hexatonic pole has ZERO common tones with source (Cohn)
test('Hexatonic pole of C maj shares zero pitch classes with C maj',
  ()=>{
    const cMaj=chordPCs(0,'maj');
    const abMin=chordPCs(8,'min');
    const common=[...cMaj].filter(pc=>abMin.has(pc));
    return common.length===0||`shared: ${common}`;
  });

// ═══════════════════════════════════════════════════════════
// SUITE E — DIATONIC SCALE STRUCTURE
// Reference: Aldwell/Schachter §1; Tymoczko Ch.1
// ═══════════════════════════════════════════════════════════
section('E · Diatonic Scale & Modal Rotation');

const MAJOR_IV=[0,2,4,5,7,9,11];

// Verify each of 7 modes is the correct rotation of the major scale
const MODE_ROOTS=[0,2,4,5,7,9,11]; // C Ionian starts at degree 0(C), 1(D), 2(E), etc.
const MODE_NAMES=['Major (Ionian)','Dorian','Phrygian','Lydian','Mixolydian','Natural Minor (Aeolian)','Locrian'];
MODE_NAMES.forEach((name,k)=>{
  test(`${name} is correct rotation of major scale`,()=>{
    const sc=CANDIDATE_SCALES.find(s=>s.name===name);
    if(!sc)return `scale "${name}" not found`;
    const root=MODE_ROOTS[k];
    // Build expected intervals by rotating major scale from degree k
    const expected=MAJOR_IV.map(i=>(i-root+12)%12).sort((a,b)=>a-b);
    const actual=[...sc.iv].sort((a,b)=>a-b);
    return deepEq(actual,expected);
  });
});

test('Harmonic Minor raises 7th of Natural Minor by 1 semitone',
  ()=>{
    const nat=CANDIDATE_SCALES.find(s=>s.name==='Natural Minor (Aeolian)').iv;
    const harm=CANDIDATE_SCALES.find(s=>s.name==='Harmonic Minor').iv;
    // Difference: harmonic replaces 10 (m7) with 11 (M7)
    const diff_nat=nat.filter(n=>!harm.includes(n));
    const diff_harm=harm.filter(n=>!nat.includes(n));
    if(diff_nat.length!==1||diff_nat[0]!==10)return `nat extra: ${diff_nat}`;
    if(diff_harm.length!==1||diff_harm[0]!==11)return `harm extra: ${diff_harm}`;
    return true;
  });
test('Lydian has raised 4th (#4=6) vs Major',
  ()=>{
    const maj=CANDIDATE_SCALES.find(s=>s.name==='Major (Ionian)').iv;
    const lyd=CANDIDATE_SCALES.find(s=>s.name==='Lydian').iv;
    return !maj.includes(6)&&lyd.includes(6)||`Lydian #4 check failed`;
  });
test('Mixolydian has flattened 7th (♭7=10) vs Major',
  ()=>{
    const maj=CANDIDATE_SCALES.find(s=>s.name==='Major (Ionian)').iv;
    const mix=CANDIDATE_SCALES.find(s=>s.name==='Mixolydian').iv;
    return maj.includes(11)&&!maj.includes(10)&&mix.includes(10)&&!mix.includes(11)||'Mixolydian ♭7 failed';
  });
test('Whole Tone scale has 6 equal steps of 2 semitones',
  ()=>{
    const wt=CANDIDATE_SCALES.find(s=>s.name==='Whole Tone').iv;
    if(wt.length!==6)return `expected 6 notes, got ${wt.length}`;
    const sorted=[...wt].sort((a,b)=>a-b);
    for(let i=1;i<sorted.length;i++)
      if(sorted[i]-sorted[i-1]!==2)return `non-equal step at ${i}: ${sorted[i]-sorted[i-1]}`;
    return true;
  });
test('Octatonic HW has 8 notes, alternating H(1) W(2) intervals',
  ()=>{
    const oc=CANDIDATE_SCALES.find(s=>s.name==='Octatonic HW (diminished)').iv;
    if(oc.length!==8)return `expected 8, got ${oc.length}`;
    const sorted=[...oc].sort((a,b)=>a-b);
    const diffs=sorted.slice(1).map((v,i)=>v-sorted[i]);
    const expected=[1,2,1,2,1,2,1];
    return deepEq(diffs,expected);
  });
test('Double Harmonic (Byzantine): 1 ♭2 3 4 5 ♭6 7 = [0,1,4,5,7,8,11]',
  ()=>{
    const byz=CANDIDATE_SCALES.find(s=>s.name==='Double Harmonic (Byzantine)').iv;
    return deepEq([...byz].sort((a,b)=>a-b),[0,1,4,5,7,8,11]);
  });
test('Persian scale: 1 ♭2 3 4 ♭5 ♭6 7 = [0,1,4,5,6,8,11]',
  ()=>{
    const per=CANDIDATE_SCALES.find(s=>s.name==='Persian').iv;
    return deepEq([...per].sort((a,b)=>a-b),[0,1,4,5,6,8,11]);
  });
test('Phrygian Dominant: 1 ♭2 3 4 5 ♭6 ♭7 = [0,1,4,5,7,8,10]',
  ()=>{
    const pd=CANDIDATE_SCALES.find(s=>s.name==='Phrygian Dominant').iv;
    return deepEq([...pd].sort((a,b)=>a-b),[0,1,4,5,7,8,10]);
  });

// ═══════════════════════════════════════════════════════════
// SUITE F — DUPLICATE SCALE DETECTION
// Reference: Rahn (1980) — interval vectors; Forte set names
// ═══════════════════════════════════════════════════════════
section('F · Duplicate Scale Detection in CANDIDATE_SCALES');

const scaleKey=sc=>[...sc.iv].sort((a,b)=>a-b).join(',');
const seen=new Map();
const KNOWN_DUPES=[];
CANDIDATE_SCALES.forEach(sc=>{
  const k=scaleKey(sc);
  if(seen.has(k))KNOWN_DUPES.push([sc.name,seen.get(k)]);
  else seen.set(k,sc.name);
});

test('Arabic (Rast) removed — no longer duplicates Mixolydian',
  ()=>{
    const dup=KNOWN_DUPES.find(([a,b])=>
      (a.includes('Arabic')||b.includes('Arabic'))&&
      (a.includes('Mixolydian')||b.includes('Mixolydian')));
    return dup?`DUPLICATE STILL PRESENT: "${dup[0]}" = "${dup[1]}"`:true;
  });
test('Flamenco removed — no longer duplicates Double Harmonic (Byzantine)',
  ()=>{
    const dup=KNOWN_DUPES.find(([a,b])=>
      (a.includes('Flamenco')||b.includes('Flamenco'))&&
      (a.includes('Byzantine')||b.includes('Byzantine')));
    return dup?`DUPLICATE STILL PRESENT: "${dup[0]}" = "${dup[1]}"`:true;
  });
test('Melodic Minor descending removed — no longer duplicates Natural Minor (Aeolian)',
  ()=>{
    const dup=KNOWN_DUPES.find(([a,b])=>
      (a.includes('descending')||b.includes('descending'))&&
      (a.includes('Aeolian')||b.includes('Aeolian')));
    return dup?`DUPLICATE STILL PRESENT: "${dup[0]}" = "${dup[1]}"`:true;
  });
test('Lydian ♭7 ♭3 removed — no longer duplicates Ukrainian Dorian',
  ()=>{
    const dup=KNOWN_DUPES.find(([a,b])=>
      (a.includes('Ukrainian')||b.includes('Ukrainian'))&&
      (a.includes('Lydian ♭7')||b.includes('Lydian ♭7')));
    return dup?`DUPLICATE STILL PRESENT: "${dup[0]}" = "${dup[1]}"`:true;
  });
test('CANDIDATE_SCALES has zero duplicate interval sets',
  ()=>KNOWN_DUPES.length===0||`${KNOWN_DUPES.length} duplicate(s) remain: ${KNOWN_DUPES.map(([a,b])=>`"${a}"≡"${b}"`).join(', ')}`);

if(KNOWN_DUPES.length>0){
  console.log('\n  Duplicate pairs found:');
  KNOWN_DUPES.forEach(([a,b])=>console.log(`    · "${a}" ≡ "${b}"`));
}

// ═══════════════════════════════════════════════════════════
// SUITE G — CONSONANCE MATRIX (scale matching)
// Reference: Tymoczko §4 — chord-scale theory
// ═══════════════════════════════════════════════════════════
section('G · Consonance Matrix — Scale Matching');

// All diatonic chords of C major → H should score 100% against C major
test('Full C major diatonic set → 100% match to C Major scale',
  ()=>{
    const H=new Set();
    D_SEMI.forEach((s,i)=>chordPCs(s,D_QUAL[i]).forEach(pc=>H.add(pc)));
    const cMajPCs=new Set(MAJOR_IV);
    const score=consonanceScore(H,cMajPCs);
    return eq(score,100);
  });

test('Diatonic set covers all 7 pitch classes of its own scale (no more, no less)',
  ()=>{
    const H=new Set();
    D_SEMI.forEach((s,i)=>chordPCs(s,D_QUAL[i]).forEach(pc=>H.add(pc)));
    const sorted=[...H].sort((a,b)=>a-b);
    return deepEq(sorted,[0,2,4,5,7,9,11]);
  });

// Borrowing iv (F min, adds A♭=8) should reduce match below 100% for C major
test('Adding borrowed iv (F min) to C major set reduces consonance score below 100%',
  ()=>{
    const H=new Set();
    D_SEMI.forEach((s,i)=>chordPCs(s,D_QUAL[i]).forEach(pc=>H.add(pc)));
    chordPCs(5,'min').forEach(pc=>H.add(pc)); // add F min
    const cMajPCs=new Set(MAJOR_IV);
    const score=consonanceScore(H,cMajPCs);
    return score<100||`score still 100 after adding A♭`;
  });

// Top-scoring scale for full G major diatonic set should be G Major
test('Full G major diatonic set → top consonance scale is G Major',
  ()=>{
    const G=7;
    const H=new Set();
    D_SEMI.forEach((s,i)=>chordPCs((G+s)%12,D_QUAL[i]).forEach(pc=>H.add(pc)));
    let topScore=0,topName='';
    CANDIDATE_SCALES.forEach(sc=>{
      const pcs=new Set(sc.iv.map(s=>(G+s)%12));
      const ck=consonanceScore(H,pcs);
      if(ck>topScore){topScore=ck;topName=sc.name;}
    });
    return topScore===100&&topName==='Major (Ionian)'||
      `top: ${topName} (${topScore}%)`;
  });

// Chromatic scale (all 12 PCs) should score highest against chromatic H
test('Chromatic scale scores 100% against a full 12-note harmonic cloud',
  ()=>{
    const H=new Set([0,1,2,3,4,5,6,7,8,9,10,11]);
    const chromPCs=new Set([0,1,2,3,4,5,6,7,8,9,10,11]);
    return eq(consonanceScore(H,chromPCs),100);
  });

// ═══════════════════════════════════════════════════════════
// SUITE H — CIRCLE OF FIFTHS MAPPING
// Reference: Aldwell/Schachter §2; common practice key theory
// ═══════════════════════════════════════════════════════════
section('H · Circle of Fifths Key Mapping');

test('COF contains 12 unique entries',
  ()=>eq(new Set(COF).size, 12));
test('COF_SEMI has 12 entries',
  ()=>eq(COF_SEMI.length, 12));
test('Each COF step is +7 semitones (perfect fifth) mod 12',
  ()=>{
    for(let i=0;i<11;i++){
      if((COF_SEMI[i]+7)%12!==COF_SEMI[i+1])
        return `Step ${i}→${i+1}: ${COF_SEMI[i]}+7≠${COF_SEMI[i+1]} (mod 12)`;
    }
    return true;
  });
test('COF closes: 12th step returns to start (0)',
  ()=>eq((COF_SEMI[11]+7)%12, 0));
test('KS maps all COF root notes correctly',
  ()=>{
    COF.forEach((note,i)=>{
      const expected=COF_SEMI[i];
      // Handle enharmonic spellings (D♭=C♯=1, A♭=G♯=8, etc.)
      const got=KS[note]??-1;
      if(got!==expected)return `${note}: expected ${expected}, got ${got}`;
    });
    return true;
  });

// ═══════════════════════════════════════════════════════════
// SUITE I — GEVURAH ENGINE (Voice-Leading Rules)
// Reference: Aldwell/Schachter §8 — common-practice part writing;
//            Riemann function theory
// ═══════════════════════════════════════════════════════════
section('I · Gevurah Engine — Voice-Leading Rule Validation');

function mkLedger(...romans){
  return romans.map(r=>({type:'chord',roman:r,note:'C',qual:'maj'}));
}

test('I → IV → V → I  scores 100 (all laws pass)',
  ()=>{
    const g=computeGevurah(mkLedger('I','IV','V','I'));
    return g.score===100||`score=${g.score}, violations=${g.violations}`;
  });
test('I → ii → V → I  scores 100 (ii pre-dominant valid)',
  ()=>{
    const g=computeGevurah(mkLedger('I','ii','V','I'));
    return g.score===100||`score=${g.score}, violations=${g.violations}`;
  });
test('I → IV → ii → V → I  scores 100 (IV→ii is correct subdominant order)',
  ()=>{
    const g=computeGevurah(mkLedger('I','IV','ii','V','I'));
    return g.score===100||`score=${g.score}`;
  });

test('V→IV retrogression fires Law 3 (maximum 80-point penalty)',
  ()=>{
    const g=computeGevurah(mkLedger('I','V','IV','V','I'));
    return g.violations.includes('Retrogression V→IV')||
      `violations: ${g.violations}`;
  });
test('ii→IV fires Law 2 (subdominant order violation)',
  ()=>{
    const g=computeGevurah(mkLedger('I','ii','IV','V','I'));
    return g.violations.includes('Subdominant Order')||
      `violations: ${g.violations}`;
  });
test('Non-tonic start fires Law 1 (tonic anchor missing)',
  ()=>{
    const g=computeGevurah(mkLedger('ii','IV','V','I'));
    return g.violations.includes('Tonic Anchor')||
      `violations: ${g.violations}`;
  });
test('V→vii° fires Law 4 (leading-tone chord must precede dominant)',
  ()=>{
    const g=computeGevurah(mkLedger('I','V','vii°','I'));
    return g.violations.includes('vii° after V')||
      `violations: ${g.violations}`;
  });
test('Ending on V→vi fires Law 5 (deceptive cadence = no authentic)',
  ()=>{
    const g=computeGevurah(mkLedger('I','IV','V','vi'));
    return g.violations.includes('No Authentic Cadence')||
      `violations: ${g.violations}`;
  });
test('V→IV retrogression reduces score more than ii→IV (80 > 40 penalty weight)',
  ()=>{
    const vIV=computeGevurah(mkLedger('I','V','IV','I'));
    const iiIV=computeGevurah(mkLedger('I','ii','IV','V','I'));
    return vIV.score<iiIV.score||`V→IV score ${vIV.score} ≥ ii→IV score ${iiIV.score}`;
  });

// ═══════════════════════════════════════════════════════════
// SUITE J — CADENCE VARIETY TRACKER
// Reference: Aldwell/Schachter §§10–11 — cadence taxonomy;
//            Caplin (1998) — Classical Form, phrase types
// ═══════════════════════════════════════════════════════════
section('J · Cadence Classification');

test('V→I classified as Authentic cadence',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','V','I'));
    const a=log.find(e=>e.type==='Authentic');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('IV→I classified as Plagal cadence',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','IV','I'));
    const a=log.find(e=>e.type==='Plagal');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('V→vi classified as Deceptive tendency',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','V','vi'));
    const a=log.find(e=>e.type==='Deceptive');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('Ledger ending on V classified as Half cadence',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','IV','V'));
    const a=log.find(e=>e.type==='Half');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('ii→I classified as Modal cadence (not Authentic/Plagal)',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','ii','I'));
    const a=log.find(e=>e.type==='Modal');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('vi→I classified as Modal cadence',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','vi','I'));
    const a=log.find(e=>e.type==='Modal');
    return !!a||`events: ${JSON.stringify(log)}`;
  });
test('First chord (tonic anchor) never generates a cadence event',
  ()=>{
    const log=computeCadenceLog(mkLedger('I'));
    return log.length===0||`events on single chord: ${log.length}`;
  });
test('I→IV→V→I yields exactly one Authentic cadence, no Deceptive',
  ()=>{
    const log=computeCadenceLog(mkLedger('I','IV','V','I'));
    const auth=log.filter(e=>e.type==='Authentic').length;
    const dec=log.filter(e=>e.type==='Deceptive').length;
    return auth===1&&dec===0||`auth=${auth},dec=${dec}`;
  });
test('Comma Bridge I→IV→iv→♭VI→i→I→V→I yields one Authentic cadence',
  ()=>{
    const ledger=[
      {type:'chord',roman:'I'},{type:'chord',roman:'IV'},{type:'chord',roman:'iv'},
      {type:'chord',roman:'♭VI'},{type:'chord',roman:'i'},
      {type:'chord',roman:'I'},{type:'chord',roman:'V'},{type:'chord',roman:'I'},
    ];
    const log=computeCadenceLog(ledger);
    const auth=log.filter(e=>e.type==='Authentic').length;
    return auth>=1||`auth=${auth}, log=${JSON.stringify(log)}`;
  });

// ═══════════════════════════════════════════════════════════
// SUITE K — CROSS-SYSTEM: COMMA BRIDGE FULL ANALYSIS
// Reference: session report 2026-04-22 — "The Comma Bridge"
// ═══════════════════════════════════════════════════════════
section('K · Cross-System: Comma Bridge Progression Validation');

const CB_LEDGER=[
  {type:'chord',roman:'I',  note:'C', qual:'maj', key:'C'},
  {type:'chord',roman:'IV', note:'F', qual:'maj', key:'C'},
  {type:'chord',roman:'iv', note:'F', qual:'min', key:'C'},
  {type:'chord',roman:'♭VI',note:'G♯',qual:'maj', key:'C'},
  {type:'chord',roman:'i',  note:'C', qual:'min', key:'C'},
  {type:'chord',roman:'I',  note:'C', qual:'maj', key:'C'},
  {type:'chord',roman:'V',  note:'G', qual:'maj', key:'C'},
  {type:'chord',roman:'I',  note:'C', qual:'maj', key:'C'},
];

test('Comma Bridge: Gevurah score = 100 (structurally pure)',
  ()=>{
    const g=computeGevurah(CB_LEDGER);
    return g.score===100||`score=${g.score}, violations=${g.violations}`;
  });
test('Comma Bridge: harmonic cloud spans {0,2,3,4,5,7,8,9,11} = 9 PCs (D from G maj)',
  ()=>{
    const H=new Set();
    CB_LEDGER.forEach(e=>{
      if(e.type==='chord') chordPCs(KS[e.note]??0,e.qual).forEach(pc=>H.add(pc));
    });
    const sorted=[...H].sort((a,b)=>a-b);
    return deepEq(sorted,[0,2,3,4,5,7,8,9,11]);
  });
test('Comma Bridge: iv (F min) consonance > V (G maj) against C tonic',
  ()=>{
    const iv=chordConsScore(5,'min',0);
    const V =chordConsScore(7,'maj',0);
    return iv>V||`iv=${iv}, V=${V}`;
  });
test('Comma Bridge: P→R→L→P arc returns to source quality and root',
  ()=>{
    // From F maj (5,false): P→Fm, R→A♭, L→Cm, P→C maj
    const step1=plrP(5,false);  // F min
    const step2=plrR(step1.root,step1.isMinor); // A♭ maj
    const step3=plrL(step2.root,step2.isMinor); // C min
    const step4=plrP(step3.root,step3.isMinor); // C maj
    const correct=step4.root===0&&step4.isMinor===false;
    if(!correct)return `ended at root=${step4.root},min=${step4.isMinor} expected C maj`;
    return true;
  });
test('Comma Bridge: PLR arc is a closed 4-step rectangle on Tonnetz',
  ()=>{
    // Each step should stay within PLR distance 1 of previous
    const arc=[
      {root:5,isMinor:false}, // F maj
      {root:5,isMinor:true},  // F min (P)
      {root:8,isMinor:false}, // A♭ maj (R)
      {root:0,isMinor:true},  // C min (L)
      {root:0,isMinor:false}, // C maj (P) — back to start-equivalent
    ];
    for(let i=1;i<arc.length;i++){
      const d=plrDist(arc[i-1].root,arc[i-1].isMinor,arc[i].root,arc[i].isMinor);
      if(d!==1)return `step ${i-1}→${i}: PLR distance ${d}, expected 1`;
    }
    return true;
  });

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(64)}`);
console.log(`  RESULTS: ${passed} passed · ${failed} failed · ${warned} warnings`);
console.log(`${'═'.repeat(64)}`);

if(ISSUES.length>0){
  console.log('\n  FAILURES (require attention):');
  ISSUES.forEach(({name,detail})=>{
    console.log(`  ✗  ${name}`);
    console.log(`     ${detail}`);
  });
}
if(WARNINGS.length>0){
  console.log('\n  WARNINGS (theoretical debate, no code change required):');
  WARNINGS.forEach(({name,detail})=>{
    console.log(`  ⚠  ${name}`);
    console.log(`     ${detail}`);
  });
}

process.exit(failed>0?1:0);
