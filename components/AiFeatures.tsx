import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AiFeature } from '../types';
import { PlusIcon, XIcon, ChatBubbleIcon, CameraIcon, VideoCameraIcon, SearchIcon, LoadingSpinner } from './icons';
import { sendMessageToChat, generateImage, generateVideo, runGroundedSearch } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- FAB Menu ---
interface FabMenuProps {
    onSelectFeature: (feature: AiFeature) => void;
}

export const FabMenu: React.FC<FabMenuProps> = ({ onSelectFeature }) => {
    const [isOpen, setIsOpen] = useState(false);

    const features: { name: AiFeature; icon: React.ReactNode; label: string }[] = [
        { name: 'chat', icon: <ChatBubbleIcon className="w-6 h-6" />, label: 'Chat with AI' },
        { name: 'image', icon: <CameraIcon className="w-6 h-6" />, label: 'Generate Image' },
        { name: 'video', icon: <VideoCameraIcon className="w-6 h-6" />, label: 'Generate Video' },
        { name: 'search', icon: <SearchIcon className="w-6 h-6" />, label: 'Grounded Search' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <div className={`flex flex-col items-center space-y-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                {features.map((feature) => (
                    <button
                        key={feature.name}
                        onClick={() => {
                            onSelectFeature(feature.name);
                            setIsOpen(false);
                        }}
                        className="group flex items-center space-x-2"
                        aria-label={feature.label}
                    >
                        <span className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {feature.label}
                        </span>
                        <div className="bg-white dark:bg-gray-700 text-indigo-500 dark:text-indigo-400 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            {feature.icon}
                        </div>
                    </button>
                ))}
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-110"
                aria-label="Toggle AI Features"
            >
                {isOpen ? <XIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
            </button>
        </div>
    );
};

// --- Base Modal for AI Features ---
interface AiModalProps {
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const AiModal: React.FC<AiModalProps> = ({ onClose, title, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
);

// --- Chat Modal ---
interface ChatModalProps {
    onClose: () => void;
}
interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await sendMessageToChat(input);
            const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'bot', text: error instanceof Error ? error.message : "An unknown error occurred." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <AiModal onClose={onClose} title="AI Chat">
            <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <div className="prose dark:prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                                <LoadingSpinner className="w-5 h-5"/> <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">Send</button>
                </div>
            </div>
        </AiModal>
    );
};


// --- Image Generation Modal ---
interface ImageGenModalProps {
    onClose: () => void;
    onInsert: (imageTag: string) => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ onClose, onInsert }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setImageUrl(null);
        setError(null);
        try {
            const url = await generateImage(prompt, aspectRatio);
            setImageUrl(url);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AiModal onClose={onClose} title="Generate Image">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic image of a cat wearing a tiny hat"
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Aspect Ratio:</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} disabled={isLoading} className="px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700">
                        {["1:1", "16:9", "9:16", "4:3", "3:4"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                {isLoading && <div className="flex items-center justify-center p-8"><LoadingSpinner className="w-8 h-8"/></div>}
                {error && <div className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
                {imageUrl && (
                    <div className="flex flex-col items-center space-y-2">
                        <img src={imageUrl} alt={prompt} className="max-w-full max-h-64 rounded-md" />
                        <button onClick={() => onInsert(`![${prompt}](${imageUrl})`)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Insert into Document</button>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </AiModal>
    );
};


// --- Video Generation Modal ---
interface VideoGenModalProps {
    onClose: () => void;
    onInsert: (videoTag: string) => void;
}

export const VideoGenModal: React.FC<VideoGenModalProps> = ({ onClose, onInsert }) => {
    const [prompt, setPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImageBase64(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !imageBase64) {
            setError('Prompt and starting image are required.');
            return;
        }
        setIsLoading(true);
        setVideoUrl(null);
        setError(null);
        setProgressMessage('');

        try {
            const url = await generateVideo(prompt, imageBase64, aspectRatio, setProgressMessage);
            setVideoUrl(url);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to generate video.');
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    return (
        <AiModal onClose={onClose} title="Generate Video">
             <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic shot of the cat flying through space"
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 resize-none"
                />
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Starting Image:</label>
                    <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isLoading} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                    {imageBase64 && <img src={`data:image/png;base64,${imageBase64}`} className="max-h-24 rounded-md border" alt="Preview"/>}
                </div>
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Aspect Ratio:</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as '16:9' | '9:16')} disabled={isLoading} className="px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700">
                        {["16:9", "9:16"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-8 space-y-2">
                        <LoadingSpinner className="w-8 h-8"/>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{progressMessage || 'Generating video...'}</p>
                    </div>
                )}
                {error && <div className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
                {videoUrl && (
                    <div className="flex flex-col items-center space-y-2">
                        <video src={videoUrl} controls className="max-w-full max-h-64 rounded-md" />
                        <button onClick={() => onInsert(`<video src="${videoUrl}" controls></video>`)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Insert into Document</button>
                    </div>
                )}
            </div>
            <div className="p-4 border-t flex justify-end">
                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim() || !imageBase64} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </AiModal>
    );
};

// --- Grounded Search Modal ---
interface GroundedSearchModalProps {
    onClose: () => void;
    onInsert: (text: string) => void;
}

export const GroundedSearchModal: React.FC<GroundedSearchModalProps> = ({ onClose, onInsert }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const response = await runGroundedSearch(prompt);
            setResult(response);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to perform search.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <AiModal onClose={onClose} title="Grounded Search">
             <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Who won the latest F1 race?"
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 resize-none"
                />
                {isLoading && <div className="flex items-center justify-center p-8"><LoadingSpinner className="w-8 h-8"/></div>}
                {error && <div className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
                {result && (
                    <div className="prose dark:prose-invert max-w-none text-sm p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                    </div>
                )}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
                 <button onClick={() => onInsert(result || '')} disabled={!result} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    Insert into Document
                </button>
                <button onClick={handleSearch} disabled={isLoading || !prompt.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </AiModal>
    );
};
