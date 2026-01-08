import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type ToolType = 'select' | 'pen' | 'highlighter' | 'eraser' | 'shape' | 'text' | 'sticky' | 'image' | 'pan';
export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line';

export interface CanvasElement {
  id: string;
  type: 'draw' | 'sticky' | 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  props: {
    points?: number[];
    color?: string;
    strokeWidth?: number;
    text?: string;
    fontSize?: number;
    stickyColor?: string;
    imageUrl?: string;
    shapeType?: ShapeType;
    opacity?: number;
  };
  zIndex: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  closed: boolean;
  x?: number;
  y?: number;
  pinned: boolean;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  question: string;
  votes: string[];
  answered: boolean;
  timestamp: number;
}

export interface Page {
  id: string;
  name: string;
  canvasElements: CanvasElement[];
  polls: Poll[];
  qna: Question[];
}

export interface Notebook {
  id: string;
  name: string;
  pages: Page[];
  createdAt: number;
}

export interface SessionUser {
  id: string;
  name: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
  isDrawing?: boolean;
}

export interface HistoryState {
  elements: CanvasElement[];
}

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Notebooks
  notebooks: Notebook[];
  currentNotebookId: string | null;
  currentPageId: string | null;
  
  // Session
  sessionCode: string | null;
  sessionUsers: SessionUser[];
  currentUserId: string;
  currentUserName: string;

  // Tools
  activeTool: ToolType;
  activeColor: string;
  strokeWidth: number;
  fontSize: number;
  activeShapeType: ShapeType;
  stickyColor: string;

  // Canvas
  zoom: number;
  panX: number;
  panY: number;

  // History
  history: HistoryState[];
  historyIndex: number;

  // Sidebar
  sidebarOpen: boolean;
  sidebarTab: 'notes' | 'qna' | 'polls';

  // Actions
  createNotebook: (name: string) => void;
  deleteNotebook: (id: string) => void;
  renameNotebook: (id: string, name: string) => void;
  selectNotebook: (id: string) => void;
  
  createPage: (notebookId: string, name: string) => void;
  deletePage: (notebookId: string, pageId: string) => void;
  renamePage: (notebookId: string, pageId: string, name: string) => void;
  selectPage: (pageId: string) => void;

  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  clearCanvas: () => void;

  setActiveTool: (tool: ToolType) => void;
  setActiveColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setActiveShapeType: (shape: ShapeType) => void;
  setStickyColor: (color: string) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;

  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  createSession: () => string;
  joinSession: (code: string, userName: string) => boolean;
  leaveSession: () => void;
  updateUserCursor: (x: number, y: number) => void;
  setUserName: (name: string) => void;

  addPoll: (question: string, options: string[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  closePoll: (pollId: string) => void;
  togglePollPin: (pollId: string) => void;

  addQuestion: (question: string) => void;
  upvoteQuestion: (questionId: string) => void;
  markQuestionAnswered: (questionId: string) => void;

  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: 'notes' | 'qna' | 'polls') => void;

  getCurrentPage: () => Page | null;
}

const generateSessionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const userColors = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316'
];

const getRandomColor = () => userColors[Math.floor(Math.random() * userColors.length)];

