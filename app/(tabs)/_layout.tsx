import { Tabs } from 'expo-router/js-tabs';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/theme';
import { selectUnreadNotificationCount, useAppStore } from '@/store/appStore';

/** Icône d'onglet (le type `color` fourni par la barre accepte `null`). */
function TabIcon({
  name,
  focusedName,
  focused,
  color,
  size,
}: {
  name: IconName;
  focusedName: IconName;
  focused: boolean;
  color: ColorValue;
  size: number;
}) {
  const resolved = typeof color === 'string' ? color : colors.text;
  return <Icon name={focused ? focusedName : name} size={size} color={resolved} />;
}

/** Barre d'onglets principale. */
export default function TabsLayout() {
  const unreadCount = useAppStore(selectUnreadNotificationCount);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Platform.select({ ios: 84 + insets.bottom, default: 62 + insets.bottom }),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon name="home-outline" focusedName="home" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="search-outline"
              focusedName="search"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Créer',
          tabBarIcon: () => (
            <View style={styles.createIcon}>
              <Icon name="add" size={24} color={colors.background} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activité',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon name="heart-outline" focusedName="heart" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="person-outline"
              focusedName="person"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.select({ ios: 84, default: 62 }),
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabItem: {
    paddingVertical: 2,
  },
  scene: {
    backgroundColor: colors.background,
  },
  createIcon: {
    width: 46,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.like,
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
});
