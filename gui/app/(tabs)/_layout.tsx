import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/src/components/ui/haptic-tab';
import { IconSymbol } from '@/src/components/ui/ui/icon-symbol';
import { Colors } from '@/src/utils/theme';
import { useColorScheme } from '@/src/utils/use-color-scheme';
import { AuthGuard } from '@/src/components/auth';

function TabsContent() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="word-practice"
        options={{
          title: 'Words',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="flashcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sentence-practice"
        options={{
          title: 'Sentences',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="mic.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="safari.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AuthGuard>
      <TabsContent />
    </AuthGuard>
  );
}
