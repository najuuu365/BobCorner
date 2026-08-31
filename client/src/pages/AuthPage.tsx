import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Compass, Key, Mail, User as UserIcon, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
        showToast('Welcome to Bob\'s space!', 'success');
      } else {
        await login(email, password);
        showToast('Signed in successfully', 'success');
      }
    } catch (err: any) {  
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@haven.app');
    setPassword('password123');
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-haven-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-haven-700 to-amber-600 flex items-center justify-center text-white mx-auto shadow-lg">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900 dark:text-white">
            Bobbb's prison  
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A corner of the Bob's vast vast space for you.
          </p>
        </div>

        {/* Form Card */}
        <Card className="space-y-5 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Input
                label="Full Name"
                placeholder="????"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="?????????"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Key className="w-4 h-4" />}
              required
            />

            <Button variant="primary" type="submit" className="w-full py-3" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Demo Login Option */}
          {/* {!isRegister && (
            <div className="pt-2 border-t border-haven-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-amber-700 border-amber-300 dark:border-amber-900/50"
                onClick={fillDemo}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Use Demo Credentials (demo@haven.app)
              </Button>
            </div>
          )}

          <div className="text-center pt-2 text-xs text-slate-500">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Create One
                </button>
              </span>
            )}
          </div> */}
        </Card>
      </div>
    </div>
  );
};
