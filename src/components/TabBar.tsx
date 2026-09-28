import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {colors, onTint, type} from '../theme';

export type Tab = 'home' | 'journal' | 'chat' | 'insights' | 'library';

type Props = {
  current: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: {key: Tab; label: string; icon: string}[] = [
  {key: 'home', label: 'Home', icon: '⌂'},
  {key: 'journal', label: 'Journal', icon: '✎'},
  {key: 'chat', label: 'AI Chat', icon: '💬'},
  {key: 'insights', label: 'Insights', icon: '📊'},
  {key: 'library', label: 'Library', icon: '📖'},
];

// The blush bar from the design, on every main screen. It is the only way
// between the four areas, so nothing here ever disappears.
export default function TabBar({current, onChange}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.blush,
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 6,
      }}>
      {TABS.map(tab => {
        const on = tab.key === current;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{flex: 1, alignItems: 'center', paddingVertical: 4}}>
            <Text style={{fontSize: 17, opacity: on ? 1 : 0.55}}>{tab.icon}</Text>
            <Text
              style={{
                ...type.small,
                fontSize: 11,
                marginTop: 3,
                color: onTint,
                opacity: on ? 1 : 0.6,
                fontWeight: on ? '600' : '400',
              }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
