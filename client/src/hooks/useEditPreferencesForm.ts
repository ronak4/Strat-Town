import { FormEvent, useState } from 'react';
import useLoginContext from './useLoginContext.ts';
import useAuth from './useAuth.ts';
import { updateUser } from '../services/userService.ts';
import { UserUpdateRequest, UserPreferences } from '@strategy-town/shared';

/**
 * Custom hook to manage preferences form logic
 * @returns an object containing form values, setters, error message, and submission handler
 */
export default function useEditPreferencesForm() {
  const { user, reset } = useLoginContext();
  const [colorblind, setColorblind] = useState(user.preferences.colorblind);
  const [theme, setTheme] = useState(user.preferences.theme);
  const [fontSize, setFontSize] = useState(user.preferences.fontSize);
  const [fontFamily, setFontFamily] = useState(user.preferences.fontFamily);
  const [err, setErr] = useState<null | string>(null);
  const auth = useAuth();

  /**
   * Handles submission of the preferences form
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if no changes were made
    if (
      user.preferences.colorblind === colorblind &&
      user.preferences.theme === theme &&
      user.preferences.fontSize === fontSize &&
      user.preferences.fontFamily === fontFamily
    ) {
      setErr('No changes to submit');
      return;
    }

    const preferences: UserPreferences = {
      colorblind,
      theme,
      fontSize,
      fontFamily,
    };

    const updates: UserUpdateRequest = { preferences };
    const response = await updateUser(auth, updates);
    if ('error' in response) {
      setErr(response.error);
      return;
    }

    reset();
  };

  /**
   * Reset all preferences to current saved values
   */
  const handleReset = () => {
    setColorblind(user.preferences.colorblind);
    setTheme(user.preferences.theme);
    setFontSize(user.preferences.fontSize);
    setFontFamily(user.preferences.fontFamily);
    setErr(null);
  };

  return {
    colorblind,
    setColorblind,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    err,
    handleSubmit,
    handleReset,
  };
}
