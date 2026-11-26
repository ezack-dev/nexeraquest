import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.js';
import { TaskInstance } from '../../types.js';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const MyTasksTab: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getUserTasks(user.id);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-100 tracking-[-0.01em]">My Quests & Submissions</h2>
        <span className="text-xs text-zinc-400 font-mono tabular-nums">{tasks.length} Total</span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">
          Loading your task history...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center bg-[#111216] border border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400">You have not joined any quests yet.</p>
          <p className="text-[11px] text-[#2AABEE] mt-1">Browse the Discover tab to start earning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isApproved = task.status === 'APPROVED';
            const isSubmitted = task.status === 'SUBMITTED';
            const isStarted = task.status === 'STARTED';
            const isRejected = task.status === 'REJECTED';

            return (
              <div
                key={task.id}
                className="p-4 bg-[#111216] border border-zinc-800/90 rounded-2xl space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {task.campaign?.category || 'QUEST'}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-100 mt-1.5 leading-snug break-words">
                      {task.campaign?.title}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{task.campaign?.rewardPerAction.toFixed(2)} USDT</span>
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2AABEE]/10 border border-[#2AABEE]/25 text-[#2AABEE] text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Review</span>
                      </span>
                    )}
                    {isStarted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Proof Details */}
                {task.proof && (
                  <div className="p-3 bg-[#0B0C0F] rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono">
                      <span className="truncate">Proof ({task.proof.proofType})</span>
                      <span className="shrink-0">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-mono truncate">{task.proof.payload}</p>
                    {task.proof.rejectionReason && (
                      <p className="text-rose-400 text-[10px]">Reason: {task.proof.rejectionReason}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
