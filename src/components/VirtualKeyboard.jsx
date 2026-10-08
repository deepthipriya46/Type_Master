import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { soundSynth } from '../services/soundSynthesizer';

const KEYBOARD_LAYOUT = [
  [
    { key: '`', shift: '~' },
    { key: '1', shift: '!' },
    { key: '2', shift: '@' },
    { key: '3', shift: '#' },
    { key: '4', shift: '$' },
    { key: '5', shift: '%' },
    { key: '6', shift: '^' },
    { key: '7', shift: '&' },
    { key: '8', shift: '*' },
    { key: '9', shift: '(' },
    { key: '0', shift: ')' },
    { key: '-', shift: '_' },
    { key: '=', shift: '+' },
    { key: 'Backspace', display: 'Backspace', class: 'key-backspace' }
  ],
  [
    { key: 'Tab', display: 'Tab', class: 'key-tab' },
    { key: 'q', shift: 'Q' },
    { key: 'w', shift: 'W' },
    { key: 'e', shift: 'E' },
    { key: 'r', shift: 'R' },
    { key: 't', shift: 'T' },
    { key: 'y', shift: 'Y' },
    { key: 'u', shift: 'U' },
    { key: 'i', shift: 'I' },
    { key: 'o', shift: 'O' },
    { key: 'p', shift: 'P' },
    { key: '[', shift: '{' },
    { key: ']', shift: '}' },
    { key: '\\', shift: '|' }
  ],
  [
    { key: 'CapsLock', display: 'Caps Lock', class: 'key-caps' },
    { key: 'a', shift: 'A' },
    { key: 's', shift: 'S' },
    { key: 'd', shift: 'D' },
    { key: 'f', shift: 'F' },
    { key: 'g', shift: 'G' },
    { key: 'h', shift: 'H' },
    { key: 'j', shift: 'J' },
    { key: 'k', shift: 'K' },
    { key: 'l', shift: 'L' },
    { key: ';', shift: ':' },
    { key: "'", shift: '"' },
    { key: 'Enter', display: 'Enter', class: 'key-enter' }
  ],
  [
    { key: 'Shift', display: 'Shift', class: 'key-shift' },
    { key: 'z', shift: 'Z' },
    { key: 'x', shift: 'X' },
    { key: 'c', shift: 'C' },
    { key: 'v', shift: 'V' },
    { key: 'b', shift: 'B' },
    { key: 'n', shift: 'N' },
    { key: 'm', shift: 'M' },
    { key: ',', shift: '<' },
    { key: '.', shift: '>' },
    { key: '/', shift: '?' },
    { key: 'ShiftRight', display: 'Shift', class: 'key-shift' }
  ],
  [
    { key: 'Control', display: 'Ctrl', class: 'key-mod' },
    { key: 'Alt', display: 'Alt', class: 'key-mod' },
    { key: ' ', display: 'Space', class: 'key-space' },
    { key: 'AltRight', display: 'Alt', class: 'key-mod' },
    { key: 'ControlRight', display: 'Ctrl', class: 'key-mod' }
  ]
];

export default function VirtualKeyboard({
  targetChar = '',
  lastPressedKey = null,
  isLastError = false,
  soundEnabled = true,
  setSoundEnabled,
  soundType = 'blue',
  setSoundType
}) {
  const [activeKeys, setActiveKeys] = useState({});
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    soundSynth.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    soundSynth.switchType = soundType;
  }, [soundType]);

  // Track physical key presses for visual depression
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      setActiveKeys(prev => ({ ...prev, [k]: true, [e.code.toLowerCase()]: true }));
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      setActiveKeys(prev => ({ ...prev, [k]: false, [e.code.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const normalizedTarget = (targetChar === ' ' ? ' ' : targetChar.toLowerCase());

  return (
    <div className="virtual-keyboard-card">
      {KEYBOARD_LAYOUT.map((row, rIdx) => (
        <div key={rIdx} className="keyboard-row">
          {row.map((item, cIdx) => {
            const keyLower = item.key.toLowerCase();
            const isTarget = normalizedTarget === keyLower || (item.key === ' ' && normalizedTarget === ' ');
            const isPressed = Boolean(activeKeys[keyLower] || activeKeys[item.key.toLowerCase()]);
            const isErrorHighlight = isLastError && lastPressedKey && lastPressedKey.toLowerCase() === keyLower;

            let extraClasses = item.class || '';
            if (isTarget) extraClasses += ' target';
            if (isPressed) extraClasses += ' pressed';
            if (isErrorHighlight) extraClasses += ' wrong';

            return (
              <div
                key={cIdx}
                className={`key-cap ${extraClasses}`}
                title={item.shift ? `Shift: ${item.shift}` : item.display || item.key}
              >
                {item.display ? item.display : item.key.toUpperCase()}
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer controls matching Image 2 */}
      <div className="keyboard-footer-controls">
        <label className="switch-label-group">
          <input
            type="checkbox"
            checked={showShortcuts}
            onChange={(e) => setShowShortcuts(e.target.checked)}
          />
          <span>Show Keyboard Shortcuts</span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Switch:</span>
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value)}
              style={{
                fontSize: '0.78rem',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontWeight: 600,
                color: '#334155'
              }}
            >
              <option value="blue">Cherry Blue (Clicky)</option>
              <option value="brown">Cherry Brown (Tactile)</option>
              <option value="red">Cherry Red (Linear)</option>
              <option value="typewriter">Typewriter (Vintage)</option>
            </select>
          </div>

          <label className="switch-label-group" style={{ cursor: 'pointer' }}>
            {soundEnabled ? <Volume2 size={16} color="#2563eb" /> : <VolumeX size={16} color="#94a3b8" />}
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <span>Sound Effects</span>
          </label>
        </div>
      </div>
    </div>
  );
}
