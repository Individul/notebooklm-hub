import { Notebook } from './types';

const STORAGE_KEY = 'notebooklm_hub_data_v1';

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'seed-legal-rm',
    notebookLmId: 'a1b2c3d4-legal-moldova-codes',
    title: 'Legislația Republicii Moldova (Codul Penal, de Executare și Procedură Penală)',
    description: 'Bază juridică consolidată a Republicii Moldova. Conține Codul penal (CP985/2002), Codul de executare (CE443/2004) și Codul de procedură penală (CPP122/2003) cu toate modificările la zi.',
    category: 'Juridic & Legislație RM',
    url: 'https://notebooklm.google.com/',
    sources: [
      { 
        id: 's-cp-rm', 
        title: 'Codul Penal al Republicii Moldova (Legea nr. 985/2002, actualizat)', 
        type: 'pdf',
        content: 'Codul penal al RM: Partea Generală și Partea Specială. Reglementează răspunderea penală, individualizarea pedepsei, art. 90 (condamnarea cu suspendare), art. 91 (liberarea condiționată înainte de termen), art. 92 (înlocuirea părții neexecutate cu o pedeapsă mai blândă), art. 96 (amânarea executării pedepsei pentru femei gravide și persoane cu copii până la 8 ani).'
      },
      { 
        id: 's-ce-rm', 
        title: 'Codul de Executare al Republicii Moldova (Legea nr. 443/2004, actualizat)', 
        type: 'pdf',
        content: 'Codul de executare al RM: Punerea în executare a hotărârilor judecătorești penale și civile, regimul de executare a pedepselor privative și neprivative de libertate, art. 205 (deținerea separată a condamnaților în penitenciare), art. 266-267 (procedura înaintării și examinării demersului de liberare condiționată).'
      },
      { 
        id: 's-cpp-rm', 
        title: 'Codul de Procedură Penală al Republicii Moldova (Legea nr. 122/2003, actualizat)', 
        type: 'pdf',
        content: 'Codul de procedură penală al RM: Urmărirea penală, judecarea cauzelor penale, căile de atac ordinare și extraordinare, art. 469 (chestiuni soluționate de instanță la punerea în executare a sentinței).'
      }
    ],
    tags: ['Drept Penal', 'Codul Penal', 'Codul de Executare', 'Legislație RM', 'Penitenciare'],
    audioOverviewStatus: 'generated',
    keyQuestions: [
      'Care sunt condițiile exacte pentru liberarea condiționată conform art. 91 Cod penal al RM?',
      'Ce prevede art. 92 Cod penal privind înlocuirea părții neexecutate cu o pedeapsă mai blândă?',
      'Ce prevede art. 96 Cod penal privind amânarea executării pedepsei?',
      'Cine se deține separat în penitenciare conform art. 205 Cod de executare al RM?'
    ],
    notes: 'Baza de date oficială a legislației RM este integrată și indexată complet în sistem. Fiecare articol solicitat este preluat exact din actele normative oficiale ale RM.',
    isFavorite: true,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  },
  {
    id: 'seed-contraventional-rm',
    notebookLmId: 'cc218-legal-contraventional-rm',
    title: 'Legislația contravențională a Republicii Moldova',
    description: 'Cadrul juridic contravențional consolidat al Republicii Moldova: Codul Contravențional (Legea nr. 218/2008), procedura contravențională, procesul-verbal de constatare, competența agenților constatatori, căile de atac și executarea sancțiunilor contravenționale.',
    category: 'Juridic & Legislație RM',
    url: 'https://notebooklm.google.com/',
    sources: [
      { 
        id: 's-cc-rm', 
        title: 'Codul Contravențional al Republicii Moldova (Legea nr. 218/2008, actualizat)', 
        type: 'pdf',
        content: 'Codul Contravențional al RM (Legea nr. 218/2008): Partea Generală și Partea Specială. Reglementează temeiurile răspunderii contravenționale, cauzele care înlătură răspunderea (starea de extremă necesitate, legitima apărare, cazul fortuit), sancțiunile contravenționale (avertismentul, amenda contravențională, munca neremunerată în folosul comunității, arestul contravențional, privarea de dreptul de a desfășura o activitate sau de a deține funcții, punctele de penalizare), individualizarea și aplicarea sancțiunii, termenul de prescripție a răspunderii contravenționale (art. 30).'
      },
      { 
        id: 's-proc-contraventionala', 
        title: 'Procedura Contravențională (Cartea a II-a a Codului Contravențional)', 
        type: 'pdf',
        content: 'Procedura contravențională în RM: Art. 374-474 Cod contravențional. Principiile procesului contravențional, drepturile și obligațiile persoanei în privința căreia a fost pornit procesul (art. 384), dreptul la apărare, asistența juridică garantată de stat, măsurile de asigurare a procedurii (reținerea, examinarea corporală, ridicarea bunurilor), întocmirea procesului-verbal cu privire la contravenție (art. 443 - cerințe de fond și formă, cauze de nulitate absolută).'
      },
      { 
        id: 's-cai-atac-executare', 
        title: 'Căile de Atac și Executarea Sancțiunilor Contravenționale', 
        type: 'doc',
        content: 'Contestarea deciziei agentului constatator: depunerea contestației împotriva procesului-verbal în termen de 15 zile la organul din care face parte agentul sau direct în instanța de judecată (art. 448). Judecarea cauzei contravenționale în instanță (art. 452-463), recursul împotriva hotărârii judecătorești (art. 465-474). Punerea în executare a sancțiunilor contravenționale (Cartea a III-a).'
      },
      { 
        id: 's-rcr-rm', 
        title: 'Regulamentul Circulației Rutiere al Republicii Moldova (HG RM nr. 357/2009)', 
        type: 'pdf',
        content: 'Regulamentul Circulației Rutiere (RCR) aprobat prin HG nr. 357/2009: normele de conduită pe drumurile publice din Republica Moldova, semnalizarea rutieră, viteza legală admisibilă (în localități max 50 km/h, în afara localităților 90 km/h etc.), prioritatea de trecere, regulile privind depășirea, oprirea, staționarea și parcarea vehiculelor.'
      },
      { 
        id: 's-lege-131-rm', 
        title: 'Legea nr. 131/2007 privind siguranța traficului rutier din Republica Moldova', 
        type: 'pdf',
        content: 'Cadrul normativ privind siguranța traficului rutier în Republica Moldova: drepturile și obligațiile participanților la trafic, cerințele tehnice pentru vehicule, atribuțiile organelor de supraveghere și control ale RM, starea de ebrietate și testarea alcoolscopică oficială a conducătorilor auto conform standardelor RM.'
      },
      { 
        id: 's-politia-agenti', 
        title: 'Legea nr. 320/2012 cu privire la activitatea Poliției (competențe contravenționale)', 
        type: 'doc',
        content: 'Competențele organelor de poliție în calitatea lor de agenți constatatori conform art. 400 Cod contravențional: atribuțiile de constatare a contravențiilor contra ordinii publice, securității circulației rutiere, drepturilor de proprietate; limitele exercitării forței fizice și a mijloacelor speciale în cadrul procedurii contravenționale.'
      },
      { 
        id: 's-csj-contraventional', 
        title: 'Jurisprudența Curții Supreme de Justiție a RM în materie contravențională', 
        type: 'text',
        content: 'Practica judiciară a instanțelor din Republica Moldova: nulitatea absolută a procesului-verbal în cazul lipsei mențiunilor obligatorii prevăzute la art. 443 alin. (1) (lipsa datei, a identității agentului sau a faptei concrete imputate), interpretarea dubiilor în favoarea persoanei (prezumția de nevinovăție), aplicarea sancțiunii sub limita minimă prevăzută de lege (art. 36) în prezența circumstanțelor atenuante deosebite.'
      }
    ],
    tags: ['Drept Contravențional', 'Codul Contravențional', 'Legislație RM', 'Procedură Contravențională', 'Proces-Verbal', 'Amenzi & Sancțiuni', 'RCR RM'],
    audioOverviewStatus: 'generated',
    keyQuestions: [
      'Care sunt cerințele obligatorii de întocmire a procesului-verbal cu privire la contravenție (art. 443) și când atrage nulitatea absolută?',
      'Care este termenul de prescripție pentru atragerea la răspundere contravențională conform art. 30 Cod contravențional?',
      'Cum și în ce termen se contestă decizia sau procesul-verbal emis de agentul constatator (termen de 15 zile)?',
      'Cum se aplică reducerea de 50% din amenda contravențională dacă plata se face în 3 zile lucrătoare (art. 34 alin. 3)?',
      'Care sunt sancțiunile pentru încălcarea regulilor de circulație rutieră (RCR / art. 228-245 CC RM)?'
    ],
    notes: 'Caiet dedicat legislației contravenționale oficiale a Republicii Moldova. Cuprinde Codul Contravențional (Legea nr. 218/2008), Regulamentul circulației rutiere (HG nr. 357/2009), Legea nr. 131/2007, procedura de constatare, contestare și jurisprudența instanțelor din RM.',
    isFavorite: true,
    createdAt: '2026-09-10T15:00:00.000Z',
    updatedAt: '2026-09-10T15:00:00.000Z'
  },
  {
    id: 'seed-1',
    notebookLmId: '2b34a66e-399d-47be-b21a-281b37b6cfdb',
    title: 'Cercetare LLM-uri & Tehnici RAG Avansate',
    description: 'Analiză comparativă între Gemini 1.5/2.0, Claude 3.5 și GPT-4o privind ferestrele mari de context, RAG hibrid și vector databases.',
    category: 'Cercetare & Știință',
    url: 'https://notebooklm.google.com/notebook/2b34a66e-399d-47be-b21a-281b37b6cfdb',
    sources: [
      { 
        id: 's-1', 
        title: 'Paper: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.pdf', 
        type: 'pdf',
        content: 'Extract din lucrarea RAG: Modelele RAG combină un modul de regăsire semantică (retriever bazat pe embeddings dense) cu un generator secvență-la-secvență. Principalele avantaje demonstrate sunt reducerea substanțială a halucinațiilor și accesul la cunoștințe actualizate în timp real fără a necesita re-antrenarea parametrilor rețelei.'
      },
      { 
        id: 's-2', 
        title: 'Gemini 1.5 Technical Report (Google DeepMind)', 
        type: 'web', 
        url: 'https://deepmind.google/technologies/gemini/',
        content: 'Raport Tehnic Gemini: Fereastra masivă de context permite procesarea a sute de pagini de documentație, depozite întregi de cod sau ore de conținut audio-video într-un singur prompt. În testele de regăsire informațională (Needle-In-A-Haystack), modelul atinge o acuratețe de peste 99% pe întreaga lungime a contextului.'
      },
      { 
        id: 's-3', 
        title: 'YouTube: Deep Dive into Hybrid Search & Reranking', 
        type: 'youtube', 
        url: 'https://youtube.com',
        content: 'Transcrierea video: Căutarea hibridă îmbină căutarea lexicală BM25 cu căutarea vectorială (dense embeddings). Un model cross-encoder pentru reordonare (reranker) crește precizia primelor 5 rezultate returnate cu până la 35% față de căutarea vectorială simplă.'
      }
    ],
    tags: ['AI', 'LLM', 'RAG', 'VectorDB', 'Gemini'],
    audioOverviewStatus: 'generated',
    keyQuestions: [
      'Care este diferența de precizie între RAG cu rerankers vs naive RAG?',
      'Cum se comportă contextul de 1M tokeni în comparație cu embeddings clasice?',
      'Care sunt cele mai mari provocări de latență în producție?'
    ],
    notes: 'Am generat podcastul audio de 12 minute în NotebookLM - sinteza este excelentă pentru recapitulare înainte de prezentare.',
    isFavorite: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-09T14:30:00.000Z'
  },
  {
    id: 'seed-2',
    notebookLmId: '4c55d77f-488e-46cf-c32b-392c48c7deef',
    title: 'Arhitectură Sisteme Distribuite & Event-Driven',
    description: 'Materiale de arhitectură pentru microservicii, Kafka, RabbitMQ, pattern-uri Saga și Outbox pentru consistență eventuală.',
    category: 'Dezvoltare & Programare',
    url: 'https://notebooklm.google.com/notebook/4c55d77f-488e-46cf-c32b-392c48c7deef',
    sources: [
      { 
        id: 's-4', 
        title: 'Designing Data-Intensive Applications (Martin Kleppmann Notes).pdf', 
        type: 'pdf',
        content: 'Principii Arhitectură Martin Kleppmann: În sistemele distribuite pe scară largă, consensul perfect (2-phase commit) este adesea prea lent și vulnerabil la căderi de noduri. Pattern-ul Transactional Outbox și procesarea asincronă bazată pe log-uri ordonate (Kafka) oferă consistență eventuală robustă.'
      },
      { 
        id: 's-5', 
        title: 'Google Docs: Plan de migrare spre Event-Driven Architecture', 
        type: 'drive',
        content: 'Plan de tranziție: Înlocuirea apelurilor sincrone REST dintre serviciul de comenzi și cel de plăți prin evenimente publicate pe un topic dedicat. Se introduce un consumator idempotent pentru a preveni dubla procesare a comenzilor.'
      },
      { 
        id: 's-6', 
        title: 'Apache Kafka Best Practices Guide', 
        type: 'web',
        content: 'Bune practici Kafka: Partiționarea mesajelor după cheia entității (ex: customer_id) pentru a garanta ordinea strictă a evenimentelor per utilizator. Setarea acks=all pentru producători critici.'
      }
    ],
    tags: ['Arhitectură', 'Kafka', 'Microservicii', 'Backend', 'Saga'],
    audioOverviewStatus: 'generated',
    keyQuestions: [
      'Cum gestionăm tranzacțiile distribuite fără 2-phase commit?',
      'Ce strategii de deduplicare a mesajelor folosim în consumatori?'
    ],
    notes: 'Adăugat capitolul despre idempotent consumer pattern. De revizuit înainte de ședința de arhitectură.',
    isFavorite: true,
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-09-08T11:15:00.000Z'
  },
  {
    id: 'seed-3',
    notebookLmId: '6e77f99a-599f-47dc-d43c-483d59d8ef0a',
    title: 'Ghid de Investiții & Analiză Macroeconomică',
    description: 'Rapoarte trimestriale, analize de piață, strategii ETF și indici bursieri (S&P 500, MSCI World, piețe emergente).',
    category: 'Finanțe & Business',
    url: 'https://notebooklm.google.com/notebook/6e77f99a-599f-47dc-d43c-483d59d8ef0a',
    sources: [
      { id: 's-7', title: 'Raport Trimestrial Piețe Financiare Q2-Q3.pdf', type: 'pdf' },
      { id: 's-8', title: 'Ghid Impozitare Investiții și Dividende', type: 'doc' }
    ],
    tags: ['Finanțe', 'Investiții', 'Macroeconomie', 'ETF'],
    audioOverviewStatus: 'pending',
    keyQuestions: [
      'Care este impactul reducerii ratelor dobânzilor asupra obligațiunilor?',
      'Cum optimizăm alocarea pe clase de active pentru un orizont de 10+ ani?'
    ],
    notes: 'Trebuie să încarc și raportul anual BNR odată ce va fi publicat.',
    isFavorite: false,
    createdAt: '2026-07-15T12:00:00.000Z',
    updatedAt: '2026-08-30T09:45:00.000Z'
  },
  {
    id: 'seed-4',
    notebookLmId: '8a99b11c-600a-48ed-e54d-594e60e9fa1b',
    title: 'Cursuri & Notițe Învățare Limbi Străine',
    description: 'Dialoguri avansate, reguli gramaticale și liste de vocabular organizate pe situații profesionale și călătorii.',
    category: 'Studiu & Cursuri',
    url: 'https://notebooklm.google.com/notebook/8a99b11c-600a-48ed-e54d-594e60e9fa1b',
    sources: [
      { id: 's-9', title: 'Vocabular B2-C1 Business English & Idioms.pdf', type: 'pdf' },
      { id: 's-10', title: 'Transcrierea podcasturilor de conversație', type: 'text' }
    ],
    tags: ['Limbi', 'Engleză', 'Studiu', 'Vocabular'],
    audioOverviewStatus: 'none',
    keyQuestions: [
      'Care sunt cele mai frecvente expresii idiomatice în negocieri?'
    ],
    notes: 'Audio overview încă nu a fost generat.',
    isFavorite: false,
    createdAt: '2026-06-10T14:20:00.000Z',
    updatedAt: '2026-07-22T16:00:00.000Z'
  }
];

