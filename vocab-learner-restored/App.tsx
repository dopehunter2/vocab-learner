import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ReviewScreen } from './src/screens/ReviewScreen';
import { AddWordScreen } from './src/screens/AddWordScreen';
import { AllWordsScreen } from './src/screens/AllWordsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { initializeDatabase } from './src/database/database';
import { useVocabularyStore } from './src/store/useVocabularyStore';

// Define type for the tab navigator's screens
type RootTabParamList = {
  Review: undefined;
  'Add Word': undefined;
  'All Words': undefined;
  Settings: undefined;
};

// Dark Theme Color Palette
const PRIMARY_BACKGROUND = '#121212';
const SURFACE_BACKGROUND = '#1E1E1E';
const PRIMARY_TEXT = '#E0E0E0';
const SECONDARY_TEXT = '#A0A0A0';
const ACCENT_COLOR = '#64FFDA';
const ERROR_COLOR = '#CF6679';

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppDarkTheme = {
  ...NavigationDefaultTheme,
  dark: true,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: ACCENT_COLOR,
    background: PRIMARY_BACKGROUND,
    card: SURFACE_BACKGROUND,
    text: PRIMARY_TEXT,
    border: SURFACE_BACKGROUND,
    notification: ACCENT_COLOR,
  },
};

function AppNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: SURFACE_BACKGROUND },
          headerTintColor: PRIMARY_TEXT,
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarActiveTintColor: ACCENT_COLOR,
          tabBarInactiveTintColor: SECONDARY_TEXT,
          tabBarStyle: {
            backgroundColor: SURFACE_BACKGROUND,
            borderTopColor: SURFACE_BACKGROUND,
          },
          tabBarLabelStyle: {
             fontSize: 11,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];

            if (route.name === 'Review') {
              iconName = focused ? 'cards' : 'cards-outline';
            } else if (route.name === 'Add Word') {
              iconName = focused ? 'plus-box' : 'plus-box-outline';
            } else if (route.name === 'All Words') {
              iconName = focused ? 'view-list' : 'view-list-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'cog' : 'cog-outline';
            } else {
              iconName = 'help-circle';
            }
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Review Due' }}
        />
        <Tab.Screen
          name="Add Word"
          component={AddWordScreen}
          options={{ title: 'Add New Word' }}
        />
        <Tab.Screen
          name="All Words"
          component={AllWordsScreen}
          options={{ title: 'Vocabulary List' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
  );
}

export default function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const loadReviewLimit = useVocabularyStore(state => state.loadReviewLimitFromStorage);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("Initializing database...");
        await initializeDatabase();
        console.log("Database initialized successfully.");
        setIsDbInitialized(true);

        console.log("Loading review limit from storage...");
        await loadReviewLimit();
        console.log("Review limit loaded.");

      } catch (error: any) {
        console.error("App initialization failed:", error);
        if (!isDbInitialized) {
            setDbError(error.message || 'Unknown initialization error');
        }
      }
    };
    initApp();
  }, [loadReviewLimit]);

  if (dbError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Database Error:</Text>
        <Text style={styles.errorText}>{dbError}</Text>
        <Text style={styles.loadingText}>Please restart the app.</Text>
      </View>
    );
  }

  if (!isDbInitialized) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
        <Text style={styles.loadingText}>Initializing Database...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppDarkTheme}>
      <AppNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PRIMARY_BACKGROUND,
  },
  errorText: {
    color: ERROR_COLOR,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  loadingText: {
    color: PRIMARY_TEXT,
    marginTop: 10,
    fontSize: 14,
  }
});

