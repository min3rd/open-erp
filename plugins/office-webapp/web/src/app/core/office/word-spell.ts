import { acceptedText, setAcceptedText } from './word-markup';
import type { WordBlock, WordDocument } from './types';

export type SpellIssueKind = 'repeated' | 'spelling' | 'grammar';

export interface SpellIssue {
  paragraphIndex: number;
  start: number;
  end: number;
  word: string;
  suggestion: string;
  kind: SpellIssueKind;
  /** Additional corrections offered in the panel, primary suggestion excluded. */
  alternatives?: string[];
}

const MISSPELLINGS: Record<string, string> = {
  teh: 'the', recieve: 'receive', adress: 'address', occured: 'occurred',
  seperate: 'separate', definately: 'definitely', untill: 'until', wierd: 'weird',
  thier: 'their', alot: 'a lot', dont: "don't", cant: "can't", wont: "won't",
  isnt: "isn't", didnt: "didn't", doesnt: "doesn't", couldnt: "couldn't",
  wouldnt: "wouldn't", shouldnt: "shouldn't", hasnt: "hasn't", havent: "haven't",
  accomodate: 'accommodate', enviroment: 'environment', goverment: 'government',
  independant: 'independent', necesary: 'necessary', publically: 'publicly',
  refered: 'referred', succesful: 'successful', tommorow: 'tomorrow',
  begining: 'beginning', beleive: 'believe', calender: 'calendar', cemetary: 'cemetery',
  collegue: 'colleague', comming: 'coming', commitee: 'committee', completly: 'completely',
  concious: 'conscious', curiousity: 'curiosity', decieve: 'deceive', dilemna: 'dilemma',
  embarass: 'embarrass', existance: 'existence', familar: 'familiar', finaly: 'finally',
  foriegn: 'foreign', fourty: 'forty', freind: 'friend', gaurd: 'guard',
  happend: 'happened', harrass: 'harass', immediatly: 'immediately', incidently: 'incidentally',
  knowlege: 'knowledge', liesure: 'leisure', maintainance: 'maintenance', managable: 'manageable',
  millenium: 'millennium', mispell: 'misspell', neccessary: 'necessary', noticable: 'noticeable',
  occassion: 'occasion', occurence: 'occurrence', oppurtunity: 'opportunity', paralel: 'parallel',
  pasttime: 'pastime', persistant: 'persistent', personel: 'personnel', posession: 'possession',
  prefered: 'preferred', priviledge: 'privilege', probaly: 'probably', proffesional: 'professional',
  promiss: 'promise', pronounciation: 'pronunciation', quater: 'quarter', questionaire: 'questionnaire',
  realy: 'really', recomend: 'recommend', referance: 'reference', relevent: 'relevant',
  religous: 'religious', remeber: 'remember', responsability: 'responsibility', rythm: 'rhythm',
  scedule: 'schedule', seams: 'seems', sieze: 'seize', similiar: 'similar',
  sincerly: 'sincerely', speach: 'speech', strenght: 'strength', succesfully: 'successfully',
  suprise: 'surprise', temprature: 'temperature', tendancy: 'tendency', therefor: 'therefore',
  threshhold: 'threshold', tounge: 'tongue', truely: 'truly', unfortunatly: 'unfortunately',
  usefull: 'useful', usualy: 'usually', vaccuum: 'vacuum', vegtable: 'vegetable',
  vehical: 'vehicle', visable: 'visible', wellcome: 'welcome', wether: 'whether',
  writting: 'writing', yeild: 'yield', arguement: 'argument', basicly: 'basically',
  buisness: 'business', catagory: 'category', changable: 'changeable', comitted: 'committed',
  comparision: 'comparison', competant: 'competent', concernned: 'concerned', consistant: 'consistent',
  conveniant: 'convenient', critisize: 'criticize', definate: 'definite',
  dependant: 'dependent', developement: 'development', diffrent: 'different', dissapoint: 'disappoint',
  dissapear: 'disappear', eficient: 'efficient', embarassed: 'embarrassed', enviromental: 'environmental',
  equiptment: 'equipment', excelent: 'excellent', excercise: 'exercise', expresion: 'expression',
  febuary: 'february', florescent: 'fluorescent', formely: 'formerly', fourtytwo: 'forty-two',
  acheive: 'achieve', adressable: 'addressable', agressive: 'aggressive', aquisition: 'acquisition',
  arguements: 'arguments', assesment: 'assessment', availabe: 'available', beggining: 'beginning',
  beleived: 'believed', benefitial: 'beneficial', buisnesses: 'businesses', carefull: 'careful',
  cieling: 'ceiling', colaborate: 'collaborate', compatability: 'compatibility', concensus: 'consensus',
  configuartion: 'configuration', consistancy: 'consistency', contruction: 'construction', critera: 'criteria',
  custmer: 'customer', decomission: 'decommission', deliverd: 'delivered', dependancy: 'dependency',
  deployement: 'deployment', descision: 'decision', develope: 'develop', documnet: 'document',
  efficency: 'efficiency', endpoit: 'endpoint', enviroments: 'environments', evalution: 'evaluation',
  exmaple: 'example', experiance: 'experience', explict: 'explicit', failiure: 'failure',
  featue: 'feature', foward: 'forward', fucntion: 'function', gaurantee: 'guarantee',
  guidline: 'guideline', happends: 'happens', heirarchy: 'hierarchy', imediately: 'immediately',
  implmentation: 'implementation', inital: 'initial', intall: 'install', intergration: 'integration',
  langauge: 'language', liason: 'liaison', maintainence: 'maintenance', managment: 'management',
  mecanism: 'mechanism', migrateion: 'migration', mispelled: 'misspelled', monitorng: 'monitoring',
  neccessarily: 'necessarily', notifcation: 'notification', occational: 'occasional', ommited: 'omitted',
  paramter: 'parameter', performace: 'performance', permenant: 'permanent', posibility: 'possibility',
  preferrable: 'preferable', procede: 'proceed', procesing: 'processing', programe: 'programme',
  qouta: 'quota', recieved: 'received', recomendation: 'recommendation', refering: 'referring',
  releated: 'related', reponse: 'response', requirment: 'requirement', resouce: 'resource',
  retreive: 'retrieve', scehdule: 'schedule', scriptng: 'scripting', secuirty: 'security',
  sucessful: 'successful', supercede: 'supersede', syncronous: 'synchronous', techonology: 'technology',
  thresold: 'threshold', transfered: 'transferred', unfortunatley: 'unfortunately', uptade: 'update',
  usefullness: 'usefulness', utilites: 'utilities', verfication: 'verification', virtuall: 'virtual',
  vulnerablity: 'vulnerability', wheter: 'whether', witout: 'without', woudl: 'would', writen: 'written',
  advices: 'advice', informations: 'information', equipments: 'equipment', softwares: 'software',
  staffs: 'staff', researches: 'research', feedbacks: 'feedback', knowledges: 'knowledge',
  furnitures: 'furniture', luggages: 'luggage', baggages: 'baggage', homeworks: 'homework',
  traffics: 'traffic', evidences: 'evidence', trainings: 'training', progresses: 'progress',
};

