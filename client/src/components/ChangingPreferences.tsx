import { ReactNode, useEffect } from 'react';
import useLoginContext from '../hooks/useLoginContext.ts';

const filters = (
  <svg xmlns='http://www.w3.org/2000/svg' style={{ display: 'none' }}>
    <filter id='protanopia'>
      <feColorMatrix
        in='SourceGraphic'
        type='matrix'
        values='0.567,0.433,0,0,0
              0.558,0.442,0,0,0
              0,0.242,0.758,0,0
              0,0,0,1,0'
      />
    </filter>
    <filter id='deuteranopia'>
      <feColorMatrix
        in='SourceGraphic'
        type='matrix'
        values='0.625,0.375,0,0,0
              0.7,0.3,0,0,0
              0,0.3,0.7,0,0
              0,0,0,1,0'
      />
    </filter>
    <filter id='tritanopia'>
      <feColorMatrix
        in='SourceGraphic'
        type='matrix'
        values='0.95,0.05,0,0,0
              0,0.433,0.567,0,0
              0,0.475,0.525,0,0
              0,0,0,1,0'
      />
    </filter>
  </svg>
);

interface ObjectedAffected {
  children: ReactNode;
}

export function ApplyPreferences({ children }: ObjectedAffected) {
  const { user } = useLoginContext();

  // Colorblindness filter
  useEffect(() => {
    if (user.preferences.colorblind !== 'none') {
      document.documentElement.style.filter = `url('#${user.preferences.colorblind}')`;
    } else {
      document.documentElement.style.filter = 'none';
    }
  }, [user?.preferences]);

  // Font size
  useEffect(() => {
    const savedFontSize = user.preferences.fontSize;
    if (savedFontSize) {
      document.documentElement.setAttribute('data-font-size', savedFontSize);
    }
  }, [user?.preferences.fontSize]);

  // Themes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', user.preferences.theme);
  }, [user.preferences.theme]);

  // Font Family
  useEffect(() => {
    const savedFontFamily = user.preferences.fontFamily;
    if (savedFontFamily) {
      document.documentElement.setAttribute('data-font-family', savedFontFamily);
    }
  }, [user?.preferences.fontFamily]);

  return (
    <>
      {filters}
      {children}
    </>
  );
}
