import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { useProgressTracking } from '@/src/stores/analyticsStore';
import { SessionEntry, AnalyticsEventType } from '@/src/types/analytics';
import { CEFRLevel } from '@/src/types/language';

interface SessionTrackerProps {
  userId: string;
  catalogueId?: string;
  sessionType: 'words' | 'sentences';
  difficultyLevel?: CEFRLevel;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (session: SessionEntry) => void;
  onMilestoneAchieved?: (milestoneId: string) => void;
}

interface ActiveSession {
  id: string;
  userId: string;
  catalogueId: string;
  sessionType: 'words' | 'sentences';
  startTime: Date;
  cardsReviewed: number;
  cardsCorrect: number;
  cardsIncorrect: number;
  wordsLearned: number[];
  wordsReviewed: string[];
  responseTimes: number[];
  difficultyLevel: CEFRLevel;
}

/**
 * Invisible component that tracks user learning sessions
 * Automatically starts/stops sessions and records analytics data
 */
export function SessionTracker({
  userId,
  catalogueId = 'default',
  sessionType,
  difficultyLevel = 'B1',
  onSessionStart,
  onSessionEnd,
  onMilestoneAchieved
}: SessionTrackerProps) {
  const { recordSession, recordProgressEntry, trackEvent, checkMilestones } = useProgressTracking();
  
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const lastActivityTime = useRef<Date>(new Date());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  // Session timeout (5 minutes of inactivity)
  const SESSION_TIMEOUT = 5 * 60 * 1000;
  
  // Start new session
  const startSession = () => {
    if (activeSession) {
      endSession(); // End previous session first
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const newSession: ActiveSession = {
      id: sessionId,
      userId,
      catalogueId,
      sessionType,
      startTime,
      cardsReviewed: 0,
      cardsCorrect: 0,
      cardsIncorrect: 0,
      wordsLearned: [],
      wordsReviewed: [],
      responseTimes: [],
      difficultyLevel
    };
    
    setActiveSession(newSession);
    sessionStartTime.current = startTime;
    lastActivityTime.current = startTime;
    
    trackEvent('session_started', {
      sessionId,
      sessionType,
      catalogueId,
      difficultyLevel
    });
    
    onSessionStart?.(sessionId);
  };
  
  // End current session
  const endSession = async () => {
    if (!activeSession || !sessionStartTime.current) return;
    
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.current.getTime()) / (1000 * 60));
    
    // Don't record very short sessions (less than 30 seconds)
    if (durationMinutes < 0.5) {
      setActiveSession(null);
      sessionStartTime.current = null;
      return;
    }
    
    const sessionEntry: Omit<SessionEntry, 'id' | 'created_at'> = {
      user_id: activeSession.userId,
      catalogue_id: activeSession.catalogueId,
      session_type: activeSession.sessionType,
      start_time: activeSession.startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      cards_total: activeSession.cardsReviewed,
      cards_correct: activeSession.cardsCorrect,
      cards_incorrect: activeSession.cardsIncorrect,
      accuracy_percentage: activeSession.cardsReviewed > 0 ? 
        Math.round((activeSession.cardsCorrect / activeSession.cardsReviewed) * 100) : 0,
      words_learned: activeSession.wordsLearned,
      words_reviewed: activeSession.wordsReviewed,
      new_words_encountered: activeSession.wordsLearned.length,
      review_words_practiced: activeSession.wordsReviewed.length,
      average_response_time: activeSession.responseTimes.length > 0 ? 
        activeSession.responseTimes.reduce((sum, time) => sum + time, 0) / activeSession.responseTimes.length : 0,
      difficulty_level: activeSession.difficultyLevel
    };
    
    try {
      await recordSession(sessionEntry);
      
      // Create progress entry for today
      const today = new Date().toISOString().split('T')[0];
      const progressEntry = {
        user_id: activeSession.userId,
        date: today,
        words_studied: activeSession.cardsReviewed,
        words_learned: activeSession.wordsLearned.length,
        words_reviewed: activeSession.wordsReviewed.length,
        deep_memory_words: 0, // Will be calculated by analytics engine
        study_time_minutes: durationMinutes,
        session_count: 1,
        accuracy_percentage: sessionEntry.accuracy_percentage,
        streak_days: 0, // Will be calculated by analytics engine
        daily_goal_minutes: 30, // Default goal
        goal_achieved: durationMinutes >= 30
      };
      
      await recordProgressEntry(progressEntry);
      
      // Check for milestone achievements
      await checkMilestones();
      
      trackEvent('session_completed', {
        sessionId: activeSession.id,
        durationMinutes,
        cardsReviewed: activeSession.cardsReviewed,
        accuracy: sessionEntry.accuracy_percentage
      });
      
      onSessionEnd?.(sessionEntry as SessionEntry);
    } catch (error) {
      console.error('Failed to record session:', error);
    }
    
    setActiveSession(null);
    sessionStartTime.current = null;
  };
  
  // Record card interaction
  const recordCardInteraction = (isCorrect: boolean, responseTime: number, wordId?: number) => {
    if (!activeSession) return;
    
    setActiveSession(prev => {
      if (!prev) return null;
      
      const updated = {
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        cardsCorrect: prev.cardsCorrect + (isCorrect ? 1 : 0),
        cardsIncorrect: prev.cardsIncorrect + (isCorrect ? 0 : 1),
        responseTimes: [...prev.responseTimes, responseTime]
      };
      
      if (wordId) {
        if (isCorrect && !prev.wordsLearned.includes(wordId)) {
          updated.wordsLearned = [...prev.wordsLearned, wordId];
        }
        if (!prev.wordsReviewed.includes(wordId.toString())) {
          updated.wordsReviewed = [...prev.wordsReviewed, wordId.toString()];
        }
      }
      
      return updated;
    });
    
    lastActivityTime.current = new Date();
    
    if (isCorrect) {
      trackEvent('word_learned', { wordId, responseTime });
    } else {
      trackEvent('word_reviewed', { wordId, responseTime });
    }
  };
  
  // Check for session timeout
  useEffect(() => {
    const checkTimeout = () => {
      if (activeSession && lastActivityTime.current) {
        const now = new Date();
        const timeSinceActivity = now.getTime() - lastActivityTime.current.getTime();
        
        if (timeSinceActivity > SESSION_TIMEOUT) {
          endSession();
        }
      }
    };
    
    const interval = setInterval(checkTimeout, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [activeSession]);
  
  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - check if we should start a new session
        if (!activeSession) {
          startSession();
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background - end session after delay
        setTimeout(() => {
          if (AppState.currentState !== 'active') {
            endSession();
          }
        }, 2000); // 2 second delay to avoid ending session on quick app switches
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [activeSession]);
  
  // Auto-start session when component mounts
  useEffect(() => {
    if (userId && !activeSession) {
      startSession();
    }
    
    return () => {
      if (activeSession) {
        endSession();
      }
    };
  }, [userId]);
  
  // Expose session control methods to parent components
  useEffect(() => {
    // Attach methods to global object for access from practice components
    if (typeof window !== 'undefined') {
      (window as any).sessionTracker = {
        recordCardInteraction,
        startSession,
        endSession,
        isActive: !!activeSession,
        currentSession: activeSession
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).sessionTracker;
      }
    };
  }, [activeSession, recordCardInteraction]);
  
  // This component doesn't render anything visible
  return null;
}

// Helper hook for practice components to interact with session tracker
export const useSessionTracker = () => {
  const recordInteraction = (isCorrect: boolean, responseTime: number, wordId?: number) => {
    if (typeof window !== 'undefined' && (window as any).sessionTracker) {
      (window as any).sessionTracker.recordCardInteraction(isCorrect, responseTime, wordId);
    }
  };
  
  const startNewSession = () => {
    if (typeof window !== 'undefined' && (window as any).sessionTracker) {
      (window as any).sessionTracker.startSession();
    }
  };
  
  const endCurrentSession = () => {
    if (typeof window !== 'undefined' && (window as any).sessionTracker) {
      (window as any).sessionTracker.endSession();
    }
  };
  
  const isSessionActive = () => {
    if (typeof window !== 'undefined' && (window as any).sessionTracker) {
      return (window as any).sessionTracker.isActive;
    }
    return false;
  };
  
  const getCurrentSession = () => {
    if (typeof window !== 'undefined' && (window as any).sessionTracker) {
      return (window as any).sessionTracker.currentSession;
    }
    return null;
  };
  
  return {
    recordInteraction,
    startNewSession,
    endCurrentSession,
    isSessionActive,
    getCurrentSession
  };
};