import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import Screen, {Card} from '../../components/ModuleScreen';
import {colors, radius, type} from '../../theme';
import {ThoughtReport, getReport} from '../api';
import {GENTLE, INSIGHTS} from '../content';
import {localDay} from '../../savoring/api';
import {RecordCard} from './ThoughtHome';

function Bars({rows}: {rows: {name: string; count: number}[]}) {
  const most = Math.max(1, ...rows.map(r => r.count));
  return (
    <View style={{gap: 8, marginTop: 8}}>
      {rows.map(r => (
        <View key={r.name} accessibilityLabel={`${r.name}: ${r.count}`}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={type.small}>{r.name}</Text>
            <Text style={type.small}>{r.count}</Text>
          </View>
          <View style={{height: 8, borderRadius: radius.pill, backgroundColor: colors.line, marginTop: 4}}>
            <View style={{height: 8, borderRadius: radius.pill, backgroundColor: colors.accentSoft, width: `${(100 * r.count) / most}%`}} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** The journal's patterns: counts always, averages from five records that have the ratings. */
export default function InsightsScreen({onBack, onOpenRecord}: {onBack: () => void; onOpenRecord: (id: string) => void}) {
  const [days, setDays] = useState<number>(INSIGHTS.periods[0].days);
  const [report, setReport] = useState<ThoughtReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setReport(null);
    getReport(localDay(-(days - 1)), localDay())
      .then(setReport)
      .catch(e => setError((e as Error).message));
  }, [days]);

  const s = report?.summary;
  const rows: [string, string][] = s
    ? [
        [INSIGHTS.completed, String(s.completed)],
        [INSIGHTS.rate, s.completion_rate === null ? '—' : `${Math.round(s.completion_rate * 100)}%`],
        [INSIGHTS.belief, s.avg_belief_drop === null ? INSIGHTS.waiting : `${s.avg_belief_drop} points`],
        [INSIGHTS.emotion, s.avg_emotion_drop === null ? INSIGHTS.waiting : `${s.avg_emotion_drop} of 100`],
        [INSIGHTS.balanced, s.balanced_belief_avg === null ? INSIGHTS.waiting : `${Math.round(s.balanced_belief_avg)}%`],
        [INSIGHTS.linked, String(s.linked_high_checkins)],
      ]
    : [];

  return (
    <Screen title={INSIGHTS.title} onBack={onBack}>
      <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
        {INSIGHTS.periods.map(p => (
          <Chip key={p.days} label={p.label} on={days === p.days} onPress={() => setDays(p.days)} />
        ))}
      </View>
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!report && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {report ? (
        <>
          <Card>
            {rows.map(([label, value]) => (
              <View key={label} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12}}>
                <Text style={{...type.small, flex: 1}}>{label}</Text>
                <Text style={type.label}>{value}</Text>
              </View>
            ))}
          </Card>
          <Card>
            <Text style={type.label}>{INSIGHTS.patterns}</Text>
            {report.insights ? (
              report.insights.map(line => (
                <Text key={line} style={{...type.body, color: colors.ink, marginTop: 8}}>
                  • {line}
                </Text>
              ))
            ) : (
              <Text style={{...type.body, marginTop: 8}}>{report.locked?.text}</Text>
            )}
          </Card>
          {report.pattern ? (
            <Card tint={colors.surfaceRaised}>
              <Text style={{...type.body, color: colors.ink}}>{GENTLE.pattern(report.pattern.tag, report.pattern.trap)}</Text>
            </Card>
          ) : null}
          {report.traps.length ? (
            <Card>
              <Text style={type.label}>{INSIGHTS.traps}</Text>
              <Bars rows={report.traps} />
            </Card>
          ) : null}
          {report.tags.length ? (
            <Card>
              <Text style={type.label}>{INSIGHTS.tags}</Text>
              <Bars rows={report.tags} />
            </Card>
          ) : null}
          {report.reframes.length ? (
            <View style={{marginTop: 20}}>
              <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
                {INSIGHTS.reframes}
              </Text>
              {report.reframes.map(r => (
                <RecordCard key={r.id} record={r} onPress={() => onOpenRecord(r.id)} />
              ))}
            </View>
          ) : null}
          <Text style={{...type.small, marginTop: 18}}>{INSIGHTS.disclaimer}</Text>
        </>
      ) : null}
    </Screen>
  );
}
