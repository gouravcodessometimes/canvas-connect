import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  ThumbsUp,
  Check,
  Pin,
  X,
  Home,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export const RightPanel = () => {
  const navigate = useNavigate();
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarTab,
    setSidebarTab,
    getCurrentPage,
    addPoll,
    votePoll,
    closePoll,
    togglePollPin,
    addQuestion,
    upvoteQuestion,
    markQuestionAnswered,
    currentUserId,
    sessionUsers,
  } = useStore();

  const [newQuestion, setNewQuestion] = useState('');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  const currentPage = getCurrentPage();
  const polls = currentPage?.polls || [];
  const questions = currentPage?.qna || [];

  const tabs = [
    { id: 'notes' as const, icon: FileText, label: 'Notes' },
    { id: 'qna' as const, icon: MessageSquare, label: 'Q&A' },
    { id: 'polls' as const, icon: BarChart3, label: 'Polls' },
  ];

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      addQuestion(newQuestion.trim());
      setNewQuestion('');
    }
  };

  const handleCreatePoll = () => {
    const validOptions = newPollOptions.filter((opt) => opt.trim());
    if (newPollQuestion.trim() && validOptions.length >= 2) {
      addPoll(newPollQuestion.trim(), validOptions);
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
    }
  };

  const addPollOption = () => {
    if (newPollOptions.length < 6) {
      setNewPollOptions([...newPollOptions, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const removePollOption = (index: number) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const getTotalVotes = (options: { votes: string[] }[]) =>
    options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1;
    return b.votes.length - a.votes.length;
  });

  return (
    <>
      {/* Tab Buttons - Always visible */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={sidebarOpen && sidebarTab === tab.id ? 'default' : 'secondary'}
            size="icon"
            className="rounded-l-lg rounded-r-none"
            onClick={() => {
              if (sidebarOpen && sidebarTab === tab.id) {
                setSidebarOpen(false);
              } else {
                setSidebarTab(tab.id);
                setSidebarOpen(true);
              }
            }}
          >
            <tab.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="sidebar-panel flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold">
                {tabs.find((t) => t.id === sidebarTab)?.label}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Q&A Tab */}
              {sidebarTab === 'qna' && (
                <div className="space-y-4">
                  {/* Add Question */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ask a question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                    <Button onClick={handleAddQuestion} className="w-full" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Ask Question
                    </Button>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {sortedQuestions.map((q) => (
                      <motion.div
                        key={q.id}
                        layout
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          q.answered
                            ? "bg-muted/50 border-muted"
                            : "bg-card border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "shrink-0 flex-col h-auto py-1 px-2",
                              q.votes.includes(currentUserId) && "text-primary"
                            )}
                            onClick={() => upvoteQuestion(q.id)}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">{q.votes.length}</span>
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm", q.answered && "line-through opacity-60")}>
                              {q.question}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">{q.userName}</span>
                              {q.answered && (
                                <Badge variant="secondary" className="text-xs">
                                  Answered
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-6 w-6"
                            onClick={() => markQuestionAnswered(q.id)}
                          >
                            <Check className={cn("w-3 h-3", q.answered && "text-success")} />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Polls Tab */}
              {sidebarTab === 'polls' && (
                <div className="space-y-4">
                  {/* Create Poll */}
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <Input
                      placeholder="Poll question"
                      value={newPollQuestion}
                      onChange={(e) => setNewPollQuestion(e.target.value)}
                    />
                    <div className="space-y-2">
                      {newPollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                          />
                          {newPollOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePollOption(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addPollOption}>
                        <Plus className="w-4 h-4 mr-1" />
                        Option
                      </Button>
                      <Button size="sm" onClick={handleCreatePoll} className="flex-1">
                        Create Poll
                      </Button>
                    </div>
                  </div>

                  {/* Polls List */}
                  <div className="space-y-4">
                    {polls.map((poll) => {
                      const totalVotes = getTotalVotes(poll.options);
                      return (
                        <motion.div
                          key={poll.id}
                          layout
                          className="p-4 bg-card rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-sm">{poll.question}</h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => togglePollPin(poll.id)}
                              >
                                <Pin className={cn("w-3 h-3", poll.pinned && "text-primary fill-primary")} />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {poll.options.map((option) => {
                              const percentage = totalVotes > 0
                                ? (option.votes.length / totalVotes) * 100
                                : 0;
                              const hasVoted = option.votes.includes(currentUserId);

                              return (
                                <button
                                  key={option.id}
                                  className={cn(
                                    "w-full p-2 rounded-lg border transition-all text-left",
                                    poll.closed
                                      ? "cursor-default"
                                      : "hover:border-primary cursor-pointer",
                                    hasVoted && "border-primary bg-primary/10"
                                  )}
                                  onClick={() => !poll.closed && votePoll(poll.id, option.id)}
                                  disabled={poll.closed}
                                >
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{option.text}</span>
                                    <span className="text-muted-foreground">
                                      {option.votes.length} ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                  <Progress value={percentage} className="h-1" />
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                            </span>
                            {!poll.closed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => closePoll(poll.id)}
                              >
                                Close Poll
                              </Button>
                            )}
                            {poll.closed && (
                              <Badge variant="secondary">Closed</Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {sidebarTab === 'notes' && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your notes here... (Markdown supported)"
                    className="min-h-[200px] resize-none"
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Notes are saved automatically and visible to all session participants.
                  </p>
                </div>
              )}
            </div>

            {/* Exit Button */}
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4" />
                Exit to Homepage
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
