import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Plus, 
  ChevronRight, 
  FileText, 
  MoreHorizontal, 
  Trash2, 
  Edit2,
  ChevronLeft
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newPageName, setNewPageName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());

  const {
    notebooks,
    currentNotebookId,
    currentPageId,
    createNotebook,
    deleteNotebook,
    renameNotebook,
    selectNotebook,
    createPage,
    deletePage,
    renamePage,
    selectPage,
  } = useStore();

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      createNotebook(newNotebookName.trim());
      setNewNotebookName('');
      setDialogOpen(false);
    }
  };

  const handleCreatePage = () => {
    if (newPageName.trim() && currentNotebookId) {
      createPage(currentNotebookId, newPageName.trim());
      setNewPageName('');
      setPageDialogOpen(false);
    }
  };

  const toggleNotebook = (id: string) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotebooks(newExpanded);
    selectNotebook(id);
  };

  const handleRename = (type: 'notebook' | 'page', notebookId: string, pageId?: string) => {
    if (editingName.trim()) {
      if (type === 'notebook') {
        renameNotebook(notebookId, editingName.trim());
      } else if (pageId) {
        renamePage(notebookId, pageId, editingName.trim());
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <motion.div
      className={cn(
        "h-full bg-card border-r border-border flex flex-col",
        "transition-all duration-300 ease-in-out"
      )}
      animate={{ width: collapsed ? 60 : 280 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Book className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">CollabPad</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {/* Create Notebook Button */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Notebook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Notebook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Notebook name"
                      value={newNotebookName}
                      onChange={(e) => setNewNotebookName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNotebook()}
                    />
                    <Button onClick={handleCreateNotebook} className="w-full">
                      Create Notebook
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notebooks List */}
              <div className="space-y-1 mt-4">
                {notebooks.map((notebook) => (
                  <div key={notebook.id}>
                    {/* Notebook Item */}
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer group",
                        "hover:bg-accent transition-colors",
                        currentNotebookId === notebook.id && "bg-accent"
                      )}
                      onClick={() => toggleNotebook(notebook.id)}
                    >
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          expandedNotebooks.has(notebook.id) && "rotate-90"
                        )}
                      />
                      <Book className="w-4 h-4 text-primary" />
                      
                      {editingId === notebook.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleRename('notebook', notebook.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename('notebook', notebook.id)}
                          autoFocus
                          className="h-6 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 text-sm truncate">{notebook.name}</span>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(notebook.id);
                              setEditingName(notebook.name);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotebook(notebook.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Pages */}
                    <AnimatePresence>
                      {expandedNotebooks.has(notebook.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 space-y-1 overflow-hidden"
                        >
                          {notebook.pages.map((page) => (
                            <div
                              key={page.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg cursor-pointer group",
                                "hover:bg-accent transition-colors",
                                currentPageId === page.id && "bg-primary/10 text-primary"
                              )}
                              onClick={() => selectPage(page.id)}
                            >
                              <FileText className="w-4 h-4" />
                              
                              {editingId === page.id ? (
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onBlur={() => handleRename('page', notebook.id, page.id)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleRename('page', notebook.id, page.id)}
                                  autoFocus
                                  className="h-6 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="flex-1 text-sm truncate">{page.name}</span>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(page.id);
                                      setEditingName(page.name);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePage(notebook.id, page.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}

                          {/* Add Page Button */}
                          <Dialog open={pageDialogOpen && currentNotebookId === notebook.id} onOpenChange={setPageDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-muted-foreground hover:text-foreground text-xs"
                                onClick={() => selectNotebook(notebook.id)}
                              >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Page
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Page</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input
                                  placeholder="Page name"
                                  value={newPageName}
                                  onChange={(e) => setNewPageName(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                                />
                                <Button onClick={handleCreatePage} className="w-full">
                                  Create Page
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed State */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            {notebooks.map((notebook) => (
              <Button
                key={notebook.id}
                variant={currentNotebookId === notebook.id ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  selectNotebook(notebook.id);
                  setCollapsed(false);
                }}
                title={notebook.name}
              >
                <Book className="w-4 h-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
