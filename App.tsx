import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { storageService } from './services/storage';
import { AppSettings, Team, Article, Language, ProcessStep, Outcome, Theme, MindMapNode, MindMapStyle, AIControlSettings, ContentStyle, ContentBlock, BlockType } from './types';
import { 
  Search, Menu, X, ChevronLeft, LayoutDashboard, 
  Settings, Users, BookOpen, Shield, LogOut, Bot, Mail, Key,
  Palette, Image, Cpu, FileText, Globe, Plus, Trash2, ChevronRight,
  AlertTriangle, CheckCircle, PlayCircle, Moon, Sun, GitBranch, CornerDownRight, Filter,
  MessageCircle, Activity, Phone, Bike, Lock, Zap, Layers, ToggleLeft, ToggleRight, Sparkles, CheckSquare, List, MoreHorizontal,
  Type, Info, ArrowUp, ArrowDown, AlignLeft, AlertCircle,
  Bold, Italic, Underline, ListOrdered, Link2, Eraser
} from 'lucide-react';
import { geminiService } from './services/geminiService';

// --- TRANSLATIONS (Simple UI Labels) ---
const LABELS = {
  en: {
    searchPlaceholder: "Search policies, SOPs, or ask a question...",
    backToResults: "Back to Results",
    shortAnswer: "Short Answer",
    trigger: "Process Trigger",
    steps: "Process Steps",
    outcomes: "Decisions & Outcomes",
    troubleshooting: "Troubleshooting",
    attachments: "Attachments & Resources",
    adminPanel: "Admin Panel",
    allTeams: "All Teams",
    askAi: "Ask AI",
    copy: "COPY",
    scenario: "Scenario Overview",
    open: "Open",
    noArticles: "No articles found",
    tryAdjusting: "Try adjusting your search or team filter.",
    mindMap: "Decision Flow",
    enableMindMap: "Enable Mind Map",
    browseByTeam: "Browse by Team",
    availableProcesses: "Available Processes",
    viewAll: "View all knowledge base articles"
  },
  ar: {
    searchPlaceholder: "ابحث في السياسات، الإجراءات، أو اسأل سؤالاً...",
    backToResults: "العودة للنتائج",
    shortAnswer: "الإجابة المختصرة",
    trigger: "محفز العملية",
    steps: "خطوات العملية",
    outcomes: "القرارات والنتائج",
    troubleshooting: "استكشاف الأخطاء وإصلاحها",
    attachments: "المرفقات والموارد",
    adminPanel: "لوحة المسؤول",
    allTeams: "كل الفرق",
    askAi: "اسأل الذكاء الاصطناعي",
    copy: "نسخ",
    scenario: "نظرة عامة على السيناريو",
    open: "فتح",
    noArticles: "لم يتم العثور على مقالات",
    tryAdjusting: "حاول تعديل البحث أو تصفية الفريق.",
    mindMap: "تدفق القرار",
    enableMindMap: "تفعيل الخريطة الذهنية",
    browseByTeam: "تصفح حسب الفريق",
    availableProcesses: "العمليات المتاحة",
    viewAll: "عرض جميع مقالات قاعدة المعرفة"
  }
};

// --- COMPONENTS ---

const Icon = ({ name, className, size = 20, style }: { name: string; className?: string; size?: number, style?: React.CSSProperties }) => {
  const LucideIcons: any = { 
    Search, Menu, X, ChevronLeft, LayoutDashboard, Settings, Users, BookOpen, Shield, LogOut, Bot, Mail, Key,
    Palette, Image, Cpu, FileText, Globe, Plus, Trash2, ChevronRight, AlertTriangle, CheckCircle, PlayCircle, GitBranch,
    MessageCircle, Activity, Phone, Bike, Filter, CornerDownRight, Lock, Zap, Layers, Sparkles
  };
  const IconComp = LucideIcons[name] || BookOpen;
  return <IconComp size={size} className={className} style={style} />;
};

// --- RICH CONTENT RENDERER (AGENT VIEW) ---

