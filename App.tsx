
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Menubar from './components/Menubar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import StatusBar from './components/StatusBar';
import Modal from './components/Modal';
import { AiAction, Selection, Tone, FormatAction, ViewMode, AiFeature } from './types';
import { runAiAction } from './services/geminiService';
import { INITIAL_MARKDOWN } from './constants';
import { FabMenu, ChatModal, ImageGenModal, VideoGenModal, GroundedSearchModal } from './components/AiFeatures';

/**
 * Applies markdown formatting to the selected text or current line.
 * @param format The format action to apply.
 * @param markdown The current full markdown text.
 * @param start The start index of the selection.
 * @param end The end index of the selection.
 * @returns An object with the new markdown string and the new selection range.
 */
const applyFormat = (format: FormatAction, markdown: string, start: number, end: number): { newMarkdown: string, newSelection: { start: number, end: number } } => {
    const selection = markdown.substring(start, end);
    let newText = '';
    let newSelectionStart = start;
    let newSelectionEnd = end;

    const wrap = (prefix: string, suffix = prefix) => {
        newText = prefix + selection + suffix;
        newSelectionStart = selection ? start + prefix.length : start + prefix.length;
        newSelectionEnd = selection ? start + prefix.length + selection.length : start + prefix.length;
    };
    
    const applyLineFormatting = (linePrefix: string) => {
        const selectedLines = selection.split('\n');
        const allLinesStartWithPrefix = selectedLines.every(line => line.trim().startsWith(linePrefix));

        if (allLinesStartWithPrefix) {
            newText = selectedLines.map(line => line.replace(linePrefix, '')).join('\n');
        } else {
            newText = selectedLines.map(line => line.trim().startsWith(linePrefix) ? line : linePrefix + line).join('\n');
        }
        newSelectionStart = start;
        newSelectionEnd = start + newText.length;
    };
    
    const prefixLine = (prefix: string) => {
        const lineStart = markdown.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = markdown.indexOf('\n', start);
        if (lineEnd === -1) lineEnd = markdown.length;
        const line = markdown.substring(lineStart, lineEnd);
        if (line.trim().startsWith(prefix)) {
            const newLine = line.replace(prefix, '');
            return {
                newMarkdown: markdown.substring(0, lineStart) + newLine + markdown.substring(lineEnd),
                newSelection: { start: Math.max(lineStart, start - prefix.length), end: end - prefix.length }
            };
        }
        return {
            newMarkdown: markdown.substring(0, lineStart) + prefix + line + markdown.substring(lineEnd),
            newSelection: { start: start + prefix.length, end: end + prefix.length }
        };
    };

    const insert = (text: string, cursorOffset: number) => {
        const replacement = markdown.substring(0, start) + text + markdown.substring(end);
        return {
            newMarkdown: replacement,
            newSelection: { start: start + cursorOffset, end: start + cursorOffset }
        };
    };

    switch (format) {
        case 'bold': wrap('**'); break;
        case 'italic': wrap('*'); break;
        case 'strikethrough': wrap('~~'); break;
        case 'code': wrap('`'); break;
        case 'h1': return prefixLine('# ');
        case 'h2': return prefixLine('## ');
        case 'h3': return prefixLine('### ');
        case 'h4': return prefixLine('#### ');
        case 'h5': return prefixLine('##### ');
        case 'h6': return prefixLine('###### ');
        case 'ul': 
            applyLineFormatting('- ');
            break;
        case 'ol':
            const lines = selection.split('\n');
            const isNumbered = lines.every(line => /^\d+\.\s/.test(line.trim()));
            if (isNumbered) {
                newText = lines.map(line => line.replace(/^\d+\.\s/, '')).join('\n');
            } else {
                newText = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
            }
            newSelectionStart = start;
            newSelectionEnd = start + newText.length;
            break;
        case 'link': 
            const url = prompt("Enter the URL:");
            if(url) {
                newText = `[${selection || 'link text'}](${url})`;
            } else {
                newText = selection;
            }
            newSelectionStart = start + newText.length;
            newSelectionEnd = newSelectionStart;
            break;
        case 'image': 
            const imgUrl = prompt("Enter image URL:");
            const altText = prompt("Enter alt text:", "alt text");
            const width = prompt("Enter optional width (e.g., 300px or 50%):");
            if(imgUrl) {
                if(width) {
                    newText = `<img src="${imgUrl}" alt="${altText}" width="${width}">`;
                } else {
                    newText = `![${altText}](${imgUrl})`;
                }
            } else {
                newText = selection;
            }
            return insert(newText, newText.length);
        case 'table': 
            const cols = parseInt(prompt("Enter number of columns:", "2") || "2", 10);
            const rows = parseInt(prompt("Enter number of rows:", "2") || "2", 10);
            if (!isNaN(cols) && !isNaN(rows) && cols > 0 && rows > 0) {
                const header = `| ${Array(cols).fill('Header').join(' | ')} |`;
                const divider = `| ${Array(cols).fill('---').join(' | ')} |`;
                const body = Array(rows).fill(`| ${Array(cols).fill('Cell').join(' | ')} |`).join('\n');
                newText = `\n${header}\n${divider}\n${body}\n`;
            } else {
                newText = selection;
            }
            return insert(newText, newText.length);
        default: newText = selection; break;
    }
    
    const newMarkdown = markdown.substring(0, start) + newText + markdown.substring(end);
    return { newMarkdown, newSelection: { start: newSelectionStart, end: newSelectionEnd } };
};


