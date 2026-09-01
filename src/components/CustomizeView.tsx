import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Upload,
  MoreVertical,
  X,
  Trash2,
  Check,
  AlertCircle,
  UploadCloud,
  FileJson,
  Github,
  Zap,
  Bot,
  Terminal,
  RotateCw,
  SlidersHorizontal,
  HelpCircle,
  ChevronDown,
  Power,
  Edit,
  Globe,
  FileText,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Skill, Connector, Plugin } from '../types';
import { useSettings } from '../context/SettingsContext';
import { SkillDetailView, CustomSkillItem } from './SkillDetailView';

type CategoryType = 'Skills' | 'Connectors' | 'Plugins';
type ScopeType = 'Yours' | 'Browse';

export type CustomItem = CustomSkillItem;

const DEFAULT_SKILLS: CustomItem[] = [
  {
    id: 'import-memory',
    type: 'skill',
    name: 'import-memory',
    author: 'Anthropic',
    description: "Import a memory export from another AI assistant into Claude's memory — conversations, preferences, and custom instructions.",
    timeAgo: '5h ago',
    isEnabled: true,
    skillMdContent: `# Importing memory from another assistant

The user wants to bring their memories over from another AI assistant (ChatGPT, Gemini, etc.). You will receive their memory export as pasted text and file it into Claude's memory using the memory tools. This skill carries the rules of Claude's dedicated import pipeline in prompt form — follow them exactly.

## Ground rules — read these first

Check for memory tools before anything else. This import only works where you can write to Claude's memory. Before asking for or reading an export, confirm you have memory tools in this conversation (\`memory_write\` / \`memory_append\`, or their \`mcp__memory__memory_write\` / \`mcp__memory__memory_append\` equivalents). The legacy \`memory_user_edits\` tool does not count: it is a small, lossy scratchpad, not Claude's memory store, so never use it to import anything — if it is the only memory tool you have, treat that as having none. If you have none, tell the user this conversation can't save memories, point them to Settings > Capabilities > "Import memory from other AI providers".

## Step 1: Request or ingest memory export
Ask the user to paste their export or memories into the chat.

## Step 2: Extract & categorize
Parse distinct preferences, projects, context, and persistent instructions.

## Step 3: Commit to memory
Write each memory item cleanly into Claude's long-term memory store.`
  },
  {
    id: 'morning',
    type: 'skill',
    name: 'morning',
    author: 'Anthropic',
    description: 'Render the user\'s morning brief as a styled HTML artifact, or set it up as a recurring workflow.',
    timeAgo: '5h ago',
    isEnabled: true,
    skillMdContent: `# Morning Brief Workflow

Render the user's morning brief as an elegant, styled HTML artifact, or schedule it as a recurring daily workflow.

## Overview
This skill generates a personalized morning dashboard summarizing key daily information:
- Today's date, weather forecast, and schedule
- Top priority focus blocks and active project action items
- Important notifications, industry news briefings, and quick reminders

## Ground Rules & Guidelines
1. Determine current date and timezone context.
2. Check for active project context, tasks, and memory entries to personalize priorities.
3. Output the morning dashboard as an interactive, beautifully styled HTML/Tailwind artifact.
4. Keep the summary crisp, actionable, and visually calming.`
  },
  {
    id: 'web-artifacts-builder',
    type: 'skill',
    name: 'web-artifacts-builder',
    author: 'Anthropic',
    description: 'Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern React and Tailwind.',
    timeAgo: '5h ago',
    isEnabled: true,
    skillMdContent: `# Web Artifacts Builder

Suite of tools and patterns for authoring elaborate, responsive, multi-component claude.ai HTML artifacts using modern React, Lucide icons, and Tailwind CSS.

## Artifact Architecture
- Structure artifacts with clean component hierarchies and modular state.
- Include responsive desktop and mobile container viewports.
- Utilize Tailwind utility classes with dark/light themes.
- Implement robust interactive handlers with simulated real-time state feedback.

## Best Practices
- Keep components self-contained in a single executable HTML or TSX block.
- Handle edge cases, empty states, and transition animations.`
  },
  {
    id: 'skill-creator',
    type: 'skill',
    name: 'skill-creator',
    author: 'Anthropic',
    description: 'Create new skills, modify and improve existing skills, and measure skill performance.',
    timeAgo: '6h ago',
    isEnabled: true,
    skillMdContent: `# Skill Creator & Optimizer

Author, refine, validate, and test custom agent capabilities conforming to the Anthropic Claude Skill architecture.

## Skill Structure
Every custom skill must define:
1. **Metadata**: Clear skill name, author, and concise description.
2. **Trigger Criteria**: Specific keywords, intent patterns, or task domains when the skill should be invoked.
3. **Execution Instructions**: Detailed step-by-step rules, constraints, and tool invocation sequences in \`/SKILL.md\`.
4. **Validation**: Test cases to verify skill behavior across conversational scenarios.`
  }
];

