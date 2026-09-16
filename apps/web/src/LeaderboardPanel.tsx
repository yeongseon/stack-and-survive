import { useState } from 'react';
import { validateNickname, type LeaderboardEntry, type RankResult } from './leaderboard';
import './leaderboard.css';

export function LeaderboardPanel({ entries, currentRank, nickname, hasValidNickname, onNicknameChange, onSubmit, personalBest, qualified }: {
  entries: LeaderboardEntry[];
  currentRank: RankResult | null;
  nickname: string;
  hasValidNickname: boolean;
  onNicknameChange: (name: string) => void;
  onSubmit?: (nicknameOverride?: string) => void;
  personalBest: LeaderboardEntry | null;
  qualified: boolean;
}) {
  const [editing, setEditing] = useState(!hasValidNickname && qualified);
  const [draft, setDraft] = useState(nickname);
  const error = validateNickname(draft);
  const top10 = entries.slice(0, 10);
  const currentRunId = currentRank?.entry.runId;
  const needsName = !hasValidNickname && qualified && !currentRank;

  return <div className="leaderboard-panel" aria-label="Leaderboard">
    <h3 className="leaderboard-title">Leaderboard</h3>

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

    {currentRank && <div className="leaderboard-current">
      <span className="leaderboard-rank-badge">#{currentRank.rank}</span>
      <span className="leaderboard-rank-score">{currentRank.entry.score} pts</span>
      {currentRank.isPersonalBest && <span className="leaderboard-pb">NEW PERSONAL BEST</span>}
      {currentRank.pointsToNextRank !== null && currentRank.pointsToNextRank > 0 && <small className="leaderboard-gap">{currentRank.pointsToNextRank} pts to #{currentRank.rank - 1}</small>}
      {currentRank.tieBreakReason && <small className="leaderboard-gap">Tie-break: {currentRank.tieBreakReason === 'availability' ? 'higher availability wins' : 'earlier attempt wins'}</small>}
    </div>}

    {personalBest && !currentRank?.isPersonalBest && <div className="leaderboard-best">
      Personal best: <strong>{personalBest.score}</strong> pts · {(personalBest.availability * 100).toFixed(1)}% availability
    </div>}

    {!qualified && <p className="leaderboard-unqualified">Complete the objective to enter the leaderboard.</p>}

    {top10.length > 0 ? <ol className="leaderboard-list">
      {top10.map((entry, i) => <li key={entry.runId} className={`leaderboard-entry${entry.runId === currentRunId ? ' leaderboard-you' : ''}`}>
        <span className="leaderboard-pos">#{i + 1}</span>
        <span className="leaderboard-name">{entry.nickname}</span>
        <span className="leaderboard-score">{entry.score}</span>
        <span className="leaderboard-avail">{(entry.availability * 100).toFixed(1)}%</span>
      </li>)}
    </ol> : !needsName && <p className="leaderboard-empty">No entries yet. Be the first on the leaderboard.</p>}

    <small className="leaderboard-device">This device · Local scores</small>
  </div>;
}
