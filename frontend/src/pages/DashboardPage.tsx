import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { playersApi } from '../services/api';
import type { Player } from '../types';

const DashboardPage: React.FC = () => {
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
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      // Backend returns { players: [...], total: 7 }
      const playersData = (response.data as any).players || response.data;
      console.log('Players array:', playersData);
      
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
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/injuries/new')}
        >
          Report Injury
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Players
            </Typography>
            <Typography variant="h3">
              {players.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Players
            </Typography>
            <Typography variant="h3">
              {players.filter((p) => p.isActive).length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/players')}
                sx={{ mb: 1 }}
              >
                View All Players
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default DashboardPage;