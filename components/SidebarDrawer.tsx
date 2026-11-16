'use client';

interface SidebarDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width: number;
  isDragging: boolean;
  startDragging: (e: React.MouseEvent) => void;
}

export default function SidebarDrawer({ 
  children, 
  isOpen, 
  width,
  isDragging,
  startDragging
}: SidebarDrawerProps) {
  
  if (!isOpen) return null;

  return (
    <div
      style={{ width: `${width}px` }}
      className="relative h-full bg-[#232426] border border-r-0 border-[#333438] rounded-l-lg flex flex-col shrink-0 transition-none overflow-hidden"
    >
      {/* The Sidebar content goes here */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Drag Handle on the right edge */}
      <div
        onMouseDown={startDragging}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#2c82f8] transition-colors z-50 ${
          isDragging ? 'bg-[#2c82f8]' : 'bg-transparent'
        }`}
      />
    </div>
  );
}