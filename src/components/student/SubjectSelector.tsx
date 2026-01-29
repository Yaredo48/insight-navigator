import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    BookOpen,
    Calculator,
    Beaker,
    Dna,
    Atom,
    Globe,
    Scroll,
} from 'lucide-react';

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface SubjectSelectorProps {
    subjects: Subject[];
    selectedSubject: number | null;
    onSelectSubject: (subjectId: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subjectIcons: Record<string, any> = {
    ENG: BookOpen,
    MATH: Calculator,
    CHEM: Beaker,
    BIO: Dna,
    PHY: Atom,
    GEO: Globe,
    HIST: Scroll,
};

const subjectColors: Record<string, string> = {
    ENG: 'from-purple-500 to-pink-500',
    MATH: 'from-blue-500 to-cyan-500',
    CHEM: 'from-green-500 to-emerald-500',
    BIO: 'from-teal-500 to-green-500',
    PHY: 'from-orange-500 to-red-500',
    GEO: 'from-indigo-500 to-blue-500',
    HIST: 'from-amber-500 to-yellow-500',
};

export const SubjectSelector = ({
    subjects,
    selectedSubject,
    onSelectSubject,
}: SubjectSelectorProps) => {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Choose Your Subject</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map((subject, index) => {
                    const Icon = subjectIcons[subject.code] || BookOpen;
                    const gradient = subjectColors[subject.code] || 'from-gray-500 to-gray-600';

                    return (
                        <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                onClick={() => onSelectSubject(subject.id)}
                                className={cn(
                                    'relative overflow-hidden cursor-pointer p-6',
                                    'transform transition-all duration-300 hover:scale-105',
                                    'border-2 group',
                                    selectedSubject === subject.id
                                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                        : 'border-border hover:border-primary/50 bg-card'
                                )}
                            >
                                {/* Background Gradient */}
                                <div
                                    className={cn(
                                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                                        gradient
                                    )}
                                />

                                {/* Selection Indicator */}
                                {selectedSubject === subject.id && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <svg
                                                className="w-4 h-4 text-primary-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className="relative z-10 mb-4">
                                    <div
                                        className={cn(
                                            'inline-flex p-3 rounded-xl bg-gradient-to-br',
                                            gradient
                                        )}
                                    >
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                {/* Subject Name */}
                                <div className="relative z-10">
                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                        {subject.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
