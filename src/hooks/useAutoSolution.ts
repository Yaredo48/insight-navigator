import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTroubleshooting } from '@/hooks/useTroubleshooting';

interface UserAction {
    type: 'upload_error' | 'api_error' | 'navigation' | 'feature_click' | 'idle';
    timestamp: number;
    metadata?: any;
}

interface StruggleThresholds {
    uploadErrors: number;
    apiErrors: number;
    featureClicks: number;
    idleTime: number;
}

const DEFAULT_THRESHOLDS: StruggleThresholds = {
    uploadErrors: 2,
    apiErrors: 2,
    featureClicks: 3,
    idleTime: 60000, // 60 seconds
};

export function useAutoSolution() {
    const [actions, setActions] = useState<UserAction[]>([]);
    const { toast } = useToast();
    const { startFlow } = useTroubleshooting();
    const lastActionTime = useRef<number>(Date.now());
    const suggestionsShown = useRef<Set<string>>(new Set());

    // Track a user action
    const trackAction = useCallback((type: UserAction['type'], metadata?: any) => {
        const timestamp = Date.now();
        lastActionTime.current = timestamp;

        setActions(prev => {
            // Keep only recent actions (last 5 minutes)
            const recent = prev.filter(a => timestamp - a.timestamp < 300000);
            return [...recent, { type, timestamp, metadata }];
        });
    }, []);

    // Analyze actions for struggle signals
    useEffect(() => {
        const analyzeStruggle = () => {
            const recentUploadErrors = actions.filter(a => a.type === 'upload_error').length;

            // Check for upload struggles
            if (recentUploadErrors >= DEFAULT_THRESHOLDS.uploadErrors && !suggestionsShown.current.has('upload_help')) {
                suggestionsShown.current.add('upload_help');
                toast({
                    title: "Having trouble uploading?",
                    description: "I noticed a few failed attempts. File size or format issues are common.",
                    action: (
                        <button 
              onClick= {() => startTroubleshooting("I can't upload a document")
    }
              className = "bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
        Get Help
    </button>
    ),
        duration: 10000,
        });
      }
    };

analyzeStruggle();
  }, [actions, toast]);

// Check for idle time
useEffect(() => {
    const checkIdle = setInterval(() => {
        const idleTime = Date.now() - lastActionTime.current;
        if (idleTime > DEFAULT_THRESHOLDS.idleTime && !suggestionsShown.current.has('idle_help')) {
            // Only show if user hasn't done anything yet
            if (actions.length < 5) {
                suggestionsShown.current.add('idle_help');
                toast({
                    title: "Need a hand getting started?",
                    description: "I can guide you through the features or help you troubleshoot an issue.",
                    action: (
                        <button 
                onClick= {() => startTroubleshooting("Help me troubleshoot an issue")
}
                className = "bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
    Start Guide
</button>
),
    duration: 15000,
          });
        }
      }
    }, 10000);

return () => clearInterval(checkIdle);
  }, [actions]);

// Helper to start troubleshooting from toast
const startTroubleshooting = async (issue: string) => {
    // We need to access the current conversation ID to start a flow
    // This will be handled by the component using this hook
    // For now we'll dispatch a custom event that ChatContainer can listen to
    window.dispatchEvent(new CustomEvent('trigger-troubleshooting', { detail: { issue } }));
};

return {
    trackAction,
};
}
