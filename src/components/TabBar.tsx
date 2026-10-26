import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {BookOpen, Brain, ChartLine, House, NotebookPen, UserRound} from 'lucide-react-native';

import {colors, font, radius, shadow, type} from '../theme';

// AI Chat is an area without a tab of its own: Home opens it, and the bar
// stays under it with nothing selected.
export type Tab = 'home' | 'journal' | 'thoughts' | 'insights' | 'library' | 'profile' | 'chat';

type Props = {
  current: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: {key: Tab; label: string; Icon: typeof House}[] = [
  {key: 'home', label: 'Home', Icon: House},
  {key: 'journal', label: 'Journal', Icon: NotebookPen},
  // The board calls it Reframe, but that is the app's name now.
  {key: 'thoughts', label: 'Thoughts', Icon: Brain},
  {key: 'insights', label: 'Insights', Icon: ChartLine},
  {key: 'library', label: 'Library', Icon: BookOpen},
  {key: 'profile', label: 'Profile', Icon: UserRound},
];

// The white bar along the bottom of every main screen, in the brand board's
// style: thin icons, the current tab in the primary sage on a pale sage pill.
// It is the only way between the six areas, so nothing here ever disappears.
export default function TabBar({current, onChange}: Props) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.image,
        borderTopRightRadius: radius.image,
        ...shadow.bar,
      }}>
      {TABS.map(({key, label, Icon}) => {
        const on = key === current;
        const tint = on ? colors.accent : colors.inkFaint;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{selected: on}}
            style={{flex: 1, alignItems: 'center', paddingVertical: 2}}>
            <View
              style={{
                width: 44,
                height: 30,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.sageWash : colors.surface,
              }}>
              <Icon size={21} color={tint} strokeWidth={on ? 2.1 : 1.7} />
            </View>
            <Text
              style={{
                ...type.tiny,
                marginTop: 3,
                color: tint,
                fontFamily: on ? font.semibold : font.medium,
              }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
