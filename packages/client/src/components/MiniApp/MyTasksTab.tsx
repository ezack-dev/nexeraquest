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
        <div>
          <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">My Quests</h2>
          <p className="text-[13px] text-zinc-400">Your active and completed submissions</p>
        </div>
        <span className="text-xs text-zinc-400 font-mono tabular-nums">{tasks.length} Total</span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-zinc-500">Loading your quests...</div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center bg-[#13151B] border border-white/[0.07] rounded-2xl">
          <p className="text-sm font-medium text-zinc-300">No quests started yet</p>
          <p className="text-xs text-zinc-500 mt-1">Head to Discover to complete your first task.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const isApproved = task.status === 'APPROVED';
            const isSubmitted = task.status === 'SUBMITTED';
            const isStarted = task.status === 'STARTED';
            const isRejected = task.status === 'REJECTED';

            return (
              <div
                key={task.id}
                className="p-4 bg-[#13151B] border border-white/[0.07] rounded-2xl space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-zinc-400 capitalize">
                      {(task.campaign?.category || 'quest').toLowerCase()}
                    </span>
                    <h3 className="text-[14px] font-semibold text-white mt-0.5 leading-snug break-words">
                      {task.campaign?.title}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold font-mono tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+{task.campaign?.rewardPerAction.toFixed(2)} USDT</span>
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3390EC]/10 border border-[#3390EC]/25 text-[#3390EC] text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Review</span>
                      </span>
                    )}
                    {isStarted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In Progress</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {task.proof && (
                  <div className="p-3 bg-[#0E1015] rounded-xl border border-white/[0.06] text-xs text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                      <span>Submitted proof</span>
                      <span className="shrink-0 font-mono">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-zinc-300 font-mono truncate">{task.proof.payload}</p>
                    {task.proof.rejectionReason && (
                      <p className="text-rose-400 text-xs pt-0.5">Reason: {task.proof.rejectionReason}</p>
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