export function extractNotebookLmId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Match UUID or alphanumeric ID pattern from URL
  const urlMatch = trimmed.match(/notebooklm\.google\.com\/notebook\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  // If user pasted just a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function formatNotebookLmUrl(idOrUrl: string): string {
  if (!idOrUrl) return 'https://notebooklm.google.com/';
  const trimmed = idOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://notebooklm.google.com/notebook/${trimmed}`;
}

export function getStoredNotebooks(): Notebook[] {
  if (typeof window === 'undefined') {
    return INITIAL_NOTEBOOKS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTEBOOKS));
      return INITIAL_NOTEBOOKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let modified = false;
      // Ensure seed-legal-rm is available at the top if not present
      if (!parsed.some(nb => nb.id === 'seed-legal-rm')) {
        parsed.unshift(INITIAL_NOTEBOOKS[0]);
        modified = true;
      }
      // Ensure seed-contraventional-rm is available right after seed-legal-rm and has latest official sources
      const contraventionalIdx = parsed.findIndex(nb => nb.id === 'seed-contraventional-rm');
      const latestContraventional = INITIAL_NOTEBOOKS.find(nb => nb.id === 'seed-contraventional-rm');
      if (contraventionalIdx === -1 && latestContraventional) {
        const insertIdx = parsed.findIndex(nb => nb.id === 'seed-legal-rm');
        if (insertIdx !== -1) {
          parsed.splice(insertIdx + 1, 0, latestContraventional);
        } else {
          parsed.unshift(latestContraventional);
        }
        modified = true;
      } else if (contraventionalIdx !== -1 && latestContraventional) {
        if (parsed[contraventionalIdx].sources.length < latestContraventional.sources.length) {
          parsed[contraventionalIdx].sources = latestContraventional.sources;
          parsed[contraventionalIdx].keyQuestions = latestContraventional.keyQuestions;
          parsed[contraventionalIdx].tags = latestContraventional.tags;
          parsed[contraventionalIdx].notes = latestContraventional.notes;
          modified = true;
        }
      }
      if (modified) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return INITIAL_NOTEBOOKS;
  } catch (err) {
    console.error('Error loading notebooks from storage:', err);
    return INITIAL_NOTEBOOKS;
  }
}

