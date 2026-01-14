import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Share2, 
  Sun, 
  Moon, 
  Download, 
  Camera,
  Copy,
  Check,
  LogOut,
  LogIn,
  UserPlus,
  MousePointer2,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  StickyNote,
  ImageIcon,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  User,
} from 'lucide-react';
import { useStore, ToolType, ShapeType } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const colors = [
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#000000', '#FFFFFF',
];

const stickyColors = [
  '#DBEAFE', '#FEF3C7', '#D1FAE5', '#FCE7F3',
  '#E0E7FF', '#FED7AA', '#CFFAFE', '#F3E8FF',
];

interface ToolButtonProps {
  icon: React.ReactNode;
  tool?: ToolType;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolButton = ({ icon, tool, label, onClick, isActive, disabled }: ToolButtonProps) => {
  const { activeTool, setActiveTool } = useStore();
  const active = isActive !== undefined ? isActive : (tool && activeTool === tool);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "p-2 rounded-lg transition-all duration-150",
              active 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-accent text-foreground",
              disabled && "opacity-40 cursor-not-allowed"
            )}
            onClick={() => {
              if (disabled) return;
              if (onClick) onClick();
              else if (tool) setActiveTool(tool);
            }}
            disabled={disabled}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const TopBar = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('collabpad-user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('collabpad-user');
    setUser(null);
  };

  const {
    darkMode,
    toggleDarkMode,
    sessionCode,
    sessionUsers,
    createSession,
    joinSession,
    leaveSession,
    setUserName: setStoreUserName,
    notebooks,
    currentNotebookId,
    currentPageId,
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize,
    activeShapeType,
    setActiveShapeType,
    stickyColor,
    setStickyColor,
    zoom,
    setZoom,
    setPan,
    undo,
    redo,
    clearCanvas,
    addElement,
    history,
    historyIndex,
  } = useStore();

  const currentNotebook = notebooks.find((n) => n.id === currentNotebookId);
  const currentPage = currentNotebook?.pages.find((p) => p.id === currentPageId);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleCreateSession = () => {
    createSession();
    setSessionDialogOpen(false);
  };

  const handleJoinSession = () => {
    if (joinCode.trim() && userNameInput.trim()) {
      setStoreUserName(userNameInput.trim());
      const success = joinSession(joinCode.trim(), userNameInput.trim());
      if (success) {
        setSessionDialogOpen(false);
        setJoinCode('');
        setUserNameInput('');
      }
    }
  };

  const copySessionCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSnapshot = async () => {
    const canvas = document.querySelector('.canvas-container canvas');
    if (canvas) {
      try {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${currentPage?.name || 'canvas'}-snapshot.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to capture snapshot:', error);
      }
    }
  };

  const handleExportPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4');
    const canvas = document.querySelector('.canvas-container canvas');
    
    if (canvas) {
      try {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
        const imgWidth = 297;
        const imgHeight = 210;
        pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${currentNotebook?.name || 'notebook'}.pdf`);
      } catch (error) {
        console.error('Failed to export PDF:', error);
      }
    }
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setActiveShapeType(shape);
    setActiveTool('shape');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          addElement({
            type: 'image',
            x: 100,
            y: 100,
            width,
            height,
            props: { imageUrl: event.target?.result as string },
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const shapeIcons: Record<ShapeType, React.ReactNode> = {
    rectangle: <Square className="w-4 h-4" />,
    circle: <Circle className="w-4 h-4" />,
    arrow: <ArrowRight className="w-4 h-4" />,
    line: <Minus className="w-4 h-4" />,
  };

  return (
    <div className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4">
      {/* Left - Page Info */}
      <div className="flex items-center gap-3 min-w-[150px]">
        <div>
          <h1 className="font-display font-semibold text-sm">{currentNotebook?.name}</h1>
          <p className="text-xs text-muted-foreground">{currentPage?.name}</p>
        </div>
      </div>

      {/* Center - Tools */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl px-2 py-1">
        {/* Selection */}
        <ToolButton icon={<MousePointer2 className="w-4 h-4" />} tool="select" label="Select" />
        <ToolButton icon={<Hand className="w-4 h-4" />} tool="pan" label="Pan" />
        
        <div className="w-px h-6 bg-border mx-1" />

        {/* Pen */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "p-2 rounded-lg transition-all duration-150",
              activeTool === 'pen' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
            )}>
              <Pencil className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-52 p-3">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-transform hover:scale-110",
                      activeColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#ddd' : 'transparent' }}
                    onClick={() => { setActiveColor(color); setActiveTool('pen'); }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">Size: {strokeWidth}px</p>
              <Slider value={[strokeWidth]} onValueChange={([v]) => setStrokeWidth(v)} min={1} max={20} />
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlighter */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "p-2 rounded-lg transition-all duration-150",
              activeTool === 'highlighter' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
            )}>
              <Highlighter className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-52 p-3">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-6 gap-1">
                {colors.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-md transition-transform hover:scale-110",
                      activeColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color, opacity: 0.6 }}
                    onClick={() => { setActiveColor(color); setActiveTool('highlighter'); }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">Size: {strokeWidth}px</p>
              <Slider value={[strokeWidth]} onValueChange={([v]) => setStrokeWidth(v)} min={10} max={40} step={2} />
            </div>
          </PopoverContent>
        </Popover>

        {/* Eraser */}
        <ToolButton icon={<Eraser className="w-4 h-4" />} tool="eraser" label="Eraser" />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Shapes */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "p-2 rounded-lg transition-all duration-150",
              activeTool === 'shape' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
            )}>
              {shapeIcons[activeShapeType]}
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-52 p-3">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Shape</p>
              <div className="flex gap-1">
                {(Object.keys(shapeIcons) as ShapeType[]).map((shape) => (
                  <button
                    key={shape}
                    className={cn(
                      "p-2 rounded-lg transition-all hover:bg-accent",
                      activeShapeType === shape && activeTool === 'shape' && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleShapeSelect(shape)}
                  >
                    {shapeIcons[shape]}
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-transform hover:scale-110",
                      activeColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#ddd' : 'transparent' }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "p-2 rounded-lg transition-all duration-150",
              activeTool === 'text' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
            )}>
              <Type className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-52 p-3">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Font Size: {fontSize}px</p>
              <Slider value={[fontSize]} onValueChange={([v]) => { setFontSize(v); setActiveTool('text'); }} min={12} max={72} step={2} />
              <p className="text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-md border transition-transform hover:scale-110",
                      activeColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? '#ddd' : 'transparent' }}
                    onClick={() => { setActiveColor(color); setActiveTool('text'); }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sticky Notes */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "p-2 rounded-lg transition-all duration-150",
              activeTool === 'sticky' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
            )}>
              <StickyNote className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-52 p-3">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Note Color</p>
              <div className="grid grid-cols-4 gap-1">
                {stickyColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-10 h-10 rounded-lg border border-border/50 transition-transform hover:scale-105",
                      stickyColor === color && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => { setStickyColor(color); setActiveTool('sticky'); }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <ToolButton
          icon={<ImageIcon className="w-4 h-4" />}
          label="Upload Image"
          onClick={() => fileInputRef.current?.click()}
        />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <ToolButton icon={<Undo2 className="w-4 h-4" />} label="Undo" onClick={undo} disabled={!canUndo} />
        <ToolButton icon={<Redo2 className="w-4 h-4" />} label="Redo" onClick={redo} disabled={!canRedo} />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Zoom */}
        <ToolButton icon={<ZoomOut className="w-4 h-4" />} label="Zoom Out" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} />
        <span className="text-xs font-medium text-muted-foreground min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <ToolButton icon={<ZoomIn className="w-4 h-4" />} label="Zoom In" onClick={() => setZoom(Math.min(5, zoom + 0.1))} />
        <ToolButton icon={<Maximize2 className="w-4 h-4" />} label="Reset" onClick={() => { setZoom(1); setPan(0, 0); }} />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Clear */}
        <ToolButton icon={<Trash2 className="w-4 h-4 text-destructive" />} label="Clear Canvas" onClick={clearCanvas} />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 min-w-[150px] justify-end">
        {sessionCode && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="font-mono text-xs">{sessionCode}</span>
                <Badge variant="secondary" className="text-xs">{sessionUsers.length}</Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Code</span>
                  <Button size="sm" variant="ghost" onClick={copySessionCode}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="font-mono text-lg text-center bg-muted p-2 rounded-lg">{sessionCode}</div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Participants</span>
                  {sessionUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                      <span>{user.name}</span>
                    </div>
                  ))}
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={leaveSession}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Session
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {!sessionCode && (
          <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Collaborate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Collaboration Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-4">
                  <Button onClick={handleCreateSession} className="w-full gap-2">
                    <UserPlus className="w-4 h-4" />
                    Create New Session
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input placeholder="Your name" value={userNameInput} onChange={(e) => setUserNameInput(e.target.value)} />
                    <Input
                      placeholder="Enter 6-digit code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest"
                    />
                    <Button onClick={handleJoinSession} variant="secondary" className="w-full" disabled={!joinCode.trim() || !userNameInput.trim()}>
                      Join Session
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Button variant="ghost" size="icon" onClick={handleSnapshot} title="Take Snapshot">
          <Camera className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExportPDF} title="Export PDF">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          <motion.div initial={false} animate={{ rotate: darkMode ? 180 : 0 }} transition={{ duration: 0.3 }}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </Button>

        {/* User Auth */}
        {user ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="max-w-[100px] truncate text-xs">{user.email}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/auth')}>
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};
