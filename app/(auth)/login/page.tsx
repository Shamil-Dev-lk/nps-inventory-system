'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Lock, Mail, Shield, AlertCircle,
  Loader2, Building2, MapPin, User2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useOrgStore } from '@/store/org-store';
import type { Organization } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, isAuthenticated } = useAuthStore();
  const { setOrg, org } = useOrgStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [otp, setOtp] = useState('');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember_me: false },
  });

  const { data: orgData } = useQuery({
    queryKey: ['organization-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Organization;
    },
  });

  useEffect(() => { if (orgData) setOrg(orgData); }, [orgData, setOrg]);
  useEffect(() => { if (isAuthenticated) router.replace('/dashboard'); }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      if (authData.session) {
        setToken(authData.session.access_token);
        
        // Fetch user profile from public schema if needed, or just use auth user
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const userData = profileData || { id: authData.user.id, name: authData.user.email?.split('@')[0] || 'User' };
        setUser(userData as any);
        toast.success(`Welcome back, ${userData.name}!`);
        router.replace('/dashboard/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FA = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await api.post('/v1/auth/login/2fa', {
        two_factor_token: twoFactorToken,
        one_time_password: otp,
      });
      setToken(res.data.token);
      setUser(res.data.user);
      toast.success('Two-factor authentication verified!');
      router.replace('/dashboard/');
    } catch (err: any) {
      toast.error('Invalid OTP code. Please try again.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const orgName = org?.name_en || 'Pradeshiya Sabha';
  const systemName = org?.system_name || 'ANTIGRAVITY';
  const subtitle = org?.system_subtitle || 'Store & Inventory Management';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* ── Left Panel: Branding ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-[52%] gov-gradient relative overflow-hidden flex-col items-center justify-center p-12 text-white select-none"
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#8DC63F]/20 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#FDB913]/15 blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          {/* Animated logo */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 shadow-2xl flex items-center justify-center"
          >
            <Building2 size={56} className="text-white drop-shadow-lg" />
          </motion.div>

          <h1 className="text-5xl font-black tracking-tight mb-3 drop-shadow-md">{systemName}</h1>
          <p className="text-white/75 text-lg mb-10 font-medium">{subtitle}</p>

          {/* Org info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left space-y-3"
          >
            <h2 className="font-bold text-xl">{orgName}</h2>
            {org?.district && (
              <p className="text-white/70 text-sm flex items-center gap-2">
                <MapPin size={14} className="shrink-0" />
                {org.district} District, {org.province} Province
              </p>
            )}
            {org?.chairman_name && (
              <p className="text-white/70 text-sm flex items-center gap-2">
                <User2 size={14} className="shrink-0" />
                Chairman: {org.chairman_name}
              </p>
            )}
          </motion.div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['Secure', 'Multi-Language', 'AI Powered', 'Real-time'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/80"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
      </motion.div>

      {/* ── Right Panel: Login Form ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-8 bg-background min-h-screen lg:min-h-0"
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gov-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">{systemName}</h1>
            <p className="text-muted-foreground text-sm mt-1">{orgName}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Login Form ── */}
            {!show2FA ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Sign in to your government account</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        id="email"
                        {...form.register('email')}
                        type="email"
                        placeholder="officer@pradeshiyasabha.gov.lk"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      />
                    </div>
                    {form.formState.errors.email && (
                      <p className="text-destructive text-xs flex items-center gap-1.5 mt-1">
                        <AlertCircle size={12} />
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        id="password"
                        {...form.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-destructive text-xs flex items-center gap-1.5 mt-1">
                        <AlertCircle size={12} />
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        {...form.register('remember_me')}
                        id="remember_me"
                        type="checkbox"
                        className="w-4 h-4 rounded border-input accent-primary cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        Remember me
                      </span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white gov-gradient hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                  >
                    {isLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                    ) : (
                      'Sign In to ANTIGRAVITY'
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-border text-center space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Shield size={12} className="text-primary" />
                    Secured with 256-bit SSL encryption
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {org?.copyright || `© ${new Date().getFullYear()} ${orgName}. All rights reserved.`}
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ── 2FA Form ── */
              <motion.div
                key="2fa-form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 border border-primary/20">
                    <Shield size={40} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Two-Factor Auth</h2>
                  <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                    Enter the 6-digit code from your authenticator app to continue
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="· · · · · ·"
                    maxLength={6}
                    className="w-full text-center text-4xl font-mono tracking-[0.5em] py-5 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />

                  <button
                    onClick={handle2FA}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-white gov-gradient hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <button
                    onClick={() => { setShow2FA(false); setOtp(''); }}
                    className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
