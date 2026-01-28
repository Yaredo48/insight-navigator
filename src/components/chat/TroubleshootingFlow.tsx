import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    TroubleshootingFlowData,
    TroubleshootingSession,
    TroubleshootingStep,
} from '@/types/troubleshooting';

interface TroubleshootingFlowProps {
    session: TroubleshootingSession;
    flow: TroubleshootingFlowData;
    onResponse: (response: 'yes' | 'no') => void;
    isLoading?: boolean;
}

export function TroubleshootingFlow({
    session,
    flow,
    onResponse,
    isLoading = false,
}: TroubleshootingFlowProps) {
    const currentStep = flow.steps[session.current_step_index];
    const progress = ((session.current_step_index + 1) / flow.steps.length) * 100;
    const isTerminalStep = currentStep.type === 'success' || currentStep.type === 'error';

    const getStepIcon = (step: TroubleshootingStep) => {
        switch (step.type) {
            case 'success':
                return <CheckCircle2 className="h-6 w-6 text-green-500" />;
            case 'error':
                return <XCircle className="h-6 w-6 text-red-500" />;
            case 'instruction':
                return <Info className="h-6 w-6 text-blue-500" />;
            default:
                return null;
        }
    };

    const getStepBackgroundColor = (step: TroubleshootingStep) => {
        switch (step.type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
            case 'error':
                return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
            case 'instruction':
                return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <Card className={cn(
                'p-6 border-2 shadow-lg',
                getStepBackgroundColor(currentStep)
            )}>
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                            {flow.title}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            Step {session.current_step_index + 1} of {flow.steps.length}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Step Icon and Message */}
                        <div className="flex items-start gap-3">
                            {getStepIcon(currentStep) && (
                                <div className="flex-shrink-0 mt-1">
                                    {getStepIcon(currentStep)}
                                </div>
                            )}
                            <div className="flex-1">
                                {currentStep.question && (
                                    <p className="text-base font-medium text-foreground mb-3">
                                        {currentStep.question}
                                    </p>
                                )}
                                {currentStep.message && (
                                    <p className="text-base text-foreground leading-relaxed">
                                        {currentStep.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Visual Aid (if present) */}
                        {currentStep.visual && (
                            <div className="rounded-lg overflow-hidden border border-border">
                                {currentStep.visual.type === 'image' && (
                                    <img
                                        src={currentStep.visual.url}
                                        alt={currentStep.visual.alt || 'Step illustration'}
                                        className="w-full h-auto"
                                    />
                                )}
                                {currentStep.visual.type === 'video' && (
                                    <video
                                        src={currentStep.visual.url}
                                        controls
                                        className="w-full h-auto"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        {currentStep.type === 'yes_no' && !isTerminalStep && (
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={() => onResponse('yes')}
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-6 text-base"
                                    size="lg"
                                >
                                    ✅ Yes
                                </Button>
                                <Button
                                    onClick={() => onResponse('no')}
                                    disabled={isLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-6 text-base"
                                    size="lg"
                                    variant="destructive"
                                >
                                    ❌ No
                                </Button>
                            </div>
                        )}

                        {currentStep.type === 'instruction' && currentStep.next && (
                            <div className="pt-2">
                                <Button
                                    onClick={() => onResponse('yes')}
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 text-base"
                                    size="lg"
                                >
                                    Continue →
                                </Button>
                            </div>
                        )}

                        {/* Tip Section */}
                        {currentStep.tip && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                            >
                                <div className="flex items-start gap-2">
                                    <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                                            💡 Pro Tip
                                        </p>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            {currentStep.tip}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Session Info */}
                <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {session.step_history.length} step{session.step_history.length !== 1 ? 's' : ''} taken
                        </span>
                        <span>
                            Started {new Date(session.started_at).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
