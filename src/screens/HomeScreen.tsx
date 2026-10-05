import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {Insights, getInsights} from '../api/insights';
import {getAccessToken} from '../storage/tokens';
import {colors, moodFaces, radius, space, type} from '../theme';

type Props = {
  onSignedOut: () => void;
  // A mood tapped on the home card starts a check-in with it already answered.
  onStartCheckIn: (mood: number) => void;
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenInsights: () => void;
  onOpenEntries: () => void;
  onOpenSettings: () => void;
};

// The three the design puts on the home screen. Everything else lives in the
// Journal tab, and free write lives in AI Chat.
const QUICK: {type: JournalType; label: string}[] = [
  {type: 'thought', label: 'Thought\nRecord'},
  {type: 'savouring', label: 'Gratitude\nJournal'},
  {type: 'check_in', label: 'Daily\nCheck-in'},
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/** The same curve the insights chart uses, at card size. */
function smooth(coords: {x: number; y: number}[]) {
  if (coords.length < 2) {
    return '';
  }
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const previous = coords[i - 1] ?? coords[i];
    const current = coords[i];
    const next = coords[i + 1];
    const after = coords[i + 2] ?? next;
    path += ` C ${current.x + (next.x - previous.x) / 6} ${current.y + (next.y - previous.y) / 6}, ${
      next.x - (after.x - current.x) / 6
    } ${next.y - (after.y - current.y) / 6}, ${next.x} ${next.y}`;
  }
  return path;
}

// FR-INS-004: only the days she recorded a mood on are drawn. A week with two
// entries shows two points, not five invented ones.
function WeekTrend({data}: {data: Insights}) {
  const width = 260;
  const height = 92;
  const points = data.mood.points.slice(-7);

  if (points.length < 2) {
    return (
      <Text style={{...type.small, color: colors.onCardSoft, marginTop: 10}}>
        A couple more check-ins and your week will show here.
      </Text>
    );
  }

  const range = Math.max(data.mood.max - data.mood.min, 1);
  const coords = points.map((point, index) => ({
    x: (index / (points.length - 1)) * width,
    y: height - ((point.value - data.mood.min) / range) * (height - 12) - 6,
  }));
  const line = smooth(coords);

  return (
    <View style={{marginTop: 12}}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="homeTrend" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.coralSoft} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.coralSoft} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill="url(#homeTrend)" />
        <Path d={line} stroke={colors.coral} strokeWidth={2.5} fill="none" />
      </Svg>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 6}}>
        {points.map(point => (
          <Text key={point.entry_id ?? point.date} style={{...type.small, color: colors.onCardSoft, fontSize: 11}}>
            {new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, {weekday: 'narrow'})}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen({
  onSignedOut,
  onStartCheckIn,
  onStartJournal,
  onResumeDraft,
  onOpenInsights,
  onOpenEntries,
  onOpenSettings,
}: Props) {
  const [draft, setDraft] = useState<EntrySummary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!(await getAccessToken())) {
        onSignedOut();
        return;
      }
      // FR-HOME-002: offer the most recent draft touched within 7 days.
      const [drafts, summary] = await Promise.all([
        listRecentDrafts().catch(() => []),
        getInsights('7d').catch(() => null),
      ]);
      // A chat is carried on from the AI Chat tab, not offered as a draft here.
      setDraft(drafts.find(d => d.journal_type !== 'chat') ?? null);
      setInsights(summary);
    } finally {
      setLoading(false);
    }
  }, [onSignedOut]);

  useEffect(() => {
    load();
  }, [load]);

  const streak = insights?.streak.current ?? 0;

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
          <Text style={{...type.title, flex: 1}}>{greeting()} 🌷</Text>
          {/* Module 4: the streak, stated and not celebrated. */}
          <View
            style={{
              borderWidth: 1.5,
              borderColor: colors.blush,
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 8,
              alignItems: 'center',
            }}>
            <Text style={{...type.small, color: colors.blush, fontSize: 12}}>
              {streak}-day
            </Text>
            <Text style={{...type.small, color: colors.blush, fontSize: 12}}>streak</Text>
          </View>
        </View>

        {/* FR-HOME-002 */}
        {draft ? (
          <Pressable
            onPress={() => onResumeDraft(draft)}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              padding: 14,
              marginTop: 16,
            }}>
            <Text style={{...type.label, fontWeight: '600'}}>
              Continue your {JOURNAL_TITLES[draft.journal_type]?.toLowerCase() ?? 'entry'}
            </Text>
            <Text style={{...type.small, marginTop: 4}}>
              Everything you recorded is saved.
            </Text>
          </Pressable>
        ) : null}

        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            padding: 16,
            marginTop: 18,
          }}>
          <Text style={{...type.label, color: colors.onCard, fontWeight: '600'}}>
            Daily mood check-in
          </Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 14}}>
            {moodFaces.map((face, index) => (
              <Pressable
                key={face}
                onPress={() => onStartCheckIn(index + 1)}
                style={({pressed}) => ({
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? colors.blush : 'rgba(243, 207, 206, 0.18)',
                })}>
                <Text style={{fontSize: 24}}>{face}</Text>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(243, 207, 206, 0.18)',
              marginTop: 14,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${Math.min(100, ((insights?.streak.days_this_week ?? 0) / (insights?.streak.weekly_goal || 7)) * 100)}%`,
                height: 6,
                backgroundColor: colors.coralSoft,
              }}
            />
          </View>
        </View>

        <Text style={{...type.label, marginTop: 24, marginBottom: 10}}>CBT journals</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          {QUICK.map(item => (
            <Pressable
              key={item.type}
              onPress={() => onStartJournal(item.type)}
              style={({pressed}) => ({
                flex: 1,
                backgroundColor: pressed ? colors.coralSoft : colors.blush,
                borderRadius: radius.card,
                paddingVertical: 18,
                paddingHorizontal: 10,
              })}>
              <Text style={{...type.label, color: colors.onCard, fontWeight: '600', fontSize: 14}}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{...type.label, marginTop: 24, marginBottom: 10}}>Your week</Text>
        <Pressable
          onPress={onOpenInsights}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            padding: 16,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <Text
              style={{...type.label, color: colors.onCard, fontWeight: '600', flex: 1, lineHeight: 22}}>
              Weekly emotional{'\n'}wellbeing trend
            </Text>
            <Text style={{...type.label, color: colors.onCardSoft}}>›</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.coral} style={{marginTop: 20}} />
          ) : insights ? (
            <WeekTrend data={insights} />
          ) : (
            <Text style={{...type.small, color: colors.onCardSoft, marginTop: 10}}>
              Your week will show here once you have written something.
            </Text>
          )}
        </Pressable>

        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 24}}>
          <Pressable onPress={onOpenEntries}>
            <Text style={{...type.small, color: colors.accent}}>Your entries</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings}>
            <Text style={{...type.small, color: colors.accent}}>Settings</Text>
          </Pressable>
          {/* FR-CRIS-009: crisis resources on every screen. */}
          <Pressable onPress={() => setResourcesOpen(true)}>
            <Text style={{...type.small, color: colors.alert}}>Get help</Text>
          </Pressable>

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
