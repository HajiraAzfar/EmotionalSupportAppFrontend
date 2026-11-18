import React, {useCallback, useEffect, useState} from 'react';
import {Image, ImageSourcePropType, Modal, Pressable, ScrollView, Text, View} from 'react-native';
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

import {illustrations} from '../assets/brand';
import Wordmark from '../components/Wordmark';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {getBadges} from '../api/weekly';
import {isLockSet} from '../storage/appLock';
import {getReminders, remindersAvailable} from '../storage/reminders';
import {clearTokens} from '../storage/tokens';
import {colors, font, gradient, radius, shadow, space, type} from '../theme';

type Props = {
  name: string | null;
  onOpenName: () => void;
  onOpenAppLock: () => void;
  onOpenReminders: () => void;
  onOpenDeleteAccount: () => void;
  onOpenBadges: () => void;
  onSignedOut: () => void;
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
  image,
  onPress,
  danger = false,
}: {
  label: string;
  description: string;
  value?: string;
  Icon?: LucideIcon;
  image?: ImageSourcePropType;
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
      {image ? (
        <Image source={image} resizeMode="contain" accessible={false} style={{width: 42, height: 42}} />
      ) : Icon ? (
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
      ) : null}
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

// The Profile tab: who she is, then the settings. The app lock follows the
// account since 18 Nov 2026 (FR-AUTH-009), but it is still set from here.
export default function SettingsScreen({
  name,
  onOpenName,
  onOpenAppLock,
  onOpenReminders,
  onOpenDeleteAccount,
  onOpenBadges,
  onSignedOut,
}: Props) {
  const [locked, setLocked] = useState<boolean | null>(null);
  // How many of the three check-in reminders are on; undefined while loading.
  const [remindersOn, setRemindersOn] = useState<number | undefined>(undefined);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  // Badges earned, and how many there are; null until loaded (or offline).
  const [badges, setBadges] = useState<{earned: number; total: number} | null>(null);

  const refresh = useCallback(() => {
    isLockSet().then(setLocked);
    getReminders()
      .then(all => setRemindersOn(Object.values(all).filter(minutes => minutes !== null).length))
      .catch(() => setRemindersOn(0));
    getBadges()
      .then(r => setBadges({earned: r.badges.filter(b => b.earned).length, total: r.badges.length}))
      .catch(() => setBadges(null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function signOut() {
    await clearTokens();
    onSignedOut();
  }

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingTop: 12, paddingBottom: 30}}>
        {/* FR-CRIS-009: this tab's own Get help, so nothing floats over the list. */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 14}}>
          <Text accessibilityRole="header" style={{...type.title, flex: 1}}>
            Settings
          </Text>
          <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
            <Text style={{...type.link, color: colors.alert}}>Get help</Text>
          </Pressable>
        </View>

        {/* Who the app greets: her initial in a ringed circle, her name, and her badges. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 18,
            borderRadius: radius.card,
            backgroundImage: gradient.lavender,
            borderWidth: 1,
            borderColor: colors.glassEdge,
            ...shadow.sm,
          }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              borderWidth: 3,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow.md,
            }}>
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: radius.pill,
                backgroundColor: colors.sageWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {name ? (
                <Text style={{...type.title, color: colors.accent}}>{name.charAt(0).toUpperCase()}</Text>
              ) : (
                <UserRound size={28} color={colors.accent} />
              )}
            </View>
          </View>
          <View style={{flex: 1}}>
            <Text style={{...type.title, fontSize: 22}}>
              {name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Your profile'}
            </Text>
            <Text style={{...type.small, marginTop: 2}}>Mindful today, brighter days.</Text>
          </View>
        </View>

        <Section>Profile</Section>
        <Row
          label="Your name"
          description="What the home screen greets you with."
          value={name ?? 'Not set'}
          Icon={UserRound}
          onPress={onOpenName}
        />

        <Section>Your progress</Section>
        <Row
          label="Your badges"
          description="Small steps you have taken, noticed."
          value={badges ? `${badges.earned} of ${badges.total}` : ''}
          image={illustrations.iconTrophy}
          onPress={onOpenBadges}
        />

        <Section>Privacy</Section>
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
          <Wordmark />
          <Text style={{...type.small, textAlign: 'center', marginTop: 14, lineHeight: 19, maxWidth: 300}}>
            Reframe is a space for reflection and self-help. Its AI companion is not a therapist
            and cannot diagnose. If you need care, please reach out to a qualified
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
