import { motion } from 'framer-motion';
import { Badge } from '@/types/troubleshooting';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';

interface BadgeDisplayProps {
    badges: Badge[];
    showUnlockAnimation?: boolean;
    compact?: boolean;
}

export function BadgeDisplay({
    badges,
    showUnlockAnimation = false,
    compact = false
}: BadgeDisplayProps) {
    if (badges.length === 0 && compact) {
        return null;
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                <TooltipProvider>
                    {badges.slice(0, 3).map((badge, index) => (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={showUnlockAnimation ? { scale: 0, rotate: -180 } : false}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 20,
                                        delay: index * 0.1,
                                    }}
                                    className="text-xl cursor-pointer hover:scale-110 transition-transform"
                                >
                                    {badge.icon}
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-center">
                                    <p className="font-semibold">{badge.name}</p>
                                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {badges.length > 3 && (
                        <span className="text-xs text-muted-foreground ml-1">
                            +{badges.length - 3}
                        </span>
                    )}
                </TooltipProvider>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Your Badges</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge, index) => (
                    <motion.div
                        key={badge.id}
                        initial={showUnlockAnimation ? { scale: 0, rotate: -180 } : false}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20,
                            delay: index * 0.1,
                        }}
                    >
                        <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="text-4xl mb-2"
                            >
                                {badge.icon}
                            </motion.div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {badge.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {badge.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Unlocked {new Date(badge.unlocked_at).toLocaleDateString()}
                            </p>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

interface BadgeUnlockNotificationProps {
    badge: Badge;
    onClose: () => void;
}

export function BadgeUnlockNotification({ badge, onClose }: BadgeUnlockNotificationProps) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div
                    animate={{
                        rotate: [0, -10, 10, -10, 10, 0],
                        scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
                    }}
                    transition={{ duration: 0.5 }}
                    className="text-7xl text-center mb-4"
                >
                    {badge.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-center text-foreground mb-2">
                    Badge Unlocked!
                </h3>
                <p className="text-xl font-semibold text-center text-primary mb-2">
                    {badge.name}
                </p>
                <p className="text-sm text-center text-muted-foreground">
                    {badge.description}
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium"
                >
                    Awesome! 🎉
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
