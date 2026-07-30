import { Crown, Check, X } from "lucide-react";
import type { LobbyPlayer } from "../../lib/api";

type PlayerCardProps = {
  player: LobbyPlayer;
  isHost: boolean;
  isSelf: boolean;
};

export default function PlayerCard({ player, isHost, isSelf }: PlayerCardProps) {
  return (
    <div
      className={`player-card${isSelf ? " player-card--self" : ""}${player.ready ? " player-card--ready" : ""}`}
    >
      <div className="player-card__info">
        <span className="player-card__name">
          {player.username}
          {isSelf && <span className="player-card__you">(YOU)</span>}
        </span>
        {isHost && (
          <span className="player-card__host">
            <Crown size={12} strokeWidth={2} /> HOST
          </span>
        )}
      </div>
      <span
        className={`player-card__ready ${player.ready ? "player-card__ready--yes" : "player-card__ready--no"}`}
      >
        {player.ready ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
        {player.ready ? "READY" : "NOT READY"}
      </span>
    </div>
  );
}
