import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, Text, View} from 'react-native';
import {Lock, Sprout} from 'lucide-react-native';

import {BADGE_ICONS} from './WeeklyReportScreen';
import {illustrations} from '../assets/brand';
import Screen from '../components/ModuleScreen';
import {Badge, getBadges} from '../api/weekly';
import {cardTints, colors, glass, gradient, radius, shadow, type} from '../theme';

type Props = {
  onBack: () => void;
};

/**
 * Every badge, earned or not yet: a 3 × 3 grid. Tapping one says what it is
 * and what earns it. Badges are things she did, never a score or a streak.
 */
export default function BadgesScreen({onBack}: Props) {
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError('');
    getBadges()
      .then(r => setBadges(r.badges))
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const earned = badges?.filter(b => b.earned).length ?? 0;
  const open = badges?.find(b => b.id === openId) ?? null;

  return (
    <Screen title="Your badges" art={illustrations.iconTrophy} onBack={onBack}>
      <Text style={type.body}>
        Small steps, noticed.{badges ? ` ${earned} of ${badges.length} so far.` : ''}
      </Text>

      {error ? (
        <Pressable onPress={load} style={{marginTop: 20}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      ) : !badges ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
      ) : (
        <>
          <View
            style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 18}}>
            {badges.map((badge, i) => {
              const Icon = BADGE_ICONS[badge.icon] ?? Sprout;
              const selected = badge.id === openId;
              return (
                <Pressable
                  key={badge.id}
                  onPress={() => setOpenId(selected ? null : badge.id)}
                  accessibilityRole="button"
                  accessibilityState={{selected}}
                  accessibilityLabel={`${badge.name}, ${badge.earned ? 'earned' : 'not yet earned'}`}
                  style={({pressed}) => ({
                    ...glass,
                    width: '31.5%',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 6,
                    borderRadius: radius.card,
                    borderColor: selected ? colors.accent : colors.glassEdge,
                    backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
                  })}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: badge.earned ? cardTints[i % cardTints.length].icon : colors.surfaceRaised,
                    }}>
                    <Icon size={24} color={badge.earned ? colors.accent : colors.muted} />
                    {badge.earned ? null : (
                      <View
                        style={{
                          position: 'absolute',
                          right: -2,
                          bottom: -2,
                          width: 20,
                          height: 20,
                          borderRadius: radius.pill,
                          backgroundColor: colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          ...shadow.sm,
                        }}>
                        <Lock size={11} color={colors.inkFaint} />
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      ...type.small,
                      fontSize: 12,
                      lineHeight: 16,
                      textAlign: 'center',
                      marginTop: 8,
                      color: badge.earned ? colors.ink : colors.inkFaint,
                    }}>
                    {badge.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* The one tapped: what it is, and what earns it. */}
          {open ? (
            <View style={{...glass, borderRadius: radius.card, padding: 16, marginTop: 14}}>
              <Text style={type.label}>{open.name}</Text>
              <Text style={{...type.body, marginTop: 4}}>{open.description}</Text>
              <Text style={{...type.small, marginTop: 6}}>
                {open.earned && open.earned_at
                  ? `Earned ${new Date(open.earned_at).toLocaleDateString(undefined, {day: 'numeric', month: 'long'})}.`
                  : `How: ${open.how}`}
              </Text>
            </View>
          ) : (
            <Text style={{...type.small, marginTop: 14, textAlign: 'center'}}>Tap a badge to see what it is for.</Text>
          )}

          {/* No pressure: a sleeping cat, and no rush. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 20,
              padding: 16,
              borderRadius: radius.card,
              backgroundImage: gradient.blush,
              borderWidth: 1,
              borderColor: colors.glassEdge,
              ...shadow.sm,
            }}>
            <View style={{flex: 1}}>
              <Text style={{...type.heading, fontSize: 17}}>There is no rush</Text>
              <Text style={{...type.small, marginTop: 4, lineHeight: 18}}>
                Badges come from what you do, at your own pace. Missing a day never takes one away.
              </Text>
            </View>
            <Image source={illustrations.cat} resizeMode="contain" accessible={false} style={{width: 110, height: 50}} />
          </View>
        </>
      )}
    </Screen>
  );
}
