import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, Switch, Text, View} from 'react-native';
import {Heart} from 'lucide-react-native';

import Chip from '../../components/chat/Chip';
import PrimaryButton from '../../components/PrimaryButton';
import Screen, {Card, LinkRow} from '../../components/ModuleScreen';
import {colors, type} from '../../theme';
import {localDay} from '../../savoring/api';
import {shortDate} from '../../savoring/components/MomentCard';
import {ExposureRecord, ExposureReport, deleteRecord, exportData, getRecord, getReport, listRecords, setFavorite} from '../api';
import {EXPORT, INSIGHTS, OCCURRED, SCREENING} from '../content';
import {ExposureCard} from './ExposureHome';

// ---- the one-time screening note ----

export function ScreeningScreen({professional, onBack, onContinue}: {professional: boolean; onBack: () => void; onContinue: () => void}) {
  return (
    <Screen title={SCREENING.title} onBack={onBack}>
      <Text style={{...type.body, color: colors.ink, marginTop: 8}}>{SCREENING.body}</Text>
      {professional ? (
        <Card tint={colors.blush}>
          <Text style={{...type.body, color: colors.ink}}>{SCREENING.professional}</Text>
        </Card>
      ) : null}
      <Text style={{...type.body, marginTop: 14}}>{SCREENING.pace}</Text>
      <View style={{marginTop: 24}}>
        <PrimaryButton label={SCREENING.ok} onPress={onContinue} />
      </View>
    </Screen>
  );
}

// ---- history ----

export function HistoryScreen({onBack, onOpenRecord, date: initialDate}: {onBack: () => void; onOpenRecord: (id: string) => void; date?: string}) {
  const [records, setRecords] = useState<ExposureRecord[] | null>(null);
  const [error, setError] = useState('');
  const [date, setDate] = useState(initialDate ?? null);
  const [favorites, setFavorites] = useState(false);

  useEffect(() => {
    listRecords().then(setRecords).catch(e => setError((e as Error).message));
  }, []);

  const shown = (records ?? []).filter(r => (!date || r.local_date === date) && (!favorites || r.is_favorite));
  return (
    <Screen title="Your exposures" onBack={onBack}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
        <Chip label="Favourites" on={favorites} onPress={() => setFavorites(v => !v)} />
        {date ? <Chip label={shortDate(date)} on removable onPress={() => setDate(null)} /> : null}
      </View>
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!records && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {records && !shown.length ? <Text style={{...type.body, marginTop: 24}}>No exposures here yet.</Text> : null}
      <View style={{marginTop: 16}}>
        {shown.map(r => <ExposureCard key={r.id} record={r} onPress={() => onOpenRecord(r.id)} />)}
      </View>
    </Screen>
  );
}

// ---- one record ----

function Line({label, value}: {label: string; value: string | null | undefined}) {
  if (!value) {
    return null;
  }
  return (
    <View style={{borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10}}>
      <Text style={type.tiny}>{label.toUpperCase()}</Text>
      <Text style={{...type.body, color: colors.ink, marginTop: 2}}>{value}</Text>
    </View>
  );
}

export function RecordScreen({id, onBack, onCorrect}: {id: string; onBack: () => void; onCorrect: (r: ExposureRecord) => void}) {
  const [record, setRecord] = useState<ExposureRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRecord(id).then(setRecord).catch(e => setError((e as Error).message));
  }, [id]);

  if (!record) {
    return (
      <Screen onBack={onBack}>
        {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />}
      </Screen>
    );
  }
  const n = (v: number | null) => (v === null ? null : String(v));
  return (
    <Screen
      onBack={onBack}
      right={
        <Pressable onPress={async () => setRecord(await setFavorite(record.id, !record.is_favorite).catch(() => record))} hitSlop={12}
          accessibilityRole="switch" accessibilityState={{checked: record.is_favorite}} accessibilityLabel="Keep as a favourite">
          <Heart size={20} color={colors.alert} fill={record.is_favorite ? colors.alert : 'transparent'} />
        </Pressable>
      }>
      <Text style={type.tiny}>
        {shortDate(record.local_date)}{record.legacy ? ' · AN OLDER RECORD (0-10, SHOWN ×10)' : ''}{record.edited_at ? ' · EDITED LATER' : ''}
      </Text>
      <Text accessibilityRole="header" style={{...type.title, marginTop: 6}}>{record.step?.description ?? record.planned_activity}</Text>
      <View style={{marginTop: 16}}>
        <Line label="The fear" value={record.feared_outcome} />
        <Line label="Predicted likelihood" value={record.predicted_likelihood !== null ? `${record.predicted_likelihood}%` : null} />
        <Line label="Did it happen" value={record.outcome_occurred ? OCCURRED[record.outcome_occurred] : null} />
        <Line label="Anxiety: predicted, peak, end"
          value={[n(record.predicted_anxiety ?? record.before), n(record.peak), n(record.end)].some(Boolean)
            ? `${n(record.predicted_anxiety ?? record.before) ?? '—'}, ${n(record.peak) ?? '—'}, ${n(record.end) ?? '—'}` : null} />
        <Line label="Safety behaviours to drop" value={record.safety_behaviors_planned.map(s => s.name).join(', ')} />
        <Line label="Safety behaviours used" value={record.safety_behaviors_used.map(s => s.name).join(', ')} />
        <Line label="What happened" value={record.what_happened} />
        <Line label="What you learned" value={record.learning} />
        <Line label="Next" value={record.next_step?.replace('_', ' ')} />
      </View>
      <View style={{flexDirection: 'row', gap: 24, marginTop: 18}}>
        <LinkRow label="Correct it" onPress={() => onCorrect(record)} />
        <Pressable accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}
          onPress={() => Alert.alert('Delete this exposure?', 'It will be gone for good.', [
            {text: 'Keep it', style: 'cancel'},
            {text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecord(record.id).catch(() => undefined); onBack(); }},
          ])}>
          <Text style={{...type.link, color: colors.alert}}>Delete</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

