import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function DetailPanel({ isOpen, onClose, title, children }) {
    const [render, setRender] = useState(isOpen);
    const [cachedChildren, setCachedChildren] = useState(children);
    const [cachedTitle, setCachedTitle] = useState(title);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            setCachedChildren(children);
            setCachedTitle(title);
        } else {
            const timer = setTimeout(() => setRender(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen, children, title]);

    if (!render) return null;

    return (
        <div className={`w-[380px] shrink-0 border-l border-border bg-surface-elevated h-[calc(100%+4rem)] -my-8 -mr-8 overflow-y-auto ${isOpen ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}>
            {/* Panel Header */}
            <div className="sticky top-0 bg-surface-elevated z-10 flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-white font-semibold text-lg m-0 truncate pr-4">{cachedTitle}</h2>
                <button 
                    onClick={onClose} 
                    className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-surface-hover transition-colors shrink-0"
                    title="Close panel"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Panel Content */}
            <div className="p-5">
                {cachedChildren}
            </div>
        </div>
    );
}