export const GmailIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 48 48">
    <path fill="#4caf50" d="M45,16.2l-5,2.75v18.55c0,1.38-1.12,2.5-2.5,2.5h-5.5V23.5l-8,5.5l-8-5.5v16.5h-5.5c-1.38,0-2.5-1.12-2.5-2.5V18.95l-5-2.75V37.5c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V16.2z"/>
    <path fill="#f44336" d="M24,27.5l16-11V10.5c0-2.76-2.24-5-5-5h-4.5L24,10.5L13.5,5.5H9c-2.76,0-5,2.24-5,5v6L24,27.5z"/>
    <path fill="#ffb300" d="M40,5.5h-5.5v8l5.5,4V10.5C40,7.74,40,5.5,40,5.5z"/>
    <path fill="#2196f3" d="M8,5.5h5.5v8L8,17.5V10.5C8,7.74,8,5.5,8,5.5z"/>
  </svg>
);

export const GoogleDriveIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 87.3 78">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

export const SlackBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 127 127">
    <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
    <path d="M47 27.2c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.7 39.7.8 47 .8c7.3 0 13.2 5.9 13.2 13.2v13.2H47zm0 6.6c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H14C6.7 60.2.8 54.3.8 47c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
    <path d="M99.8 47c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.8V47zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V14c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33z" fill="#2EB67D"/>
    <path d="M80 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8H80zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80z" fill="#ECB22E"/>
  </svg>
);

export const GitHubBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} text-[#ECEBE7] fill-current`} viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export const NotionBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} text-[#ECEBE7] fill-current`} viewBox="0 0 24 24">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.69c-.466-.373-1.166-.746-2.287-.653L2.733 2.156c-.466.046-.56.326-.373.513l2.099 1.539zm-.653 3.684v14.079c0 .746.42 1.026 1.213.98l14.288-.84c.793-.046.98-.56.98-1.166V6.632c0-.56-.233-.84-.793-.793l-14.894.886c-.56.047-.794.42-.794.98v.187zm13.448.746c.093.42 0 .84-.42.887l-1.073.233v9.743c-.606.373-1.213.606-1.726.606-.793 0-1.12-.28-1.773-1.073l-4.57-7.181v6.948l1.633.373c.093.42 0 .84-.42.887l-4.29.233c-.094-.42 0-.84.42-.887l1.213-.28V9.199l-1.446-.14c-.093-.42 0-.84.42-.887l4.337-.28 4.757 7.275V8.872l-1.4-.14c-.094-.42 0-.84.42-.887l3.935-.233z" />
  </svg>
);

const DEFAULT_CONNECTORS: CustomItem[] = [
  {
    id: 'github',
    type: 'connector',
    name: 'GitHub Integration',
    author: 'GitHub',
    description: 'Access repositories, pull requests, issues, and code search directly from Claude.',
    timeAgo: '1d ago',
    isEnabled: true
  },
  {
    id: 'gmail',
    type: 'connector',
    name: 'Gmail',
    author: 'Google',
    description: 'Search, read, and draft emails with AI assistance.',
    timeAgo: '2d ago',
    isEnabled: false
  },
  {
    id: 'google-drive',
    type: 'connector',
    name: 'Google Drive',
    author: 'Google',
    description: 'Search, read, and reference Docs, Sheets, and Slides from Google Drive.',
    timeAgo: '3d ago',
    isEnabled: false
  },
  {
    id: 'slack',
    type: 'connector',
    name: 'Slack',
    author: 'Slack',
    description: 'Read messages, search chat history, and summarize channel threads.',
    timeAgo: '4d ago',
    isEnabled: false
  },
  {
    id: 'notion',
    type: 'connector',
    name: 'Notion',
    author: 'Notion',
    description: 'Search and access Notion workspace pages, documents, and databases.',
    timeAgo: '5d ago',
    isEnabled: false
  },
  {
    id: 'jira',
    type: 'connector',
    name: 'Jira',
    author: 'Atlassian',
    description: 'Manage Jira issues, sprints, backlogs, and agile tickets.',
    timeAgo: '5d ago',
    isEnabled: false
  },
  {
    id: 'linear',
    type: 'connector',
    name: 'Linear',
    author: 'Linear',
    description: 'Streamlined project management and issue tracking integration.',
    timeAgo: '1w ago',
    isEnabled: false
  }
];

