"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase-config";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

interface OwnerLoginProps {
  onBack?: () => void;
}

const OWNER_EMAIL = "spinzbeverage@gmail.com";

export function OwnerLogin({ onBack }: OwnerLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // ✅ Email / Password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() !== OWNER_EMAIL) {
      toast.error("Only owner can log in");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back, Owner!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.email?.toLowerCase() !== OWNER_EMAIL) {
        await auth.signOut();
        toast.error("Only owner can log in");
        return;
      }
      
      toast.success("Welcome back, Owner!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Enter email");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Reset link sent");
      setShowForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Card className="p-8 w-full max-w-md mx-auto relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl">
        <div className="absolute top-0 left-[-20%] w-[140%] h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Reset Password
          </h2>
          <p className="text-center text-sm text-blue-200 mb-8">
            We'll send you instructions securely
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300 group-focus-within:text-indigo-400 transition-colors duration-300" />
              <Input
                type="email"
                placeholder="Owner Email"
                className="pl-12 h-14 bg-black/20 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 rounded-2xl transition-all duration-300 text-white placeholder:text-white/40"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>

            <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 font-semibold text-lg border-0" disabled={loading}>
              {loading && <Loader2 className="mr-2 animate-spin" />}
              Send Reset Link
            </Button>

            <Button
              variant="ghost"
              type="button"
              className="w-full h-12 rounded-2xl hover:bg-white/5 transition-all text-blue-200 hover:text-white"
              onClick={() => setShowForgotPassword(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl transition-all duration-500">
      <div className="absolute top-[-10%] left-[-20%] w-[140%] h-48 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/20 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[100%] h-48 bg-gradient-to-tl from-cyan-500/10 to-transparent blur-[60px] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center mb-8">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 rounded-full hover:bg-white/10 text-white hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 text-center pr-8 sm:pr-0">
            <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Welcome Back
            </h2>
            <p className="text-sm text-blue-200 mt-1 font-medium">
              Secure Owner Dashboard Access
            </p>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300 group-focus-within:text-cyan-400 transition-colors duration-300" />
            <Input
              type="email"
              placeholder="Owner Email"
              className="pl-12 h-14 bg-black/20 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-2xl transition-all duration-300 text-white placeholder:text-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300 group-focus-within:text-cyan-400 transition-colors duration-300" />
            <Input
              type="password"
              placeholder="Password"
              className="pl-12 h-14 bg-black/20 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-2xl transition-all duration-300 text-white placeholder:text-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-all"
            >
              Recover Password?
            </button>
          </div>

          <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 font-bold text-[16px] tracking-wide border-0 mt-2" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Sign In Securely
          </Button>

          <div className="relative my-6 flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-blue-200 uppercase tracking-widest">
              Or Connect With
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm font-medium text-[15px] text-white"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Google Authorization
          </Button>
        </form>
      </div>
    </Card>
  );
}