export function saveStoredNotebooks(notebooks: Notebook[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
  } catch (err) {
    console.error('Error saving notebooks to storage:', err);
  }
}

export function exportNotebooksAsJson(notebooks: Notebook[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notebooks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `notebooklm-hub-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportNotebooksAsMarkdown(notebooks: Notebook[]): void {
  let md = `# NotebookLM Hub Export\nGenerat la: ${new Date().toLocaleString('ro-RO')}\n\n`;
  notebooks.forEach((nb, index) => {
    md += `## ${index + 1}. ${nb.title} ${nb.isFavorite ? '⭐' : ''}\n`;
    md += `- **Categorie**: ${nb.category}\n`;
    md += `- **Link NotebookLM**: [Deschide în NotebookLM](${nb.url})\n`;
    md += `- **Status Audio Overview**: ${nb.audioOverviewStatus}\n`;
    if (nb.tags.length > 0) {
      md += `- **Etichete**: ${nb.tags.join(', ')}\n`;
    }
    md += `- **Descriere**: ${nb.description}\n`;
    if (nb.sources.length > 0) {
      md += `\n### Surse (${nb.sources.length}):\n`;
      nb.sources.forEach((s) => {
        md += `  - [${s.type.toUpperCase()}] ${s.title}${s.url ? ` (${s.url})` : ''}\n`;
      });
    }
    if (nb.keyQuestions.length > 0) {
      md += `\n### Întrebări Cheie:\n`;
      nb.keyQuestions.forEach((q) => {
        md += `  - ${q}\n`;
      });
    }
    if (nb.notes) {
      md += `\n### Note:\n${nb.notes}\n`;
    }
    md += `\n---\n\n`;
  });

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `notebooklm-hub-notes-${new Date().toISOString().slice(0, 10)}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
