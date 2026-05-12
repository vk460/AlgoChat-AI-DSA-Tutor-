import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle2, BrainCircuit, ChevronRight } from 'lucide-react';

/**
 * Premium Centered Gated Diagnostic Modal
 * Blocks UI until all prerequisite questions are answered.
 */
export const DiagnosticModal = ({ questions, concept, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const selectedAnswer = answers[currentIndex];

  const handleSelect = (optionIndex) => {
    setAnswers({ ...answers, [currentIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={`q-${currentIndex}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 0 80px rgba(99,102,241,0.15), 0 25px 50px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(99,102,241,0.4)'
                }}>
                  <ShieldCheck size={22} color="#6366f1" />
                </div>
                <div>
                  <h2 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                    Neural Mapping
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    Prerequisite Assessment — {concept || 'DSA'}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#6366f1', fontSize: '28px', fontWeight: 900, lineHeight: 1 }}>{currentIndex + 1}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px', fontWeight: 700 }}>/{questions.length}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', marginBottom: '32px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '99px' }}
              />
            </div>

            {/* Question */}
            <h3 style={{
              color: '#f0f0ff', fontSize: '20px', fontWeight: 700, lineHeight: 1.5,
              marginBottom: '28px', minHeight: '60px'
            }}>
              {currentQ?.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {(currentQ?.options || []).map((opt, i) => {
                const isSelected = selectedAnswer === i;
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                      border: isSelected ? '1.5px solid #6366f1' : '1.5px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.2s ease',
                      textAlign: 'left', width: '100%'
                    }}
                  >
                    <span style={{
                      minWidth: '32px', height: '32px', borderRadius: '8px',
                      background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.06)',
                      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700,
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)'
                    }}>
                      {optionLabels[i]}
                    </span>
                    <span style={{ color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 500 }}>
                      {opt}
                    </span>
                    {isSelected && <CheckCircle2 size={18} color="#6366f1" style={{ marginLeft: 'auto' }} />}
                  </motion.button>
                );
              })}
            </div>

            {/* Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                disabled={selectedAnswer === undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '99px', cursor: selectedAnswer === undefined ? 'not-allowed' : 'pointer',
                  background: selectedAnswer !== undefined
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', color: '#fff',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                  opacity: selectedAnswer === undefined ? 0.4 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Completion Screen */
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '100%', maxWidth: '480px', textAlign: 'center',
              background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 100%)',
              border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '48px',
              boxShadow: '0 0 80px rgba(34,197,94,0.1), 0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}
            >
              <CheckCircle2 size={40} color="#22c55e" />
            </motion.div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Mapping Complete
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '36px', lineHeight: 1.6 }}>
              Your knowledge profile has been saved. Now generating a personalized explanation...
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(answers)}
              style={{
                width: '100%', padding: '16px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff', fontSize: '14px', fontWeight: 800,
                letterSpacing: '2px', textTransform: 'uppercase'
              }}
            >
              Continue to Lab ›
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
