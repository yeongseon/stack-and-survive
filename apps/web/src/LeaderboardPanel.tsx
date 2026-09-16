import { useState } from 'react';
import { validateNickname, type LeaderboardEntry, type RankResult } from './leaderboard';
import { globalLeaderboardConfigured, formatShareText, copyToClipboard } from './global-leaderboard';
import type { GlobalEntry, GlobalRankContext } from './global-leaderboard';
import './leaderboard.css';

export function LeaderboardPanel({ entries, currentRank, nickname, hasValidNickname, onNicknameChange, onSubmit, personalBest, qualified, globalAvailable, globalEntries, globalRankContext, globalLoading, hasPending, onRetry, challengeName, score, availability }: {
  entries: LeaderboardEntry[];
  currentRank: RankResult | null;
  nickname: string;
  hasValidNickname: boolean;
  onNicknameChange: (name: string) => void;
  onSubmit?: (nicknameOverride?: string) => void;
  personalBest: LeaderboardEntry | null;
  qualified: boolean;
  globalAvailable?: boolean;
  globalEntries?: GlobalEntry[] | null;
  globalRankContext?: GlobalRankContext | null;
  globalLoading?: boolean;
  hasPending?: boolean;
  onRetry?: () => void;
  challengeName?: string;
  score?: number;
  availability?: number;
}) {
  const [editing, setEditing] = useState(!hasValidNickname && qualified);
  const [draft, setDraft] = useState(nickname);
  const [copied, setCopied] = useState(false);
  const error = validateNickname(draft);
  const isGlobal = !!globalAvailable;
  const displayEntries = isGlobal && globalEntries ? globalEntries : entries.slice(0, 10);
  const currentRunId = currentRank?.entry.runId;
  const needsName = !hasValidNickname && qualified && !currentRank;

  // Rank display: prefer global rank context, fall back to local
  const displayRank = isGlobal && globalRankContext ? globalRankContext.rank : currentRank?.rank ?? null;
  const pointsToNext = isGlobal && globalRankContext ? globalRankContext.pointsToNextRank
    : currentRank?.pointsToNextRank ?? null;
  const tieBreak = isGlobal && globalRankContext ? globalRankContext.tieBreakReason
    : currentRank?.tieBreakReason ?? null;

  const handleShare = async () => {
    const text = formatShareText({
      score: score ?? currentRank?.entry.score ?? 0,
      availability: availability ?? currentRank?.entry.availability ?? 0,
      challenge: challengeName ?? 'Black Friday',
      rank: displayRank ?? undefined,
      globalRank: isGlobal && !!globalRankContext,
      nickname: nickname || undefined,
    });
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return <div className="leaderboard-panel" aria-label="Leaderboard">
    <h3 className="leaderboard-title">{isGlobal ? 'Global Leaderboard' : 'Leaderboard'}</h3>

    {needsName && !editing ? <div className="leaderboard-join">
      <p>Enter your name to join the leaderboard</p>
      <button type="button" onClick={() => { setDraft(''); setEditing(true); }}>Enter name</button>
    </div> : <div className="leaderboard-nickname">
      {editing ? <form onSubmit={e => { e.preventDefault(); if (!error) { onNicknameChange(draft.trim()); setEditing(false); onSubmit?.(draft.trim()); } }}>
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} maxLength={16} autoFocus aria-label="Nickname" placeholder="Enter nickname" />
        <button type="submit" disabled={!!error}>{needsName ? 'Join' : 'Save'}</button>
        {hasValidNickname && <button type="button" onClick={() => { setDraft(nickname); setEditing(false); }}>Cancel</button>}
        {error && draft.length > 0 && <small className="leaderboard-error">{error}</small>}
      </form> : <span>
        <strong>{nickname}</strong>
        <button type="button" className="leaderboard-edit" onClick={() => { setDraft(nickname); setEditing(true); }}>Edit for future runs</button>
      </span>}
    </div>}

    {displayRank && <div className="leaderboard-current">
      <span className="leaderboard-rank-badge">#{displayRank}</span>
      <span className="leaderboard-rank-score">{score ?? currentRank?.entry.score ?? 0} pts</span>
      {currentRank?.isPersonalBest && <span className="leaderboard-pb">NEW PERSONAL BEST</span>}
      {pointsToNext !== null && pointsToNext > 0 && <small className="leaderboard-gap">{pointsToNext} pts to #{displayRank - 1}</small>}
      {pointsToNext === 0 && tieBreak && <small className="leaderboard-gap">Same score · {tieBreak === 'availability' ? 'improve availability' : 'earlier attempt wins'}</small>}
      {displayRank === 1 && !pointsToNext && <small className="leaderboard-gap">You're on top. Beat your own score.</small>}
    </div>}

    {globalLoading && <p className="leaderboard-loading">Verifying with server...</p>}

    {personalBest && !currentRank?.isPersonalBest && <div className="leaderboard-best">
      Personal best: <strong>{personalBest.score}</strong> pts · {(personalBest.availability * 100).toFixed(1)}% availability
    </div>}

    {!qualified && <p className="leaderboard-unqualified">Complete the objective to enter the leaderboard.</p>}

    {displayEntries.length > 0 ? <ol className="leaderboard-list">
      {displayEntries.map((entry, i) => {
        const isYou = isGlobal && globalRankContext ? (i + 1 === globalRankContext.rank) : ('runId' in entry && entry.runId === currentRunId);
        return <li key={isGlobal ? `g-${i}` : (entry as LeaderboardEntry).runId} className={`leaderboard-entry${isYou ? ' leaderboard-you' : ''}`}>
          <span className="leaderboard-pos">#{i + 1}</span>
          <span className="leaderboard-name">{entry.nickname}</span>
          <span className="leaderboard-score">{entry.score}</span>
          <span className="leaderboard-avail">{(entry.availability * 100).toFixed(1)}%</span>
        </li>;
      })}
    </ol> : !needsName && !globalLoading && <p className="leaderboard-empty">{isGlobal ? 'No verified scores yet. Be the first.' : 'No entries yet. Be the first on the leaderboard.'}</p>}

    {hasPending && onRetry && <div className="leaderboard-retry">
      <small>{globalLeaderboardConfigured ? 'Previous score not yet verified.' : 'Saved submission preserved. Server verification is not configured for this build.'}</small>
      <button type="button" disabled={!globalLeaderboardConfigured} onClick={onRetry}>Retry server submission</button>
    </div>}
    <div className="leaderboard-footer">
      <small className="leaderboard-device">{isGlobal ? 'Verified server replay' : 'This device · Local scores'}</small>
      {qualified && <button type="button" className="leaderboard-share" onClick={handleShare}>{copied ? 'Copied!' : 'Copy result'}</button>}
    </div>
  </div>;
}
