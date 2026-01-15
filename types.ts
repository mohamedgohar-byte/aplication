export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type BlockType = 'text' | 'list' | 'callout' | 'image';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content?: string;
  listType?: 'bullet' | 'number';
  items?: string[];
  calloutType?: 'note' | 'warning' | 'tip';
  url?: string;
  caption?: string;
}

export interface Team {
  id: string;
  name: string;
  color: string; // Hex code
  iconName: string; // Lucide icon name
  description?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'link';
  url: string;
}

export interface MindMapStyle {
  nodeBg?: string;
  nodeBorder?: string;
  nodeRadius?: string;
  nodeColor?: string;
  lineColor?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  style?: MindMapStyle;
}

export interface ProcessStep {
  title: string;
  description: string;
  imageUrl?: string;
  contentBlocks?: ContentBlock[];
  htmlContent?: string; // WYSIWYG Content
}

export interface Outcome {
  label: string;
  action: string;
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  teamIds: string[];
  title: string;
  
  // Section 2: Scenario Overview
  summary: string; 
  
  // Section 3: Trigger
  trigger: string; 
  
  // Section 7: Short Answer (retained for AI efficiency)
  shortAnswer: string;
  
  // Section 4: Step-by-Step
  processSteps: ProcessStep[]; 
  
  // Section 5: Decisions & Outcomes
  outcomes: Outcome[];

  processOwner?: string;
  troubleshooting?: string;
  mindMap?: MindMapNode;
  mindMapStyle?: MindMapStyle;
  attachments: Attachment[];
  
  isVisibleToAgents: boolean;
  isAvailableToAi: boolean;
  status: ArticleStatus;
  lastUpdated: number;
}

export interface ContentStyle {
  fontFamily: 'Inter' | 'Cairo' | 'Sans';
  fontSize: 'sm' | 'base' | 'lg';
  textColor: string; // Hex
  bulletStyle: 'numbers' | 'dots' | 'checks';
}

export interface AppSettings {
  appName: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  contentStyle: ContentStyle;
}

export interface AIControlSettings {
  enabled: boolean;
  allowedTeamIds: string[];
  scope: {
    useShortAnswers: boolean;
    useFullContent: boolean;
    useAttachments: boolean;
  };
  strictMode: boolean;
  tone: 'operational' | 'direct' | 'coaching';
  aiAccentColor: string;
}

export interface AIStats {
  count: number;
  lastUsed: number | null;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}