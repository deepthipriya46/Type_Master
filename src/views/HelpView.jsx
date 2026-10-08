import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

export default function HelpView() {
  const faqs = [
    {
      q: 'How is typing speed (WPM) calculated?',
      a: 'In accordance with standardized typing conventions, 1 word is measured as exactly 5 keystrokes (including spaces and punctuation). WPM is calculated as (Net Correct Keystrokes / 5) divided by Elapsed Time in Minutes.'
    },
    {
      q: 'How does the Anti-Cheat Validation work?',
      a: 'Every test submission is inspected by the Anti-Cheat Service to guarantee integrity. It checks for unrealistic sustained velocity (>250 WPM), duration sanity, and keystroke cadence anomalies before committing stats to Supabase.'
    },
    {
      q: 'How do streaks work?',
      a: 'Completing at least one typing test each calendar day increments your practice streak. If a day is skipped, the streak resets to 1 day.'
    },
    {
      q: 'How can I connect my own Supabase project?',
      a: 'Go to Settings or click the Supabase badge in the top bar. Enter your Supabase Project URL and Anon API Key from your Supabase dashboard. You can also run the provided supabase_schema.sql in your Supabase SQL Editor to initialize all tables.'
    }
  ];

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Help & Touch Typing Guide</h1>
          <p>Techniques, posture guidance, and frequently asked questions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Posture & Ergonomics Card */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <BookOpen size={20} color="#2563eb" />
              <h3>Touch Typing Ergonomics</h3>
            </div>
          </div>

          <ul className="tips-list" style={{ gap: '14px', marginTop: '8px' }}>
            <li>
              <CheckCircle2 size={16} />
              <div>
                <strong>Home Row Anchor:</strong> Rest left index on 'F' and right index on 'J'. Use the physical bumps on F and J to position your hands without glancing down.
              </div>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <div>
                <strong>Curved Fingers:</strong> Keep fingers lightly curved over keys like holding a tennis ball. Avoid flat finger striking.
              </div>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <div>
                <strong>Wrist Alignment:</strong> Keep wrists straight and elevated slightly above the desk surface to avoid carpal strain.
              </div>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <div>
                <strong>Rhythm Over Rush:</strong> Type at a steady, rhythmic cadence. High accuracy naturally translates into blistering speed over time.
              </div>
            </li>
          </ul>
        </div>

        {/* FAQs */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <HelpCircle size={20} color="#7c3aed" />
              <h3>Frequently Asked Questions</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  {f.q}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
