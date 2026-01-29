import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Grade {
    id: number;
    grade_number: number;
    name: string;
}

interface GradeSelectorProps {
    grades: Grade[];
    selectedGrade: number | null;
    onSelectGrade: (gradeId: number) => void;
}

export const GradeSelector = ({ grades, selectedGrade, onSelectGrade }: GradeSelectorProps) => {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Select Your Grade</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {grades.map((grade, index) => (
                    <motion.div
                        key={grade.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card
                            onClick={() => onSelectGrade(grade.id)}
                            className={cn(
                                'relative overflow-hidden cursor-pointer p-6 text-center',
                                'transform transition-all duration-300 hover:scale-105',
                                'border-2',
                                selectedGrade === grade.id
                                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                    : 'border-border hover:border-blue-300 bg-card'
                            )}
                        >
                            {/* Selection Indicator */}
                            {selectedGrade === grade.id && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-4 h-4 text-white"
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

                            {/* Grade Number */}
                            <div className="text-5xl font-bold text-blue-500 mb-2">
                                {grade.grade_number}
                            </div>

                            {/* Grade Name */}
                            <div className="text-sm text-muted-foreground">
                                {grade.name}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
