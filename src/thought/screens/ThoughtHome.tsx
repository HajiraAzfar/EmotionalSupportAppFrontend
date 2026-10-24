import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, Text, View} from 'react-native';
import {ChevronRight} from 'lucide-react-native';

import Heatmap, {HeatmapLegend} from '../../components/Heatmap';
import Screen, {Card, LinkRow} from '../../components/ModuleScreen';
import CrisisResourcesScreen from '../../screens/CrisisResourcesScreen';
import {colors, radius, type} from '../../theme';
import {RecordMode, ThoughtHome as HomeData, ThoughtRecord, getHeatmap, getHome} from '../api';
import {GENTLE, HOME, STREAK, TITLE} from '../content';
import {LocalDraft, localDrafts, syncFinished} from '../storage';
import {Heatmap as HeatmapData} from '../../savoring/api';
import {STREAK as SHARED} from '../../savoring/content';
import {twelveWeeks} from '../../savoring/screens/SavoringHome';
import {shortDate} from '../../savoring/components/MomentCard';

type Props = {
  onBack: () => void;
  onStart: (mode: RecordMode, home: HomeData | null) => void;
  // A draft to carry on: the phone's own, or one the server keeps (from another phone).
  onContinue: (draft: {local?: LocalDraft; server?: ThoughtRecord}, home: HomeData | null) => void;
  onOpenRecord: (id: string) => void;
  onOpenHistory: (date?: string) => void;
  onOpenInsights: () => void;
  onOpenGrounding?: () => void;
};

export function RecordCard({record, onPress}: {record: ThoughtRecord; onPress: () => void}) {
  const change =
    record.belief_before !== null && record.belief_after !== null ? `${record.belief_before}% → ${record.belief_after}%` : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${shortDate(record.local_date)}: ${record.automatic_thought ?? ''}`}
      style={({pressed}) => ({
        padding: 14,
        marginBottom: 8,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
      })}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{...type.tiny, flex: 1}}>
          {shortDate(record.local_date)}
          {record.situation_tags.length ? ` · ${record.situation_tags.map(t => t.name).join(', ').toUpperCase()}` : ''}
        </Text>
        {change ? <Text style={type.tiny}>{change}</Text> : null}
      </View>
      <Text style={{...type.body, color: colors.ink, marginTop: 4}} numberOfLines={2}>
        “{record.automatic_thought ?? record.situation ?? record.name}”
      </Text>
      {record.balanced_thought ? (
        <Text style={{...type.small, marginTop: 4}} numberOfLines={1}>
          → {record.balanced_thought}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * The Thought Journal's home: start a quick or full record, carry on a draft
 * (a week at most), the gentle signals, the last three, and the heatmap.
 */
export default function ThoughtHome({onBack, onStart, onContinue, onOpenRecord, onOpenHistory, onOpenInsights, onOpenGrounding}: Props) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [heat, setHeat] = useState<HeatmapData | null>(null);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [error, setError] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(async () => {
    setError('');
    await syncFinished().catch(() => 0);
    setDrafts(await localDrafts());
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

  // The phone's drafts first; the server's only when this phone has no copy.
  const local = new Set(drafts.map(d => d.clientId));
  const serverDrafts = (home?.drafts ?? []).filter(d => !d.client_id || !local.has(d.client_id));

  return (
    <Screen title={TITLE} onBack={onBack}>
      <Text style={type.body}>{HOME.intro}</Text>

      <Card>
        <View style={{flexDirection: 'row', gap: 10}}>
          {([['quick', HOME.quick, HOME.quickHint], ['full', HOME.full, HOME.fullHint]] as const).map(([mode, label, hint]) => (
            <Pressable
              key={mode}
              onPress={() => onStart(mode, home)}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${hint}`}
              style={({pressed}) => ({
                flex: 1,
                padding: 14,
                minHeight: 72,
                borderRadius: radius.tile,
                backgroundColor: pressed ? colors.sageWash : colors.surfaceRaised,
                borderWidth: 1,
                borderColor: colors.line,
              })}>
              <Text style={type.label}>{label}</Text>
              <Text style={{...type.small, marginTop: 2}}>{hint}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {home?.gentle ? (
        <Card tint={colors.blush}>
          <Text style={{...type.body, color: colors.ink}}>{GENTLE.daily}</Text>
          {onOpenGrounding ? <LinkRow label={GENTLE.grounding} onPress={onOpenGrounding} /> : null}
        </Card>
      ) : null}
      {home?.pattern ? (
        <Card tint={colors.surfaceRaised}>
          <Text style={{...type.body, color: colors.ink}}>{GENTLE.pattern(home.pattern.tag, home.pattern.trap)}</Text>
          <LinkRow label={GENTLE.resources} onPress={() => setResourcesOpen(true)} />
        </Card>
      ) : null}

      {drafts.length || serverDrafts.length ? (
        <View style={{marginTop: 20}}>
          <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
            {HOME.continue}
          </Text>
          {drafts.map(d => (
            <Card key={d.clientId} tint={colors.sageWash}>
              <Pressable onPress={() => onContinue({local: d}, home)} accessibilityRole="button">
                <Text style={type.label} numberOfLines={2}>
                  {d.content.automatic_thought ?? d.content.situation ?? 'A record you started'}
                </Text>
                <Text style={{...type.small, marginTop: 2}}>
                  {d.complete ? 'Finished on this phone, waiting to be sent' : `${d.mode === 'full' ? 'Full' : 'Quick'} record`}
                </Text>
              </Pressable>
            </Card>
          ))}
          {serverDrafts.map(r => (
            <Card key={r.id} tint={colors.sageWash}>
              <Pressable onPress={() => onContinue({server: r}, home)} accessibilityRole="button">
                <Text style={type.label} numberOfLines={2}>
                  {r.automatic_thought ?? r.situation ?? 'A record you started'}
                </Text>
                <Text style={{...type.small, marginTop: 2}}>{shortDate(r.local_date)}</Text>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : null}

      {error ? (
        <Pressable onPress={load} style={{marginTop: 20}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      ) : !home ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 30}} />
      ) : (
        <>
          {home.recent.length ? (
            <View style={{marginTop: 22}}>
              <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
                {HOME.recent}
              </Text>
              {home.recent.map(r => (
                <RecordCard key={r.id} record={r} onPress={() => onOpenRecord(r.id)} />
              ))}
            </View>
          ) : null}
          {heat ? (
            <Card>
              <Text style={type.label}>
                {heat.streak.current ? STREAK.current(heat.streak.current) : STREAK.fresh(heat.streak.total_days)}
              </Text>
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
        </>
      )}

      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </Screen>
  );
}
