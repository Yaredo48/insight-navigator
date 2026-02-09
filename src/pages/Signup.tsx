import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'teacher'], {
        required_error: 'Please select a role',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
    const { signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            role: 'student',
        },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            await signUp(data.email, data.password, data.name, data.role);
        } catch (error) {
            console.error('Signup error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md px-4"
            >
                <Card className="border-slate-700 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-yellow-400 mr-3" />
                            <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">
                            Join Insight Navigator and start learning
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-200">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm text-red-400">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="student@example.com"
                                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-200">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        {...register('password')}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-200">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        {...register('confirmPassword')}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-200">I am a...</Label>
                                <RadioGroup
                                    value={selectedRole}
                                    onValueChange={(value) => setValue('role', value as 'student' | 'teacher')}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div>
                                        <RadioGroupItem
                                            value="student"
                                            id="student"
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor="student"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:border-purple-500 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 cursor-pointer transition-all"
                                        >
                                            <span className="text-lg font-semibold text-white">Student</span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem
                                            value="teacher"
                                            id="teacher"
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor="teacher"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:border-pink-500 peer-data-[state=checked]:border-pink-500 peer-data-[state=checked]:bg-pink-500/20 cursor-pointer transition-all"
                                        >
                                            <span className="text-lg font-semibold text-white">Teacher</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                                {errors.role && (
                                    <p className="text-sm text-red-400">{errors.role.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-sm text-center text-slate-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>
                        <div className="text-sm text-center">
                            <Link
                                to="/"
                                className="text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                ← Back to home
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default Signup;