// ---- insights ----

export function InsightsScreen({onBack}: {onBack: () => void}) {
  const [days, setDays] = useState<number>(INSIGHTS.periods[0].days);
  const [report, setReport] = useState<ExposureReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setReport(null);
    getReport(localDay(-(days - 1)), localDay()).then(setReport).catch(e => setError((e as Error).message));
  }, [days]);

  const s = report?.summary;
  const or = (v: number | null, f: (v: number) => string) => (v === null ? INSIGHTS.waiting : f(v));
  return (
    <Screen title={INSIGHTS.title} onBack={onBack}>
      <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
        {INSIGHTS.periods.map(p => <Chip key={p.days} label={p.label} on={days === p.days} onPress={() => setDays(p.days)} />)}
      </View>
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!report && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {report && s ? (
        <>
          <Card>
            {([
              [INSIGHTS.done, String(s.done)],
              [INSIGHTS.partial, String(s.partial)],
              [INSIGHTS.skipped, String(s.skipped)],
              [INSIGHTS.steps, `${s.steps_attempted} / ${s.steps_completed}`],
              [INSIGHTS.highest, s.highest_step ? `${s.highest_step.description} (${s.highest_step.expected_suds})` : '—'],
              [INSIGHTS.likelihood, report.prediction.predicted_likelihood === null ? INSIGHTS.waiting
                : `${Math.round(report.prediction.predicted_likelihood)}% / ${Math.round(report.prediction.outcome_rate!)}%`],
              [INSIGHTS.anxiety, or(report.anxiety.peak, () => `${report.anxiety.predicted ?? '—'} / ${report.anxiety.peak} / ${report.anxiety.end ?? '—'}`)],
            ] as [string, string][]).map(([label, value]) => (
              <View key={label} style={{flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6}}>
                <Text style={{...type.small, flex: 1}}>{label}</Text>
                <Text style={{...type.label, flexShrink: 1, textAlign: 'right'}}>{value}</Text>
              </View>
            ))}
          </Card>
          <Card>
            <Text style={type.label}>{INSIGHTS.patterns}</Text>
            {report.insights ? report.insights.map(line => (
              <Text key={line} style={{...type.body, color: colors.ink, marginTop: 8}}>• {line}</Text>
            )) : <Text style={{...type.body, marginTop: 8}}>{report.locked?.text}</Text>}
          </Card>
          {report.repeats.length ? (
            <Card>
              <Text style={type.label}>{INSIGHTS.repeats}</Text>
              {report.repeats.map(r => (
                <Text key={r.step} style={{...type.small, marginTop: 6}}>{`${r.step}: peak ${r.first_peak} → ${r.last_peak} over ${r.attempts} tries`}</Text>
              ))}
            </Card>
          ) : null}
          {report.safety_planned.length || report.safety_used.length ? (
            <Card>
              <Text style={type.label}>{INSIGHTS.safety}</Text>
              {report.safety_planned.map(b => (
                <Text key={b.name} style={{...type.small, marginTop: 6}}>
                  {`${b.name}: ${b.count} / ${report.safety_used.find(u => u.name === b.name)?.count ?? 0}`}
                </Text>
              ))}
            </Card>
          ) : null}
          <Text style={{...type.small, marginTop: 18}}>{INSIGHTS.disclaimer}</Text>
        </>
      ) : null}
    </Screen>
  );
}

// ---- export, with its consent ----

export function ExportScreen({onBack}: {onBack: () => void}) {
  const [notes, setNotes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  return (
    <Screen title={EXPORT.title} onBack={onBack}>
      <Text style={type.body}>{EXPORT.body}</Text>
      <Card>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <View style={{flex: 1}}>
            <Text style={type.label}>{EXPORT.notes}</Text>
            <Text style={{...type.small, marginTop: 2}}>{EXPORT.notesHint}</Text>
          </View>
          <Switch value={notes} onValueChange={setNotes} accessibilityLabel={EXPORT.notes}
            trackColor={{true: colors.accentSoft, false: colors.muted}} thumbColor={notes ? colors.accent : colors.surface} />
        </View>
      </Card>
      <Text style={{...type.label, marginTop: 18}}>{EXPORT.disclaimer}</Text>
      <View style={{marginTop: 16}}>
        <PrimaryButton label={EXPORT.button} busy={busy} onPress={async () => {
          setBusy(true);
          setResult('');
          try {
            setResult(EXPORT.saved(await exportData(notes)));
          } catch (e) {
            setResult((e as Error).message);
          } finally {
            setBusy(false);
          }
        }} />
      </View>
      {result ? <Text style={{...type.small, marginTop: 12}}>{result}</Text> : null}
    </Screen>
  );
}
