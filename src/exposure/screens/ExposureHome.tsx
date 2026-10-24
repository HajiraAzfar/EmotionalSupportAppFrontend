import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';

import Heatmap, {HeatmapLegend} from '../../components/Heatmap';
import PrimaryButton from '../../components/PrimaryButton';
import Screen, {Card, LinkRow} from '../../components/ModuleScreen';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {colors, radius, type} from '../../theme';
import {Heatmap as HeatmapData} from '../../savoring/api';
import {STREAK as SHARED} from '../../savoring/content';
import {twelveWeeks} from '../../savoring/screens/SavoringHome';
import {shortDate} from '../../savoring/components/MomentCard';
import {ExposureHome as HomeData, ExposureMode, ExposureRecord, Ladder, getHeatmap, getHome} from '../api';
import {GENTLE, HOME, STREAK, TITLE} from '../content';
import {LocalDraft, cacheLadders, cachedLadders, localDrafts, reconcileReminders, syncUnsent} from '../storage';

type Props = {
  onBack: () => void;
  onPlan: (mode: ExposureMode, home: HomeData | null, ladders: Ladder[]) => void;
  onContinue: (draft: {local?: LocalDraft; server?: ExposureRecord}, ladders: Ladder[]) => void;
  onOpenLadder: (ladder?: Ladder) => void;
  onOpenRecord: (id: string) => void;
  onOpenHistory: (date?: string) => void;
  onOpenInsights: () => void;
  onOpenExport: () => void;
};

