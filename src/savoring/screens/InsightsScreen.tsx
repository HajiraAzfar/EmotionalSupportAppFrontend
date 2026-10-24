import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import PrimaryButton from '../../components/PrimaryButton';
import {colors, radius, type} from '../../theme';
import {Counted, SavoringReport, getReport, localDay} from '../api';
import {INSIGHTS} from '../content';
import MomentCard, {shortDate} from '../components/MomentCard';
import Screen, {Card} from '../../components/ModuleScreen';

type Props = {
  onBack: () => void;
  onOpenMoment: (id: string) => void;
  onExport: () => void;
};

// A count as a bar, with the number beside it: the length is never the only cue.
function Bars({rows}: {rows: Counted[]}) {
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

function Section({title, hint, children}: {title: string; hint?: string; children: React.ReactNode}) {
  return (
    <Card>
      <Text style={type.label}>{title}</Text>
      {hint ? <Text style={{...type.tiny, marginTop: 2}}>{hint}</Text> : null}
      {children}
    </Card>
  );
}

/**
 * The Saving Journal's patterns for a stretch of days: counts always, and
 * once there are enough moments, a few sentences worded as patterns.
 */
export default function InsightsScreen({onBack, onOpenMoment, onExport}: Props) {
  const [days, setDays] = useState<number>(INSIGHTS.periods[0].days);
  const [report, setReport] = useState<SavoringReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setReport(null);
    setError('');
    getReport(localDay(-(days - 1)), localDay())
      .then(setReport)
      .catch(e => setError((e as Error).message));
  }, [days]);

  const s = report?.summary;
  return (
    <Screen title={INSIGHTS.title} onBack={onBack}>
      <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
        {INSIGHTS.periods.map(p => (
          <Chip key={p.days} label={p.label} on={days === p.days} onPress={() => setDays(p.days)} />
        ))}
      </View>
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 20}}>{error}</Text> : null}
      {!report && !error ? <ActivityIndicator color={colors.accent} style={{marginTop: 40}} /> : null}
      {report && s ? (
        <>
          <Card>
            {[
              [INSIGHTS.days, String(s.days_with_entries)],
              [INSIGHTS.perDay, String(s.avg_per_active_day)],
              [INSIGHTS.lift, s.avg_mood_lift !== null ? `${s.avg_mood_lift > 0 ? '+' : ''}${s.avg_mood_lift}` : INSIGHTS.liftNone],
            ].map(([label, value]) => (
              <View key={label} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6}}>
                <Text style={type.small}>{label}</Text>
                <Text style={type.label}>{value}</Text>
              </View>
            ))}
          </Card>

          <Section title={INSIGHTS.patterns}>
            {report.insights ? (
              report.insights.map(line => (
                <Text key={line} style={{...type.body, color: colors.ink, marginTop: 8}}>
                  • {line}
                </Text>
              ))
            ) : (
              <Text style={{...type.body, marginTop: 8}}>{report.locked?.text}</Text>
            )}
          </Section>

          {report.emotions.length ? (
            <Section title={INSIGHTS.emotions}>
              <Bars rows={report.emotions} />
            </Section>
          ) : null}
          {report.categories.length ? (
            <Section title={INSIGHTS.categories}>
              <Bars rows={report.categories} />
            </Section>
          ) : null}
          {report.people.length ? (
            <Section title={INSIGHTS.people}>
              <Bars rows={report.people} />
            </Section>
          ) : null}
          {report.places.length ? (
            <Section title={INSIGHTS.places}>
              <Bars rows={report.places} />
            </Section>
          ) : null}
          {s.entries_total ? (
            <Section title={INSIGHTS.timeOfDay}>
              <Bars rows={Object.entries(report.time_of_day).map(([name, count]) => ({name, count}))} />
            </Section>
          ) : null}
          {report.techniques.length ? (
            <Section title={INSIGHTS.techniques} hint={INSIGHTS.techniquesHint}>
              {report.techniques.map(t => (
                <View key={t.name} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6}}>
                  <Text style={type.small}>{t.name}</Text>
                  <Text style={type.label}>{`${t.avg_lift > 0 ? '+' : ''}${t.avg_lift}`}</Text>
                </View>
              ))}
            </Section>
          ) : null}
          {report.anticipation ? (
            <Section title={INSIGHTS.anticipation}>
              <Text style={{...type.body, color: colors.ink, marginTop: 8}}>
                {`Expected ${report.anticipation.expected}/10, really ${report.anticipation.actual}/10`}
              </Text>
            </Section>
          ) : null}
          {report.weeks.some(w => w.checkin_mood !== null) ? (
            <Section title={INSIGHTS.weeks} hint={INSIGHTS.weeksHint}>
              {report.weeks.map(w => (
                <View key={w.week_start} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4}}>
                  <Text style={type.small}>{shortDate(w.week_start)}</Text>
                  <Text style={type.small}>
                    {`${w.savoring_days} ${w.savoring_days === 1 ? 'day' : 'days'} · mood ${w.checkin_mood ?? '—'}`}
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}
          {report.highlights.length ? (
            <View style={{marginTop: 20}}>
              <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
                {INSIGHTS.highlights}
              </Text>
              {report.highlights.map(m => (
                <MomentCard key={m.id} moment={m} onPress={() => onOpenMoment(m.id)} />
              ))}
            </View>
          ) : null}
          <Text style={{...type.small, marginTop: 18}}>{INSIGHTS.disclaimer}</Text>
          <View style={{marginTop: 14}}>
            <PrimaryButton label={INSIGHTS.export} onPress={onExport} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
