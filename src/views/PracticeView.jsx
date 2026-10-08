import React from 'react';
import { BookOpen, Play, CheckCircle2, Flame, Award, Zap } from 'lucide-react';

export default function PracticeView({ onStartTest }) {
  const drills = [
    {
      id: 'home_row',
      title: 'Home Row Mastery',
      desc: 'Focus strictly on ASDF and JKL; to build rock-solid index and pinky finger anchors.',
      difficulty: 'Easy',
      category: 'Random Text',
      keys: 'A S D F J K L ;'
    },
    {
      id: 'top_row',
      title: 'Top Row Elevation',
      desc: 'Train smooth finger extensions for QWERTY and UIOP without lifting home row anchors.',
      difficulty: 'Easy',
      category: 'Random Text',
      keys: 'Q W E R T Y U I O P'
    },
    {
      id: 'bottom_row',
      title: 'Bottom Row Drops',
      desc: 'Master wrist positioning and precision drops for ZXCVBNM keys.',
      difficulty: 'Medium',
      category: 'Random Text',
      keys: 'Z X C V B N M , .'
    },
    {
      id: 'tech_terms',
      title: 'Technology & Cloud Lexicon',
      desc: 'Real engineering terms, cloud computing patterns, and distributed architecture vocabulary.',
      difficulty: 'Medium',
      category: 'Technology',
      keys: 'Full Words'
    },
    {
      id: 'code_syntax',
      title: 'Developer Syntax & Symbols',
      desc: 'Brackets, braces, arrows, semicolons, and camelCase programming patterns.',
      difficulty: 'Hard',
      category: 'Programming',
      keys: '{ } [ ] => === ; &'
    },
    {
      id: 'quotes_mastery',
      title: 'Famous Inspirational Quotes',
      desc: 'Flow naturally through historic philosophical passages and wisdom.',
      difficulty: 'Medium',
      category: 'Quotes',
      keys: 'Punctuation & Flow'
    }
  ];

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Targeted Practice Drills</h1>
          <p>Reinforce specific muscle memory patterns, difficult keys, and specialized vocabularies.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {drills.map((drill) => (
          <div key={drill.id} className="dashboard-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: drill.difficulty === 'Easy' ? '#ecfdf5' : drill.difficulty === 'Medium' ? '#fffbeb' : '#fef2f2',
                    color: drill.difficulty === 'Easy' ? '#059669' : drill.difficulty === 'Medium' ? '#d97706' : '#dc2626'
                  }}
                >
                  {drill.difficulty}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {drill.category}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                {drill.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, marginBottom: '12px' }}>
                {drill.desc}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#2563eb',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}
              >
                Focus: {drill.keys}
              </div>
            </div>

            <button
              onClick={() => onStartTest({ duration: 60, difficulty: drill.difficulty, category: drill.category })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <Play size={14} fill="#ffffff" /> Start Practice Drill
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
