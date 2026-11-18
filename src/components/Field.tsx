import React, {useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';

import {colors, radius, shadow, type} from '../theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  // A password being chosen, so a password manager offers to make and save one.
  newPassword?: boolean;
  email?: boolean;
  // A six-digit code from an email: the number pad, and no more than six.
  code?: boolean;
};

export default function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  newPassword,
  email,
  code,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  // Addresses, passwords and codes are typed exactly: no capitals, no corrections.
  const exact = email || secure || code;

  return (
    <View style={{marginBottom: 18}}>
      <Text style={{...type.small, color: colors.inkSoft, marginBottom: 7}}>{label}</Text>

      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          secureTextEntry={secure && !shown}
          autoCapitalize={exact ? 'none' : 'sentences'}
          autoCorrect={!exact}
          keyboardType={email ? 'email-address' : code ? 'number-pad' : 'default'}
          maxLength={code ? 6 : undefined}
          autoComplete={
            email
              ? 'email'
              : secure
              ? newPassword
                ? 'new-password'
                : 'current-password'
              : code
              ? 'one-time-code'
              : undefined
          }
          textContentType={
            email
              ? 'emailAddress'
              : secure
              ? newPassword
                ? 'newPassword'
                : 'password'
              : code
              ? 'oneTimeCode'
              : undefined
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: focused ? colors.accent : colors.line,
            borderRadius: radius.input,
            paddingLeft: 16,
            paddingRight: secure ? 52 : 16,
            paddingVertical: 15,
            ...type.input,
            color: colors.ink,
            ...shadow.sm,
          }}
        />

        {secure ? (
          <Pressable
            onPress={() => setShown(on => !on)}
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: 4,
              top: 0,
              bottom: 0,
              width: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {shown ? (
              <EyeOff size={20} color={colors.inkSoft} strokeWidth={1.8} />
            ) : (
              <Eye size={20} color={colors.inkSoft} strokeWidth={1.8} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