/** Explicit malformed Vietnamese diacritics (unambiguous corrections). */
const VIETNAMESE_TYPOS: Record<string, string> = {
  'khống': 'không', 'ngừoi': 'người', 'ngườii': 'người', 'viẹc': 'việc', 'viêc': 'việc',
  'đựơc': 'được', 'đươc': 'được', 'đưoc': 'được', 'nghịêp': 'nghiệp', 'nghêp': 'nghiệp',
  'giãi': 'giải', 'thụât': 'thuật', 'kỹ thụât': 'kỹ thuật', 'chưong trình': 'chương trình',
  'hệ thông': 'hệ thống', 'ưng dụng': 'ứng dụng', 'công nghẹ': 'công nghệ', 'công nghê': 'công nghệ',
  'kinh nghiêm': 'kinh nghiệm', 'kinh ngiệm': 'kinh nghiệm', 'kỹ thuât': 'kỹ thuật',
  khong: 'không', duoc: 'được', nguoi: 'người', viec: 'việc', nghiep: 'nghiệp', cong: 'công',
};

/** Extra corrections offered alongside the primary suggestion. */
const ALTERNATIVES: Record<string, string[]> = {
  teh: ['tech', 'ten'],
  adress: ['addresses', 'addressing'],
  recieve: ['relieve'],
  wierd: ['wired'],
  thier: ['there', "they're"],
  alot: ['allot'],
  cong: ['công', 'cổng'],
  duoc: ['được', 'đước'],
  khong: ['không', 'khổng'],
  nguoi: ['người', 'nguôi'],
  viec: ['việc', 'vực'],
};