const BlockRenderer = ({ blocks, styleSettings }: { blocks: ContentBlock[], styleSettings: ContentStyle }) => {
  if (!blocks || blocks.length === 0) return null;

  // Font and color from appearance settings
  const customTextStyle = { 
    fontFamily: styleSettings.fontFamily === 'Sans' ? 'sans-serif' : styleSettings.fontFamily, 
    color: styleSettings.textColor 
  };
  
  const fontSizeClass = styleSettings.fontSize === 'sm' ? 'text-sm' : styleSettings.fontSize === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div className={`space-y-4 ${fontSizeClass}`} style={customTextStyle}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            // Simple markdown-like bold parsing for display
            const parts = block.content?.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                part.startsWith('**') && part.endsWith('**') 
                ? <strong key={i}>{part.slice(2, -2)}</strong> 
                : part
            );
            return <p key={block.id} className="whitespace-pre-wrap leading-relaxed">{parts}</p>;
          
          case 'list':
            const ListTag = block.listType === 'number' ? 'ol' : 'ul';
            return (
              <ListTag key={block.id} className={`pl-5 space-y-1 ${block.listType === 'number' ? 'list-decimal' : 'list-disc'}`}>
                {block.items?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ListTag>
            );

          case 'callout':
            let bgColor = 'bg-slate-100 dark:bg-slate-800';
            let borderColor = 'border-slate-300';
            let icon = <Info size={18} />;
            
            if (block.calloutType === 'warning') {
              bgColor = 'bg-amber-50 dark:bg-amber-900/20';
              borderColor = 'border-amber-400';
              icon = <AlertTriangle size={18} className="text-amber-600" />;
            } else if (block.calloutType === 'tip') {
              bgColor = 'bg-green-50 dark:bg-green-900/20';
              borderColor = 'border-green-400';
              icon = <CheckCircle size={18} className="text-green-600" />;
            }

            return (
              <div key={block.id} className={`${bgColor} border-l-4 ${borderColor} p-4 rounded-r flex gap-3 items-start`}>
                <div className="flex-shrink-0 mt-0.5">{icon}</div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">{block.content}</div>
              </div>
            );

          case 'image':
            return (
              <div key={block.id} className="my-4">
                <img src={block.url} alt={block.caption || 'Step image'} className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-80 object-cover" />
                {block.caption && <p className="text-xs text-slate-500 mt-1 italic text-center">{block.caption}</p>}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

// --- MARKDOWN PARSERS (Legacy Support) ---

const blocksToHtml = (blocks: ContentBlock[]): string => {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map(b => {
    if (b.type === 'text') return `<p>${b.content || ''}</p>`;
    if (b.type === 'list') {
      const tag = b.listType === 'number' ? 'ol' : 'ul';
      const items = b.items?.map(i => `<li>${i}</li>`).join('') || '';
      return `<${tag}>${items}</${tag}>`;
    }
    if (b.type === 'callout') {
       const color = b.calloutType === 'warning' ? '#f59e0b' : b.calloutType === 'tip' ? '#10b981' : '#3b82f6';
       return `<div style="border-left: 4px solid ${color}; padding: 10px; background: ${color}15; margin: 10px 0;"><strong>${b.calloutType?.toUpperCase()}:</strong> ${b.content}</div>`;
    }
    return '';
  }).join('');
};

// --- WYSIWYG EDITOR ---

const WYSIWYGEditor = ({ value, onChange }: { value: string, onChange: (html: string) => void }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  useEffect(() => {
    // Initial load
    if (contentRef.current && value) {
      if (contentRef.current.innerHTML !== value) {
        // Only set content if it differs and we are not focused (avoids cursor jump loops)
        if (document.activeElement !== contentRef.current) {
           contentRef.current.innerHTML = value;
        }
      }
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      // Basic check if selection is inside editor
      let node = sel.anchorNode;
      while (node && node !== contentRef.current) {
          node = node.parentNode;
      }
      if (node === contentRef.current) {
        selectionRef.current = sel.getRangeAt(0);
      }
    }
  };

  const restoreSelection = () => {
    if (selectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(selectionRef.current);
      }
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
      // It is important to save selection after input to keep it synced
      saveSelection();
    }
  };

  const exec = (cmd: string, val?: string) => {
    // 1. Focus the editor first as requested
    if (contentRef.current) {
        contentRef.current.focus();
    }
    
    // 2. Restore selection if needed (especially for selects)
    // We assume if we have a saved selection, we want to apply to it.
    // However, if we just focused, cursor might be at start.
    restoreSelection();

    // 3. Execute
    document.execCommand(cmd, false, val);
    
    // 4. Update state
    handleInput();
  };

  const ToolbarButton = ({ cmd, icon: IconComp, title }: any) => (
    <button 
      type="button" 
      // Use onMouseDown with preventDefault to prevent button from taking focus
      onMouseDown={(e) => { 
          e.preventDefault(); 
          exec(cmd); 
      }} 
      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
      title={title}
    >
      <IconComp size={16}/>
    </button>
  );

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-shadow">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
         <select 
            onChange={(e) => exec('fontName', e.target.value)} 
            onFocus={saveSelection}
            className="text-xs h-7 px-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
         >
            <option value="Inter">Inter</option>
            <option value="Cairo">Cairo</option>
            <option value="sans-serif">Sans Serif</option>
         </select>
         <select 
            onChange={(e) => exec('fontSize', e.target.value)} 
            onFocus={saveSelection}
            className="text-xs h-7 px-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-18 outline-none"
         >
            <option value="3">Normal</option>
            <option value="1">Small</option>
            <option value="4">Large</option>
            <option value="5">Huge</option>
         </select>
         
         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

         <ToolbarButton cmd="bold" icon={Bold} title="Bold" />
         <ToolbarButton cmd="italic" icon={Italic} title="Italic" />
         <ToolbarButton cmd="underline" icon={Underline} title="Underline" />
         
         <div className="flex items-center mx-1" title="Text Color">
            <input 
                type="color" 
                onChange={(e) => exec('foreColor', e.target.value)} 
                onFocus={saveSelection}
                className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" 
            />
         </div>
         
         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
         
         <ToolbarButton cmd="insertUnorderedList" icon={List} title="Bullet List" />
         <ToolbarButton cmd="insertOrderedList" icon={ListOrdered} title="Numbered List" />
         
         <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

         <button 
            type="button" 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
                saveSelection();
                const url = prompt('Enter link URL:');
                if (url) {
                    exec('createLink', url);
                } else {
                    restoreSelection(); // Restore selection if cancelled
                }
            }} 
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" 
            title="Link"
         >
            <Link2 size={16}/>
         </button>
         
         <button 
            type="button" 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
                saveSelection();
                exec('removeFormat');
            }} 
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" 
            title="Clear Formatting"
         >
            <Eraser size={16}/>
         </button>
      </div>

      {/* Editor Area */}
      <div 
        ref={contentRef}
        className="p-4 min-h-[160px] outline-none text-slate-900 dark:text-white text-base leading-relaxed wysiwyg-content [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5"
        contentEditable
        onInput={handleInput}
        onBlur={saveSelection}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>
  );
};


// --- MARKDOWN RENDERER (AI) ---
const SimpleMarkdown = ({ content, accentColor }: { content: string, accentColor?: string }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let inList = false;

  const flushList = () => {
    if (inList && listBuffer.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="list-none space-y-2 mb-4 ml-1">{listBuffer}</ul>);
      listBuffer = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-lg font-bold mb-2 mt-4" style={{ color: accentColor }}>{trimmed.replace('### ', '')}</h3>);
      return;
    }
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(<h4 key={index} className="text-base font-bold mb-2 mt-3 text-slate-700 dark:text-slate-300">{trimmed.replace('#### ', '')}</h4>);
      return;
    }

    // Blockquotes (Warnings / Outcomes)
    if (trimmed.startsWith('> ')) {
      flushList();
      const text = trimmed.replace(/^> /, '');
      let bgColor = 'bg-slate-100 dark:bg-slate-800';
      let borderColor = 'border-slate-300';
      
      if (text.includes('⚠️')) {
        bgColor = 'bg-amber-50 dark:bg-amber-900/20';
        borderColor = 'border-amber-400';
      } else if (text.includes('✅')) {
        bgColor = 'bg-green-50 dark:bg-green-900/20';
        borderColor = 'border-green-400';
      }

      const parts = text.split('**');
      const formattedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);

      elements.push(
        <div key={index} className={`${bgColor} border-l-4 ${borderColor} p-3 rounded-r my-3 text-sm text-slate-800 dark:text-slate-200`}>
          {formattedText}
        </div>
      );
      return;
    }

    // List Items (Bullets or Numbers)
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      const text = trimmed.replace(/^(- |\d+\.\s)/, '');
      const parts = text.split('**');
      const formattedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
      
      listBuffer.push(
        <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
           <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
           <span>{formattedText}</span>
        </li>
      );
      return;
    }

    // Standard Paragraph
    if (trimmed.length > 0) {
      flushList();
      const parts = trimmed.split('**');
      const formattedText = parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
      elements.push(<p key={index} className="mb-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{formattedText}</p>);
    }
  });

  flushList(); // Flush remaining list items
  return <div>{elements}</div>;
};

// --- MIND MAP COMPONENTS ---

