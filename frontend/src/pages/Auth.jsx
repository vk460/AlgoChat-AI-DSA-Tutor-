import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import API_URL from '../config';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/signup/';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('dsa_mentor_user', JSON.stringify(data.user));
        window.location.href = '/lab';
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/20 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-secondary/10 blur-[120px] animate-pulse pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-black uppercase tracking-tighter text-white">AlgoChat AI</h1>
          <p className="text-muted-foreground text-sm">Synchronizing neural pathways for mastery.</p>
        </div>

        <div className="glass-panel-strong p-8 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <ShieldCheck size={180} />
          </div>

          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-widest transition-all ${isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-2 text-sm font-bold uppercase tracking-widest transition-all ${!isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            >
              Signup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Full Name" 
                      className="pl-10"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                type="email" 
                placeholder="Email Address" 
                className="pl-10"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="Password" 
                className="pl-10"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-xs text-destructive font-bold bg-destructive/10 p-2 rounded"
              >
                {error}
              </motion.p>
            )}

            <Button className="w-full h-12 gap-2 uppercase font-black tracking-widest" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Login to Neural Core' : 'Create Neural Identity')}
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs text-muted-foreground">
          By continuing, you agree to our <span className="text-primary hover:underline cursor-pointer">Protocol Terms</span>.
        </p>
      </motion.div>
    </div>
  );
}
