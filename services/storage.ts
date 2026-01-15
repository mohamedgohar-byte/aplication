import { Article, Team, AppSettings, Theme, AIControlSettings, AIStats } from '../types';

const KEYS = {
  TEAMS: 'elmenus_kb_teams',
  ARTICLES: 'elmenus_kb_articles',
  SETTINGS: 'elmenus_kb_settings',
  ADMIN_PASS: 'elmenus_kb_admin_hash',
  ADMIN_EMAIL: 'elmenus_kb_admin_email',
  RESET_TOKEN: 'elmenus_kb_reset_token',
  VERSION: 'elmenus_kb_version_1_3', // Bumped version to force migration
  THEME: 'elmenus_kb_theme',
  AI_SETTINGS: 'elmenus_kb_ai_settings',
  AI_STATS: 'elmenus_kb_ai_stats',
};

// Default Data
const DEFAULT_TEAMS: Team[] = [
  { id: 't1', name: 'Service Champs', color: '#E31E24', iconName: 'MessageCircle', description: 'Chat Support Team' },
  { id: 't2', name: 'Live Ops', color: '#F59E0B', iconName: 'Activity', description: 'Real-time Operations' },
  { id: 't3', name: 'WhatsApp', color: '#25D366', iconName: 'Phone', description: 'Social Support' },
  { id: 't4', name: 'Fleet Empire', color: '#3B82F6', iconName: 'Bike', description: 'Riders & Logistics' },
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'a1',
    teamIds: ['t1'],
    title: 'Refund Policy: Missing Items',
    summary: 'SOP for handling customer complaints regarding missing items in their order. This policy ensures fair compensation while minimizing fraud risk.',
    trigger: 'Customer contacts support claiming an item is missing from their delivered order.',
    shortAnswer: 'Verify items with restaurant. If confirmed missing, refund item value + 10% wallet credit.',
    processSteps: [
      {
        title: 'Verify Package Integrity',
        description: 'Ask customer for photo proof if the package seal was broken upon arrival. Check if the rider reported any damage.'
      },
      {
        title: 'Contact Restaurant',
        description: 'Call the restaurant partner via the dedicated support line. Do not use the general customer number.'
      },
      {
        title: 'Dispatcher Confirmation',
        description: 'Ask the restaurant dispatcher to check their packing logs. Confirm specifically if the item was marked as packed.'
      },
      {
        title: 'Process Compensation',
        description: 'If the restaurant admits the mistake, process a partial refund for the exact value of the missing item. Add 10% of that item\'s value as wallet credit.'
      },
      {
        title: 'Log Incident',
        description: 'Log the ticket in Salesforce as "Vendor Error" so the restaurant is billed for the refund.'
      }
    ],
    outcomes: [
      { label: 'Restaurant Admits Fault', action: 'Refund Item + 10% Credit. Log as Vendor Error.' },
      { label: 'Restaurant Denies Fault', action: 'If customer is trusted (Tier 1), refund as "Goodwill". Otherwise, deny claim.' }
    ],
    attachments: [],
    isVisibleToAgents: true,
    isAvailableToAi: true,
    status: 'published',
    lastUpdated: Date.now(),
  },
  {
    id: 'a2',
    teamIds: ['t4'],
    title: 'Rider Accident Protocol',
    summary: 'Emergency procedures for when a rider is involved in a road accident while on an active order.',
    trigger: 'Rider reports an accident via app or phone, or Fleet Manager receives an SOS alert.',
    shortAnswer: 'Ensure safety first. Call emergency services if needed. Reassign order immediately.',
    processSteps: [
      {
        title: 'Safety Check',
        description: 'Immediately ask the rider: "Are you safe? Do you need an ambulance?" Do not ask about the order yet.'
      },
      {
        title: 'Emergency Services',
        description: 'If medical help is needed, call 123 (Ambulance) immediately and provide the rider\'s GPS location.'
      },
      {
        title: 'Update Status',
        description: 'Mark the rider status in the dashboard as "Unavailable/Emergency" to stop new orders.'
      },
      {
        title: 'Order Reassignment',
        description: 'Reassign the active order to the nearest available rider using the Dispatch Tool "Force Assign" feature.'
      },
      {
        title: 'Customer Communication',
        description: 'Inform the customer of a delay due to "unforeseen traffic circumstances". Never share accident details with the customer.'
      }
    ],
    outcomes: [
      { label: 'Minor Accident (Rider OK)', action: 'Rider takes break. Order reassigned. No report needed.' },
      { label: 'Major Accident (Injury)', action: 'Trigger Insurance Protocol. File Incident Report #99.' }
    ],
    attachments: [],
    isVisibleToAgents: true,
    isAvailableToAi: true,
    status: 'published',
    lastUpdated: Date.now(),
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Elmenus Knowledge Base',
  logoText: 'elmenus',
  primaryColor: '#E31E24',
  accentColor: '#F8B717',
  contentStyle: {
    fontFamily: 'Inter',
    fontSize: 'base',
    textColor: '#1e293b', // slate-800
    bulletStyle: 'numbers'
  }
};