const DEFAULT_PLUGINS: CustomItem[] = [
  {
    id: 'web-search',
    type: 'plugin',
    name: 'web-search',
    author: 'Anthropic',
    description: 'Real-time web browsing and search information retrieval tool.',
    timeAgo: 'Built-in',
    isEnabled: true
  },
  {
    id: 'python-sandbox',
    type: 'plugin',
    name: 'python-sandbox',
    author: 'Anthropic',
    description: 'Interactive Python execution environment with NumPy, Pandas, and Matplotlib.',
    timeAgo: 'Built-in',
    isEnabled: true
  },
  {
    id: 'math-latex-renderer',
    type: 'plugin',
    name: 'math-latex-renderer',
    author: 'Anthropic',
    description: 'High-fidelity KaTeX mathematics and formula typesetting engine.',
    timeAgo: 'Built-in',
    isEnabled: true
  },
  {
    id: 'charts-visualizer',
    type: 'plugin',
    name: 'charts-visualizer',
    author: 'Anthropic',
    description: 'Interactive Recharts and Chart.js diagram visualizer.',
    timeAgo: 'Built-in',
    isEnabled: true
  }
];

export const CustomizeView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Skills');
  const [selectedScope, setSelectedScope] = useState<ScopeType>('Yours');
  const [connectorStatusFilter, setConnectorStatusFilter] = useState<'All' | 'Connected' | 'Not connected'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recent' | 'alphabetical'>('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [skillsList, setSkillsList] = useState<CustomItem[]>(() => {
    try {
      const saved = localStorage.getItem('claude_custom_skills');
      if (saved) {
        const parsed: CustomItem[] = JSON.parse(saved);
        const removedIds = [
          'si-visibility',
          'b12-website-editor',
          'broken-links',
          'content-brief',
          'content-strategy',
          'content-translation'
        ];
        const filtered = parsed.filter((item) => !removedIds.includes(item.id));
        if (filtered.length > 0) {
          return filtered.map((item) => {
            const defMatch = DEFAULT_SKILLS.find((d) => d.id === item.id);
            if (defMatch && (!item.skillMdContent || item.skillMdContent.length < 50)) {
              return { ...item, skillMdContent: defMatch.skillMdContent };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SKILLS;
  });

  const [connectorsList, setConnectorsList] = useState<CustomItem[]>(() => {
    try {
      const saved = localStorage.getItem('claude_custom_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CONNECTORS;
  });

  const [pluginsList, setPluginsList] = useState<CustomItem[]>(() => {
    try {
      const saved = localStorage.getItem('claude_custom_plugins');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PLUGINS;
  });

  // Save to localStorage when list changes
  useEffect(() => {
    try {
      localStorage.setItem('claude_custom_skills', JSON.stringify(skillsList));
    } catch (e) {
      console.error(e);
    }
  }, [skillsList]);

  useEffect(() => {
    try {
      localStorage.setItem('claude_custom_connectors', JSON.stringify(connectorsList));
    } catch (e) {
      console.error(e);
    }
  }, [connectorsList]);

  useEffect(() => {
    try {
      localStorage.setItem('claude_custom_plugins', JSON.stringify(pluginsList));
    } catch (e) {
      console.error(e);
    }
  }, [pluginsList]);

  // Auto clear toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const [activeSkillDetail, setActiveSkillDetail] = useState<CustomSkillItem | null>(null);

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeContextMenuId, setActiveContextMenuId] = useState<string | null>(null);

  const [isCreateSkillModalOpen, setIsCreateSkillModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<CustomItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<CustomItem | null>(null);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (addMenuRef.current && !addMenuRef.current.contains(target)) {
        setIsAddMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setActiveContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If a skill is selected for viewing / editing SKILL.md, render Claude's Skill Detail Workspace
  if (activeSkillDetail) {
    return (
      <SkillDetailView
        skill={activeSkillDetail}
        onBack={() => setActiveSkillDetail(null)}
        onUpdate={(updated) => {
          setActiveSkillDetail(updated);
          setSkillsList((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
        }}
        onDelete={(id) => {
          const itemToDelete = skillsList.find((s) => s.id === id);
          setSkillsList((prev) => prev.filter((s) => s.id !== id));
          setActiveSkillDetail(null);
          setToastMessage(`"${itemToDelete?.name || 'Skill'}" deleted successfully`);
        }}
        onToggle={() => {
          const updated = {
            ...activeSkillDetail,
            isEnabled: !activeSkillDetail.isEnabled
          };
          setActiveSkillDetail(updated);
          handleToggleItem(activeSkillDetail);
        }}
      />
    );
  }

  const getCurrentItems = (): CustomItem[] => {
    let list: CustomItem[] = [];
    if (selectedCategory === 'Skills') list = skillsList;
    else if (selectedCategory === 'Connectors') list = connectorsList;
    else if (selectedCategory === 'Plugins') list = pluginsList;

    if (selectedCategory === 'Connectors') {
      if (connectorStatusFilter === 'Connected') {
        list = list.filter((item) => item.isEnabled);
      } else if (connectorStatusFilter === 'Not connected') {
        list = list.filter((item) => !item.isEnabled);
      }
    } else if (selectedScope === 'Yours') {
      list = list.filter((item) => item.isEnabled);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
    }

    if (sortOrder === 'alphabetical') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  };

  const handleToggleItem = (item: CustomItem) => {
    const update = (prev: CustomItem[]) =>
      prev.map((i) => (i.id === item.id ? { ...i, isEnabled: !i.isEnabled } : i));

    if (item.type === 'skill') setSkillsList(update);
    else if (item.type === 'connector') setConnectorsList(update);
    else if (item.type === 'plugin') setPluginsList(update);
  };

  const handleDeleteItem = (item: CustomItem) => {
    const remove = (prev: CustomItem[]) => prev.filter((i) => i.id !== item.id);
    if (item.type === 'skill') setSkillsList(remove);
    else if (item.type === 'connector') setConnectorsList(remove);
    else if (item.type === 'plugin') setPluginsList(remove);
    setDeleteTargetItem(null);
    setToastMessage(`"${item.name}" deleted successfully`);
  };

  const getItemIcon = (item: CustomItem) => {
    if (item.type === 'connector') {
      const key = item.id.toLowerCase();
      const n = item.name.toLowerCase();
      if (key === 'gmail' || n.includes('gmail')) return <GmailIcon className="w-4 h-4" />;
      if (key.includes('google') || n.includes('drive')) return <GoogleDriveIcon className="w-4 h-4" />;
      if (key.includes('slack') || n.includes('slack')) return <SlackBrandIcon className="w-4 h-4" />;
      if (key.includes('github') || n.includes('github')) return <GitHubBrandIcon className="w-4 h-4" />;
      if (key.includes('notion') || n.includes('notion')) return <NotionBrandIcon className="w-4 h-4" />;
      if (key.includes('linear') || n.includes('linear')) {
        return (
          <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
            <path d="M2.5 12a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0zm9.5-6a6 6 0 0 0-6 6c0 1.2.35 2.31.96 3.24l8.28-8.28A5.96 5.96 0 0 0 12 6zm4.8 2.52-8.04 8.04A5.98 5.98 0 0 0 12 18a6 6 0 0 0 4.8-9.48z"/>
          </svg>
        );
      }
      if (key.includes('jira') || n.includes('jira')) {
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M11.53 2c0 2.4-1.97 4.35-4.4 4.35H4.8v2.33h2.33c3.68 0 6.67-2.99 6.67-6.68H11.53z" fill="#0052CC"/>
            <path d="M19.2 9.67c0 2.4-1.97 4.35-4.4 4.35h-2.33v2.33h2.33c3.68 0 6.67-2.99 6.67-6.68H19.2z" fill="#2684FF"/>
            <path d="M11.53 9.67c0 2.4-1.97 4.35-4.4 4.35H4.8v2.33h2.33c3.68 0 6.67-2.99 6.67-6.68H11.53z" fill="#0052CC"/>
          </svg>
        );
      }
      return <Zap className="w-4 h-4 text-[#DA7756]" />;
    }
    if (item.type === 'plugin') {
      if (item.id.includes('python')) return <Terminal className="w-4 h-4 text-[#3B82F6]" />;
      if (item.id.includes('search')) return <Search className="w-4 h-4 text-[#10B981]" />;
      return <Sparkles className="w-4 h-4 text-[#8B5CF6]" />;
    }
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h10" />
        <path d="M7 12h10" />
        <path d="M7 17h6" />
      </svg>
    );
  };

  const currentItems = getCurrentItems();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141413] text-[#ECEBE7] overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 py-7 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#ECEBE7]">
            Customize
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#201F1D]">
          <div className="flex items-center gap-3">
            <div className="bg-[#1C1B19] p-1 rounded-xl border border-[#282725] flex items-center gap-0.5">
              {(['Skills', 'Connectors', 'Plugins'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#2E2C28] text-white font-medium shadow-xs'
                      : 'text-[#8C8A82] hover:text-[#ECEBE7] font-normal'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-[#1C1B19] p-1 rounded-xl border border-[#282725] flex items-center gap-0.5">
              {(['Yours', 'Browse'] as const).map((sc) => (
                <button
                  key={sc}
                  onClick={() => setSelectedScope(sc)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedScope === sc
                      ? 'bg-[#2E2C28] text-white font-medium shadow-xs'
                      : 'text-[#8C8A82] hover:text-[#ECEBE7] font-normal'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${selectedCategory.toLowerCase()}...`}
                  autoFocus
                  className="bg-[#1C1B19] border border-[#2E2D2A] rounded-xl px-3 py-1.5 text-xs text-[#ECEBE7] placeholder-[#666] outline-none focus:border-[#DA7756] w-48"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8A82] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSortOrder(prev => prev === 'recent' ? 'alphabetical' : 'recent')}
              className={`p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors ${
                sortOrder === 'alphabetical' ? 'text-[#DA7756]' : ''
              }`}
              title={`Sort: ${sortOrder === 'recent' ? 'Most recent' : 'A-Z'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              className={`p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors ${
                isRefreshing ? 'animate-spin text-[#DA7756]' : ''
              }`}
              title="Sync / Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#201F1D] transition-colors"
              title="Customizations Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Add</span>
                <ChevronDown className="w-3.5 h-3.5 text-black/80" />
              </button>

              {isAddMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsCreateSkillModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#DA7756]" />
                    <span>Create new skill</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUploadModalOpen(true);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Upload skill (.json/.yaml)</span>
                  </button>
                  <div className="my-1 border-t border-[#262522]" />
                  <button
                    onClick={() => {
                      setSelectedCategory('Connectors');
                      setSelectedScope('Browse');
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Add connector</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory('Plugins');
                      setSelectedScope('Browse');
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#8C8A82]" />
                    <span>Add plugin</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedCategory === 'Connectors' ? (
          <div className="space-y-6 pt-1">
            {/* Popular Section (matching screenshot) */}
            <div>
              <h3 className="text-xs text-[#8C8A82] font-normal mb-3">Popular</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gmail Card */}
                {(() => {
                  const gmailItem = connectorsList.find((c) => c.id === 'gmail') || {
                    id: 'gmail',
                    name: 'Gmail',
                    isEnabled: false,
                    type: 'connector',
                    author: 'Google',
                    description: '',
                    timeAgo: ''
                  };
                  return (
                    <div className="bg-[#1C1B19] border border-[#282725] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <GmailIcon className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-medium text-[#ECEBE7]">Gmail</span>
                      </div>
                      <button
                        onClick={() => handleToggleItem(gmailItem as CustomItem)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          gmailItem.isEnabled
                            ? 'bg-[#2E2C28] text-white border-[#3E3C38]'
                            : 'bg-[#201F1D] border-[#2D2C28] hover:bg-[#282724] text-[#ECEBE7]'
                        }`}
                      >
                        {gmailItem.isEnabled ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  );
                })()}

                {/* Google Drive Card */}
                {(() => {
                  const gdriveItem = connectorsList.find((c) => c.id === 'google-drive') || {
                    id: 'google-drive',
                    name: 'Google Drive',
                    isEnabled: false,
                    type: 'connector',
                    author: 'Google',
                    description: '',
                    timeAgo: ''
                  };
                  return (
                    <div className="bg-[#1C1B19] border border-[#282725] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <GoogleDriveIcon className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-medium text-[#ECEBE7]">Google Drive</span>
                      </div>
                      <button
                        onClick={() => handleToggleItem(gdriveItem as CustomItem)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          gdriveItem.isEnabled
                            ? 'bg-[#2E2C28] text-white border-[#3E3C38]'
                            : 'bg-[#201F1D] border-[#2D2C28] hover:bg-[#282724] text-[#ECEBE7]'
                        }`}
                      >
                        {gdriveItem.isEnabled ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  );
                })()}

                {/* Slack Card */}
                {(() => {
                  const slackItem = connectorsList.find((c) => c.id === 'slack') || {
                    id: 'slack',
                    name: 'Slack',
                    isEnabled: false,
                    type: 'connector',
                    author: 'Slack',
                    description: '',
                    timeAgo: ''
                  };
                  return (
                    <div className="bg-[#1C1B19] border border-[#282725] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <SlackBrandIcon className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-medium text-[#ECEBE7]">Slack</span>
                      </div>
                      <button
                        onClick={() => handleToggleItem(slackItem as CustomItem)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          slackItem.isEnabled
                            ? 'bg-[#2E2C28] text-white border-[#3E3C38]'
                            : 'bg-[#201F1D] border-[#2D2C28] hover:bg-[#282724] text-[#ECEBE7]'
                        }`}
                      >
                        {slackItem.isEnabled ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sub-filter Capsules (All / Connected / Not connected) */}
            <div className="flex items-center gap-1.5 pt-1">
              {(['All', 'Connected', 'Not connected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setConnectorStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    connectorStatusFilter === st
                      ? 'bg-[#2A2824] text-white font-medium shadow-xs'
                      : 'text-[#8C8A82] hover:text-[#ECEBE7]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-xs text-[#8C8A82] pt-3 pb-2 border-b border-[#201F1D]">
              <div className="col-span-8 sm:col-span-8">Connector</div>
              <div className="col-span-2 sm:col-span-2">Type</div>
              <div className="col-span-2 sm:col-span-2 text-right pr-2">Status</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-0.5">
              {currentItems.length === 0 ? (
                <div className="py-12 text-center text-[#8C8A82] text-xs">
                  No connectors found in this view.
                </div>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center py-3.5 px-2 rounded-xl hover:bg-[#1C1B19]/60 transition-colors text-xs group"
                  >
                    {/* Connector col */}
                    <div className="col-span-8 sm:col-span-8 flex items-center gap-3.5 min-w-0">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {getItemIcon(item)}
                      </div>
                      <span className="text-xs font-medium text-[#ECEBE7] truncate">
                        {item.name}
                      </span>
                    </div>

                    {/* Type col */}
                    <div className="col-span-2 sm:col-span-2 text-xs text-[#8C8A82]">
                      Web
                    </div>

                    {/* Status col */}
                    <div className="col-span-2 sm:col-span-2 flex justify-end items-center pr-2">
                      {item.isEnabled ? (
                        <Check className="w-4 h-4 text-[#ECEBE7]" />
                      ) : (
                        <button
                          onClick={() => handleToggleItem(item)}
                          className="px-3.5 py-1 rounded-lg bg-[#201F1D] border border-[#2D2C28] hover:bg-[#282724] text-xs text-[#ECEBE7] font-medium transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {currentItems.length === 0 ? (
              <div className="py-16 text-center text-[#8C8A82] text-xs">
                No {selectedCategory.toLowerCase()} found in {selectedScope.toLowerCase()}.
              </div>
            ) : (
              currentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'skill') {
                      setActiveSkillDetail(item);
                    } else {
                      setDetailItem(item);
                    }
                  }}
                  className="group px-3 py-3 rounded-xl hover:bg-[#1C1B19] cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1C1B19] border border-[#282725] flex items-center justify-center text-[#9C9A92] shrink-0 group-hover:border-[#383734] group-hover:text-white transition-colors">
                      {getItemIcon(item)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13.5px] font-medium text-[#ECEBE7] group-hover:text-white transition-colors">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-normal text-[#8C8A82] bg-[#22211F] px-2 py-0.5 rounded-md border border-[#2B2A27]">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#8C8A82] truncate max-w-xl sm:max-w-2xl mt-0.5 leading-relaxed">
                        <span className="text-[#A5A39C]">by {item.author}</span>
                        <span className="mx-1.5 text-[#555450]">•</span>
                        <span>{item.description}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-[#706E68] hidden sm:inline-block">
                      {item.timeAgo}
                    </span>

                    <div className="relative" ref={contextMenuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveContextMenuId(activeContextMenuId === item.id ? null : item.id);
                        }}
                        className="p-1.5 rounded-lg text-[#8C8A82] hover:text-[#ECEBE7] hover:bg-[#262522] transition-colors"
                        aria-label="Item options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeContextMenuId === item.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              handleToggleItem(item);
                              setActiveContextMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                          >
                            <Power className="w-3.5 h-3.5 text-[#8C8A82]" />
                            <span>{item.isEnabled ? 'Disable' : 'Enable'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (item.type === 'skill') {
                                setActiveSkillDetail(item);
                              } else {
                                setDetailItem(item);
                              }
                              setActiveContextMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#242320] text-left text-[#ECEBE7]"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#8C8A82]" />
                            <span>View details</span>
                          </button>
                          <div className="my-0.5 border-t border-[#262522]" />
                          <button
                            onClick={() => {
                              setDeleteTargetItem(item);
                              setActiveContextMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-left text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isCreateSkillModalOpen && (
        <CreateSkillDialog
          onClose={() => setIsCreateSkillModalOpen(false)}
          onCreate={(newSkill) => {
            setSkillsList(prev => [newSkill, ...prev]);
            setIsCreateSkillModalOpen(false);
            setActiveSkillDetail(newSkill);
          }}
        />
      )}

      {isUploadModalOpen && (
        <UploadSkillDialog
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={(uploadedSkill) => {
            setSkillsList(prev => [uploadedSkill, ...prev]);
            setIsUploadModalOpen(false);
            setActiveSkillDetail(uploadedSkill);
          }}
        />
      )}

      {detailItem && (
        <ItemDetailDialog
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onToggle={() => handleToggleItem(detailItem)}
        />
      )}

      {deleteTargetItem && (
        <DeleteConfirmDialog
          item={deleteTargetItem}
          onClose={() => setDeleteTargetItem(null)}
          onConfirm={() => handleDeleteItem(deleteTargetItem)}
        />
      )}

      {isHelpModalOpen && (
        <HelpGuideDialog onClose={() => setIsHelpModalOpen(false)} />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1B19] border border-[#2B2A27] text-[#ECEBE7] text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

interface CreateSkillDialogProps {
  onClose: () => void;
  onCreate: (skill: CustomItem) => void;
}

const CreateSkillDialog: React.FC<CreateSkillDialogProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const skillName = name.trim();
    const skillDesc = description.trim() || 'Custom user skill';
    const skillInstr = instructions.trim();

    const starterMd = `# ${skillName}

${skillDesc}

## Ground rules — read these first

Check for required tools before executing workflows. When the user invokes this skill, format structured output according to Anthropic best practices.

### Instructions

${skillInstr || '1. Parse the user request thoroughly.\n2. Formulate clear step-by-step logic.\n3. Deliver high quality markdown responses.'}`;

    onCreate({
      id: skillName.toLowerCase().replace(/\s+/g, '-'),
      type: 'skill',
      name: skillName,
      badge: badge.trim() || undefined,
      author: 'Custom',
      description: skillDesc,
      instructions: starterMd,
      skillMdContent: starterMd,
      timeAgo: 'Just now',
      isEnabled: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#262522]">
          <h2 className="text-sm font-semibold text-[#ECEBE7]">Create New Skill</h2>
          <button onClick={onClose} className="text-[#8C8A82] hover:text-[#ECEBE7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Skill Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. code-reviewer"
              required
              autoFocus
              className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] placeholder-[#666] outline-none focus:border-[#DA7756]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Category Badge (Optional)</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. Developer Tools"
              className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] placeholder-[#666] outline-none focus:border-[#DA7756]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#ECEBE7] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do?"
              required
              className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl px-3 py-2 text-xs text-[#ECEBE7] placeholder-[#666] outline-none focus:border-[#DA7756]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#ECEBE7] mb-1">System Instructions / Initial SKILL.md</label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="System prompt and instructions for this skill..."
              className="w-full bg-[#141413] border border-[#2B2A27] rounded-xl p-3 text-xs text-[#ECEBE7] placeholder-[#666] font-mono outline-none focus:border-[#DA7756] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#262522]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#8C8A82] hover:bg-[#201F1D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow transition-all"
            >
              Create Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface UploadSkillDialogProps {
  onClose: () => void;
  onUpload: (skill: CustomItem) => void;
}

const UploadSkillDialog: React.FC<UploadSkillDialogProps> = ({ onClose, onUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [extractedTitle, setExtractedTitle] = useState<string>('');

  const processFile = (file: File) => {
    setFileName(file.name);
    const clean = file.name.replace(/\.(md|json|yaml|yml|txt)$/i, '');
    setExtractedTitle(clean);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setRawTextContent(text);

      // Extract markdown H1 if present
      const h1Match = text.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        setExtractedTitle(h1Match[1].trim().toLowerCase().replace(/\s+/g, '-'));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (!fileName) return;
    const skillName = extractedTitle || fileName.replace(/\.(md|json|yaml|yml|txt)$/i, '');
    
    const content = rawTextContent || `# ${skillName}

Skill imported from ${fileName}.

## Instructions

Follow the rules defined in this uploaded skill config.`;

    onUpload({
      id: skillName.toLowerCase().replace(/\s+/g, '-'),
      type: 'skill',
      name: skillName,
      author: 'Uploaded',
      description: `Imported skill definition from ${fileName}`,
      instructions: content,
      skillMdContent: content,
      timeAgo: 'Just now',
      isEnabled: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#262522]">
          <h2 className="text-sm font-semibold text-[#ECEBE7]">Upload Skill (.md / .json / .yaml)</h2>
          <button onClick={onClose} className="text-[#8C8A82] hover:text-[#ECEBE7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#2B2A27] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#141413] hover:border-[#DA7756]/60 transition-colors cursor-pointer text-center"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.md,.json,.yaml,.yml,.txt';
            input.onchange = (e: any) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            };
            input.click();
          }}
        >
          <UploadCloud className="w-8 h-8 text-[#8C8A82] mb-3" />
          <p className="text-xs font-medium text-[#ECEBE7] mb-1">
            {fileName ? fileName : 'Click or drag SKILL.md file here to upload'}
          </p>
          <p className="text-[11px] text-[#706E68]">Support for SKILL.md, .markdown, .json, or .yaml</p>
        </div>

        {fileName && (
          <div className="bg-[#201F1D] border border-[#2B2A27] rounded-xl p-3 flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[#ECEBE7]">Ready to import: {fileName}</p>
              <p className="text-[11px] text-[#8C8A82]">
                {rawTextContent ? `${rawTextContent.length} characters loaded` : 'Valid Antigravity / Claude skill format detected.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#262522]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[#8C8A82] hover:bg-[#201F1D]"
          >
            Cancel
          </button>
          <button
            disabled={!fileName}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow disabled:opacity-40 transition-all"
          >
            Save Upload
          </button>
        </div>
      </div>
    </div>
  );
};

interface ItemDetailDialogProps {
  item: CustomItem;
  onClose: () => void;
  onToggle: () => void;
}

const ItemDetailDialog: React.FC<ItemDetailDialogProps> = ({ item, onClose, onToggle }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#262522]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-[#ECEBE7]">{item.name}</span>
            {item.badge && (
              <span className="text-[10px] text-[#8C8A82] bg-[#22211F] px-2 py-0.5 rounded border border-[#2B2A27]">
                {item.badge}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[#8C8A82] hover:text-[#ECEBE7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[#706E68] text-[11px] uppercase tracking-wider block mb-1">Author</span>
            <span className="text-xs text-[#ECEBE7] font-medium">{item.author}</span>
          </div>

          <div>
            <span className="text-[#706E68] text-[11px] uppercase tracking-wider block mb-1">Description</span>
            <p className="text-xs text-[#C4C3BE] leading-relaxed">{item.description}</p>
          </div>

          <div>
            <span className="text-[#706E68] text-[11px] uppercase tracking-wider block mb-1">Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.isEnabled ? 'bg-emerald-400' : 'bg-[#706E68]'}`} />
              <span className="text-xs text-[#ECEBE7]">{item.isEnabled ? 'Active and enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[#262522]">
          <button
            onClick={() => {
              onToggle();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#22211F] hover:bg-[#282725] text-[#ECEBE7] border border-[#2E2D2A]"
          >
            {item.isEnabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteConfirmDialogProps {
  item: CustomItem;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ item, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h2 className="text-sm font-semibold text-[#ECEBE7]">Delete {item.name}?</h2>
        </div>

        <p className="text-xs text-[#8C8A82] leading-relaxed">
          Are you sure you want to remove <strong>{item.name}</strong>? This action will remove it from your workspace.
        </p>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#262522]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[#8C8A82] hover:bg-[#201F1D]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const HelpGuideDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1C1B19] border border-[#2B2A27] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#262522]">
          <h2 className="text-sm font-semibold text-[#ECEBE7]">About Customizations</h2>
          <button onClick={onClose} className="text-[#8C8A82] hover:text-[#ECEBE7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#8C8A82] leading-relaxed">
          <p>
            <strong className="text-[#ECEBE7]">Skills:</strong> Reusable capability packs with custom system instructions, automated multi-step workflows, and tools.
          </p>
          <p>
            <strong className="text-[#ECEBE7]">Connectors:</strong> Deep integrations with external platforms like GitHub, Google Drive, Notion, and Slack.
          </p>
          <p>
            <strong className="text-[#ECEBE7]">Plugins:</strong> Built-in execution environments including Python sandbox, web search, and KaTeX math renderers.
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#262522]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
