'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Coins,
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestExecutionModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: () => void;
}

export function QuestExecutionModal({
  campaign,
  isOpen,
  onClose,
  onRewardClaimed,
}: QuestExecutionModalProps) {
  const [taskInstance, setTaskInstance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(600);

  const primaryTask = campaign?.tasks?.[0];

  useEffect(() => {
    if (!isOpen) {
      setTaskInstance(null);
      setResult(null);
      setError(null);
      setProofText('');
      setProofUrl('');
      setProofFile(null);
      setUploadProgress('');
    }
  }, [isOpen]);

  // Countdown timer for active task
  useEffect(() => {
    if (taskInstance && taskInstance.status === 'IN_PROGRESS' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [taskInstance, timeLeft]);

  if (!isOpen || !campaign) return null;

  const handleStartQuest = async () => {
    if (!primaryTask) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/tasks/${primaryTask.id}/start`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Could not start quest');
      }

      setTaskInstance(data.data);
      if (data.data.status === 'APPROVED') {
        setResult({
          verified: true,
          status: 'APPROVED',
          rewardAmount: campaign.rewardPerAction,
          message: 'Task already completed!',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = (f: File | undefined) => {
    if (!f) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setError(`File type ${f.type || 'unknown'} not accepted. Use PNG, JPEG, WebP, MP4, or PDF.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large — max 10 MB.');
      return;
    }
    setError(null);
    setProofFile(f);
  };

  const handleVerify = async () => {
    if (!taskInstance) return;
    setVerifying(true);
    setError(null);

    try {
      // If task requires proof, submit proof first (file upload or URL/text)
      if (primaryTask.verificationAdapter === 'CONTENT_REVIEW') {
        let fileMeta: any = {};
        if (proofFile) {
          setUploading(true);
          setUploadProgress('Uploading proof…');
          const form = new FormData();
          form.append('file', proofFile);
          form.append('taskInstanceId', taskInstance.id);
          const upRes = await fetch('/api/v1/proofs/upload', { method: 'POST', body: form });
          const upData = await upRes.json();
          setUploading(false);
          if (!upRes.ok || !upData.success) {
            throw new Error(upData.error?.message || 'Proof upload failed');
          }
          fileMeta = {
            fileUrl: upData.data.fileUrl,
            fileSize: upData.data.fileSize,
            mimeType: upData.data.mimeType,
            checksum: upData.data.checksum,
          };
          setUploadProgress('Upload complete.');
        }
        const submitRes = await fetch(`/api/v1/tasks/${taskInstance.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proofType: proofFile ? 'IMAGE_UPLOAD' : proofUrl ? 'URL' : 'TEXT',
            content: proofUrl || proofText || (proofFile ? proofFile.name : 'Completed testnet workflow verified by contributor.'),
            ...fileMeta,
          }),
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok || !submitData.success) {
          throw new Error(submitData.error?.message || 'Proof submission failed');
        }
      }

      // Execute Verification & Reward settlement
      const verifyRes = await fetch(`/api/v1/tasks/${taskInstance.id}/verify`, {
        method: 'POST',
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error?.message || 'Verification execution failed');
      }

      setResult(verifyData.data);

      if (verifyData.data.verified) {
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        onRewardClaimed();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-lg bg-obsidian-900 border border-white/[0.1] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={campaign.project?.logoUrl || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128'}
            alt={campaign.project?.name}
            className="w-11 h-11 rounded-xl object-cover border border-white/[0.1]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">{campaign.project?.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-quest-cyan/15 text-quest-cyan text-[10px] font-bold">
                VERIFIED
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">{campaign.title}</h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* State: Quest Completed Result */}
        {result?.verified ? (
          <div className="text-center py-6 animate-success-pop">
            <div className="w-16 h-16 rounded-full bg-quest-emerald/10 border border-quest-emerald/20 text-quest-emerald flex items-center justify-center mx-auto mb-3 shadow-lg shadow-quest-emerald/20 animate-glow-subtle">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-quest-emerald/20 text-quest-emerald text-xs font-bold uppercase tracking-wider">
              Quest Verified & Approved
            </span>
            <h3 className="text-2xl font-black text-white mt-3">
              +{result.rewardAmount} {campaign.currency}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Reward credited to your internal available balance with immutable transaction reference.
            </p>

            <div className="p-3 rounded-xl bg-obsidian-850 border border-white/[0.08] text-xs space-y-1.5 mb-6 text-left">
              <div className="flex justify-between text-slate-400">
                <span>New Available Balance</span>
                <span className="text-quest-emerald font-bold">{result.newBalance?.toFixed(2) || 'Credited'} {campaign.currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trust Score Impact</span>
                <span className="text-quest-cyan font-bold">+2 Reputation Points</span>
              </div>
              {result.transactionId && (
                <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                  <span>Ledger TX</span>
                  <span className="text-slate-300">{result.transactionId}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-quest-violet text-white font-bold text-xs hover:bg-quest-violet/90 transition-colors"
            >
              Done & Return to Feed
            </button>
          </div>
        ) : result && !result.verified ? (
          /* State: Not Verified / Rejection Result */
          <div className="text-center py-5">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Verification Check Not Passed</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-4">
              {result.reason || 'Verification engine could not detect active completion.'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 py-2.5 rounded-xl bg-quest-violet text-white font-bold text-xs hover:bg-quest-violet/90 transition-colors flex items-center justify-center gap-1.5"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                <span>Retry Verification</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : !taskInstance ? (
          /* State: Before Starting Quest */
          <div>
            <div className="p-3.5 rounded-xl bg-obsidian-850 border border-white/[0.06] mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Guaranteed Reward</span>
                <span className="text-quest-emerald font-bold text-sm">
                  {campaign.rewardPerAction} {campaign.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Slots Remaining</span>
                <span className="text-white font-semibold">
                  {campaign.targetParticipants - campaign.completedParticipants} of {campaign.targetParticipants}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Verification Model</span>
                <span className="text-quest-cyan font-semibold">
                  {primaryTask?.verificationAdapter || 'Automated Engine'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-300 mb-1">About Campaign</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{campaign.description}</p>
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-300 mb-1">Task Requirements</h4>
              <div className="p-3 rounded-xl bg-obsidian-850/60 border border-white/[0.06] text-xs text-slate-300 space-y-1.5">
                <p>{primaryTask?.instructions || 'Join the official community and verify.'}</p>
                <p className="text-[11px] text-slate-500">
                  {primaryTask?.proofRequirements || 'Automated Telegram Bot verification.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleStartQuest}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-quest-violet to-quest-cyan text-white font-bold text-sm shadow-lg shadow-quest-violet/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing Quest...</span>
                </>
              ) : (
                <>
                  <span>Start Quest</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* State: In Progress Quest Execution */
          <div>
            {/* Active Progress Bar */}
            <div className="flex items-center justify-between text-xs mb-3 p-2.5 rounded-xl bg-obsidian-850 border border-white/[0.06]">
              <div className="flex items-center gap-2 text-quest-cyan font-semibold">
                <Clock className="w-4 h-4" />
                <span>Expires in: {formatTimer(timeLeft)}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-quest-amber/15 text-quest-amber text-[10px] font-bold">
                IN PROGRESS
              </span>
            </div>

            {/* Step 1: Open Destination Action */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-quest-violet flex items-center justify-center text-[11px]">
                  1
                </span>
                <span>Open Task Destination</span>
              </div>
              <a
                href={primaryTask?.destinationUrl || 'https://t.me/tondefi_announcements'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 border border-white/[0.08] text-xs font-semibold text-quest-cyan flex items-center justify-between transition-colors"
              >
                <span>{primaryTask?.title || 'Open Destination Link'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Step 2: Proof Submission if Content Review */}
            {primaryTask?.verificationAdapter === 'CONTENT_REVIEW' && (
              <div className="mb-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-quest-violet flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span>Submit Task Proof</span>
                </div>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="Paste URL or explorer hash..."
                  className="w-full min-h-[44px] bg-obsidian-850 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mb-2 focus:outline-none focus:border-quest-violet"
                />
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Or enter structured review comments..."
                  rows={2}
                  className="w-full bg-obsidian-850 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-quest-violet mb-2"
                />
                <label className="pressable flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl border border-dashed border-white/[0.15] text-xs text-slate-300 cursor-pointer hover:border-quest-violet/50 transition-colors px-3 py-3 text-center">
                  <Send className="w-4 h-4 shrink-0 text-quest-cyan" />
                  <span className="truncate">{proofFile ? proofFile.name : 'Attach screenshot / video / PDF (max 10 MB)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFilePick(e.target.files?.[0])}
                  />
                </label>
                {proofFile && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 animate-fade-in">
                    <span className="font-mono truncate">{(proofFile.size / 1024).toFixed(0)} KB · {proofFile.type}</span>
                    <button onClick={() => setProofFile(null)} className="text-rose-400 font-semibold px-2 py-1">Remove</button>
                  </div>
                )}
                {uploadProgress && <p className="mt-1 text-[11px] text-quest-cyan">{uploadProgress}</p>}
              </div>
            )}

            {/* Step 3: Trigger Verification */}
            <div className="mt-5">
              <button
                onClick={handleVerify}
                disabled={verifying || uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-quest-emerald to-teal-500 text-obsidian-950 font-bold text-sm shadow-lg shadow-quest-emerald/20 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Server Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Claim Reward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