const App: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(INITIAL_MARKDOWN);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeAiFeature, setActiveAiFeature] = useState<AiFeature | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const cycleViewMode = () => {
    setViewMode(current => {
      if (current === 'split') return 'editor';
      if (current === 'editor') return 'preview';
      return 'split';
    });
  };

  const handleAiAction = useCallback(async (action: AiAction, options?: { tone?: Tone; prompt?: string }) => {
    setIsLoading(true);
    try {
      let textToProcess = '';
      let isSelectionAction = false;

      switch (action) {
        case AiAction.IMPROVE:
        case AiAction.SUMMARIZE_SELECTION:
        case AiAction.CHANGE_TONE:
          if (!selection || !selection.text) {
             setModalContent({ title: 'Error', content: 'Please select text to perform this action.' });
             return;
          }
          textToProcess = selection.text;
          isSelectionAction = true;
          break;
        case AiAction.SUMMARIZE_DOCUMENT:
        case AiAction.GENERATE_OUTLINE:
        case AiAction.SUGGEST_TITLES:
          textToProcess = markdown;
          break;
        case AiAction.GENERATE_OUTLINE_FROM_PROMPT:
            if (!options?.prompt) return;
            textToProcess = options.prompt;
            break;
        default:
          return;
      }

      const result = await runAiAction(action, textToProcess, options);

      if (isSelectionAction && selection) {
        const newMarkdown = markdown.substring(0, selection.start) + result + markdown.substring(selection.end);
        setMarkdown(newMarkdown);
      } else if (action === AiAction.GENERATE_OUTLINE_FROM_PROMPT) {
         setMarkdown(prev => `${prev.trim()}\n\n${result}`);
      }
      else {
        let title = 'AI Result';
        if (action === AiAction.SUMMARIZE_DOCUMENT) title = 'Document Summary';
        if (action === AiAction.GENERATE_OUTLINE) title = 'Generated Outline';
        if (action === AiAction.SUGGEST_TITLES) title = 'Suggested Titles';
        setModalContent({ title, content: result });
      }
    } catch (error) {
      console.error("AI Action Failed:", error);
      setModalContent({ title: 'Error', content: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  }, [markdown, selection]);
  
  const handleFormat = useCallback((format: FormatAction) => {
    if (editorRef.current) {
        const { selectionStart, selectionEnd } = editorRef.current;
        const { newMarkdown, newSelection } = applyFormat(format, markdown, selectionStart, selectionEnd);
        setMarkdown(newMarkdown);
        
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                editorRef.current.setSelectionRange(newSelection.start, newSelection.end);
                const text = editorRef.current.value.substring(newSelection.start, newSelection.end);
                setSelection(text ? { text, start: newSelection.start, end: newSelection.end } : null);
            }
        }, 0);
    }
  }, [markdown]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans antialiased relative">
      <Menubar
        theme={theme}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onFormat={handleFormat}
        selectionActive={!!selection}
        viewMode={viewMode}
        cycleViewMode={cycleViewMode}
      />
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <Sidebar
            onAiAction={handleAiAction}
            isLoading={isLoading}
            selectionActive={!!selection?.text}
          />
        )}
        <main className="flex-1 grid" style={{ gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr'}}>
          { (viewMode === 'split' || viewMode === 'editor') &&
            <div className="h-full overflow-hidden">
                <Editor ref={editorRef} value={markdown} onChange={setMarkdown} onSelect={setSelection} />
            </div>
          }
          { (viewMode === 'split' || viewMode === 'preview') &&
            <div className="h-full overflow-hidden">
              <Preview markdown={markdown} />
            </div>
          }
        </main>
      </div>
      <StatusBar text={markdown} />
      {modalContent && (
        <Modal
          title={modalContent.title}
          onClose={() => setModalContent(null)}
          contentToCopy={modalContent.content}
        >
          <div className="prose dark:prose-invert max-w-none text-sm">
            <pre className="whitespace-pre-wrap font-sans bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                {modalContent.content}
            </pre>
          </div>
        </Modal>
      )}
      <FabMenu onSelectFeature={setActiveAiFeature} />
      {activeAiFeature === 'chat' && <ChatModal onClose={() => setActiveAiFeature(null)} />}
      {activeAiFeature === 'image' && <ImageGenModal onClose={() => setActiveAiFeature(null)} onInsert={(imgTag) => { setMarkdown(prev => prev + '\n' + imgTag); setActiveAiFeature(null);}} />}
      {activeAiFeature === 'video' && <VideoGenModal onClose={() => setActiveAiFeature(null)} onInsert={(videoTag) => { setMarkdown(prev => prev + '\n' + videoTag); setActiveAiFeature(null);}} />}
      {activeAiFeature === 'search' && <GroundedSearchModal onClose={() => setActiveAiFeature(null)} onInsert={(text) => { setMarkdown(prev => prev + '\n' + text); setActiveAiFeature(null);}} />}
    </div>
  );
};

export default App;
