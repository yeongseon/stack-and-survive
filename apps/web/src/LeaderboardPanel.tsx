import { useState } from 'react';
import { validateNickname, type LeaderboardEntry, type RankResult } from './leaderboard';
import './leaderboard.css';

export function LeaderboardPanel({ entries, currentRank, nickname, onNicknameChange, personalBest }: {
  entries: LeaderboardEntry[];
  currentRank: RankResult | null;
  nickname: string;
  onNicknameChange: (name: string) => void;
  personalBest: LeaderboardEntry | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const error = validateNickname(draft);
  const top10 = entries.slice(0, 10);
  const currentRunId = currentRank?.entry.runId;

  return <div className="leaderboard-panel" aria-label="Leaderboard">
    <h3 className="leaderboard-title">Leaderboard</h3>

    <div className="leaderboard-nickname">
      {editing ? <form onSubmit={e => { e.preventDefault(); if (!error) { onNicknameChange(draft); setEditing(false); } }}>
        <input type="text" value={draft} onChange={e => setDraft(e.target.value)} maxLength={16} autoFocus aria-label="Nickname" placeholder="Enter nickname" />
        <button type="submit" disabled={!!error}>Save</button>
        <button type="button" onClick={() => { setDraft(nickname); setEditing(false); }}>Cancel</button>
        {error && <small className="leaderboard-error">{error}</small>}
      </form> : <span>
        <strong>{nickname || 'Anonymous'}</strong>
        <button type="button" className="leaderboard-edit" onClick={() => { setDraft(nickname); setEditing(true); }}>Edit name</button>
      </span>}
    </div>

    {currentRank && <div className="leaderboard-current">
      <span className="leaderboard-rank-badge">#{currentRank.rank}</span>
      <span className="leaderboard-rank-score">{currentRank.entry.score} pts</span>
      {currentRank.isPersonalBest && <span className="leaderboard-pb">NEW PERSONAL BEST</span>}
      {currentRank.pointsToNextRank !== null && currentRank.pointsToNextRank > 0 && <small className="leaderboard-gap">{currentRank.pointsToNextRank} pts to #{currentRank.rank - 1}</small>}
    </div>}

    {personalBest && !currentRank?.isPersonalBest && <div className="leaderboard-best">
      Personal best: <strong>{personalBest.score}</strong> pts · {(personalBest.availability * 100).toFixed(1)}% availability
    </div>}

    {top10.length > 0 ? <ol className="leaderboard-list">
      {top10.map((entry, i) => <li key={entry.runId} className={`leaderboard-entry${entry.runId === currentRunId ? ' leaderboard-you' : ''}`}>
        <span className="leaderboard-pos">#{i + 1}</span>
        <span className="leaderboard-name">{entry.nickname}</span>
        <span className="leaderboard-score">{entry.score}</span>
        <span className="leaderboard-avail">{(entry.availability * 100).toFixed(1)}%</span>
      </li>)}
    </ol> : <p className="leaderboard-empty">No qualifying runs yet. Complete the objective to place on the leaderboard.</p>}
  </div>;
}
