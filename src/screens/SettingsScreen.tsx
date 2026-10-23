import React, {useCallback, useEffect, useState} from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  LucideIcon,
  Trash2,
  UserRound,
} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import Logo from '../components/Logo';
import ScreenBackground from '../components/ScreenBackground';
import Wordmark from '../components/Wordmark';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {isLockSet} from '../storage/appLock';
import {getReminders, remindersAvailable} from '../storage/reminders';
import {clearTokens} from '../storage/tokens';
import {colors, font, radius, shadow, space, type} from '../theme';

type Props = {
  name: string | null;
  onOpenName: () => void;
  onOpenAppLock: () => void;
  onOpenReminders: () => void;
  onOpenDeleteAccount: () => void;
  onSignedOut: () => void;
  onBack: () => void;
};

function Section({children}: {children: string}) {
  return (
    <Text accessibilityRole="header" style={{...type.small, marginTop: 18, marginBottom: 10}}>
      {children}
    </Text>
  );
}

function Row({
  label,
  description,
  value,
  Icon,
  onPress,
  danger = false,
}: {
  label: string;
  description: string;
  value?: string;
  Icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
}) {
  const tint = danger ? colors.alert : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={description}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.card,
        padding: 14,
        marginBottom: 10,
        ...shadow.sm,
      })}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: danger ? colors.blush : colors.sageWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={19} color={tint} />
      </View>
      <View style={{flex: 1}}>
        <Text style={{...type.label, color: danger ? colors.alert : colors.ink}}>{label}</Text>
        <Text style={{...type.small, marginTop: 2}}>{description}</Text>
      </View>
      {value ? (
        <Text style={{...type.small, fontFamily: font.semibold, color: colors.accent}}>{value}</Text>
      ) : null}
      {!danger ? <ChevronRight size={18} color={colors.inkFaint} /> : null}
    </Pressable>
  );
}

// Where the settings that belong to this phone live. The app lock is the main
// one: it is device-only by design (FR-AUTH-009), so it has nowhere else to be.
export default function SettingsScreen({
  name,
  onOpenName,
  onOpenAppLock,
  onOpenReminders,
  onOpenDeleteAccount,
  onSignedOut,
  onBack,
}: Props) {
  const [locked, setLocked] = useState<boolean | null>(null);
  // How many of the three check-in reminders are on; undefined while loading.
  const [remindersOn, setRemindersOn] = useState<number | undefined>(undefined);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const refresh = useCallback(() => {
    isLockSet().then(setLocked);
    getReminders()
      .then(all => setRemindersOn(Object.values(all).filter(minutes => minutes !== null).length))
      .catch(() => setRemindersOn(0));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function signOut() {
    await clearTokens();
    onSignedOut();
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <BackButton onPress={onBack} />
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 30}}>
        <Text accessibilityRole="header" style={{...type.title, marginBottom: 4}}>
          Settings
        </Text>

        <Section>Profile</Section>
        <Row
          label="Your name"
          description="What the home screen greets you with."
          value={name ?? 'Not set'}
          Icon={UserRound}
          onPress={onOpenName}
        />

        <Section>Privacy on this phone</Section>
        <Row
          label="App lock"
          description={
            locked
              ? 'Change your PIN, or turn the lock off.'
              : 'Ask for a PIN before the app opens.'
          }
          value={locked === null ? '' : locked ? 'On' : 'Off'}
          Icon={LockKeyhole}
          onPress={onOpenAppLock}
        />
        {remindersAvailable ? (
          <Row
            label="Check-in reminders"
            description="A gentle nudge when a check-in opens. It never shows what you wrote."
            value={remindersOn === undefined ? '' : remindersOn === 0 ? 'Off' : `${remindersOn} of 3 on`}
            Icon={Bell}
            onPress={onOpenReminders}
          />
        ) : null}

        <Section>Help and support</Section>
        <Row
          label="Crisis resources"
          description="Helplines and what to do if you are not safe right now."
          Icon={LifeBuoy}
          onPress={() => setResourcesOpen(true)}
        />

        <Section>Account</Section>
        <Row
          label="Sign out"
          description="Your entries stay safe — they live on the server, not on this phone."
          Icon={LogOut}
          onPress={signOut}
          danger
        />
        <Row
          label="Delete my account"
          description="Delete your account and every entry, for good."
          Icon={Trash2}
          onPress={onOpenDeleteAccount}
          danger
        />

        {/* About: what the app is, and what it is not. */}
        <View style={{alignItems: 'center', marginTop: 34}}>
          <Logo size={64} />
          <View style={{marginTop: 10}}>
            <Wordmark />
          </View>
          <Text style={{...type.small, textAlign: 'center', marginTop: 14, lineHeight: 19, maxWidth: 300}}>
            Mind Doc is a space for reflection and self-help. Echo, its AI companion, is not a
            therapist and cannot diagnose. If you need care, please reach out to a qualified
            professional.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={resourcesOpen}
        animationType="slide"
        onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}