export function ExposureCard({record, onPress}: {record: ExposureRecord; onPress: () => void}) {
  const what = record.step?.description ?? record.planned_activity ?? record.feared_outcome ?? '';
  const status = {completed: 'Done', partial: 'Done in part', skipped: 'Set aside', planned: 'Planned', draft: 'Draft'}[record.status];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${shortDate(record.local_date)}, ${status}: ${what}`}
      style={({pressed}) => ({padding: 14, marginBottom: 8, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface})}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{...type.tiny, flex: 1}}>{shortDate(record.local_date)} · {status.toUpperCase()}</Text>
        {record.peak !== null ? <Text style={type.tiny}>peak {record.peak}</Text> : null}
      </View>
      <Text style={{...type.body, color: colors.ink, marginTop: 4}} numberOfLines={2}>{what}</Text>
      {record.scheduled_for && record.status === 'planned' ? (
        <Text style={{...type.small, marginTop: 2}}>{record.scheduled_for.replace('T', ' at ')}</Text>
      ) : null}
    </Pressable>
  );
}

/** The journal's home: plan (or repeat) a step, plans waiting, the ladders, the gentle signals, the heatmap. */
export default function ExposureHome({onBack, onPlan, onContinue, onOpenLadder, onOpenRecord, onOpenHistory, onOpenInsights, onOpenExport}: Props) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [heat, setHeat] = useState<HeatmapData | null>(null);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [error, setError] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLadders(await cachedLadders());
    await syncUnsent().catch(() => 0);
    setDrafts(await localDrafts());
    const {from, to} = twelveWeeks();
    try {
      const [h, m] = await Promise.all([getHome(), getHeatmap(from, to)]);
      setHome(h);
      setHeat(m);
      setLadders(h.ladders);
      await cacheLadders(h.ladders);
      // A reminder fires only for a plan still waiting.
      await reconcileReminders(new Set(h.planned.map(p => p.client_id ?? '')));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const local = new Set(drafts.map(d => d.clientId));
  const waiting = [...(home?.planned ?? []), ...(home?.drafts ?? [])].filter(r => !r.client_id || !local.has(r.client_id));

  return (
    <Screen title={TITLE} onBack={onBack}>
      <Text style={type.body}>{HOME.intro}</Text>
      <Text style={{...type.small, marginTop: 6}}>{HOME.week}</Text>

      <Card>
        <PrimaryButton label={HOME.plan} onPress={() => onPlan('full', home, ladders)} />
        <Pressable onPress={() => onPlan('quick', home, ladders)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center', marginTop: 6}}>
          <Text style={{...type.link, textAlign: 'center'}}>{HOME.quick}</Text>
        </Pressable>
      </Card>

      {home?.gentle ? (
        <Card tint={colors.blush}>
          <Text style={{...type.body, color: colors.ink}}>{GENTLE.daily}</Text>
        </Card>
      ) : null}
      {home?.pattern ? (
        <Card tint={colors.surfaceRaised}>
          <Text style={{...type.body, color: colors.ink}}>{GENTLE.pattern(home.pattern.step)}</Text>
          <LinkRow label={GENTLE.resources} onPress={() => setResourcesOpen(true)} />
        </Card>
      ) : null}

      {drafts.length || waiting.length ? (
        <View style={{marginTop: 20}}>
          <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>{HOME.drafts}</Text>
          {drafts.map(d => (
            <Card key={d.clientId} tint={colors.sageWash}>
              <Pressable onPress={() => onContinue({local: d}, ladders)} accessibilityRole="button">
                <Text style={type.label} numberOfLines={2}>{d.content.feared_outcome ?? 'An exposure you started'}</Text>
                <Text style={{...type.small, marginTop: 2}}>
                  {d.status === 'planned' ? (d.content.scheduled_for ? `Planned for ${d.content.scheduled_for.replace('T', ' at ')}` : 'Planned') : 'Draft'}
                  {d.unsent ? ' · on this phone' : ''}
                </Text>
              </Pressable>
            </Card>
          ))}
          {waiting.map(r => <ExposureCard key={r.id} record={r} onPress={() => onContinue({server: r}, ladders)} />)}
        </View>
      ) : null}

      <View style={{marginTop: 22}}>
        <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>{HOME.ladders}</Text>
        {ladders.map(l => (
          <Pressable key={l.id} onPress={() => onOpenLadder(l)} accessibilityRole="button"
            style={{padding: 14, marginBottom: 8, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface}}>
            <Text style={type.label}>{l.fear_name}</Text>
            <Text style={{...type.small, marginTop: 2}}>
              {l.steps.length} steps · {l.steps.filter(s => s.completed).length} done
            </Text>
          </Pressable>
        ))}
        <LinkRow label={HOME.newLadder} onPress={() => onOpenLadder()} />
      </View>

      {error ? (
        <Pressable onPress={load} style={{marginTop: 16}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      ) : !home ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 24}} />
      ) : (
        <>
          {home.recent.length ? (
            <View style={{marginTop: 22}}>
              <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>{HOME.recent}</Text>
              {home.recent.map(r => <ExposureCard key={r.id} record={r} onPress={() => onOpenRecord(r.id)} />)}
            </View>
          ) : null}
          {heat ? (
            <Card>
              <Text style={type.label}>{heat.streak.current ? STREAK.current(heat.streak.current) : STREAK.fresh(heat.streak.total_days)}</Text>
              <Text style={{...type.small, marginTop: 2, marginBottom: 12}}>{STREAK.best(heat.streak.best)}</Text>
              <Heatmap days={heat.days} monthLabels onDayPress={date => onOpenHistory(date)} />
              <View style={{marginTop: 8}}>
                <HeatmapLegend less={SHARED.less} more={SHARED.more} />
              </View>
              {heat.days.some(d => d.grace_day) ? <Text style={{...type.tiny, marginTop: 4}}>{SHARED.grace}</Text> : null}
            </Card>
          ) : null}
          <View style={{marginTop: 18}}>
            {[
              {label: HOME.history, onPress: () => onOpenHistory()},
              {label: HOME.insights, onPress: onOpenInsights},
              {label: HOME.export, onPress: onOpenExport},
            ].map(link => (
              <Pressable key={link.label} onPress={link.onPress} accessibilityRole="button"
                style={{flexDirection: 'row', alignItems: 'center', minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.line}}>
                <Text style={{...type.label, flex: 1}}>{link.label}</Text>
                <ChevronRight size={18} color={colors.inkFaint} />
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </Screen>
  );
}
