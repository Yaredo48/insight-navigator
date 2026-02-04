import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  Brain, 
  Video, 
  FileText, 
  TrendingUp, 
  Plus,
  ArrowLeft,
  Trophy
} from "lucide-react";

// Hooks
import { useQuizzes } from "@/hooks/useQuizzes";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useStudentNotes } from "@/hooks/useStudentNotes";
import { useVideoLessons } from "@/hooks/useVideoLessons";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { useGradesSubjects } from "@/hooks/useGradesSubjects";

// Quiz components
import { QuizCard, QuizPlayer, QuizCreator } from "@/components/learning/quiz";

// Flashcard components
import { FlashcardDeckCard, FlashcardStudy, FlashcardDeckCreator } from "@/components/learning/flashcards";

// Notes components
import { NoteTaker } from "@/components/learning/notes";

// Video components
import { VideoLessonCard, VideoPlayerPage } from "@/components/learning/video";

// Progress components
import { ProgressDashboard, Leaderboard, StreakDisplay } from "@/components/learning/progress";

// Temporary user ID - replace with auth
const USER_ID = 'anonymous-user';

export default function LearningCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('progress');
  const [gradeFilter, setGradeFilter] = useState<number | undefined>();
  const [subjectFilter, setSubjectFilter] = useState<number | undefined>();
  
  // Quiz state
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [playingQuiz, setPlayingQuiz] = useState<string | null>(null);
  
  // Flashcard state
  const [showDeckCreator, setShowDeckCreator] = useState(false);
  const [studyingDeck, setStudyingDeck] = useState<string | null>(null);
  
  // Video state
  const [watchingVideo, setWatchingVideo] = useState<string | null>(null);

  // Hooks
  const { grades, subjects } = useGradesSubjects();
  const {
    quizzes,
    currentQuiz,
    questions,
    isLoading: quizzesLoading,
    fetchQuizzes,
    fetchQuizWithQuestions,
    createQuiz,
    addQuestion,
    submitQuizAttempt,
    deleteQuiz
  } = useQuizzes();

  const {
    decks,
    currentDeck,
    cards,
    isLoading: flashcardsLoading,
    fetchDecks,
    fetchDeckWithCards,
    createDeck,
    addCard,
    reviewCard,
    deleteDeck
  } = useFlashcards();

  const {
    notes,
    currentNote,
    setCurrentNote,
    isLoading: notesLoading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin
  } = useStudentNotes(USER_ID);

  const {
    videos,
    currentVideo,
    setCurrentVideo,
    progress: videoProgress,
    isLoading: videosLoading,
    fetchVideos,
    fetchProgress: fetchVideoProgress,
    updateProgress: updateVideoProgress
  } = useVideoLessons();

  const {
    progressData,
    badges,
    earnedBadges,
    leaderboard,
    isLoading: progressLoading,
    fetchProgress,
    updateProgress,
    fetchBadges,
    checkAndAwardBadges,
    fetchLeaderboard,
    getOverallStats
  } = useStudentProgress(USER_ID);

  // Load initial data
  useEffect(() => {
    fetchProgress();
    fetchBadges();
    fetchLeaderboard();
  }, [fetchProgress, fetchBadges, fetchLeaderboard]);

  // Load tab-specific data
  useEffect(() => {
    const filters = { gradeId: gradeFilter, subjectId: subjectFilter };
    
    switch (activeTab) {
      case 'quizzes':
        fetchQuizzes(filters);
        break;
      case 'flashcards':
        fetchDecks(filters);
        break;
      case 'notes':
        fetchNotes(filters);
        break;
      case 'videos':
        fetchVideos(filters);
        fetchVideoProgress(USER_ID);
        break;
    }
  }, [activeTab, gradeFilter, subjectFilter, fetchQuizzes, fetchDecks, fetchNotes, fetchVideos, fetchVideoProgress]);

  // Quiz handlers
  const handleStartQuiz = async (quizId: string) => {
    await fetchQuizWithQuestions(quizId);
    setPlayingQuiz(quizId);
  };

  const handleSubmitQuiz = async (answers: Record<string, unknown>, timeTaken: number) => {
    if (!currentQuiz) return null;
    
    const result = await submitQuizAttempt(currentQuiz.id, USER_ID, answers, timeTaken);
    if (result) {
      await updateProgress(gradeFilter ?? null, subjectFilter ?? null, {
        quizzes_completed: 1,
        quizzes_passed: result.percentage >= currentQuiz.passing_score ? 1 : 0,
        average_score: result.percentage
      });
      await checkAndAwardBadges();
    }
    return result;
  };

  const handleSaveQuiz = async (quizData: Parameters<typeof createQuiz>[0], questionsData: Array<{
    id: string;
    question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
    question_text: string;
    options: Array<{ id: string; text: string }>;
    correct_answer: unknown;
    explanation: string;
    points: number;
  }>) => {
    const quiz = await createQuiz(quizData);
    if (quiz) {
      for (let i = 0; i < questionsData.length; i++) {
        const q = questionsData[i];
        await addQuestion({
          quiz_id: quiz.id,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          points: q.points,
          order_index: i
        });
      }
      setShowQuizCreator(false);
      fetchQuizzes({ gradeId: gradeFilter, subjectId: subjectFilter });
    }
  };

  // Flashcard handlers
  const handleStudyDeck = async (deckId: string) => {
    await fetchDeckWithCards(deckId);
    setStudyingDeck(deckId);
  };

  const handleReviewCard = async (cardId: string, quality: number) => {
    await reviewCard(cardId, USER_ID, quality);
    await updateProgress(gradeFilter ?? null, subjectFilter ?? null, {
      flashcards_reviewed: 1
    });
    await checkAndAwardBadges();
  };

  const handleSaveDeck = async (deckData: Parameters<typeof createDeck>[0], cardsData: Array<{ front_text: string; back_text: string }>) => {
    const deck = await createDeck(deckData);
    if (deck) {
      for (let i = 0; i < cardsData.length; i++) {
        await addCard({
          deck_id: deck.id,
          front_text: cardsData[i].front_text,
          back_text: cardsData[i].back_text,
          order_index: i
        });
      }
      setShowDeckCreator(false);
      fetchDecks({ gradeId: gradeFilter, subjectId: subjectFilter });
    }
  };

  // Video handlers
  const handleWatchVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setCurrentVideo(video);
      setWatchingVideo(videoId);
    }
  };

  const handleVideoProgress = async (watchedSeconds: number, completed?: boolean) => {
    if (watchingVideo) {
      await updateVideoProgress(watchingVideo, USER_ID, watchedSeconds, completed);
      if (completed) {
        await updateProgress(gradeFilter ?? null, subjectFilter ?? null, {
          videos_watched: 1
        });
        await checkAndAwardBadges();
      }
    }
  };

  // Notes handlers
  const handleCreateNote = async (data: Parameters<typeof createNote>[0]) => {
    const note = await createNote(data);
    if (note) {
      await updateProgress(gradeFilter ?? null, subjectFilter ?? null, {
        notes_created: 1
      });
      await checkAndAwardBadges();
    }
    return note;
  };

  const stats = getOverallStats();

  // Render quiz playing view
  if (playingQuiz && currentQuiz && questions.length > 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <QuizPlayer
          quiz={currentQuiz}
          questions={questions}
          onSubmit={handleSubmitQuiz}
          onClose={() => setPlayingQuiz(null)}
        />
      </div>
    );
  }

  // Render quiz creator
  if (showQuizCreator) {
    return (
      <div className="min-h-screen bg-background p-6">
        <QuizCreator
          grades={grades}
          subjects={subjects}
          onSave={handleSaveQuiz}
          onCancel={() => setShowQuizCreator(false)}
        />
      </div>
    );
  }

  // Render flashcard study
  if (studyingDeck && currentDeck && cards.length >= 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <FlashcardStudy
          deck={currentDeck}
          cards={cards}
          onReview={handleReviewCard}
          onClose={() => setStudyingDeck(null)}
        />
      </div>
    );
  }

  // Render deck creator
  if (showDeckCreator) {
    return (
      <div className="min-h-screen bg-background p-6">
        <FlashcardDeckCreator
          grades={grades}
          subjects={subjects}
          onSave={handleSaveDeck}
          onCancel={() => setShowDeckCreator(false)}
        />
      </div>
    );
  }

  // Render video player
  if (watchingVideo && currentVideo) {
    return (
      <div className="min-h-screen bg-background p-6">
        <VideoPlayerPage
          video={currentVideo}
          progress={videoProgress[watchingVideo]}
          onUpdateProgress={handleVideoProgress}
          onClose={() => setWatchingVideo(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Learning Center</h1>
                <p className="text-sm text-muted-foreground">
                  Quizzes, flashcards, videos, and more
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select
                value={gradeFilter?.toString() || 'all'}
                onValueChange={(val) => setGradeFilter(val === 'all' ? undefined : parseInt(val))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={subjectFilter?.toString() || 'all'}
                onValueChange={(val) => setSubjectFilter(val === 'all' ? undefined : parseInt(val))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <Target className="w-4 h-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-2">
              <Brain className="w-4 h-4" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProgressDashboard stats={stats} earnedBadges={earnedBadges} />
              </div>
              <div>
                <StreakDisplay
                  currentStreak={stats.currentStreak}
                  longestStreak={stats.longestStreak}
                  lastStudyDate={progressData[0]?.last_study_date}
                />
              </div>
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Available Quizzes</h2>
              <Button onClick={() => setShowQuizCreator(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Quiz
              </Button>
            </div>
            {quizzesLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading quizzes...</p>
            ) : quizzes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No quizzes available. Create one to get started!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map(quiz => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onStart={handleStartQuiz}
                    onDelete={deleteQuiz}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Flashcard Decks</h2>
              <Button onClick={() => setShowDeckCreator(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Deck
              </Button>
            </div>
            {flashcardsLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading decks...</p>
            ) : decks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No flashcard decks available. Create one to start studying!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map(deck => (
                  <FlashcardDeckCard
                    key={deck.id}
                    deck={deck}
                    onStudy={handleStudyDeck}
                    onDelete={deleteDeck}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Video Lessons</h2>
            </div>
            {videosLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading videos...</p>
            ) : videos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No video lessons available yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map(video => (
                  <VideoLessonCard
                    key={video.id}
                    video={video}
                    progress={videoProgress[video.id]}
                    onWatch={handleWatchVideo}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <NoteTaker
              notes={notes}
              currentNote={currentNote}
              onSelectNote={setCurrentNote}
              onCreateNote={handleCreateNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
              isLoading={notesLoading}
            />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Leaderboard entries={leaderboard} currentUserId={USER_ID} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
