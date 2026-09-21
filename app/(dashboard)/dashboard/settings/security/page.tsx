'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Camera, KeyRound, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Sparkles, UserCheck, Lock, Trash2,
  ScanLine, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { FaceRecognitionEngine } from '@/lib/face-recognition';
import { AdminFaceVerificationModal } from '@/components/auth/AdminFaceVerificationModal';

export default function SecuritySettingsPage() {
  const { user, setUser } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [pin, setPin] = useState<string>(user?.security_pin || '123456');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Test modal state
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  const isFaceRegistered = Boolean(user?.face_data || capturedDescriptor);
  const isEnabled = Boolean(user?.face_lock_enabled);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);

    const check = await FaceRecognitionEngine.checkCameraAvailability();
    if (!check.available) {
      setCameraError(check.error || 'Camera hardware is unavailable on this device.');
      setIsCameraActive(false);
      return;
    }

    // Delay slightly to ensure video DOM element is ready
    setTimeout(async () => {
      try {
        if (videoRef.current) {
          const stream = await FaceRecognitionEngine.startCamera(videoRef.current);
          streamRef.current = stream;
        } else {
          setCameraError('Video frame component initialization failed.');
          setIsCameraActive(false);
        }
      } catch (err: any) {
        setCameraError(err.message || 'Failed to start camera. Please grant browser camera permissions.');
        setIsCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    FaceRecognitionEngine.stopCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
    setIsCameraActive(false);
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current) return;
    try {
      const res = await FaceRecognitionEngine.captureFromVideo(videoRef.current);
      if (!res.faceDetected || res.descriptor.length === 0) {
        toast.error('No clear face detected. Please position your face inside the oval frame.');
        return;
      }

      setCapturedDescriptor(res.descriptor);
      setCapturedPreview(res.previewUrl);
      setConfidence(res.confidence);
      toast.success('Facial features successfully captured!');
      stopCamera();
    } catch (err: any) {
      toast.error(err.message || 'Capture failed.');
    }
  };

  const handleSaveEnrollment = async () => {
    if (!user) return;
    if (!capturedDescriptor && !user.face_data) {
      toast.error('Please capture your face before saving enrollment.');
      return;
    }
    if (pin.length < 2) {
      toast.error('Security PIN must be at least 2 digits.');
      return;
    }

    setIsSaving(true);
    try {
      const faceDataStr = capturedDescriptor ? JSON.stringify(capturedDescriptor) : user.face_data;
      const registeredAtStr = new Date().toISOString();

      // Update Supabase user profile
      const { error } = await supabase
        .from('users')
        .update({
          face_lock_enabled: true,
          face_data: faceDataStr,
          security_pin: pin,
          face_registered_at: registeredAtStr,
        })
        .eq('id', user.id);

      if (error) {
        console.warn('Supabase update warning:', error);
      }

      const updatedUser = {
        ...user,
        face_lock_enabled: true,
        face_data: faceDataStr,
        security_pin: pin,
        face_registered_at: registeredAtStr,
      };

      setUser(updatedUser as any);
      setCapturedDescriptor(null);
      setCapturedPreview(null);

      toast.success('Admin Face Lock Enabled & Enrolled Successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save security settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFaceLock = async (enabled: boolean) => {
    if (!user) return;
    if (enabled && !user.face_data && !capturedDescriptor) {
      toast.error('Please enroll your face before enabling Face Lock.');
      return;
    }

    setIsSaving(true);
    try {
      await supabase.from('users').update({ face_lock_enabled: enabled }).eq('id', user.id);

      setUser({ ...user, face_lock_enabled: enabled } as any);
      toast.success(`Face Lock is now ${enabled ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err: any) {
      toast.error('Failed to toggle Face Lock status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFaceData = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete your biometric face data and disable Face Lock?')) return;

    setIsSaving(true);
    try {
      await supabase
        .from('users')
        .update({
          face_lock_enabled: false,
          face_data: null,
          face_registered_at: null,
        })
        .eq('id', user.id);

      setUser({
        ...user,
        face_lock_enabled: false,
        face_data: null,
        face_registered_at: null,
      } as any);

      setCapturedDescriptor(null);
      setCapturedPreview(null);
      toast.success('Biometric face data deleted.');
    } catch (err: any) {
      toast.error('Failed to reset face data.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="text-primary" size={28} />
            Admin Security & Face Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage two-factor facial verification and backup recovery credentials for your Admin account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border ${
              isEnabled
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isEnabled ? 'bg-emerald-500 animate-ping' : 'bg-muted-foreground'
              }`}
            />
            Status: {isEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
      </div>

      {/* Main Status & Toggle Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Lock size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Admin Face Lock Verification</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEnabled
                  ? 'Active. Face scan is required after username & password during Admin login.'
                  : 'Disabled. Admin logs in with password only.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggleFaceLock(e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>

        {/* Enrollment / Registration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Left Column: Camera Enrollment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Camera size={18} className="text-primary" />
              1. Biometric Face Enrollment
            </h3>

            <div className="relative w-full aspect-video rounded-2xl bg-black border-2 border-border overflow-hidden flex items-center justify-center group shadow-inner">
              {/* Always mounted video element so videoRef is available */}
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isCameraActive && !capturedPreview ? 'block' : 'hidden'
                }`}
              />

              {/* Overlay Oval when camera active */}
              {isCameraActive && !capturedPreview && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-48 rounded-[50%] border-2 border-primary border-dashed animate-pulse" />
                </div>
              )}

              {/* Captured preview image */}
              {capturedPreview && (
                <div className="relative w-full h-full">
                  <img src={capturedPreview} alt="Captured Face" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <CheckCircle2 size={12} /> Captured ({confidence}% Confidence)
                  </div>
                </div>
              )}

              {/* Placeholder text before launch */}
              {!isCameraActive && !capturedPreview && (
                <div className="text-center p-6 space-y-3">
                  <Camera size={40} className="mx-auto text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Click below to launch your device camera and record your biometric facial features.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle size={14} /> {cameraError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {!isCameraActive && !capturedPreview && (
                <button
                  onClick={startCamera}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Camera size={15} /> Launch Camera Scan
                </button>
              )}

              {isCameraActive && (
                <>
                  <button
                    onClick={handleCaptureFace}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 size={15} /> Capture Facial Features
                  </button>
                  <button
                    onClick={stopCamera}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {capturedPreview && (
                <button
                  onClick={() => {
                    setCapturedPreview(null);
                    setCapturedDescriptor(null);
                    startCamera();
                  }}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Re-capture Face
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Backup PIN & Controls */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                2. Backup Security PIN
              </h3>

              <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border">
                <label className="text-xs font-medium text-foreground block">
                  Admin Security PIN (Hardware Fallback, 2 to 6 digits)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full text-center text-xl font-mono tracking-widest py-2 px-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Used to bypass face scan if camera is broken or in low-light environments.
                </p>
              </div>

              {/* Status Info Card */}
              <div className="bg-card border border-border p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Enrollment Record:</span>
                  <span className="font-medium text-foreground">
                    {user?.face_registered_at
                      ? new Date(user.face_registered_at).toLocaleDateString()
                      : isFaceRegistered
                      ? 'Captured (Unsaved)'
                      : 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Scope:</span>
                  <span className="font-semibold text-primary">Admin Account Only</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleSaveEnrollment}
                disabled={isSaving || (!capturedDescriptor && !user?.face_data)}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white gov-gradient hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                Save Security Settings & Enroll
              </button>

              <div className="flex gap-2 pt-1">
                {isFaceRegistered && (
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-input hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} className="text-primary" /> Test Verification Live
                  </button>
                )}

                {user?.face_data && (
                  <button
                    onClick={handleDeleteFaceData}
                    disabled={isSaving}
                    className="py-2 px-3 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Reset Face Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Test Verification Modal */}
      {showTestModal && user && (
        <AdminFaceVerificationModal
          isOpen={showTestModal}
          user={user}
          token="test-token"
          onSuccess={() => {
            setShowTestModal(false);
            toast.success('Test Verification Passed Perfectly!');
          }}
          onCancel={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
}
