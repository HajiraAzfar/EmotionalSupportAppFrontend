import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {HeartHandshake, Phone, Siren} from 'lucide-react-native';

import ScreenBackground from '../components/ScreenBackground';
import {getCrisisResources, CrisisResource} from '../api/crisis';
import {offers, ResourceLinks} from '../components/chat/SupportCard';
import {illustrations} from '../assets/brand';
import {cardTints, colors, gradient, radius, shadow, space, type} from '../theme';

// FR-CRIS-009 / FR-CRIS-010: must be reachable without sign-in or app unlock.
// getCrisisResources() calls apiRequest with no token, so this works even
// with no active session.

type Props = {
  onClose: () => void;
  // Fixed crisis content to show above the list (FR-CRIS-008), e.g. the emergency message.
  intro?: string;
  closeLabel?: string;
};

const ALERT_WASH = '#FBEAEE';
const ALERT_SHADOW = {boxShadow: '0px 8px 20px rgba(176, 58, 91, 0.25)'};

function call(phone: string) {
  Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
}

function Resource({r}: {r: CrisisResource}) {
  // Emergency services ("emergency-1122") come first and look it: rose, not sage.
  const urgent = r.id.startsWith('emergency');
  const Icon = urgent ? Siren : HeartHandshake;
  // "Call" alone says nothing the button does not; show it when there is more (text, hours, languages).
  const what = offers(r);
  return (
    <View
      style={{
        borderRadius: radius.card,
        padding: 18,
        marginBottom: 14,
        backgroundColor: urgent ? ALERT_WASH : colors.surface,
        borderWidth: 1,
        borderColor: urgent ? '#F1C9D4' : colors.line,
        ...shadow.sm,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: urgent ? colors.surface : colors.sageWash,
          }}>
          <Icon size={22} color={urgent ? colors.alert : colors.accent} />
        </View>
        <View style={{flex: 1}}>
          <Text style={{...type.label, fontSize: 16}}>{r.name}</Text>
          {what !== 'Call' ? (
            <Text style={{...type.tiny, marginTop: 3, color: urgent ? colors.alert : colors.leafDeep}}>{what}</Text>
          ) : null}
        </View>
      </View>
      <Text style={{...type.small, color: colors.inkSoft, marginTop: 12, lineHeight: 19}}>{r.description}</Text>
      <Pressable
        onPress={() => call(r.phone)}
        accessibilityRole="button"
        style={({pressed}) => ({
          marginTop: 14,
          minHeight: 50,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed ? 0.85 : 1,
          ...(urgent ? {backgroundColor: colors.alert, ...ALERT_SHADOW} : {backgroundImage: gradient.primary, ...shadow.button}),
        })}>
        <Phone size={18} color={colors.onAccent} />
        <Text style={{...type.label, color: colors.onAccent}}>{`Call ${r.phone}`}</Text>
      </Pressable>
      <ResourceLinks r={r} call={false} />
    </View>
  );
}

export default function CrisisResourcesScreen({onClose, intro, closeLabel = 'Close'}: Props) {
  const [resources, setResources] = useState<CrisisResource[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCrisisResources()
      .then(data => setResources(data.resources))
      .catch(e => setError((e as Error).message));
  }, []);

  return (
    // The background outside the safe area, so it runs to the bottom edge.
    <View style={{flex: 1}}>
      <ScreenBackground />
      <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingTop: 24, paddingBottom: 32}}>
        {/* A calm, illustrated welcome before the numbers. */}
        <View
          style={{
            borderRadius: radius.card + 8,
            paddingHorizontal: 22,
            paddingTop: 18,
            paddingBottom: 22,
            alignItems: 'center',
            backgroundImage: `linear-gradient(180deg, ${cardTints[0].bg} 0%, ${colors.surface} 100%)`,
            borderWidth: 1,
            borderColor: colors.line,
            ...shadow.md,
          }}>
          <Image source={illustrations.arch} resizeMode="contain" accessible={false} style={{width: 170, height: 120}} />
          <Text accessibilityRole="header" style={{...type.title, marginTop: 10, textAlign: 'center'}}>
            Support is available
          </Text>
          <Text style={{...type.body, marginTop: 8, textAlign: 'center'}}>
            These services are free and separate from Reframe. You can call any of them right now.
          </Text>
          <Image
            source={illustrations.notAlone}
            resizeMode="contain"
            accessible={false}
            style={{width: 160, height: 46, marginTop: 14}}
          />
        </View>

        {intro ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: radius.tile,
              backgroundColor: ALERT_WASH,
              borderLeftWidth: 4,
              borderLeftColor: colors.alert,
            }}>
            <Text style={{...type.body, color: colors.ink}}>{intro}</Text>
          </View>
        ) : null}

        <Text style={{...type.tiny, letterSpacing: 1, marginTop: 24, marginBottom: 10}}>HELPLINES</Text>

        {!resources && !error && <ActivityIndicator color={colors.sage} />}

        {error ? (
          <Text style={{...type.small, color: colors.alert}}>
            Couldn't load the resource list. If this is urgent, dial 1122 for
            emergency services.
          </Text>
        ) : null}

        {resources?.map(r => <Resource key={r.id} r={r} />)}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({pressed}) => ({
            marginTop: 10,
            minHeight: 52,
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: colors.accentSoft,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          <Text style={{...type.label, color: colors.accent}}>{closeLabel}</Text>
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
