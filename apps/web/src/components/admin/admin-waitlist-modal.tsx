'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/auth-context';
import {
  X,
  ShieldCheck,
  Search,
  Check,
  Copy,
  Sparkles,
  Users,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export interface AdminWaitlistEntry {
  id: string;
  email: string;
  cityName?: string;
  userType: string;
  source: string;
  isInvited: boolean;
  createdAt: string;
  inviteCode?: string;
  currentUses?: number;
  maxUses?: number;
}

interface AdminWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminWaitlistModal({ isOpen, onClose }: AdminWaitlistModalProps) {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    code?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchEntries = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/waitlist/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to fetch waitlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchEntries();
      setNotification(null);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleGrantInvite = async (targetEmail: string) => {
    if (!token || !targetEmail.trim()) return;
    const emailToGrant = targetEmail.trim().toLowerCase();
    setActionLoadingEmail(emailToGrant);
    setNotification(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/invite/grant-waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailToGrant }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({
          type: 'success',
          message: `Alpha invite code successfully generated for ${emailToGrant}!`,
          code: data.inviteCode,
        });

        // Update list in state
        setEntries((prev) =>
          prev.map((item) =>
            item.email.toLowerCase() === emailToGrant
              ? {
                  ...item,
                  isInvited: true,
                  inviteCode: data.inviteCode,
                  currentUses: 0,
                  maxUses: 1,
                }
              : item
          )
        );

        if (quickEmail.toLowerCase() === emailToGrant) {
          setQuickEmail('');
        }
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to grant alpha invite code',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Network error promoting waitlisted subscriber',
      });
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    return (
      entry.email.toLowerCase().includes(query) ||
      (entry.cityName && entry.cityName.toLowerCase().includes(query)) ||
      entry.userType.toLowerCase().includes(query) ||
      (entry.inviteCode && entry.inviteCode.toLowerCase().includes(query))
    );
  });

  const totalCount = entries.length;
  const invitedCount = entries.filter((e) => e.isInvited).length;
  const pendingCount = totalCount - invitedCount;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-8 flex min-h-screen items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl my-auto rounded-2xl bg-[#111116] border border-[#2b2b36] shadow-2xl p-6 md:p-8 text-gray-100 flex flex-col max-h-[85vh] shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#22222c]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 id="admin-modal-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Alpha Waitlist Console</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Platform Admin
                </span>
              </h2>
              <p className="text-xs text-gray-400">Promote waitlist subscribers to alpha access with dedicated codes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin console"
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#1e1e28] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Stats Pill Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-[#171720] border border-[#262634] text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Waitlist</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#171720] border border-emerald-900/40 text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Promoted (Alpha)</p>
            <p className="text-xl font-extrabold text-emerald-300 mt-0.5">{invitedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#171720] border border-amber-900/40 text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pending</p>
            <p className="text-xl font-extrabold text-amber-300 mt-0.5">{pendingCount}</p>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-3 mb-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className={notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'} />
              <span>{notification.message}</span>
            </div>
            {notification.code && (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-black/50 text-white border border-emerald-500/40">
                  {notification.code}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(notification.code!)}
                  className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode === notification.code ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCode === notification.code ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Promote Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGrantInvite(quickEmail);
          }}
          className="flex gap-2 mb-4"
        >
          <input
            type="email"
            placeholder="Promote any waitlisted email address directly..."
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#0c0c10] border border-[#272734] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50"
          />
          <button
            type="submit"
            disabled={!quickEmail || actionLoadingEmail === quickEmail.trim().toLowerCase()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {actionLoadingEmail === quickEmail.trim().toLowerCase() ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>Grant Code</span>
          </button>
        </form>

        {/* Search & Refresh Bar */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by email, city, or user type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0c0c10] border border-[#22222b] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/60"
            />
          </div>
          <button
            type="button"
            onClick={fetchEntries}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#171720] hover:bg-[#20202c] border border-[#272736] text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh subscribers"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Subscribers Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[#22222b] bg-[#0c0c10]">
          {isLoading && entries.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin text-amber-400" />
              <span>Loading waitlist subscribers...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No waitlist subscribers matching "{searchQuery}"
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1f1f26] bg-[#14141c] text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Subscriber</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-right">Alpha Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a22]">
                {filteredEntries.map((entry) => {
                  const isBusy = actionLoadingEmail === entry.email.toLowerCase();
                  return (
                    <tr key={entry.id} className="hover:bg-[#13131a] transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">
                        <p>{entry.email}</p>
                        <p className="text-[10px] text-gray-500">
                          Joined {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded bg-[#1a1a24] border border-[#292938] text-[10px] text-gray-300">
                          {entry.userType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">
                        {entry.cityName || 'Unknown'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {entry.isInvited && entry.inviteCode ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                              {entry.inviteCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(entry.inviteCode!)}
                              title="Copy code"
                              className="p-1 rounded bg-[#20202c] hover:bg-[#2b2b3b] text-gray-300 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedCode === entry.inviteCode ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGrantInvite(entry.email)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-bold text-[11px] transition-colors cursor-pointer shadow-sm shadow-sky-500/20"
                          >
                            {isBusy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            <span>Grant Alpha</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : modalContent;
}
