import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import AcceptParentInviteScreen from "../screens/auth/AcceptParentInviteScreen";
import AcceptAthleteInviteScreen from "../screens/auth/AcceptAthleteInviteScreen";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="AcceptParentInvite"
        component={AcceptParentInviteScreen}
      />
      <Stack.Screen
        name="AcceptAthleteInvite"
        component={AcceptAthleteInviteScreen}
      />
    </Stack.Navigator>
  );
}
