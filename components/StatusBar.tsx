
import React, { useMemo } from 'react';

interface StatusBarProps {
  text: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ text }) => {
  const { words, characters } = useMemo(() => {
    const trimmedText = text.trim();
    const wordMatch = trimmedText.match(/\S+/g);
    return {
      words: wordMatch ? wordMatch.length : 0,
      characters: trimmedText.length,
    };
  }, [text]);

  return (
    <footer className="flex items-center justify-end px-4 py-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-x-4">
      <span>{words} {words === 1 ? 'word' : 'words'}</span>
      <span>{characters} {characters === 1 ? 'character' : 'characters'}</span>
    </footer>
  );
};

export default React.memo(StatusBar);
