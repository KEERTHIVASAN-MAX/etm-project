import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase-config";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

interface OwnerLoginProps {
  onBack?: () => void;
}

export function OwnerLogin({ onBack }: OwnerLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log("Checking for redirect result...");
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect result user:", result.user.email);
          if (result.user.email !== "spinzbeverage@gmail.com") {
            await auth.signOut();
            toast.error("Access Denied: You must use the 'spinzbeverage@gmail.com' account.");
            return;
          }

          // Explicitly save to localStorage for mobile persistence
          localStorage.setItem("uid", result.user.uid);
          localStorage.setItem("role", "owner");
          localStorage.setItem("userName", result.user.displayName || "Owner");

          console.log("✅ Google login successful, session saved");
          toast.success("Google login successful!");

          // Give Firebase time to update auth state before reload
          setTimeout(() => {
            window.location.href = "/";
          }, 500);
        } else {
          console.log("No redirect result found");
        }
      } catch (error: any) {
        console.error("Redirect result error:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
          toast.error("Google login failed: " + error.message);
        }
      }
    };
    handleRedirectResult();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() !== "spinzbeverage@gmail.com") {
      toast.error("Access Denied: Only the owner (spinzbeverage@gmail.com) can log in.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back, Owner!");
      // No need to reload, AuthContext will update and redirect
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      // Use redirect instead of popup for mobile compatibility
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error("Google login failed: " + error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset link sent to " + resetEmail);
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Card className="p-6 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter your registered email"
                className="pl-10"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Send Reset Link
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setShowForgotPassword(false)}
          >
            Back to Login
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <div className="flex items-center mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 text-center">
          <h2 className="text-2xl font-bold">Owner Login</h2>
          <p className="text-sm text-gray-500">Manage your business securely</p>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              placeholder="spinzbeverage@gmail.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Enter your password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Login"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
        Google
      </Button>
    </Card>
  );
}
