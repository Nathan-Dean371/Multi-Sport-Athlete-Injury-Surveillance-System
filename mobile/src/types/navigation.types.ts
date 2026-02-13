import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Status: undefined;
  Injuries: undefined;
  Team: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
};

export type StatusStackParamList = {
  StatusUpdate: undefined;
  StatusHistory: undefined;
};

export type InjuryStackParamList = {
  InjuryList: undefined;
  InjuryDetail: { injuryId: string };
  ReportInjury: undefined;
  EditInjury: { injuryId: string };
};

export type TeamStackParamList = {
  TeamRoster: undefined;
  TeamDashboard: undefined;
  PlayerDetail: { playerId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
};
