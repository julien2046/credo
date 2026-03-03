import type { StorefrontTheme } from '@credo/shared';

export const clientBTheme: StorefrontTheme = {
  id: 'client-b',
  name: 'Commerce Nordique',
  fontFamily: "'Gill Sans', 'Trebuchet MS', sans-serif",
  accentFontFamily: "Georgia, 'Times New Roman', serif",
  background:
    'linear-gradient(145deg, rgba(230,244,244,1) 0%, rgba(205,227,222,1) 45%, rgba(184,214,205,1) 100%)',
  surface: 'rgba(246, 252, 251, 0.9)',
  textColor: '#16322d',
  mutedTextColor: '#46655f',
  accentColor: '#1c7a63',
  accentContrastColor: '#eefaf6',
  borderColor: 'rgba(28, 122, 99, 0.2)',
};

export function CredoClientB() {
  return (
    <div>
      <h1>{clientBTheme.name}</h1>
    </div>
  );
}

export default CredoClientB;
