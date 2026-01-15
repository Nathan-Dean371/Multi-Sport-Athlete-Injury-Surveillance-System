import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { playersApi } from '../services/api';
import type { Player } from '../types';

const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await playersApi.getAll();
      console.log('Players response:', response.data);

      // Backend returns { players: [...], total: 7 }
      const playersData = (response.data as any).players || response.data;
      setPlayers(playersData);
    } catch (err: any) {
      console.error('Failed to load players', err);
      setError(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Players
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player ID</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Age Group</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.playerId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/players/${player.playerId}`)}
              >
                <TableCell>{player.playerId}</TableCell>
                <TableCell>{player.teamName}</TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell>{player.ageGroup}</TableCell>
                <TableCell>
                  <Chip
                    label={player.isActive ? 'Active' : 'Inactive'}
                    color={player.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PlayersPage;