const DEFAULT_AI_SETTINGS: AIControlSettings = {
  enabled: true,
  allowedTeamIds: ['t1', 't2', 't3', 't4'],
  scope: {
    useShortAnswers: true,
    useFullContent: true,
    useAttachments: false,
  },
  strictMode: true,
  tone: 'operational',
  aiAccentColor: '#2563EB', // Default Blue
};

// Improved DJB2 Hash Function
const hashString = (str: string) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash >>> 0;
};

// Hash for '0000'
const DEFAULT_PASS_HASH = String(hashString('0000')); 

export const storageService = {
  init: () => {
    // Migration Logic: Force Reset Password and Data for new Version
    const CURRENT_VERSION = 'elmenus_kb_version_1_3';
    const storedVersion = localStorage.getItem(KEYS.VERSION);

    if (storedVersion !== CURRENT_VERSION) {
      console.log('Migrating storage to version', CURRENT_VERSION);
      
      // Reset critical data to ensure schema compatibility
      localStorage.setItem(KEYS.ADMIN_PASS, DEFAULT_PASS_HASH);
      localStorage.setItem(KEYS.ARTICLES, JSON.stringify(DEFAULT_ARTICLES)); // Overwrite articles to ensure new structure
      localStorage.setItem(KEYS.TEAMS, JSON.stringify(DEFAULT_TEAMS));
      
      if (!localStorage.getItem(KEYS.SETTINGS)) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      if (!localStorage.getItem(KEYS.AI_SETTINGS)) localStorage.setItem(KEYS.AI_SETTINGS, JSON.stringify(DEFAULT_AI_SETTINGS));
      
      // Update Version
      localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
    }
  },

  getTeams: (): Team[] => JSON.parse(localStorage.getItem(KEYS.TEAMS) || '[]'),
  saveTeams: (teams: Team[]) => localStorage.setItem(KEYS.TEAMS, JSON.stringify(teams)),

  getArticles: (): Article[] => JSON.parse(localStorage.getItem(KEYS.ARTICLES) || '[]'),
  saveArticles: (articles: Article[]) => localStorage.setItem(KEYS.ARTICLES, JSON.stringify(articles)),

  getSettings: (): AppSettings => {
    const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...stored };
  },
  saveSettings: (settings: AppSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)),

  getAISettings: (): AIControlSettings => {
    const stored = JSON.parse(localStorage.getItem(KEYS.AI_SETTINGS) || 'null');
    return { ...DEFAULT_AI_SETTINGS, ...stored };
  },
  saveAISettings: (settings: AIControlSettings) => localStorage.setItem(KEYS.AI_SETTINGS, JSON.stringify(settings)),

  getAIStats: (): AIStats => {
    return JSON.parse(localStorage.getItem(KEYS.AI_STATS) || '{"count": 0, "lastUsed": null}');
  },
  
  incrementAIUsage: () => {
    const stats = storageService.getAIStats();
    stats.count += 1;
    stats.lastUsed = Date.now();
    localStorage.setItem(KEYS.AI_STATS, JSON.stringify(stats));
  },

  checkPassword: (password: string): boolean => {
    const stored = localStorage.getItem(KEYS.ADMIN_PASS);
    return String(hashString(password)) === stored;
  },
  
  setPassword: (password: string) => {
    localStorage.setItem(KEYS.ADMIN_PASS, String(hashString(password)));
  },

  getRecoveryEmail: (): string => {
    return localStorage.getItem(KEYS.ADMIN_EMAIL) || '';
  },

  setRecoveryEmail: (email: string) => {
    localStorage.setItem(KEYS.ADMIN_EMAIL, email);
  },

  createResetToken: (): string => {
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires = Date.now() + 10 * 60 * 1000; 
    localStorage.setItem(KEYS.RESET_TOKEN, JSON.stringify({ token, expires }));
    return token;
  },

  verifyResetToken: (inputToken: string): boolean => {
    const data = localStorage.getItem(KEYS.RESET_TOKEN);
    if (!data) return false;
    const { token, expires } = JSON.parse(data);
    if (Date.now() > expires) return false;
    return token === inputToken.toUpperCase();
  },

  consumeResetToken: () => {
    localStorage.removeItem(KEYS.RESET_TOKEN);
  },

  getTheme: (): Theme => (localStorage.getItem(KEYS.THEME) as Theme) || 'light',
  saveTheme: (theme: Theme) => localStorage.setItem(KEYS.THEME, theme),
};