const SENTENCE_ABBREVIATIONS = new Set([
  'v', 'tp', 'p', 'q', 'ks', 'ths', 'ts', 'pgs', 'gs', 'st', 'mr', 'mrs', 'ms', 'dr', 'etc', 'vs', 'no',
]);

/** Base verbs that need -s/-es after he/she/it. */
const BASE_VERBS = new Set([
  'go', 'do', 'have', 'be', 'say', 'make', 'take', 'come', 'know', 'think', 'see', 'get', 'give',
  'find', 'tell', 'become', 'show', 'leave', 'feel', 'put', 'bring', 'begin', 'keep', 'hold',
  'write', 'stand', 'hear', 'let', 'mean', 'set', 'meet', 'run', 'pay', 'sit', 'speak', 'lead',
  'read', 'grow', 'lose', 'fall', 'send', 'build', 'understand', 'draw', 'break', 'spend', 'cut',
  'rise', 'drive', 'buy', 'wear', 'choose', 'use', 'need', 'want', 'work', 'call', 'try', 'ask',
  'seem', 'help', 'turn', 'start', 'move', 'live', 'believe', 'happen', 'provide', 'include',
  'continue', 'change', 'create', 'support', 'require', 'offer', 'allow', 'follow', 'produce',
]);

const PLURAL_SUBJECTS = [
  'reports', 'documents', 'files', 'users', 'systems', 'services', 'applications', 'projects',
  'products', 'teams', 'pages', 'tables', 'requirements', 'results', 'issues', 'items', 'records',
  'questions', 'answers', 'tasks', 'features',
];
const SINGULAR_SUBJECTS = [
  'report', 'document', 'file', 'user', 'system', 'service', 'application', 'project', 'product',
  'team', 'page', 'table', 'requirement', 'result', 'issue', 'item', 'record', 'question', 'answer',
  'task', 'feature', 'information', 'advice', 'equipment', 'software', 'research', 'feedback',
  'knowledge', 'furniture', 'luggage', 'baggage', 'homework', 'traffic', 'evidence', 'training',
  'progress',
];

/** Words starting with a vowel letter but a consonant sound (take "a"). */
const A_SOUNDS = new Set([
  'university', 'universities', 'user', 'users', 'uniform', 'union', 'unit', 'unique', 'universal',
  'useful', 'usual', 'european', 'one', 'once', 'url', 'urls', 'usb', 'uk', 'unicode',
]);
/** Words starting with a consonant letter but a vowel sound (take "an"). */
const AN_SOUNDS = new Set(['hour', 'hours', 'honest', 'honor', 'honour', 'heir', 'heirs']);

const PREPOSITION_FIXES: Array<[RegExp, string]> = [
  [/\bdepend of\b/giu, 'depend on'],
  [/\bdepends of\b/giu, 'depends on'],
  [/\bdepended of\b/giu, 'depended on'],
  [/\bresponsible of\b/giu, 'responsible for'],
  [/\binterested on\b/giu, 'interested in'],
  [/\bdiscuss about\b/giu, 'discuss'],
  [/\bexplain about\b/giu, 'explain'],
  [/\bcapable to\b/giu, 'capable of'],
  [/\bconcentrate in\b/giu, 'concentrate on'],
  [/\bdepend from\b/giu, 'depend on'],
  [/\bafraid from\b/giu, 'afraid of'],
  [/\bdifferent than\b/giu, 'different from'],
  [/\bsuperior than\b/giu, 'superior to'],
  [/\binferior than\b/giu, 'inferior to'],
  [/\bmarried with\b/giu, 'married to'],
  [/\bdespite of\b/giu, 'despite'],
  [/\bmore better\b/giu, 'better'],
  [/\bmore easier\b/giu, 'easier'],
  [/\bmore faster\b/giu, 'faster'],
  [/\bmore bigger\b/giu, 'bigger'],
  [/\bmore worse\b/giu, 'worse'],
  [/\bmost easiest\b/giu, 'easiest'],
  [/\bmost fastest\b/giu, 'fastest'],
  [/\bmost best\b/giu, 'best'],
  [/\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/giu, 'on $1'],
];

