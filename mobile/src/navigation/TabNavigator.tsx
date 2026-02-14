import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import StatusUpdateScreen from '../screens/status/StatusUpdateScreen';
import StatusHistoryScreen from '../screens/status/StatusHistoryScreen';
import InjuryListScreen from '../screens/injuries/InjuryListScreen';
import InjuryDetailScreen from '../screens/injuries/InjuryDetailScreen';
import ReportInjuryScreen from '../screens/injuries/ReportInjuryScreen';
import EditInjuryScreen from '../screens/injuries/EditInjuryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TeamDashboardScreen from '../screens/team/TeamDashboardScreen';
import TeamRosterScreen from '../screens/team/TeamRosterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
    </Stack.Navigator>
  );
}

function StatusStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StatusUpdate" 
        component={StatusUpdateScreen} 
        options={{ title: 'Update Status' }}
      />
      <Stack.Screen 
        name="StatusHistory" 
        component={StatusHistoryScreen} 
        options={{ title: 'Status History' }}
      />
    </Stack.Navigator>
  );
}

function InjuryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="InjuryList" 
        component={InjuryListScreen} 
        options={{ title: 'Injuries' }}
      />
      <Stack.Screen 
        name="InjuryDetail" 
        component={InjuryDetailScreen} 
        options={{ title: 'Injury Details' }}
      />
      <Stack.Screen 
        name="ReportInjury" 
        component={ReportInjuryScreen} 
        options={{ title: 'Report Injury' }}
      />
      <Stack.Screen 
        name="EditInjury" 
        component={EditInjuryScreen} 
        options={{ title: 'Update Injury' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

function TeamStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TeamDashboard" 
        component={TeamDashboardScreen} 
        options={{ title: 'Team Dashboard' }}
      />
      <Stack.Screen 
        name="TeamRoster" 
        component={TeamRosterScreen} 
        options={{ title: 'Full Team Roster' }}
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const { user } = useAuth();
  const isPlayer = user?.identityType === 'player';
  const isCoach = user?.identityType === 'coach';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" size={size} color={color} />
          ),
        }}
      />
      
      {isPlayer && (
        <Tab.Screen
          name="Status"
          component={StatusStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="heart-pulse" size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tab.Screen
        name="Injuries"
        component={InjuryStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon source="medical-bag" size={size} color={color} />
          ),
        }}
      />
      
      {isCoach && (
        <Tab.Screen
          name="Team"
          component={TeamStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="account-group" size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon source="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
