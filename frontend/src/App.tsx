import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import ReportInjuryPage from './pages/ReportInjuryPage';
import InjuryDetailPage from './pages/InjuryDetailsPage';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Chip,
  Container,
  IconButton,
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AddCircle as AddCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Helper to get role color and label
const getRoleInfo = (identityType: string) => {
  const roles: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default' }> = {
    player: { label: 'Player', color: 'primary' },
    coach: { label: 'Coach', color: 'secondary' },
    medical_staff: { label: 'Medical Staff', color: 'success' },
    admin: { label: 'Admin', color: 'error' },
  };
  return roles[identityType] || { label: identityType, color: 'default' };
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log('ProtectedRoute check:', { isAuthenticated, user });
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout with navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const roleInfo = user ? getRoleInfo(user.identityType) : null;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
              🏥 Injury Surveillance System
            </Typography>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  color="inherit"
                  startIcon={<DashboardIcon />}
                  component={RouterLink}
                  to="/dashboard"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Dashboard
                </Button>
                <Button
                  color="inherit"
                  startIcon={<PeopleIcon />}
                  component={RouterLink}
                  to="/players"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Players
                </Button>
                <Button
                  color="inherit"
                  startIcon={<AddCircleIcon />}
                  component={RouterLink}
                  to="/injuries/new"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Report Injury
                </Button>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
                  <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {user.email}
                    </Typography>
                  </Box>
                  {roleInfo && (
                    <Chip
                      label={roleInfo.label}
                      color={roleInfo.color}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  <Button 
                    color="inherit" 
                    onClick={logout}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      ml: 1,
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.8)',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Box>
      <Box component="footer" sx={{ py: 3, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2026 Multi-Sport Athlete Injury Surveillance System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/players"
        element={
          <ProtectedRoute>
            <Layout>
              <PlayersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/players/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <PlayerDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/injuries/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportInjuryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/injuries/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <InjuryDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;