import React, { useState } from 'react';
import { FormatAction, ViewMode } from '../types';
import {
  SunIcon, MoonIcon, SidebarIcon, WritingIcon, PreviewViewIcon, SplitScreenIcon,
  BoldIcon, ItalicIcon, StrikethroughIcon, LinkIcon, ImageIcon, TableIcon,
  ListUlIcon, ListOlIcon, HeadingIcon, ChevronDownIcon, CodeIcon,
} from './icons';


interface MenubarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onFormat: (format: FormatAction) => void;
  selectionActive: boolean;
  viewMode: ViewMode;
  cycleViewMode: () => void;
}

const Menubar: React.FC<MenubarProps> = ({
  theme,
  toggleTheme,
  isSidebarOpen,
  toggleSidebar,
  onFormat,
  selectionActive,
  viewMode,
  cycleViewMode,
}) => {
  const [isHeadingDropdownOpen, setIsHeadingDropdownOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/ban-types
  const ToolbarButton: React.FC<{ onClick?: () => void; children: React.ReactNode; 'aria-label': string, title: string, className?: string, disabled?: boolean }> = ({ onClick, children, className, ...props }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
  
  const MenuLink: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <button className="px-3 py-1 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          {children}
      </button>
  );

  const viewModeIcon = () => {
    switch (viewMode) {
      case 'split': return <SplitScreenIcon className="w-5 h-5" />;
      case 'editor': return <WritingIcon className="w-5 h-5" />;
      case 'preview': return <PreviewViewIcon className="w-5 h-5" />;
      default: return null;
    }
  };
  
  const viewModeTitle = () => {
    switch (viewMode) {
      case 'split': return 'Cycle to Editor View';
      case 'editor': return 'Cycle to Preview View';
      case 'preview': return 'Cycle to Split View';
      default: return 'Change View';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 flex-shrink-0 flex flex-col">
      {/* Top Row: Header */}
      <div className="flex items-center justify-between px-4 py-2 w-full">
        <div className="flex items-center space-x-2">
            <ToolbarButton onClick={toggleSidebar} aria-label="Toggle Sidebar" title="Toggle Sidebar">
                <SidebarIcon className={`w-5 h-5 transition-colors ${isSidebarOpen ? 'text-indigo-500' : ''}`} />
            </ToolbarButton>
        </div>
        <div className="flex items-center space-x-2">
            <WritingIcon className="w-6 h-6 text-indigo-500" />
            <h1 className="text-lg font-semibold hidden sm:block">Sam's AI Writer</h1>
        </div>
        <div className="flex items-center space-x-2">
            <ToolbarButton onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </ToolbarButton>
        </div>
      </div>

      {/* Middle Row: Menu Bar */}
      <div className="flex items-center px-4 py-1 border-y border-gray-200 dark:border-gray-700 w-full">
        <div className="flex items-center space-x-1">
            <MenuLink>File</MenuLink>
            <MenuLink>Edit</MenuLink>
            <MenuLink>Paragraph</MenuLink>
            <MenuLink>Format</MenuLink>
            <MenuLink>View</MenuLink>
            <MenuLink>Themes</MenuLink>
            <MenuLink>Help</MenuLink>
        </div>
      </div>

      {/* Bottom Row: Toolbar */}
      <div className="flex items-center justify-between px-4 py-1 w-full">
          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto">
            <div className="relative">
              <ToolbarButton onClick={() => setIsHeadingDropdownOpen(prev => !prev)} aria-label="Headings" title="Headings">
                <HeadingIcon className="w-5 h-5" />
                <ChevronDownIcon className="w-4 h-4 ml-1"/>
              </ToolbarButton>
              {isHeadingDropdownOpen && (
                <div 
                  className="absolute top-full mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20"
                  onMouseLeave={() => setIsHeadingDropdownOpen(false)}
                >
                  {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((h, i) => (
                      <button key={h} onClick={() => { onFormat(h); setIsHeadingDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Heading {i + 1}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 md:mx-2"></div>
            
            <ToolbarButton onClick={() => onFormat('bold')} aria-label="Bold" title="Bold"><BoldIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('italic')} aria-label="Italic" title="Italic"><ItalicIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('strikethrough')} aria-label="Strikethrough" title="Strikethrough"><StrikethroughIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('code')} aria-label="Code" title="Code"><CodeIcon className="w-5 h-5" /></ToolbarButton>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 md:mx-2"></div>

            <ToolbarButton onClick={() => onFormat('link')} aria-label="Insert Link" title="Insert Link"><LinkIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('image')} aria-label="Insert Image" title="Insert Image"><ImageIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('table')} aria-label="Insert Table" title="Insert Table"><TableIcon className="w-5 h-5" /></ToolbarButton>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 md:mx-2"></div>

            <ToolbarButton onClick={() => onFormat('ul')} aria-label="Bullet List" title="Bullet List"><ListUlIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton onClick={() => onFormat('ol')} aria-label="Number List" title="Number List"><ListOlIcon className="w-5 h-5" /></ToolbarButton>
          </div>
          <div className="flex items-center">
            <ToolbarButton onClick={cycleViewMode} aria-label={viewModeTitle()} title={viewModeTitle()}>
              {viewModeIcon()}
            </ToolbarButton>
          </div>
      </div>
    </header>
  );
};

export default Menubar;