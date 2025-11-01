import React, { useState } from 'react';
import { AiAction, Tone } from '../types';
import { SparklesIcon, ChevronDownIcon, LoadingSpinner } from './icons';

interface SidebarProps {
  onAiAction: (action: AiAction, options?: { tone?: Tone; prompt?: string }) => void;
  isLoading: boolean;
  selectionActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onAiAction, isLoading, selectionActive }) => {
  const [selectedTone, setSelectedTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [outlinePrompt, setOutlinePrompt] = useState<string>('');

  const ActionButton: React.FC<{
    action: AiAction;
    text: string;
    disabled?: boolean;
    requiresSelection?: boolean;
    activeAction?: AiAction | null;
  }> = ({ action, text, disabled = false, requiresSelection = false }) => {
    const isButtonDisabled = disabled || isLoading || (requiresSelection && !selectionActive);
    const
     handleClick = () => {
        if (!isButtonDisabled) {
            onAiAction(action);
        }
    };
    return (
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className="w-full flex items-center justify-between text-left px-3 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>{text}</span>
        {isLoading && disabled ? <LoadingSpinner className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4 text-indigo-400" />}
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Selection Actions</h2>
        <div className="space-y-2">
          <ActionButton action={AiAction.IMPROVE} text="Improve Writing" requiresSelection={true} disabled={isLoading}/>
          <ActionButton action={AiAction.SUMMARIZE_SELECTION} text="Summarize Selection" requiresSelection={true} disabled={isLoading}/>
          <div className="relative">
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as Tone)}
              disabled={isLoading || !selectionActive}
              className="w-full appearance-none px-3 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.values(Tone).map(tone => <option key={tone} value={tone}>{tone}</option>)}
            </select>
             <div
              className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
             >
                <ChevronDownIcon className="w-4 h-4 text-gray-400"/>
             </div>
          </div>
           <button
              onClick={() => onAiAction(AiAction.CHANGE_TONE, { tone: selectedTone })}
              disabled={isLoading || !selectionActive}
              className="w-full flex items-center justify-between text-left px-3 py-2 text-sm font-medium rounded-md bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>Change Tone</span>
               {isLoading ? <LoadingSpinner className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
            </button>
        </div>
      </div>
      <div>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Document Actions</h2>
        <div className="space-y-2">
          <ActionButton action={AiAction.SUMMARIZE_DOCUMENT} text="Summarize Document" disabled={isLoading} />
          <ActionButton action={AiAction.GENERATE_OUTLINE} text="Generate Outline" disabled={isLoading}/>
          <ActionButton action={AiAction.SUGGEST_TITLES} text="Suggest Titles" disabled={isLoading}/>
        </div>
      </div>
       <div>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Generate from Prompt</h2>
        <div className="space-y-2">
            <textarea
                value={outlinePrompt}
                onChange={(e) => setOutlinePrompt(e.target.value)}
                placeholder="e.g., An essay about the history of AI"
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
                onClick={() => onAiAction(AiAction.GENERATE_OUTLINE_FROM_PROMPT, { prompt: outlinePrompt })}
                disabled={isLoading || !outlinePrompt.trim()}
                className="w-full flex items-center justify-center text-center px-3 py-2 text-sm font-medium rounded-md bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <span>Generate Outline</span>
                {isLoading ? <LoadingSpinner className="w-4 h-4 ml-2" /> : <SparklesIcon className="w-4 h-4 ml-2" />}
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
