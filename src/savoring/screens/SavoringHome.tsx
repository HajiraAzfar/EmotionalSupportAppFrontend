import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, Text, View} from 'react-native';
import {ChevronRight, Settings} from 'lucide-react-native';

import PrimaryButton from '../../components/PrimaryButton';
import Chip from '../../components/chat/Chip';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {colors, type} from '../../theme';
import {DayRoom, Heatmap as HeatmapData, MomentType, SavoringHome as HomeData, getHeatmap, getHome, localDay, setActual} from '../api';
import {CAP_MESSAGE, FOLLOW_UP, HOME, MEMORY, OFFLINE, STREAK, SUPPORT, TITLE, TYPES} from '../content';
import {Pending, letGo, moveToToday, syncPending} from '../storage';
import Heatmap, {HeatmapLegend} from '../components/Heatmap';
import MomentCard, {shortDate} from '../components/MomentCard';
import ScoreScale from '../components/ScoreScale';
import Screen, {Card, LinkRow} from '../components/Screen';

type Props = {
  onBack: () => void;
  onStart: (type: MomentType, room: {today: DayRoom; yesterday: DayRoom}, total: number) => void;
  onOpenMoment: (id: string) => void;
  onOpenHistory: (date?: string) => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
  onOpenYear: () => void;
};

// Twelve whole weeks, Monday to Sunday, ending with this one.
export function twelveWeeks(today = new Date()) {
  const monday = -((today.getDay() + 6) % 7);
  return {from: localDay(monday - 77, today), to: localDay(0, today)};
}

/**
 * The Saving Journal's home: start a moment (or hear, kindly, that today is
 * full), answer how an awaited moment really was, the last three, memory lane,
 * and the heatmap with the streak beside it.
 */
