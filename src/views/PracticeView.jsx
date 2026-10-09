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
      keys: 'A S D F J K L ;',
      customPrompt: 'asdf jkl; asdf jkl; a fad a glad lass all fall flags ask glad dads salad flask falls shall fall ask a dad.'
    },
    {
      id: 'top_row',
      title: 'Top Row Elevation',
      desc: 'Train smooth finger extensions for QWERTY and UIOP without lifting home row anchors.',
      difficulty: 'Easy',
      category: 'Random Text',
      keys: 'Q W E R T Y U I O P',
      customPrompt: 'type pure water wire quiet tower write root report power quote youth poet trip peer prep toy rope tree pot.'
    },
    {
      id: 'bottom_row',
      title: 'Bottom Row Drops',
      desc: 'Master wrist positioning and precision drops for ZXCVBNM keys and bottom punctuation.',
      difficulty: 'Medium',
      category: 'Random Text',
      keys: 'Z X C V B N M , .',
      customPrompt: 'zinc calm brave vacuum cabin maze vex comb banish zone move context box vanish mix cabin zinc calm banish move.'
    },
    {
      id: 'number_row',
      title: 'Number Row Mastery',
      desc: 'Build blind finger reach across numerical and top-tier shift symbol keys without glancing down.',
      difficulty: 'Medium',
      category: 'Random Text',
      keys: '1 2 3 4 5 6 7 8 9 0 ! @ # $ % ^ & * ( )',
      customPrompt: '123 456 789 012 !@# $%^ &*() 2024 + 1985 = 4009; 100% of 50 is 25, while 99 * 2 = 198 (Item #42 costs $19.99 & 5 items cost $99.95).'
    },
    {
      id: 'capitalization_shift',
      title: 'Capitalization & Shift Key Precision',
      desc: 'Train muscle memory for alternate left and right shift key coordination with mixed casing.',
      difficulty: 'Medium',
      category: 'Random Text',
      keys: 'Mixed Uppercase & Lowercase Strings',
      customPrompt: 'Alice Brown traveled to Paris, New York, and Tokyo. JavaScript and TypeScript use PascalCase for Classes and camelCase for functions. NASA, FBI, and UNESCO are Global Organizations.'
    },
    {
      id: 'common_code_syntax',
      title: 'Common Code Syntax & Symbols',
      desc: 'Drill developer brackets, arrows, inequalities, semicolons, and operator assignments.',
      difficulty: 'Hard',
      category: 'Programming',
      keys: '{ } [ ] < > ; : = + - -> =>',
      customPrompt: 'const items = [1, 2, 3]; if (x => x > 0 && y <= 10) { return items.map(val => val * 2); } <!-- tags --> obj.prop = { key: "value", flag: true };'
    },
    {
      id: 'speed_sprint_100',
      title: 'Speed Sprint - Top 100 English Words',
      desc: 'Rapid-fire burst training across the most frequent English words to elevate raw WPM rhythm.',
      difficulty: 'Easy',
      category: 'Random Text',
      keys: 'Fast-Paced Core Vocabulary',
      customPrompt: 'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'
    },
    {
      id: 'bigrams_trigrams',
      title: 'Tricky Bigrams & Trigrams',
      desc: 'Drill the most common recurring letter pairs and triplets to eliminate hesitation stutter.',
      difficulty: 'Medium',
      category: 'Random Text',
      keys: 'th, he, in, er, an, re, nd, at, on, nt',
      customPrompt: 'the mother and father went in another direction there then that other person thanked the entertainer for rendering enter entrance into under standard tender send brand grand at on nt tent went sent bent rent.'
    },
    {
      id: 'punctuation_mastery',
      title: 'Punctuation Mastery',
      desc: 'Hone conversational and prose punctuation: dialogue quotes, semicolons, colons, and dashes.',
      difficulty: 'Medium',
      category: 'Quotes',
      keys: 'Quotes, Commas, Semicolons, Em-dashes',
      customPrompt: '"Wait!" she whispered, pausing at the threshold; "did you hear that sound?" It was subtle—almost imperceptible—yet unmistakably present: a quiet rhythm, steady and calm.'
    },
    {
      id: 'tech_terms',
      title: 'Technology & Cloud Lexicon',
      desc: 'Real engineering terms, cloud computing patterns, and distributed architecture vocabulary.',
      difficulty: 'Medium',
      category: 'Technology',
      keys: 'Full Words & Cloud Jargon',
      customPrompt: 'Kubernetes containers orchestrate microservice clusters across distributed virtual private clouds with automated zero-downtime rolling canary deployments and telemetry logging.'
    },
    {
      id: 'code_syntax',
      title: 'Developer Syntax & Symbols',
      desc: 'Brackets, braces, arrows, semicolons, and camelCase programming patterns.',
      difficulty: 'Hard',
      category: 'Programming',
      keys: '{ } [ ] => === ; &',
      customPrompt: 'export async function fetchData(url: string): Promise<Record<string, unknown>> { const res = await fetch(url); return res.ok ? await res.json() : Promise.reject(new Error("Network Error")); }'
    },
    {
      id: 'quotes_mastery',
      title: 'Famous Inspirational Quotes',
      desc: 'Flow naturally through historic philosophical passages and wisdom.',
      difficulty: 'Medium',
      category: 'Quotes',
      keys: 'Punctuation & Flow',
      customPrompt: 'The only limit to our realization of tomorrow will be our doubts of today. Let us move forward with strong and active faith, knowing that perseverance turns dreams into reality.'
    },
    {
      id: 'left_hand_isolation',
      title: 'Left Hand Dexterity Isolation',
      desc: 'Isolate left-hand fingers (pinky to index) across QWERT, ASDFG, and ZXCVB key corridors.',
      difficulty: 'Hard',
      category: 'Random Text',
      keys: 'Q W E R T A S D F G Z X C V B',
      customPrompt: 'we saw extra baggage waste great craft brave water fast taste create treat extra brave craft sweat brass base grab trace vast state'
    },
    {
      id: 'right_hand_isolation',
      title: 'Right Hand Dexterity Isolation',
      desc: 'Isolate right-hand fingers (index to pinky) across YUIOP, HJKL, and NM key corridors.',
      difficulty: 'Hard',
      category: 'Random Text',
      keys: 'Y U I O P H J K L N M ; \' /',
      customPrompt: 'you look upon million lion opinion loop jolly hook nymph join polo link monopoly million look union pink milk kilo jump monk plum oil'
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

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {drill.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>
                {drill.desc}
              </p>

              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--card-border)',
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
              onClick={() => onStartTest({
                duration: 60,
                difficulty: drill.difficulty,
                category: drill.category,
                customPrompt: drill.customPrompt,
                drillTitle: drill.title
              })}
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
