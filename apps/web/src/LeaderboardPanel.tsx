import { useRef, useState } from 'react';
import { type LeaderboardEntry, type RankResult } from './leaderboard';
import { PlayerNameControl } from './PlayerNameControl';
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
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const isGlobal = !!globalAvailable;
  const displayEntries = isGlobal && globalEntries ? globalEntries : entries.slice(0, 10);
  const currentRunId = currentRank?.entry.runId;
  const needsName = qualified && !currentRank;
  const submittedName = currentRank?.entry.nickname;
  const focusResult = () => requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));

  // Rank display: prefer global rank context, fall back to local
  const displayRank = isGlobal ? globalRankContext?.rank ?? null : currentRank?.rank ?? null;
  const pointsToNext = isGlobal ? globalRankContext?.pointsToNextRank ?? null : currentRank?.pointsToNextRank ?? null;
  const tieBreak = isGlobal ? globalRankContext?.tieBreakReason ?? null : currentRank?.tieBreakReason ?? null;

  const handleShare = async () => {
    const text = formatShareText({
      score: score ?? currentRank?.entry.score ?? 0,
      availability: availability ?? currentRank?.entry.availability ?? 0,
      challenge: challengeName ?? 'Black Friday',
      rank: displayRank ?? undefined,
      globalRank: isGlobal && !!globalRankContext,
      nickname: submittedName || nickname || undefined,
    });
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return <div className="leaderboard-panel" aria-label="Leaderboard">
    <h3 ref={heading} tabIndex={-1} className="leaderboard-title">{isGlobal ? 'Global Leaderboard' : 'Local Leaderboard'}</h3>

    {qualified && <div className="leaderboard-identity">
      {!currentRank ? <><h4>Post your score</h4><p className="leaderboard-post-score">Your score <strong>{(score ?? 0).toLocaleString('en-US')}</strong></p>
        <PlayerNameControl key={nickname} nickname={nickname} join onSave={name => onSubmit?.(name)} afterSave={focusResult} />
        <small>{hasValidNickname ? 'Change for this and future runs. ' : ''}Join saves your name and posts this score{globalLeaderboardConfigured ? ' for server verification' : ' on this device'}.</small>
      </> : <><p className="leaderboard-submitted-name">{globalLoading ? 'Submitting as' : 'Score recorded as'} <strong>{submittedName}</strong></p>
        <PlayerNameControl nickname={nickname} onSave={onNicknameChange} afterSave={focusResult} changeLabel="Change for future runs" />
      </>}
    </div>}
    {!qualified && hasValidNickname && <PlayerNameControl nickname={nickname} onSave={onNicknameChange} afterSave={focusResult} changeLabel="Change for future runs" />}

    {displayRank && <div className="leaderboard-current">
      <span className="leaderboard-rank-badge">#{displayRank}</span>
      <span className="leaderboard-rank-score">{score ?? currentRank?.entry.score ?? 0} pts</span>
      {currentRank?.isPersonalBest && !isGlobal && <span className="leaderboard-pb">NEW PERSONAL BEST</span>}
      {pointsToNext !== null && pointsToNext > 0 && <small className="leaderboard-gap">{pointsToNext} pts to #{displayRank - 1}</small>}
      {pointsToNext === 0 && tieBreak && <small className="leaderboard-gap">Same score · {tieBreak === 'availability' ? 'improve availability' : 'earlier attempt wins'}</small>}
      {displayRank === 1 && !pointsToNext && <small className="leaderboard-gap">You're on top. Beat your own score.</small>}
    </div>}

    {globalLoading && <output className="leaderboard-loading">Verifying with server...</output>}

    {personalBest && !currentRank?.isPersonalBest && <div className="leaderboard-best">
      Personal best: <strong>{personalBest.score}</strong> pts · {(personalBest.availability * 100).toFixed(1)}% availability
    </div>}

    {!qualified && <p className="leaderboard-unqualified">Complete the objective to enter the leaderboard.</p>}

    {displayEntries.length > 0 ? <ol className="leaderboard-list">
      {displayEntries.map((entry, i) => {
        const isYou = isGlobal && globalRankContext ? (i + 1 === globalRankContext.rank) : ('runId' in entry && entry.runId === currentRunId);
        return <li key={isGlobal ? `g-${i}` : (entry as LeaderboardEntry).runId} className={`leaderboard-entry${isYou ? ' leaderboard-you' : ''}`}>
          <span className="leaderboard-pos">#{i + 1}</span>
          <span className="leaderboard-name">{entry.nickname}{isYou && <small className="leaderboard-you-label"> ← YOU</small>}</span>
          <span className="leaderboard-score">{entry.score.toLocaleString('en-US')}</span>
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
