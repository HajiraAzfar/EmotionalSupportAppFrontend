import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {colors, radius, shadow, type} from '../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  email?: boolean;
};

export default function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  email,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{marginBottom: 18}}>
      <Text style={{...type.small, color: colors.inkSoft, marginBottom: 7}}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        secureTextEntry={secure}
        autoCapitalize={email ? 'none' : 'sentences'}
        keyboardType={email ? 'email-address' : 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: focused ? colors.accent : colors.line,
          borderRadius: radius.input,
          paddingHorizontal: 16,
          paddingVertical: 15,
          ...type.input,
          color: colors.ink,
          ...shadow.sm,
        }}
      />
    </View>
  );
}
