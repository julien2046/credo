import type { StorefrontTheme } from '@credo/shared';

export const clientATheme: StorefrontTheme = {
  id: 'client-a',
  name: 'Atelier Editorial',
  fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
  accentFontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
  background:
    'linear-gradient(135deg, rgba(247,239,226,1) 0%, rgba(230,214,192,1) 48%, rgba(215,192,161,1) 100%)',
  surface: 'rgba(255, 252, 247, 0.9)',
  textColor: '#2b1d14',
  mutedTextColor: '#6c5547',
  accentColor: '#8d4f2b',
  accentContrastColor: '#fff8f0',
  borderColor: 'rgba(141, 79, 43, 0.2)',
};

export function CredoClientA() {
  return (
    <div>
      <h1>{clientATheme.name}</h1>
    </div>
  );
}

export default CredoClientA;