const MindMapRenderer = ({ node, styleSettings }: { node: MindMapNode, styleSettings?: MindMapStyle }) => {
  if (!node) return null;

  // Merge global settings with node specific settings
  const mergedStyle = { ...styleSettings, ...node.style };

  // Defaults
  const bg = mergedStyle.nodeBg || '';
  const border = mergedStyle.nodeBorder || '';
  const color = mergedStyle.nodeColor || '';
  const radius = mergedStyle.nodeRadius || '0.5rem'; // rounded-lg
  const line = mergedStyle.lineColor || '';

  // Custom styles object
  const nodeStyle = {
    backgroundColor: bg,
    borderColor: border,
    color: color,
    borderRadius: radius,
  };
  
  const lineStyle = {
    backgroundColor: line
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Content */}
      <div 
        className={`z-10 border-2 p-3 shadow-sm min-w-[140px] max-w-[200px] text-center transition-all ${!bg && 'bg-white dark:bg-slate-800'} ${!border && 'border-indigo-100 dark:border-slate-600'} ${!color && 'text-slate-800 dark:text-slate-200'}`}
        style={nodeStyle}
      >
        <p className="font-medium text-sm">{node.label}</p>
      </div>

      {/* Children Wrapper */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical Stem from Parent (Uses CURRENT node's line style for lines originating from it) */}
          <div className={`h-6 w-0.5 ${!line && 'bg-slate-300 dark:bg-slate-600'}`} style={lineStyle}></div>
          
          <div className="flex gap-4 items-start relative">
             {/* Horizontal Connector Line */}
             {node.children.length > 1 && (
               <div className={`absolute top-0 left-0 right-0 h-0.5 rounded -translate-y-px mx-[20%] ${!line && 'bg-slate-300 dark:bg-slate-600'}`} style={lineStyle}></div>
             )}

             {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center relative pt-4">
                   {/* Vertical Connector to Child */}
                   <div className={`absolute top-0 h-4 w-0.5 ${!line && 'bg-slate-300 dark:bg-slate-600'}`} style={lineStyle}></div>
                   <MindMapRenderer node={child} styleSettings={styleSettings} />
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MindMapEditorProps {
  node: MindMapNode;
  onChange: (n: MindMapNode) => void;
  onDelete?: () => void;
  isRoot?: boolean;
  styleSettings?: MindMapStyle;
}

const MindMapEditor: React.FC<MindMapEditorProps> = ({ node, onChange, onDelete, isRoot = false, styleSettings }) => {
  const [showNodeStyle, setShowNodeStyle] = useState(false);

  const handleLabelChange = (e: any) => {
    onChange({ ...node, label: e.target.value });
  };
  
  const handleNodeStyleChange = (field: keyof MindMapStyle, value: any) => {
    const currentStyle = node.style || {};
    onChange({ ...node, style: { ...currentStyle, [field]: value } });
  };

  const handleAddChild = () => {
    const newChild: MindMapNode = { id: Date.now().toString() + Math.random(), label: 'New Decision', children: [] };
    onChange({ ...node, children: [...(node.children || []), newChild] });
  };

  const handleChildChange = (idx: number, newChildNode: MindMapNode) => {
    const newChildren = [...(node.children || [])];
    newChildren[idx] = newChildNode;
    onChange({ ...node, children: newChildren });
  };

  const handleChildDelete = (idx: number) => {
    const newChildren = [...(node.children || [])];
    newChildren.splice(idx, 1);
    onChange({ ...node, children: newChildren });
  };
  
  // Merge for Preview in Input
  const mergedStyle = { ...styleSettings, ...node.style };
  const bg = mergedStyle.nodeBg || '';
  const border = mergedStyle.nodeBorder || '';
  const radius = mergedStyle.nodeRadius || '0.25rem';
  const color = mergedStyle.nodeColor || '';
  
  const inputStyle = {
     backgroundColor: bg,
     borderColor: border,
     borderRadius: radius,
     color: color
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {isRoot && <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded text-indigo-600 dark:text-indigo-400"><GitBranch size={16} /></div>}
        {!isRoot && <CornerDownRight className="text-slate-300 dark:text-slate-600" size={16} />}
        
        <div className="flex-1 flex flex-col gap-1">
           <input 
             value={node.label} 
             onChange={handleLabelChange}
             placeholder="Decision point or Outcome..."
             className={`w-full min-w-[200px] border px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${!bg && 'bg-white dark:bg-slate-800'} ${!border && 'border-slate-300 dark:border-slate-600'} ${!color && 'text-slate-900 dark:text-white'}`}
             style={inputStyle}
           />
           {showNodeStyle && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div title="Background" className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                      <input type="color" value={node.style?.nodeBg || '#ffffff'} onChange={e => handleNodeStyleChange('nodeBg', e.target.value)} className="h-5 w-5 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div title="Border" className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-slate-400 bg-transparent"></div>
                      <input type="color" value={node.style?.nodeBorder || '#e0e7ff'} onChange={e => handleNodeStyleChange('nodeBorder', e.target.value)} className="h-5 w-5 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div title="Text Color" className="flex items-center gap-1">
                      <Type size={12} className="text-slate-500" />
                      <input type="color" value={node.style?.nodeColor || '#1e293b'} onChange={e => handleNodeStyleChange('nodeColor', e.target.value)} className="h-5 w-5 rounded cursor-pointer border-0 p-0" />
                  </div>
                   <div title="Line Color" className="flex items-center gap-1">
                      <div className="w-0.5 h-3 bg-slate-400"></div>
                      <input type="color" value={node.style?.lineColor || '#cbd5e1'} onChange={e => handleNodeStyleChange('lineColor', e.target.value)} className="h-5 w-5 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <select 
                      value={node.style?.nodeRadius || ''} 
                      onChange={e => handleNodeStyleChange('nodeRadius', e.target.value || undefined)}
                      className="text-[10px] h-5 border border-slate-300 dark:border-slate-600 rounded bg-transparent dark:text-white"
                  >
                      <option value="">Default</option>
                      <option value="0px">Square</option>
                      <option value="0.5rem">Rounded</option>
                      <option value="1rem">Large</option>
                      <option value="9999px">Pill</option>
                  </select>
              </div>
           )}
        </div>
        
        <div className="flex items-center gap-1 self-start mt-1">
          <button 
             type="button"
             onClick={() => setShowNodeStyle(!showNodeStyle)}
             className={`p-1.5 rounded transition-colors ${showNodeStyle ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
             title="Style Node"
          >
             <Palette size={14} />
          </button>
          <button 
            type="button" 
            onClick={handleAddChild} 
            className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded transition-colors" 
            title="Add Branch"
          >
            <Plus size={14} />
          </button>
          {!isRoot && onDelete && (
            <button 
              type="button" 
              onClick={onDelete} 
              className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors" 
              title="Delete Branch"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Children Indentation */}
      <div className="pl-6 ml-3 border-l border-slate-200 dark:border-slate-700 space-y-3">
        {node.children?.map((child, idx) => (
          <MindMapEditor 
            key={child.id} 
            node={child} 
            onChange={(n) => handleChildChange(idx, n)} 
            onDelete={() => handleChildDelete(idx)} 
            styleSettings={styleSettings}
          />
        ))}
      </div>
    </div>
  );
};


// 2. AGENT VIEW COMPONENTS

const AgentHeader = ({ 
  settings, 
  teams, 
  selectedTeamId, 
  onTeamSelect, 
  searchQuery, 
  onSearch,
  lang,
  setLang,
  theme,
  toggleTheme,
  filterStatus,
  setFilterStatus,
  aiSettings,
  onAskAI
}: any) => {
  const t = LABELS[lang as Language];
  const isRtl = lang === 'ar';
  const [showFilters, setShowFilters] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          {/* Logo & Lang & Theme */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: settings.primaryColor }}>
              {settings.logoText}
              <span className="text-slate-500 dark:text-slate-400 font-light text-lg mx-2">Knowledge</span>
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Globe size={14} />
                {lang === 'en' ? 'AR' : 'EN'}
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl w-full relative z-20">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              className={`block w-full ${isRtl ? 'pr-24 pl-10' : 'pl-10 pr-24'} py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out shadow-sm`}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                 if(e.key === 'Enter') {
                    // Normal search behavior (already driven by state), possibly blur or submit analytics
                    (e.target as HTMLInputElement).blur();
                 }
              }}
            />
            
            <div className={`absolute inset-y-0 ${isRtl ? 'left-2' : 'right-2'} flex items-center gap-1`}>
               {/* AI Icon in Search */}
               {aiSettings.enabled && (
                  <button 
                     onClick={() => onAskAI(searchQuery)}
                     title="Ask AI Assistant"
                     className="p-1.5 rounded-full text-white transition-all hover:scale-105 shadow-sm flex items-center justify-center pointer-events-auto"
                     style={{ backgroundColor: aiSettings.aiAccentColor }}
                  >
                     <Bot size={18} className="text-white" />
                  </button>
               )}
               
               {/* Filter Toggle */}
               <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-full transition-colors ${showFilters ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               >
                  <Filter size={18} />
               </button>
            </div>

            {/* Filter Dropdown */}
            {showFilters && (
               <div className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} w-72 bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 p-4`}>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filter Options</h3>
                     <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={16} /></button>
                  </div>

                  <div className="mb-4">
                     <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
                     <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {['published', 'draft', 'all'].map(s => (
                           <button
                              key={s}
                              onClick={() => setFilterStatus(s)}
                              className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition-all ${filterStatus === s ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>

          {/* Admin Link */}
          <div>
            <Link to="/admin" className="text-xs text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">{t.adminPanel}</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const SOPViewer = ({ article, onBack, teams, lang, settings }: { article: Article; onBack: () => void; teams: Team[], lang: Language, settings: AppSettings }) => {
  const t = LABELS[lang];
  const isRtl = lang === 'ar';
  const { contentStyle } = settings;

  // Style Mappers
  const fontSizeMap = { 'sm': 'text-sm', 'base': 'text-base', 'lg': 'text-lg' };
  const baseSize = fontSizeMap[contentStyle.fontSize] || 'text-base';
  
  // Custom Styles
  const customTextStyle = { fontFamily: contentStyle.fontFamily === 'Sans' ? 'sans-serif' : contentStyle.fontFamily, color: contentStyle.textColor };

  const renderBullet = (idx: number) => {
    if (contentStyle.bulletStyle === 'dots') return <div className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-400 mt-2 mr-4" />;
    if (contentStyle.bulletStyle === 'checks') return <div className="flex-shrink-0 text-green-600 dark:text-green-400 mr-3 mt-1"><CheckSquare size={18} /></div>;
    // Default Numbered
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-sm mr-4">
        {idx + 1}
      </div>
    );
  };

  return (
    <div className={`max-w-[900px] mx-auto bg-white dark:bg-slate-900 min-h-screen border-x border-slate-100 dark:border-slate-800 print:border-none sop-document pb-20`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Back */}
      <div className="p-8 pb-4 no-print">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {isRtl ? <ChevronRight className="w-5 h-5 ml-1" /> : <ChevronLeft className="w-5 h-5 mr-1" />}
          {t.backToResults}
        </button>
      </div>

      <div className="px-12 py-8 print:p-0" style={customTextStyle}>
        {/* 2. Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{article.title}</h1>
            <div className="flex gap-2">
              {article.teamIds.map(tid => {
                const tm = teams.find(t => t.id === tid);
                if(!tm) return null;
                return (
                  <span key={tid} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium text-white" style={{ backgroundColor: tm.color }}>
                    {tm.name}
                  </span>
                )
              })}
              {/* Status Badge in Viewer */}
              {article.status !== 'published' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 uppercase tracking-wide">
                  {article.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 my-6" />

        {/* 3. Scenario Overview (Summary) */}
        <div className="mb-8">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.scenario}</h3>
           <div className={`prose max-w-none text-slate-700 dark:text-slate-300 leading-relaxed ${baseSize}`} style={{ color: contentStyle.textColor }}>
             {article.summary}
           </div>
        </div>

        {/* 4. Trigger */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-8">
           <div className="flex items-start gap-3">
              <PlayCircle className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div>
                 <h3 className="text-blue-800 dark:text-blue-200 font-bold uppercase text-xs tracking-wider mb-1">{t.trigger}</h3>
                 <p className={`text-slate-900 dark:text-blue-50 font-medium ${baseSize}`}>{article.trigger}</p>
              </div>
           </div>
        </div>

        {/* 7. Short Answer (AI Core) */}
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-6 rounded-r-lg relative group mb-8">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-bold uppercase text-xs tracking-wider mb-2">{t.shortAnswer}</h3>
          <p className={`text-slate-800 dark:text-yellow-50 font-medium ${baseSize === 'text-sm' ? 'text-base' : 'text-lg'}`}>{article.shortAnswer}</p>
          <button 
            onClick={() => navigator.clipboard.writeText(article.shortAnswer)}
            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-yellow-600 dark:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold hover:text-yellow-800 dark:hover:text-yellow-200`}
          >
            {t.copy}
          </button>
        </div>

        {/* 9. Process / Steps */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">{t.steps}</h2>
          <div className="space-y-6">
            {article.processSteps.map((step, idx) => (
              <div key={idx} className="flex items-start">
                {renderBullet(idx)}
                <div className="flex-1">
                  <h4 className={`font-bold text-slate-900 dark:text-slate-100 mb-1 ${baseSize === 'text-sm' ? 'text-base' : 'text-lg'}`}>{step.title}</h4>
                  
                  {/* Content Rendering: Prefer HTML, fallback to BlockRenderer, fallback to description */}
                  {step.htmlContent ? (
                    <div 
                      className={`prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed ${baseSize}`} 
                      dangerouslySetInnerHTML={{ __html: step.htmlContent }}
                      style={{ color: contentStyle.textColor }}
                    />
                  ) : step.contentBlocks && step.contentBlocks.length > 0 ? (
                    <BlockRenderer blocks={step.contentBlocks} styleSettings={contentStyle} />
                  ) : (
                    // Fallback legacy description
                    <p className={`text-slate-700 dark:text-slate-400 leading-relaxed ${baseSize}`} style={{ color: contentStyle.textColor }}>{step.description}</p>
                  )}
                  
                  {step.imageUrl && (
                    <img src={step.imageUrl} alt={step.title} className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Outcomes */}
        <section className="mb-8">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">{t.outcomes}</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.outcomes.map((outcome, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                       <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                       {outcome.label}
                    </h4>
                    <p className={`text-slate-600 dark:text-slate-400 ${baseSize}`}>{outcome.action}</p>
                 </div>
              ))}
           </div>
        </section>

        {/* 6. Mind Map (Optional) */}
        {article.mindMap && (
           <section className="mb-8 overflow-x-auto pb-4">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <GitBranch size={24} className="text-indigo-500" />
                {t.mindMap}
             </h2>
             <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 min-w-max flex justify-center">
                <MindMapRenderer node={article.mindMap} styleSettings={article.mindMapStyle} />
             </div>
           </section>
        )}

        {/* Attachments */}
        <section className="mb-8 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t.attachments}</h2>
          {article.attachments.length === 0 ? (
            <p className="text-slate-400 italic text-sm">No attachments.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.attachments.map(att => (
                <div key={att.id} className="flex items-center p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                   <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-blue-600 dark:text-blue-300 mx-2">
                     <FileText size={16} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{att.name}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{t.open}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Troubleshooting */}
        {article.troubleshooting && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
               <AlertTriangle size={20} /> {t.troubleshooting}
            </h2>
            <div className={`bg-red-50 dark:bg-red-900/30 p-6 rounded text-red-900 dark:text-red-100 border border-red-100 dark:border-red-900/50 ${baseSize}`}>
              {article.troubleshooting}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const AIAssistant = ({ visible, onClose, onOpen, contextArticles, teams, lang, aiSettings, pendingQuery, onQueryHandled }: { visible: boolean; onClose: () => void; onOpen: () => void; contextArticles: Article[]; teams: Team[]; lang: Language; aiSettings: AIControlSettings, pendingQuery?: string, onQueryHandled?: () => void }) => {
  const t = LABELS[lang];
  const isRtl = lang === 'ar';
  const [messages, setMessages] = useState<{role: 'user' | 'model'; content: string}[]>([
    { role: 'model', content: isRtl ? "مرحباً! أنا مساعد المنيوز الذكي. كيف يمكنني مساعدتك اليوم؟" : "Hi! I'm your Elmenus assistant. How can I help you resolve an issue today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = text;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    const response = await geminiService.askAssistant(userMsg, contextArticles, teams, messages);
    
    setMessages(prev => [...prev, { role: 'model', content: response }]);
    setLoading(false);
  };

  // Handle auto-send for pending queries from search bar
  useEffect(() => {
     if (visible && pendingQuery) {
        handleSend(pendingQuery);
        if (onQueryHandled) onQueryHandled();
     }
  }, [visible, pendingQuery]);

  // If disabled via AI Control Center, return null (renders nothing)
  if (!aiSettings.enabled) return null;

  if (!visible) return (
    <button 
      onClick={onOpen}
      className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50`}
      style={{ backgroundColor: aiSettings.aiAccentColor }}
      title="Ask AI Assistant"
    >
      <Bot size={28} />
    </button>
  );

  return (
    <div className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} w-96 h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 dark:border-slate-700 overflow-hidden font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: aiSettings.aiAccentColor }}>
        <div className="flex items-center gap-2">
           <Bot size={20} />
           <span className="font-bold">AI Assistant</span>
        </div>
        <button onClick={onClose} className="hover:text-slate-300"><X size={20} /></button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
               className={`max-w-[85%] p-3 rounded-lg text-sm ${
                 m.role === 'user' 
                   ? 'text-white rounded-br-none' 
                   : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
               }`}
               style={m.role === 'user' ? { backgroundColor: aiSettings.aiAccentColor } : {}}
            >
              {m.role === 'model' 
                ? <SimpleMarkdown content={m.content} accentColor={aiSettings.aiAccentColor} /> 
                : m.content
              }
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg rounded-bl-none shadow-sm text-sm text-slate-500 dark:text-slate-400 italic">
               ...
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <input 
            className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-opacity-50"
            placeholder={isRtl ? "اكتب سؤالك..." : "Ask a question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            style={{ borderColor: 'transparent', outlineColor: aiSettings.aiAccentColor }} // visual trick to use ai color on focus
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={loading}
            className="text-white px-4 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: aiSettings.aiAccentColor }}
          >
            {isRtl ? "إرسال" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AGENT VIEW (MAIN) ---

const AgentView = ({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) => {
  const [lang, setLang] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('published');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [pendingAIQuery, setPendingAIQuery] = useState('');

  const settings = storageService.getSettings();
  const aiSettings = storageService.getAISettings();
  const teams = storageService.getTeams();
  const allArticles = storageService.getArticles();

  // Filter Logic
  const filteredArticles = allArticles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeamId ? a.teamIds.includes(selectedTeamId) : true;
    const matchesStatus = filterStatus === 'all' ? true : a.status === filterStatus;
    return matchesSearch && matchesTeam && matchesStatus && a.isVisibleToAgents;
  });

  const handleAskAI = (query: string) => {
    setPendingAIQuery(query);
    setShowAI(true);
  };

  if (selectedArticle) {
    return (
      <SOPViewer 
        article={selectedArticle} 
        onBack={() => setSelectedArticle(null)} 
        teams={teams} 
        lang={lang}
        settings={settings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <AgentHeader 
        settings={settings}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onTeamSelect={setSelectedTeamId}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        lang={lang}
        setLang={setLang}
        theme={theme}
        toggleTheme={toggleTheme}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        aiSettings={aiSettings}
        onAskAI={handleAskAI}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Browse by Team Section - Cards Style */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Users size={20} className="text-slate-500" />
            {LABELS[lang].browseByTeam}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* All Teams Card */}
            <div 
              onClick={() => setSelectedTeamId(null)}
              className={`relative rounded-xl p-6 cursor-pointer transition-all border-2 flex flex-col justify-between h-36 ${!selectedTeamId ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-slate-100 border-transparent text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
               <div>
                 <LayoutDashboard size={28} className="mb-4" />
                 <h3 className="font-bold text-lg">{LABELS[lang].allTeams}</h3>
               </div>
               <p className="text-xs opacity-70 font-medium">{LABELS[lang].viewAll}</p>
            </div>

            {/* Specific Team Cards */}
            {teams.map(team => {
               const isSelected = selectedTeamId === team.id;
               return (
                 <div 
                   key={team.id}
                   onClick={() => setSelectedTeamId(team.id)}
                   className={`relative bg-white dark:bg-slate-900 rounded-xl p-6 cursor-pointer transition-all border shadow-sm flex flex-col justify-between h-36 group ${isSelected ? 'ring-2 ring-offset-2 shadow-lg' : 'hover:shadow-md'}`}
                   style={{ 
                     borderColor: isSelected ? team.color : '', 
                     borderTopWidth: '4px', 
                     borderTopColor: team.color 
                   }}
                 >
                    <div>
                       <div className="mb-4" style={{ color: team.color }}>
                          <Icon name={team.iconName} size={28} />
                       </div>
                       <h3 className="font-bold text-slate-900 dark:text-white text-lg">{team.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{team.description}</p>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Available Processes Section */}
        <div>
           <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
             <FileText size={20} className="text-slate-500" />
             {LABELS[lang].availableProcesses}
           </h2>
           <p className="text-xs text-slate-500 mb-6">Showing processes across all teams</p>

           {/* Article Grid */}
           {filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Search className="text-slate-400" size={32} />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white">{LABELS[lang].noArticles}</h3>
                 <p className="text-slate-500 dark:text-slate-400">{LABELS[lang].tryAdjusting}</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredArticles.map(article => (
                    <div 
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group h-full flex flex-col"
                    >
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-1 flex-wrap">
                             {article.teamIds.map(tid => {
                                const t = teams.find(tm => tm.id === tid);
                                return t ? <span key={tid} className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} title={t.name} /> : null;
                             })}
                          </div>
                          <ChevronRight className={`text-slate-300 group-hover:text-${settings.primaryColor} transition-colors`} size={20} />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {article.title}
                       </h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                          {article.summary}
                       </p>
                    </div>
                 ))}
              </div>
           )}
        </div>

      </main>

      <AIAssistant 
        visible={showAI} 
        onClose={() => setShowAI(false)}
        onOpen={() => setShowAI(true)}
        contextArticles={filteredArticles}
        teams={teams}
        lang={lang}
        aiSettings={aiSettings}
        pendingQuery={pendingAIQuery}
        onQueryHandled={() => setPendingAIQuery('')}
      />
    </div>
  );
};

// --- ADMIN COMPONENTS ---

const AdminLayout = ({ children, title, theme, toggleTheme }: { children?: React.ReactNode; title: string; theme: Theme; toggleTheme: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
    { path: '/admin/articles', icon: 'BookOpen', label: 'Articles' },
    { path: '/admin/teams', icon: 'Users', label: 'Teams' },
    { path: '/admin/appearance', icon: 'Palette', label: 'Appearance' },
    { path: '/admin/ai', icon: 'Bot', label: 'AI Control' },
    { path: '/admin/security', icon: 'Shield', label: 'Security' },
  ];

  const handleLogout = () => {
    // In a real app, clear tokens. Here just navigate.
    window.location.href = '/#/admin/login'; 
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight">elmenus <span className="font-light text-slate-400">Admin</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
             const isActive = location.pathname === item.path;
             return (
               <Link 
                 key={item.path} 
                 to={item.path} 
                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-red-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
               >
                 <Icon name={item.icon} size={18} />
                 <span className="font-medium text-sm">{item.label}</span>
               </Link>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
           {/* Back to Agent View Link */}
           <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full text-left transition-colors mb-1">
              <Globe size={18} />
              <span className="font-medium text-sm">Back to Agent View</span>
           </Link>
           
           <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full text-left">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span className="font-medium text-sm">Toggle Theme</span>
           </button>
           <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 w-full text-left">
             <LogOut size={18} />
             <span className="font-medium text-sm">Logout</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
         <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
         </header>
         <main className="flex-1 p-8 overflow-y-auto">
            {children}
         </main>
      </div>
    </div>
  );
};

const ArticleForm = ({ initialData, teams, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState<Article>(initialData);
  const [showMindMapEditor, setShowMindMapEditor] = useState(!!initialData.mindMap);
  const [showStyleSettings, setShowStyleSettings] = useState(false);

  const handleChange = (field: keyof Article, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleStyleChange = (field: keyof MindMapStyle, value: any) => {
    setFormData(prev => ({ 
        ...prev, 
        mindMapStyle: { ...prev.mindMapStyle, [field]: value } 
    }));
  };

  // Step Handlers
  const handleStepChange = (idx: number, field: keyof ProcessStep, val: any) => {
    const newSteps = [...formData.processSteps];
    newSteps[idx] = { ...newSteps[idx], [field]: val };
    handleChange('processSteps', newSteps);
  };
  const addStep = () => handleChange('processSteps', [...formData.processSteps, { title: '', description: '', contentBlocks: [], htmlContent: '' }]);
  const removeStep = (idx: number) => handleChange('processSteps', formData.processSteps.filter((_, i) => i !== idx));

  // Outcome Handlers
  const handleOutcomeChange = (idx: number, field: keyof Outcome, val: string) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[idx] = { ...newOutcomes[idx], [field]: val };
    handleChange('outcomes', newOutcomes);
  };
  const addOutcome = () => handleChange('outcomes', [...formData.outcomes, { label: '', action: '' }]);
  const removeOutcome = (idx: number) => handleChange('outcomes', formData.outcomes.filter((_, i) => i !== idx));

  // Mind Map Handlers
  const toggleMindMap = () => {
    if (!showMindMapEditor) {
      if (!formData.mindMap) {
        handleChange('mindMap', { id: 'root', label: 'Start Decision', children: [] });
      }
      setShowMindMapEditor(true);
    } else {
      if (confirm('Disable Mind Map? This will hide it from the article.')) {
         setShowMindMapEditor(false);
         handleChange('mindMap', undefined);
      }
    }
  };

  const handleMindMapChange = (newNode: MindMapNode) => {
    handleChange('mindMap', newNode);
  };

  const toggleTeam = (teamId: string) => {
    const current = formData.teamIds;
    if(current.includes(teamId)) handleChange('teamIds', current.filter(id => id !== teamId));
    else handleChange('teamIds', [...current, teamId]);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assigned Teams</label>
           <div className="flex flex-wrap gap-2">
              {teams.map((t: Team) => (
                <button
                   key={t.id} type="button" onClick={() => toggleTeam(t.id)}
                   className={`px-3 py-1 rounded-full text-sm border ${formData.teamIds.includes(t.id) ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600'}`}
                >
                  {t.name}
                </button>
              ))}
           </div>
        </div>
        <div className="col-span-2">
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Article Title</label>
           <input type="text" className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
        </div>
      </div>

      {/* 2. Scenario Overview */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Scenario Overview</label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">When should an agent use this process?</p>
        <textarea className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" rows={2} value={formData.summary} onChange={e => handleChange('summary', e.target.value)} />
      </div>

      {/* 3. Trigger */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded border border-blue-200 dark:border-blue-800">
        <label className="block text-sm font-bold text-blue-900 dark:text-blue-100">Trigger</label>
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">What event starts this process?</p>
        <input type="text" className="block w-full border border-blue-300 dark:border-blue-700 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.trigger} onChange={e => handleChange('trigger', e.target.value)} />
      </div>

      {/* 4. Steps */}
      <div>
         <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Step-by-Step Process</label>
            <button type="button" onClick={addStep} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">+ Add Step</button>
         </div>
         <div className="space-y-4">
            {formData.processSteps.map((step, idx) => (
               <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700 relative">
                  <span className="absolute left-4 top-4 w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white">{idx + 1}</span>
                  <div className="pl-10 space-y-3">
                     <input 
                        type="text" placeholder="Step Title" 
                        className="block w-full border border-slate-300 dark:border-slate-600 rounded p-1 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={step.title} onChange={e => handleStepChange(idx, 'title', e.target.value)}
                     />
                     
                     {/* RICH EDITOR REPLACING TEXTAREA */}
                     <div className="mt-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Step Content</label>
                        <WYSIWYGEditor 
                           // Legacy migration: prefer htmlContent, fall back to blocks -> html, fall back to description
                           value={step.htmlContent || (step.contentBlocks && step.contentBlocks.length > 0 ? blocksToHtml(step.contentBlocks) : step.description)} 
                           onChange={(html) => handleStepChange(idx, 'htmlContent', html)} 
                        />
                     </div>

                     <input 
                        type="text" placeholder="Header Image URL (optional)" 
                        className="block w-full border border-slate-300 dark:border-slate-600 rounded p-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-2"
                        value={step.imageUrl || ''} onChange={e => handleStepChange(idx, 'imageUrl', e.target.value)}
                     />
                  </div>
                  <button onClick={() => removeStep(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
               </div>
            ))}
         </div>
      </div>

      {/* 5. Outcomes */}
      <div>
         <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Decisions & Outcomes</label>
            <button type="button" onClick={addOutcome} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">+ Add Outcome</button>
         </div>
         <div className="space-y-2">
            {formData.outcomes.map((out, idx) => (
               <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                     <input 
                        type="text" placeholder="Label (e.g. Approved)" 
                        className="col-span-1 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={out.label} onChange={e => handleOutcomeChange(idx, 'label', e.target.value)}
                     />
                     <input 
                        type="text" placeholder="Action Required" 
                        className="col-span-2 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        value={out.action} onChange={e => handleOutcomeChange(idx, 'action', e.target.value)}
                     />
                  </div>
                  <button onClick={() => removeOutcome(idx)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
               </div>
            ))}
         </div>
      </div>

      {/* 6. Mind Map (Optional) */}
      <div className="bg-indigo-50 dark:bg-slate-800 p-4 rounded border border-indigo-100 dark:border-slate-700">
         <div className="flex justify-between items-center mb-4">
            <div>
               <label className="block text-sm font-bold text-slate-900 dark:text-white">Decision Tree (Mind Map)</label>
               <p className="text-xs text-slate-500 dark:text-slate-400">Visual flow for complex decision making.</p>
            </div>
            <button 
               type="button" 
               onClick={toggleMindMap}
               className={`px-3 py-1 text-sm rounded border transition-colors ${showMindMapEditor ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-800' : 'bg-white text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}
            >
               {showMindMapEditor ? 'Disable Mind Map' : 'Enable Mind Map'}
            </button>
         </div>
         
         {showMindMapEditor && formData.mindMap && (
            <div className="pl-2 border-l-2 border-indigo-200 dark:border-slate-600">
               {/* Appearance Settings Toggle */}
               <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                  <button 
                      type="button"
                      onClick={() => setShowStyleSettings(!showStyleSettings)}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                      <Palette size={16} />
                      Mind Map Global Appearance
                  </button>
                  
                  {showStyleSettings && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                              <label className="block text-xs text-slate-500 mb-1">Node Background</label>
                              <div className="flex items-center gap-2">
                                  <input type="color" value={formData.mindMapStyle?.nodeBg || '#ffffff'} onChange={e => handleStyleChange('nodeBg', e.target.value)} className="h-6 w-6 rounded border cursor-pointer" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs text-slate-500 mb-1">Node Border</label>
                               <div className="flex items-center gap-2">
                                  <input type="color" value={formData.mindMapStyle?.nodeBorder || '#e0e7ff'} onChange={e => handleStyleChange('nodeBorder', e.target.value)} className="h-6 w-6 rounded border cursor-pointer" />
                              </div>
                          </div>
                           <div>
                              <label className="block text-xs text-slate-500 mb-1">Text Color</label>
                               <div className="flex items-center gap-2">
                                  <input type="color" value={formData.mindMapStyle?.nodeColor || '#1e293b'} onChange={e => handleStyleChange('nodeColor', e.target.value)} className="h-6 w-6 rounded border cursor-pointer" />
                              </div>
                          </div>
                           <div>
                              <label className="block text-xs text-slate-500 mb-1">Connector Line</label>
                               <div className="flex items-center gap-2">
                                  <input type="color" value={formData.mindMapStyle?.lineColor || '#cbd5e1'} onChange={e => handleStyleChange('lineColor', e.target.value)} className="h-6 w-6 rounded border cursor-pointer" />
                              </div>
                          </div>
                           <div>
                              <label className="block text-xs text-slate-500 mb-1">Border Radius</label>
                              <select 
                                  value={formData.mindMapStyle?.nodeRadius || '0.5rem'} 
                                  onChange={e => handleStyleChange('nodeRadius', e.target.value)}
                                  className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded p-1 bg-transparent dark:text-white"
                              >
                                  <option value="0px">Square</option>
                                  <option value="0.5rem">Rounded</option>
                                  <option value="1rem">Large</option>
                                  <option value="9999px">Pill</option>
                              </select>
                          </div>
                      </div>
                  )}
               </div>

               <MindMapEditor 
                  node={formData.mindMap} 
                  onChange={handleMindMapChange}
                  isRoot={true}
                  styleSettings={formData.mindMapStyle}
               />
            </div>
         )}
      </div>

      {/* 7. Short Answer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded border border-yellow-200 dark:border-yellow-800">
        <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-100">Short Answer</label>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">For AI and quick reference.</p>
        <textarea className="block w-full border border-yellow-300 dark:border-yellow-700 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" rows={2} value={formData.shortAnswer} onChange={e => handleChange('shortAnswer', e.target.value)} />
      </div>

      {/* Troubleshooting */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Troubleshooting</label>
        <textarea className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" rows={3} value={formData.troubleshooting || ''} onChange={e => handleChange('troubleshooting', e.target.value)} />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded hover:bg-slate-800 dark:hover:bg-slate-600">Save Article</button>
      </div>
    </div>
  );
};

const Dashboard = ({ theme, toggleTheme }: any) => {
  const articles = storageService.getArticles();
  const teams = storageService.getTeams();
  const published = articles.filter(a => a.status === 'published').length;
  const drafts = articles.length - published;
  const aiStats = storageService.getAIStats();
  const isOnline = navigator.onLine;

  return (
    <AdminLayout title="Dashboard" theme={theme} toggleTheme={toggleTheme}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Articles</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{articles.length}</p>
          <div className="flex items-center gap-3 mt-1 text-sm">
             <span className="text-green-600 font-medium">{published} Published</span>
             <span className="text-slate-300 dark:text-slate-600">|</span>
             <span className="text-amber-600 font-medium">{drafts} Drafts</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Active Teams</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{teams.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Knowledge Contributors</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">System Status</h3>
          <div className="mt-2 space-y-3">
             <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </span>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{isOnline ? 'Operational' : 'Offline'}</p>
             </div>
             <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">AI Assistant Usage</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{aiStats.count} <span className="text-sm font-normal text-slate-500">queries</span></p>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const AppearanceManager = ({ theme, toggleTheme }: any) => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  
  const save = () => {
    storageService.saveSettings(settings);
    alert('Settings saved. Refresh to see changes.');
  };

  return (
    <AdminLayout title="Appearance" theme={theme} toggleTheme={toggleTheme}>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-700 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">App Name</label>
          <input 
            value={settings.appName} 
            onChange={e => setSettings({...settings, appName: e.target.value})}
            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Brand Color</label>
          <div className="flex gap-2 mt-1">
            <input 
              type="color" 
              value={settings.primaryColor} 
              onChange={e => setSettings({...settings, primaryColor: e.target.value})}
              className="h-10 w-20"
            />
            <input 
               type="text"
               value={settings.primaryColor} 
               onChange={e => setSettings({...settings, primaryColor: e.target.value})}
               className="block flex-1 border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
         <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Default Font</label>
          <select 
            value={settings.contentStyle.fontFamily}
            onChange={e => setSettings({...settings, contentStyle: {...settings.contentStyle, fontFamily: e.target.value as any}})}
            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="Inter">Inter (System)</option>
            <option value="Sans">Sans Serif</option>
            <option value="Cairo">Cairo (Arabic Optimized)</option>
          </select>
        </div>
        <button onClick={save} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded">Save Changes</button>
      </div>
    </AdminLayout>
  )
}

const ArticleManager = ({ theme, toggleTheme }: any) => {
  const [articles, setArticles] = useState<Article[]>(storageService.getArticles());
  const [teams] = useState<Team[]>(storageService.getTeams());
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (article: Article) => {
    let newArticles;
    if (isCreating) {
       newArticles = [...articles, { ...article, id: Date.now().toString(), lastUpdated: Date.now() }];
    } else {
       newArticles = articles.map(a => a.id === article.id ? { ...article, lastUpdated: Date.now() } : a);
    }
    storageService.saveArticles(newArticles);
    setArticles(newArticles);
    setEditingArticle(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if(confirm('Delete this article?')) {
      const newArticles = articles.filter(a => a.id !== id);
      storageService.saveArticles(newArticles);
      setArticles(newArticles);
    }
  };
  
  const createNew = () => {
    const newArt: Article = {
      id: '', teamIds: [], title: '', summary: '', trigger: '', shortAnswer: '',
      processSteps: [], outcomes: [], attachments: [], isVisibleToAgents: true, 
      isAvailableToAi: true, status: 'draft', lastUpdated: Date.now()
    };
    setEditingArticle(newArt);
    setIsCreating(true);
  };

  if (editingArticle) {
    return (
      <AdminLayout title={isCreating ? "New Article" : "Edit Article"} theme={theme} toggleTheme={toggleTheme}>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
           <ArticleForm 
             initialData={editingArticle} 
             teams={teams} 
             onSave={handleSave} 
             onCancel={() => { setEditingArticle(null); setIsCreating(false); }} 
           />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Knowledge Base Articles" theme={theme} toggleTheme={toggleTheme}>
      <div className="flex justify-end mb-6">
        <button onClick={createNew} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} /> New Article
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
           <thead className="bg-slate-50 dark:bg-slate-800">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Teams</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
               <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
             </tr>
           </thead>
           <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
             {articles.map(article => (
               <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{article.title}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex -space-x-2">
                       {article.teamIds.map(tid => {
                         const t = teams.find(team => team.id === tid);
                         return t ? <div key={tid} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" style={{ backgroundColor: t.color }} title={t.name} /> : null;
                       })}
                    </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                      {article.status}
                    </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                   <button onClick={() => setEditingArticle(article)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 mr-4">Edit</button>
                   <button onClick={() => handleDelete(article.id)} className="text-red-600 dark:text-red-400 hover:text-red-900">Delete</button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </AdminLayout>
  );
}

const AssetManager = ({ theme, toggleTheme }: any) => {
  return (
      <AdminLayout title="Assets & Media" theme={theme} toggleTheme={toggleTheme}>
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Image className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No assets</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Media management coming soon.</p>
          </div>
      </AdminLayout>
  )
}

const AIControlManager = ({ theme, toggleTheme }: any) => {
  const [settings, setSettings] = useState<AIControlSettings>(storageService.getAISettings());
  const [teams] = useState<Team[]>(storageService.getTeams());
  
  const save = () => {
      storageService.saveAISettings(settings);
      alert('AI Settings Saved');
  };

  const toggleTeam = (tid: string) => {
      const current = settings.allowedTeamIds;
      if (current.includes(tid)) setSettings({...settings, allowedTeamIds: current.filter(id => id !== tid)});
      else setSettings({...settings, allowedTeamIds: [...current, tid]});
  };

  return (
      <AdminLayout title="AI Control Center" theme={theme} toggleTheme={toggleTheme}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Toggle & Tone */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">Enable AI Assistant</h3>
                      <p className="text-sm text-slate-500">Allow agents to query the Knowledge Base with AI.</p>
                  </div>
                  <button 
                      onClick={() => setSettings({...settings, enabled: !settings.enabled})}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.enabled ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assistant Tone</label>
                  <select 
                      value={settings.tone}
                      onChange={e => setSettings({...settings, tone: e.target.value as any})}
                      className="block w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                      <option value="operational">Operational (Balanced)</option>
                      <option value="direct">Direct & Concise (Expert)</option>
                      <option value="coaching">Coaching (Educational)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Strict Mode</label>
                    <button 
                        onClick={() => setSettings({...settings, strictMode: !settings.strictMode})}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.strictMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.strictMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">If enabled, AI will refuse to answer questions not explicitly covered in the articles.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Brand Color</label>
                  <div className="flex items-center gap-2">
                      <input type="color" value={settings.aiAccentColor} onChange={e => setSettings({...settings, aiAccentColor: e.target.value})} className="h-8 w-12 border border-slate-300 rounded" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{settings.aiAccentColor}</span>
                  </div>
                </div>
            </div>

            {/* Scope & Team Access */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Knowledge Scope</h3>
                  <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={settings.scope.useShortAnswers} onChange={e => setSettings({...settings, scope: {...settings.scope, useShortAnswers: e.target.checked}})} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Use Short Answers (Highly Recommended)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={settings.scope.useFullContent} onChange={e => setSettings({...settings, scope: {...settings.scope, useFullContent: e.target.checked}})} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Use Full Process Content</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={settings.scope.useAttachments} onChange={e => setSettings({...settings, scope: {...settings.scope, useAttachments: e.target.checked}})} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Read Attachments Metadata</span>
                      </label>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Team Access</h3>
                  <p className="text-xs text-slate-500 mb-3">Which teams' articles can the AI access?</p>
                  <div className="flex flex-wrap gap-2">
                      {teams.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => toggleTeam(t.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${settings.allowedTeamIds.includes(t.id) ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500'}`}
                        >
                            {t.name}
                        </button>
                      ))}
                  </div>
                </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button onClick={save} className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity">
                Save AI Configuration
            </button>
          </div>
      </AdminLayout>
  )
}

const TeamManager = ({ theme, toggleTheme }: any) => {
  const [teams] = useState<Team[]>(storageService.getTeams());
  return (
    <AdminLayout title="Manage Teams" theme={theme} toggleTheme={toggleTheme}>
       <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
         <div className="grid gap-4">
            {teams.map(t => (
              <div key={t.id} className="flex items-center p-3 border dark:border-slate-700 rounded-lg">
                <div className="w-8 h-8 rounded-full mr-3" style={{ background: t.color }}></div>
                <div><h4 className="font-bold text-slate-900 dark:text-white">{t.name}</h4><p className="text-sm text-slate-500 dark:text-slate-400">{t.description}</p></div>
              </div>
            ))}
         </div>
       </div>
    </AdminLayout>
  );
};

const SecurityManager = ({ theme, toggleTheme }: any) => {
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const handleSave = () => {
    storageService.setPassword(pass);
    setMsg('Password updated.');
    setPass('');
  };
  return (
    <AdminLayout title="Security" theme={theme} toggleTheme={toggleTheme}>
       <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 max-w-md">
          <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-white">New Admin Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="block w-full border border-slate-300 dark:border-slate-600 rounded p-2 mb-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
          <button onClick={handleSave} className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 dark:hover:bg-slate-600">Update Password</button>
          {msg && <p className="text-green-600 dark:text-green-400 mt-2 text-sm">{msg}</p>}
       </div>
    </AdminLayout>
  );
};

// --- LOGIN ---
const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(storageService.checkPassword(pass)) onLogin();
    else setErr(true);
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-sm border border-transparent dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" />
            {err && <p className="text-red-600 dark:text-red-400 text-sm">Invalid password.</p>}
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold">Login</button>
            <div className="text-center"><Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-white">Return to Knowledge Base</Link></div>
          </form>
       </div>
    </div>
  );
};

// --- APP ---
const App = () => {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [theme, setTheme] = useState<Theme>(storageService.getTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AgentView theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/login" element={isAdminAuth ? <Navigate to="/admin/dashboard" /> : <Login onLogin={() => setIsAdminAuth(true)} />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        <Route path="/admin/*" element={isAdminAuth ? (
              <Routes>
                 <Route path="dashboard" element={<Dashboard theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="appearance" element={<AppearanceManager theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="teams" element={<TeamManager theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="articles" element={<ArticleManager theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="assets" element={<AssetManager theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="ai" element={<AIControlManager theme={theme} toggleTheme={toggleTheme} />} />
                 <Route path="security" element={<SecurityManager theme={theme} toggleTheme={toggleTheme} />} />
              </Routes>
           ) : <Navigate to="/admin/login" />
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;