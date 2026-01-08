import { useState } from 'react';
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
  UserPlus
} from 'lucide-react';
import { useStore } from '@/store/useStore';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const TopBar = () => {
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    darkMode,
    toggleDarkMode,
    sessionCode,
    sessionUsers,
    currentUserName,
    createSession,
    joinSession,
    leaveSession,
    setUserName: setStoreUserName,
    notebooks,
    currentNotebookId,
    currentPageId,
  } = useStore();

  const currentNotebook = notebooks.find((n) => n.id === currentNotebookId);
  const currentPage = currentNotebook?.pages.find((p) => p.id === currentPageId);

  const handleCreateSession = () => {
    const code = createSession();
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
    const canvas = document.querySelector('.konva-container canvas');
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
    const canvas = document.querySelector('.konva-container canvas');
    
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

  return (
    <div className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      {/* Left - Page Info */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display font-semibold text-sm">{currentNotebook?.name}</h1>
          <p className="text-xs text-muted-foreground">{currentPage?.name}</p>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Session Status */}
        {sessionCode && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="font-mono text-xs">{sessionCode}</span>
                <Badge variant="secondary" className="text-xs">
                  {sessionUsers.length}
                </Badge>
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
                <div className="font-mono text-lg text-center bg-muted p-2 rounded-lg">
                  {sessionCode}
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Participants</span>
                  {sessionUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <span>{user.name}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={leaveSession}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Session
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Session Dialog */}
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
                  <div className="text-center">
                    <Button onClick={handleCreateSession} className="w-full gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create New Session
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Generate a code to share with others
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                    />
                    <Input
                      placeholder="Enter 6-digit code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="font-mono text-center text-lg tracking-widest"
                    />
                    <Button
                      onClick={handleJoinSession}
                      variant="secondary"
                      className="w-full"
                      disabled={!joinCode.trim() || !userNameInput.trim()}
                    >
                      Join Session
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Snapshot */}
        <Button variant="ghost" size="icon" onClick={handleSnapshot} title="Take Snapshot">
          <Camera className="w-4 h-4" />
        </Button>

        {/* Export PDF */}
        <Button variant="ghost" size="icon" onClick={handleExportPDF} title="Export PDF">
          <Download className="w-4 h-4" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          <motion.div
            initial={false}
            animate={{ rotate: darkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </Button>
      </div>
    </div>
  );
};
