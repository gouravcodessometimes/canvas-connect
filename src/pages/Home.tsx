import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  Bookmark,
  FileText,
  Trash2,
  Star,
  Search,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useStore, Notebook } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface BookmarkedNotebook {
  id: string;
  name: string;
  bookmarkedAt: number;
}

export const Home = () => {
  const navigate = useNavigate();
  const {
    notebooks,
    createNotebook,
    deleteNotebook,
    selectNotebook,
    darkMode,
    toggleDarkMode,
  } = useStore();

  const [notepadContent, setNotepadContent] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkedNotebook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNotebookName, setNewNotebookName] = useState('');
  
  // Auth state
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedNotepad = localStorage.getItem('collabpad-notepad');
    if (savedNotepad) setNotepadContent(savedNotepad);

    const savedBookmarks = localStorage.getItem('collabpad-bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedUser = localStorage.getItem('collabpad-user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save notepad to localStorage
  useEffect(() => {
    localStorage.setItem('collabpad-notepad', notepadContent);
  }, [notepadContent]);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('collabpad-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleLogout = () => {
    localStorage.removeItem('collabpad-user');
    setUser(null);
  };

  const toggleBookmark = (notebook: Notebook) => {
    const existing = bookmarks.find((b) => b.id === notebook.id);
    if (existing) {
      setBookmarks(bookmarks.filter((b) => b.id !== notebook.id));
    } else {
      setBookmarks([
        ...bookmarks,
        { id: notebook.id, name: notebook.name, bookmarkedAt: Date.now() },
      ]);
    }
  };

  const isBookmarked = (id: string) => bookmarks.some((b) => b.id === id);

  const handleOpenNotebook = (id: string) => {
    selectNotebook(id);
    navigate('/canvas');
  };

  const handleCreateNotebook = () => {
    const name = newNotebookName.trim() || `Notebook ${notebooks.length + 1}`;
    createNotebook(name);
    setNewNotebookName('');
    navigate('/canvas');
  };

  // Sort notebooks by most recent
  const recentNotebooks = [...notebooks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const bookmarkedNotebooks = bookmarks
    .filter((b) => notebooks.some((n) => n.id === b.id))
    .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CollabPad
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
            {!user && (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create New */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <Input
                  placeholder="New notebook name..."
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handleCreateNotebook} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Notebook
                </Button>
              </div>
            </section>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bookmarks */}
            {bookmarkedNotebooks.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Bookmark className="w-5 h-5 text-primary" />
                  Bookmarks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookmarkedNotebooks.map((bookmark) => {
                    const notebook = notebooks.find((n) => n.id === bookmark.id);
                    if (!notebook) return null;
                    return (
                      <motion.div
                        key={bookmark.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleOpenNotebook(bookmark.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{notebook.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notebook.pages.length} pages
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(notebook);
                            }}
                          >
                            <Star className="w-4 h-4 fill-primary text-primary" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recents */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Clock className="w-5 h-5 text-primary" />
                Recents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentNotebooks.map((notebook) => (
                  <motion.div
                    key={notebook.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenNotebook(notebook.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{notebook.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notebook.pages.length} pages • {new Date(notebook.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(notebook);
                          }}
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              isBookmarked(notebook.id)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotebook(notebook.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {recentNotebooks.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-8">
                    No notebooks found. Create one to get started!
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Notepad Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <section className="p-4 rounded-xl border border-border bg-card">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  Quick Notes
                </h2>
                <Textarea
                  placeholder="Write quick notes here... (auto-saved)"
                  value={notepadContent}
                  onChange={(e) => setNotepadContent(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Notes are saved automatically to your browser
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