const defaultNotebook: Notebook = {
  id: uuidv4(),
  name: 'My First Notebook',
  pages: [
    {
      id: uuidv4(),
      name: 'Page 1',
      canvasElements: [],
      polls: [],
      qna: [],
    }
  ],
  createdAt: Date.now(),
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      notebooks: [defaultNotebook],
      currentNotebookId: defaultNotebook.id,
      currentPageId: defaultNotebook.pages[0].id,

      sessionCode: null,
      sessionUsers: [],
      currentUserId: uuidv4(),
      currentUserName: 'Guest',

      activeTool: 'select',
      activeColor: '#10B981',
      strokeWidth: 3,
      fontSize: 16,
      activeShapeType: 'rectangle',
      stickyColor: '#FEF3C7',

      zoom: 1,
      panX: 0,
      panY: 0,

      history: [],
      historyIndex: -1,

      sidebarOpen: false,
      sidebarTab: 'notes',

      createNotebook: (name) => {
        const newNotebook: Notebook = {
          id: uuidv4(),
          name,
          pages: [
            {
              id: uuidv4(),
              name: 'Page 1',
              canvasElements: [],
              polls: [],
              qna: [],
            }
          ],
          createdAt: Date.now(),
        };
        set((state) => ({
          notebooks: [...state.notebooks, newNotebook],
          currentNotebookId: newNotebook.id,
          currentPageId: newNotebook.pages[0].id,
        }));
      },

      deleteNotebook: (id) => set((state) => {
        const notebooks = state.notebooks.filter((n) => n.id !== id);
        if (notebooks.length === 0) {
          const newNotebook = { ...defaultNotebook, id: uuidv4() };
          newNotebook.pages[0].id = uuidv4();
          return {
            notebooks: [newNotebook],
            currentNotebookId: newNotebook.id,
            currentPageId: newNotebook.pages[0].id,
          };
        }
        return {
          notebooks,
          currentNotebookId: state.currentNotebookId === id ? notebooks[0].id : state.currentNotebookId,
          currentPageId: state.currentNotebookId === id ? notebooks[0].pages[0].id : state.currentPageId,
        };
      }),

      renameNotebook: (id, name) => set((state) => ({
        notebooks: state.notebooks.map((n) => n.id === id ? { ...n, name } : n),
      })),

      selectNotebook: (id) => {
        const notebook = get().notebooks.find((n) => n.id === id);
        if (notebook) {
          set({
            currentNotebookId: id,
            currentPageId: notebook.pages[0]?.id || null,
          });
        }
      },

      createPage: (notebookId, name) => {
        const newPage: Page = {
          id: uuidv4(),
          name,
          canvasElements: [],
          polls: [],
          qna: [],
        };
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === notebookId ? { ...n, pages: [...n.pages, newPage] } : n
          ),
          currentPageId: newPage.id,
        }));
      },

      deletePage: (notebookId, pageId) => set((state) => ({
        notebooks: state.notebooks.map((n) => {
          if (n.id !== notebookId) return n;
          const pages = n.pages.filter((p) => p.id !== pageId);
          if (pages.length === 0) {
            pages.push({
              id: uuidv4(),
              name: 'Page 1',
              canvasElements: [],
              polls: [],
              qna: [],
            });
          }
          return { ...n, pages };
        }),
        currentPageId: state.currentPageId === pageId 
          ? state.notebooks.find((n) => n.id === notebookId)?.pages.find((p) => p.id !== pageId)?.id || null
          : state.currentPageId,
      })),

      renamePage: (notebookId, pageId, name) => set((state) => ({
        notebooks: state.notebooks.map((n) =>
          n.id === notebookId
            ? { ...n, pages: n.pages.map((p) => p.id === pageId ? { ...p, name } : p) }
            : n
        ),
      })),

      selectPage: (pageId) => set({ currentPageId: pageId }),

      addElement: (element) => {
        const state = get();
        const currentPage = state.getCurrentPage();
        if (!currentPage) return;

        const maxZIndex = Math.max(0, ...currentPage.canvasElements.map((e) => e.zIndex));
        const newElement: CanvasElement = {
          ...element,
          id: uuidv4(),
          zIndex: maxZIndex + 1,
        };

        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? { ...p, canvasElements: [...p.canvasElements, newElement] }
                      : p
                  ),
                }
              : n
          ),
        }));
        get().saveToHistory();
      },

      updateElement: (id, updates) => set((state) => ({
        notebooks: state.notebooks.map((n) =>
          n.id === state.currentNotebookId
            ? {
                ...n,
                pages: n.pages.map((p) =>
                  p.id === state.currentPageId
                    ? {
                        ...p,
                        canvasElements: p.canvasElements.map((e) =>
                          e.id === id ? { ...e, ...updates } : e
                        ),
                      }
                    : p
                ),
              }
            : n
        ),
      })),

      deleteElement: (id) => {
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? { ...p, canvasElements: p.canvasElements.filter((e) => e.id !== id) }
                      : p
                  ),
                }
              : n
          ),
        }));
        get().saveToHistory();
      },

      clearCanvas: () => {
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? { ...p, canvasElements: [] }
                      : p
                  ),
                }
              : n
          ),
        }));
        get().saveToHistory();
      },

      setActiveTool: (tool) => set({ activeTool: tool }),
      setActiveColor: (color) => set({ activeColor: color }),
      setStrokeWidth: (width) => set({ strokeWidth: width }),
      setFontSize: (size) => set({ fontSize: size }),
      setActiveShapeType: (shape) => set({ activeShapeType: shape }),
      setStickyColor: (color) => set({ stickyColor: color }),

      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
      setPan: (x, y) => set({ panX: x, panY: y }),

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const state = history[newIndex];
          set((s) => ({
            historyIndex: newIndex,
            notebooks: s.notebooks.map((n) =>
              n.id === s.currentNotebookId
                ? {
                    ...n,
                    pages: n.pages.map((p) =>
                      p.id === s.currentPageId
                        ? { ...p, canvasElements: state.elements }
                        : p
                    ),
                  }
                : n
            ),
          }));
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const state = history[newIndex];
          set((s) => ({
            historyIndex: newIndex,
            notebooks: s.notebooks.map((n) =>
              n.id === s.currentNotebookId
                ? {
                    ...n,
                    pages: n.pages.map((p) =>
                      p.id === s.currentPageId
                        ? { ...p, canvasElements: state.elements }
                        : p
                    ),
                  }
                : n
            ),
          }));
        }
      },

      saveToHistory: () => {
        const currentPage = get().getCurrentPage();
        if (!currentPage) return;

        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ elements: [...currentPage.canvasElements] });

        set({
          history: newHistory.slice(-50),
          historyIndex: newHistory.length - 1,
        });
      },

      createSession: () => {
        const code = generateSessionCode();
        const { currentUserId, currentUserName } = get();
        set({
          sessionCode: code,
          sessionUsers: [
            {
              id: currentUserId,
              name: currentUserName,
              color: getRandomColor(),
            },
          ],
        });
        localStorage.setItem('collabpad_session', code);
        return code;
      },

      joinSession: (code, userName) => {
        const storedCode = localStorage.getItem('collabpad_session');
        if (storedCode === code || code.length === 6) {
          const { currentUserId } = get();
          const newUser: SessionUser = {
            id: currentUserId,
            name: userName,
            color: getRandomColor(),
          };
          set((state) => ({
            sessionCode: code,
            currentUserName: userName,
            sessionUsers: [...state.sessionUsers, newUser],
          }));
          return true;
        }
        return false;
      },

      leaveSession: () => {
        const { currentUserId } = get();
        set((state) => ({
          sessionCode: null,
          sessionUsers: state.sessionUsers.filter((u) => u.id !== currentUserId),
        }));
      },

      updateUserCursor: (x, y) => set((state) => ({
        sessionUsers: state.sessionUsers.map((u) =>
          u.id === state.currentUserId ? { ...u, cursorX: x, cursorY: y } : u
        ),
      })),

      setUserName: (name) => set({ currentUserName: name }),

      addPoll: (question, options) => {
        const poll: Poll = {
          id: uuidv4(),
          question,
          options: options.map((text) => ({ id: uuidv4(), text, votes: [] })),
          closed: false,
          pinned: false,
        };
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? { ...p, polls: [...p.polls, poll] }
                      : p
                  ),
                }
              : n
          ),
        }));
      },

      votePoll: (pollId, optionId) => {
        const { currentUserId } = get();
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? {
                          ...p,
                          polls: p.polls.map((poll) =>
                            poll.id === pollId
                              ? {
                                  ...poll,
                                  options: poll.options.map((opt) => ({
                                    ...opt,
                                    votes: opt.id === optionId
                                      ? opt.votes.includes(currentUserId)
                                        ? opt.votes.filter((v) => v !== currentUserId)
                                        : [...opt.votes, currentUserId]
                                      : opt.votes.filter((v) => v !== currentUserId),
                                  })),
                                }
                              : poll
                          ),
                        }
                      : p
                  ),
                }
              : n
          ),
        }));
      },

      closePoll: (pollId) => set((state) => ({
        notebooks: state.notebooks.map((n) =>
          n.id === state.currentNotebookId
            ? {
                ...n,
                pages: n.pages.map((p) =>
                  p.id === state.currentPageId
                    ? {
                        ...p,
                        polls: p.polls.map((poll) =>
                          poll.id === pollId ? { ...poll, closed: true } : poll
                        ),
                      }
                    : p
                ),
              }
            : n
        ),
      })),

      togglePollPin: (pollId) => set((state) => ({
        notebooks: state.notebooks.map((n) =>
          n.id === state.currentNotebookId
            ? {
                ...n,
                pages: n.pages.map((p) =>
                  p.id === state.currentPageId
                    ? {
                        ...p,
                        polls: p.polls.map((poll) =>
                          poll.id === pollId ? { ...poll, pinned: !poll.pinned } : poll
                        ),
                      }
                    : p
                ),
              }
            : n
        ),
      })),

      addQuestion: (question) => {
        const { currentUserId, currentUserName } = get();
        const newQuestion: Question = {
          id: uuidv4(),
          userId: currentUserId,
          userName: currentUserName,
          question,
          votes: [],
          answered: false,
          timestamp: Date.now(),
        };
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? { ...p, qna: [...p.qna, newQuestion] }
                      : p
                  ),
                }
              : n
          ),
        }));
      },

      upvoteQuestion: (questionId) => {
        const { currentUserId } = get();
        set((state) => ({
          notebooks: state.notebooks.map((n) =>
            n.id === state.currentNotebookId
              ? {
                  ...n,
                  pages: n.pages.map((p) =>
                    p.id === state.currentPageId
                      ? {
                          ...p,
                          qna: p.qna.map((q) =>
                            q.id === questionId
                              ? {
                                  ...q,
                                  votes: q.votes.includes(currentUserId)
                                    ? q.votes.filter((v) => v !== currentUserId)
                                    : [...q.votes, currentUserId],
                                }
                              : q
                          ),
                        }
                      : p
                  ),
                }
              : n
          ),
        }));
      },

      markQuestionAnswered: (questionId) => set((state) => ({
        notebooks: state.notebooks.map((n) =>
          n.id === state.currentNotebookId
            ? {
                ...n,
                pages: n.pages.map((p) =>
                  p.id === state.currentPageId
                    ? {
                        ...p,
                        qna: p.qna.map((q) =>
                          q.id === questionId ? { ...q, answered: !q.answered } : q
                        ),
                      }
                    : p
                ),
              }
            : n
        ),
      })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),

      getCurrentPage: () => {
        const { notebooks, currentNotebookId, currentPageId } = get();
        const notebook = notebooks.find((n) => n.id === currentNotebookId);
        return notebook?.pages.find((p) => p.id === currentPageId) || null;
      },
    }),
    {
      name: 'collabpad-storage',
      partialize: (state) => ({
        notebooks: state.notebooks,
        currentNotebookId: state.currentNotebookId,
        currentPageId: state.currentPageId,
        darkMode: state.darkMode,
        currentUserName: state.currentUserName,
      }),
    }
  )
);
