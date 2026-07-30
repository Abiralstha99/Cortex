import React from 'react'
import { useParams } from 'react-router-dom';
import { useLobbySocket } from '../hooks/useLobbySocket';
import {useLobbyStore} from '../stores/lobbyStore'

export default function Lobby() {
    const {roomCode = ""} = useParams();
    const parsedRoomCode = roomCode.toUpperCase()
    const {connected, toggleReady, leave} = useLobbySocket(parsedRoomCode);

    // Get data from the store
    const players = useLobbyStore((s) => s.players);
    const roomCode = useLobbyStore((s) => s.roomCode);
    const gameId = useLobbyStore((s) => s.gameId);
    const hostId = useLobbyStore((s) => s.hostId);
    const difficulty = useLobbyStore((s) => s.difficulty);
    const numberOfRounds = useLobbyStore((s) => s.numberOfRounds);
    const toast = useLobbyStore((s) => s.toast);
    const { id: myUserId } = useCurrentUser();
    const isHost = myUserId != null && hostId === myUserId;

  return (
    <div>Lobby</div>
  )
}
