import React, { forwardRef } from 'react';
import { Selection } from '../types';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: Selection | null) => void;
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ value, onChange, onSelect }, ref) => {
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        const text = target.value.substring(target.selectionStart, target.selectionEnd);
        if (text) {
            onSelect({ text, start: target.selectionStart, end: target.selectionEnd });
        } else {
            onSelect(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onSelect={handleSelect}
                className="flex-1 w-full h-full p-6 sm:p-8 md:p-12 bg-transparent text-gray-800 dark:text-gray-200 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                placeholder="Start writing your masterpiece..."
                spellCheck="false"
            />
        </div>
    );
});

Editor.displayName = 'Editor';

export default Editor;