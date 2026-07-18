// Small illustrative snippet
import { createPortal } from 'react-dom';
import { X } from 'lucide-react'; // Tumhare existing icons

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return createPortal(
    // Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div 
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-xl bg-gray-900 border border-gray-800 shadow-2xl p-6"
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="mt-2 overflow-y-auto flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}