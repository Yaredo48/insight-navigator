import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Landing = () => {
    const navigate = useNavigate();

    const roles = [
        {
            type: 'student' as const,
            title: 'Student',
            description: 'Access curriculum-aligned learning materials, interactive exercises, and personalized progress tracking',
            icon: GraduationCap,
            gradient: 'from-blue-500 to-cyan-500',
            hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
            path: '/student',
        },
        {
            type: 'teacher' as const,
            title: 'Teacher',
            description: 'Access teacher guides, lesson plans, class progress overview, and curriculum resources',
            icon: BookOpen,
            gradient: 'from-purple-500 to-pink-500',
            hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
            path: '/teacher',
        },
    ];

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 w-full max-w-6xl px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center mb-6">
                        <Sparkles className="w-12 h-12 text-yellow-400 mr-4" />
                        <h1 className="text-5xl md:text-7xl font-bold text-white">
                            Insight Navigator
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
                        AI-Powered Learning Assistant for Ethiopian Secondary Schools
                    </p>
                    <p className="text-lg text-slate-400 mt-4">
                        Grades 9-12 • Curriculum-Aligned • Interactive Learning
                    </p>
                </motion.div>

                {/* Role Selection Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {roles.map((role, index) => (
                        <motion.div
                            key={role.type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                        >
                            <Card
                                onClick={() => navigate(role.path)}
                                className={`
                  relative overflow-hidden cursor-pointer
                  bg-gradient-to-br ${role.gradient}
                  ${role.hoverGradient}
                  border-0 p-8 h-full
                  transform transition-all duration-300
                  hover:scale-105 hover:shadow-2xl
                  group
                `}
                            >
                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div className="mb-6 inline-block p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                        <role.icon className="w-12 h-12 text-white" />
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl font-bold text-white mb-4">
                                        {role.title}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-white/90 text-lg leading-relaxed">
                                        {role.description}
                                    </p>

                                    {/* Arrow Indicator */}
                                    <div className="mt-6 flex items-center text-white font-semibold">
                                        <span>Get Started</span>
                                        <svg
                                            className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center mt-16 text-slate-400"
                >
                    <p className="text-sm">
                        Powered by RAG Technology • Ethiopian Curriculum Aligned
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Landing;