export default function SavoringHome({
  onBack,
  onStart,
  onOpenMoment,
  onOpenHistory,
  onOpenInsights,
  onOpenSettings,
  onOpenYear,
}: Props) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [heat, setHeat] = useState<HeatmapData | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    // Moments kept offline go first, so the counts below include them.
    const synced = await syncPending().catch(() => null);
    if (synced) {
      setPending(synced.pending);
    }
    const {from, to} = twelveWeeks();
    try {
      const [h, m] = await Promise.all([getHome(), getHeatmap(from, to)]);
      setHome(h);
      setHeat(m);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!home || !heat) {
    return (
      <Screen title={TITLE} onBack={onBack}>
        {error ? (
          <Pressable onPress={load} style={{marginTop: 20}}>
            <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
          </Pressable>
        ) : (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        )}
      </Screen>
    );
  }

  const room = {today: home.today, yesterday: home.yesterday};
  const full = home.today.at_cap;
  const streak = heat.streak;
  const waiting = pending.filter(p => !p.conflict);
  const conflicts = pending.filter(p => p.conflict);

  return (
    <Screen
      title={TITLE}
      onBack={onBack}
      right={
        <Pressable onPress={onOpenSettings} hitSlop={12} accessibilityRole="button" accessibilityLabel={HOME.settings}>
          <Settings size={20} color={colors.inkFaint} />
        </Pressable>
      }>
      <Text style={type.body}>{HOME.intro}</Text>

      {home.support ? (
        <Card tint={colors.blush}>
          <Text style={{...type.body, color: colors.ink}}>
            {home.support === 'reach_out' ? SUPPORT.reachOut : SUPPORT.break}
          </Text>
          <LinkRow label={SUPPORT.resources} onPress={() => setResourcesOpen(true)} />
        </Card>
      ) : null}

      {waiting.length ? <Text style={{...type.small, marginTop: 14}}>{OFFLINE.pending(waiting.length)}</Text> : null}
      {conflicts.map(p => (
        <Card key={p.moment.client_id} tint={colors.surfaceRaised}>
          <Text style={{...type.body, color: colors.ink}}>
            {(p.conflict!.code === 'daily_cap' ? OFFLINE.conflictCap : OFFLINE.conflictWindow)(shortDate(p.moment.local_date))}
          </Text>
          <View style={{flexDirection: 'row', gap: 20}}>
            {!full ? (
              <LinkRow
                label={OFFLINE.toToday}
                onPress={async () => {
                  await moveToToday(p.moment.client_id);
                  load();
                }}
              />
            ) : null}
            <LinkRow
              label={OFFLINE.letGo}
              onPress={async () => {
                await letGo(p.moment.client_id);
                load();
              }}
            />
          </View>
        </Card>
      ))}

      <Card>
        {full ? (
          <>
            <Text style={{...type.body, color: colors.ink}}>{CAP_MESSAGE}</Text>
            {!home.yesterday.at_cap ? (
              <LinkRow label="Add one for yesterday" onPress={() => onStart('moment', room, home.total_entries)} />
            ) : null}
          </>
        ) : (
          <>
            <PrimaryButton label={HOME.start} onPress={() => onStart('moment', room, home.total_entries)} />
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12}}>
              {TYPES.map(t => (
                <Chip key={t.id} label={t.chip} on={false} onPress={() => onStart(t.id, room, home.total_entries)} />
              ))}
            </View>
          </>
        )}
      </Card>

      {home.follow_ups.map(moment => (
        <Card key={moment.id} tint={colors.sageWash}>
          <Text style={type.heading}>{FOLLOW_UP.title}</Text>
          <Text style={{...type.body, color: colors.ink, marginTop: 4}}>{moment.what_happened}</Text>
          {moment.expected_rating !== null ? (
            <Text style={{...type.small, marginTop: 2, marginBottom: 10}}>{FOLLOW_UP.expected(moment.expected_rating)}</Text>
          ) : null}
          <ScoreScale
            value={ratings[moment.id] ?? null}
            onChange={v => setRatings(r => ({...r, [moment.id]: v}))}
            label={FOLLOW_UP.title}
            low="Not good"
            high="As good as it gets"
          />
          <View style={{marginTop: 10}}>
            <PrimaryButton
              label={FOLLOW_UP.save}
              disabled={ratings[moment.id] == null}
              onPress={async () => {
                await setActual(moment.id, ratings[moment.id]!).catch(() => undefined);
                load();
              }}
            />
          </View>
        </Card>
      ))}

      {home.recent.length ? (
        <View style={{marginTop: 22}}>
          <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
            {HOME.recent}
          </Text>
          {home.recent.map(m => (
            <MomentCard key={m.id} moment={m} onPress={() => onOpenMoment(m.id)} />
          ))}
        </View>
      ) : null}

      {home.memory_lane.length ? (
        <Card tint={colors.surfaceRaised}>
          <Text style={type.heading}>{MEMORY.title}</Text>
          <Text style={{...type.small, marginTop: 2, marginBottom: 10}}>{MEMORY.hint}</Text>
          {home.memory_lane.map(m => (
            <MomentCard key={m.id} moment={m} onPress={() => onOpenMoment(m.id)} />
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={type.label}>
          {streak.current ? STREAK.current(streak.current) : STREAK.fresh(streak.total_days)}
        </Text>
        <Text style={{...type.small, marginTop: 2, marginBottom: 12}}>
          {STREAK.best(streak.best)} · {STREAK.total(streak.total_days)}
        </Text>
        <Heatmap days={heat.days} monthLabels onDayPress={date => onOpenHistory(date)} />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8}}>
          <HeatmapLegend less={STREAK.less} more={STREAK.more} />
          <LinkRow label={STREAK.year} onPress={onOpenYear} />
        </View>
        {heat.days.some(d => d.grace_day) ? <Text style={{...type.tiny, marginTop: 4}}>{STREAK.grace}</Text> : null}
      </Card>

      <View style={{marginTop: 18}}>
        {[
          {label: HOME.history, onPress: () => onOpenHistory()},
          {label: HOME.insights, onPress: onOpenInsights},
        ].map(link => (
          <Pressable
            key={link.label}
            onPress={link.onPress}
            accessibilityRole="button"
            style={{flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.line}}>
            <Text style={{...type.label, flex: 1}}>{link.label}</Text>
            <ChevronRight size={18} color={colors.inkFaint} />
          </Pressable>
        ))}
      </View>

      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </Screen>
  );
}
