import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {BookOpen, ChartLine, House, MessageCircle, NotebookPen} from 'lucide-react-native';

import {colors, font, radius, shadow, type} from '../theme';

export type Tab = 'home' | 'journal' | 'chat' | 'insights' | 'library';

type Props = {
  current: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: {key: Tab; label: string; Icon: typeof House}[] = [
  {key: 'home', label: 'Home', Icon: House},
  {key: 'journal', label: 'Journal', Icon: NotebookPen},
  {key: 'chat', label: 'AI Chat', Icon: MessageCircle},
  {key: 'insights', label: 'Insights', Icon: ChartLine},
  {key: 'library', label: 'Library', Icon: BookOpen},
];

// The white bar along the bottom of every main screen, in the brand brief's
// style: thin icons, the current tab in the primary purple on a lavender pill.
// It is the only way between the five areas, so nothing here ever disappears.
export default function TabBar({current, onChange}: Props) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        paddingHorizontal: 6,
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
                width: 52,
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
