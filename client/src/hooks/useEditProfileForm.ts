import { ChangeEvent, FormEvent, useState, useRef } from 'react';
import useLoginContext from './useLoginContext.ts';
import useAuth from './useAuth.ts';
import { updateUser, uploadProfileImage } from '../services/userService.ts';
import { UserUpdateRequest } from '@strategy-town/shared';

/**
 * Custom hook to manage profile form logic
 * @returns an object containing
 *  - Form values `display`, `password`, and `confirm`
 *  - Form setters `setDisplay`, `setPassword`, and `setConfirm`
 *  - Possibly-null error message `err`
 *  - Submission handler `handleSubmit`
 */
export default function useEditProfileForm() {
  const { user, reset } = useLoginContext();
  const [display, setDisplay] = useState(user.display);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<null | string>(null);
  const [colorFilter, setColorFilter] = useState(user.preferences.colorblind);
  const [imageUrl, setImageUrl] = useState(user.image_url);
  const [bio, setBio] = useState(user.bio);
  const [uploading, setUploading] = useState(false);

  // New state for file handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auth = useAuth();

  /**
   * Handles file selection - just preview, don't upload yet
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErr('Image must be smaller than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErr('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL (doesn't upload to Cloudinary!)
    const preview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(preview);
    setErr(null);
  };

  /**
   * Resets image to original state
   */
  const resetImageUrl = () => {
    setImageUrl(user.image_url);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Clean up memory
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      user.display === display &&
      password === confirm &&
      password === '' &&
      colorFilter === user.preferences.colorblind &&
      imageUrl === user.image_url &&
      bio === user.bio &&
      !selectedFile
    ) {
      setErr('No changes to submit');
      return;
    }

    if (display.trim() !== display) {
      setErr("Display names can't begin or end with whitespace");
      return;
    }

    if (display.trim() === '') {
      setErr('Please enter a display name');
      return;
    }

    if (password.trim() !== password) {
      setErr("Passwords can't begin or end with whitespace");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords don't match");
      return;
    }

    // Upload to Cloudinary only if there's a new file
    let finalImageUrl = imageUrl;
    if (selectedFile) {
      setUploading(true);
      const uploadResponse = await uploadProfileImage(auth, selectedFile);
      setUploading(false);

      if ('error' in uploadResponse) {
        setErr(uploadResponse.error);
        return;
      }

      finalImageUrl = uploadResponse.imageUrl;
    }

    const updates: UserUpdateRequest = {};
    if (display !== user.display) updates.display = display;
    if (password !== '') updates.password = password;
    if (colorFilter !== user.preferences.colorblind) {
      updates.preferences = { colorblind: colorFilter };
    }
    if (finalImageUrl !== user.image_url) updates.image_url = finalImageUrl;
    if (bio !== user.bio) updates.bio = bio;

    const response = await updateUser(auth, updates);
    if ('error' in response) {
      setErr(response.error);
      return;
    }

    // Clean up preview URL before reset
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // We need to do this — or do something else that resets the login context
    reset();
  };

  // Get the display URL (preview or current)
  const displayImageUrl = previewUrl || imageUrl;

  return {
    display,
    setDisplay,
    password,
    setPassword,
    confirm,
    setConfirm,
    err,
    handleSubmit,
    colorFilter,
    setColorFilter,
    bio,
    setBio,
    uploading,
    handleFileSelect,
    displayImageUrl,
    selectedFile,
    resetImageUrl,
    fileInputRef,
  };
}