const VIETNAMESE_PEOPLE = 'người|học sinh|sinh viên|giáo viên|kỹ sư|nhân viên|chuyên gia|bác sĩ|giám đốc|trẻ em|đứa trẻ';

const PLURAL_IS = new RegExp(`\\b(${PLURAL_SUBJECTS.join('|')})\\s+is\\b`, 'giu');
const SINGULAR_ARE = new RegExp(`\\b(${SINGULAR_SUBJECTS.join('|')})\\s+are\\b`, 'giu');
const ARTICLE = /\b(a|an)\s+([\p{L}][\p{L}']*)\b/giu;
const VN_CLASSIFIER = new RegExp(`\\b(những|các)\\s+cái\\s+(${VIETNAMESE_PEOPLE})\\b`, 'giu');
const VN_ONE_CLASSIFIER = new RegExp(`\\bmột\\s+cái\\s+(${VIETNAMESE_PEOPLE})\\b`, 'giu');
const VN_QUANTIFIER = /\b(những|các)\s+(một|mỗi|từng)\b/giu;
const VN_ONE_OF = /\bmột\s+(những|các)\b/giu;

function thirdPerson(verb: string): string {
  if (verb === 'have') return 'has';
  if (verb === 'be') return 'is';
  if (verb === 'do') return 'does';
  if (verb === 'go') return 'goes';
  if (/(s|x|z|ch|sh|o)$/.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

function matchCase(replacement: string, original: string): string {
  if (!original || original[0] !== original[0].toUpperCase() || original[0] === original[0].toLowerCase()) return replacement;
  return replacement.charAt(0).toUpperCase() + replacement.slice(1);
}

function articleFix(article: string, word: string): string | null {
  const lower = word.toLowerCase();
  const vowelSound = /^[aeiou]/.test(lower);
  const needsAn = AN_SOUNDS.has(lower) || (vowelSound && !A_SOUNDS.has(lower));
  const isA = article.toLowerCase() === 'a';
  if (isA !== needsAn) return null;
  const fixed = needsAn ? 'an' : 'a';
  return matchCase(`${fixed} ${word}`, `${article} ${word}`);
}

export function checkWordSpelling(blocks: WordBlock[], ignored: Set<string> = new Set()): SpellIssue[] {
  const issues: SpellIssue[] = [];
  const push = (paragraphIndex: number, start: number, end: number, word: string, suggestion: string, kind: SpellIssueKind, alternatives?: string[]) => {
    if (ignored.has(word.toLowerCase())) return;
    issues.push({ paragraphIndex, start, end, word, suggestion, kind, alternatives });
  };

  blocks.forEach((block, paragraphIndex) => {
    if (block.kind !== 'paragraph') return;
    const text = acceptedText(block.paragraph);
    if (!text) return;
    const vietnamese = /[\u00C0-\u1EF9]/.test(text);

    if (!vietnamese) {
      for (const match of text.matchAll(/(?<![\p{L}\p{N}])([\p{L}\p{N}]+)\s+\1(?![\p{L}\p{N}])/giu)) {
        push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'repeated');
      }
    }
    for (const match of text.matchAll(/[\p{L}]+/gu)) {
      const word = match[0];
      const lower = word.toLowerCase();
      const suggestion = MISSPELLINGS[lower] ?? VIETNAMESE_TYPOS[word] ?? VIETNAMESE_TYPOS[lower];
      if (!suggestion) continue;
      const alternatives = ALTERNATIVES[lower]?.filter((item) => item !== suggestion);
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + word.length, word, suggestion, 'spelling', alternatives);
    }
    for (const [wrong, right] of Object.entries(VIETNAMESE_TYPOS)) {
      if (!wrong.includes(' ')) continue;
      let index = text.toLowerCase().indexOf(wrong);
      while (index >= 0) {
        push(paragraphIndex, index, index + wrong.length, text.slice(index, index + wrong.length), right, 'spelling');
        index = text.toLowerCase().indexOf(wrong, index + wrong.length);
      }
    }
    if (!vietnamese) {
      for (const match of text.matchAll(/\b(he|she|it)\s+([\p{L}]+)\b/giu)) {
        const verb = match[2].toLowerCase();
        if (!BASE_VERBS.has(verb)) continue;
        push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
          match[0], `${match[1]} ${thirdPerson(verb)}`, 'grammar');
      }
      for (const match of text.matchAll(PLURAL_IS)) {
        push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
          match[0], `${match[1]} are`, 'grammar');
      }
      for (const match of text.matchAll(SINGULAR_ARE)) {
        push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
          match[0], `${match[1]} is`, 'grammar');
      }
      for (const match of text.matchAll(ARTICLE)) {
        const suggestion = articleFix(match[1], match[2]);
        if (!suggestion) continue;
        push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
          match[0], suggestion, 'grammar');
      }
      for (const [pattern, replacement] of PREPOSITION_FIXES) {
        for (const match of text.matchAll(pattern)) {
          const replaced = match[0].replace(pattern, replacement);
          push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
            match[0], matchCase(replaced, match[0]), 'grammar');
        }
      }
    }
    for (const match of text.matchAll(VN_CLASSIFIER)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
        match[0], `${match[1]} ${match[2]}`, 'grammar');
    }
    for (const match of text.matchAll(VN_ONE_CLASSIFIER)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
        match[0], `một ${match[1]}`, 'grammar');
    }
    for (const match of text.matchAll(VN_QUANTIFIER)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
        match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(VN_ONE_OF)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length,
        match[0], 'một', 'grammar');
    }
    for (const match of text.matchAll(/ {2,}/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], ' ', 'grammar');
    }
    for (const match of text.matchAll(/\s+([,.;:!?])/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(/([.,;:!?])(?=[A-Z][a-z])/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], `${match[1]} `, 'grammar');
    }
    for (const match of text.matchAll(/([!?])\1+/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(/([,;:])\1+/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(/([(\[])[ \t]+/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(/[ \t]+([)\]])/g)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], match[1], 'grammar');
    }
    for (const match of text.matchAll(/([;:])(?=[\p{L}])/gu)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], `${match[1]} `, 'grammar');
    }
    for (const match of text.matchAll(/(,)(?=[\p{L}])/gu)) {
      push(paragraphIndex, match.index ?? 0, (match.index ?? 0) + match[0].length, match[0], ', ', 'grammar');
    }
    for (const match of text.matchAll(/([.!?]\s+)([\p{Ll}])/gu)) {
      const start = (match.index ?? 0) + match[1].length;
      if (!/[\p{L}]/u.test(text.charAt(start + 1))) continue;
      const before = text.slice(0, start);
      const previous = /([\p{L}.]+)\.\s*$/u.exec(before)?.[1]?.replace(/\./g, '').toLowerCase();
      if (previous && SENTENCE_ABBREVIATIONS.has(previous)) continue;
      push(paragraphIndex, start, start + 1, match[2], match[2].toUpperCase(), 'grammar');
    }
  });

  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.paragraphIndex}:${issue.kind}:${issue.start}:${issue.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function fixWordSpelling(document: WordDocument, issue: SpellIssue): boolean {
  return applySpellSuggestion(document, issue, issue.suggestion);
}

export function applySpellSuggestion(document: WordDocument, issue: SpellIssue, replacement: string): boolean {
  const block = document.blocks[issue.paragraphIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const text = acceptedText(block.paragraph);
  if (text.slice(issue.start, issue.end) !== issue.word) return false;
  setAcceptedText(block.paragraph, text.slice(0, issue.start) + replacement + text.slice(issue.end));
  return true;
}

export function spellcheckSummary(issues: SpellIssue[]): { repeated: number; misspelled: number; grammar: number } {
  return {
    repeated: issues.filter((issue) => issue.kind === 'repeated').length,
    misspelled: issues.filter((issue) => issue.kind === 'spelling').length,
    grammar: issues.filter((issue) => issue.kind === 'grammar').length,
  };
}
