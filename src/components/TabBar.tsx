import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {colors, type} from '../theme';

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

// How far the AI Chat button stands above the bar.
const RISE = 24;

// The white bar from the design, on every main screen, with AI Chat as a
// raised peach button in the middle. It is the only way between the five
// areas, so nothing here ever disappears.
export default function TabBar({current, onChange}: Props) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6, paddingBottom: 8}}>
      {/* The bar starts RISE below the top, so the raised button sits inside
          this view's bounds and stays tappable on Android. */}
      <View
        style={{
          position: 'absolute',
          top: RISE,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      />
      {TABS.map(tab => {
        const on = tab.key === current;
        const tint = on ? colors.accent : colors.inkFaint;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{selected: on}}
            style={{flex: 1, alignItems: 'center', paddingVertical: 4}}>
            {tab.key === 'chat' ? (
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: colors.coral,
                  borderWidth: 4,
                  borderColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.accent,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: {width: 0, height: 3},
                  elevation: 4,
                }}>
                <Text style={{fontSize: 22}}>{tab.icon}</Text>
              </View>
            ) : (
              <Text style={{fontSize: 17, color: tint, opacity: on ? 1 : 0.6}}>{tab.icon}</Text>
            )}
            <Text
              style={{
                ...type.small,
                fontSize: 11,
                marginTop: 3,
                color: tint,
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
