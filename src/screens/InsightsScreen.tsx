import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import BackButton from '../components/BackButton';
import BarChart from '../components/insights/BarChart';
import CountGrid, {TRAP_ICONS} from '../components/insights/CountGrid';
import CycleChart from '../components/insights/CycleChart';
import LineChart from '../components/insights/LineChart';
import MoodAreaChart from '../components/insights/MoodAreaChart';
import MoodCalendar from '../components/insights/MoodCalendar';
import ProgressRing from '../components/insights/ProgressRing';
import QuestionnaireForm from '../components/insights/QuestionnaireForm';
import TrendChart from '../components/insights/TrendChart';
import {JOURNAL_TITLES} from '../api/entries';
import {listArticles} from '../api/library';
import {
  CountRow,
  ExposureGroup,
  getInsights,
  Insights,
  ItemTrend,
  Period,
  PERIODS,
  QuestionnaireState,
  Streak,
  declineQuestionnaire,
  rememberPeriod,
  rememberedPeriod,
} from '../api/insights';
import {colors, font, glass, gradient, radius, space, type} from '../theme';

const MOOD_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Very good'];

type Props = {
  onOpenEntry: (entryId: string) => void;
  onStartEntry: () => void;
  // FR-INS-012: a thinking pattern opens its article.
  onOpenArticle: (slug: string) => void;
  onBack: () => void;
};

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        ...glass,
        borderRadius: radius.card,
        padding: 16,
        marginBottom: 14,
      }}>
      {title ? <Text style={type.heading}>{title}</Text> : null}
      {subtitle ? <Text style={{...type.small, marginTop: 2}}>{subtitle}</Text> : null}
      <View style={{marginTop: title ? 14 : 0}}>{children}</View>
    </View>
  );
}

// FR-INS-021: too little recorded yet — say how much more, draw nothing.
function NotEnough({needed, what, plural}: {needed: number; what: string; plural?: string}) {
  return (
    <Text style={type.body}>
      {needed} more {needed === 1 ? what : plural ?? `${what}s`} to show this.
    </Text>
  );
}

// Module 4: days in a row, entries this month, and everything she has finished.
// Facts only — nothing praises a streak or reproaches a broken one.
function EntriesCard({streak, onStartEntry}: {streak: Streak; onStartEntry: () => void}) {
  const goal = streak.weekly_goal;
  return (
    <Card title="Total completed CBT entries">
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 18}}>
        <ProgressRing
          value={streak.total_entries}
          fraction={goal ? Math.min(1, streak.days_this_week / goal) : 1}
        />
        <View style={{flex: 1, gap: 6}}>
          <Text style={type.body}>
            Entries this month: <Text style={{color: colors.ink}}>{streak.entries_this_month}</Text>
          </Text>
          <Text style={type.body}>
            Consistency streak:{' '}
            <Text style={{color: colors.ink}}>
              {streak.current} {streak.current === 1 ? 'day' : 'days'}
            </Text>
            {streak.current > 0 ? ' 🔥' : ''}
          </Text>
          {streak.longest > streak.current ? (
            <Text style={type.small}>Your longest so far is {streak.longest} days.</Text>
          ) : null}
          {goal ? (
            <Text style={type.small}>
              This week: {streak.days_this_week} of {goal} {goal === 1 ? 'day' : 'days'}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onStartEntry}
        style={({pressed}) => ({
          marginTop: 16,
          alignItems: 'center',
          paddingVertical: 13,
          borderRadius: radius.pill,
          backgroundImage: gradient.primary,
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{...type.label, color: colors.onAccent}}>Start new entry</Text>
      </Pressable>
    </Card>
  );
}

// FR-INS-017: offered again only after the set wait, and declining is one tap.
function QuestionnaireOffer({
  onAnswer,
  onDecline,
  busy,
}: {
  onAnswer: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.accentWash,
        borderRadius: radius.card,
        padding: 16,
        marginBottom: 14,
      }}>
      <Text style={type.label}>A few questions, when you have a minute</Text>
      <Text style={{...type.small, marginTop: 4}}>
        Five short questions about the last two weeks. You will not be given a score.
      </Text>
      <View style={{flexDirection: 'row', gap: 10, marginTop: 14}}>
        <Pressable
          onPress={onAnswer}
          disabled={busy}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 12,
            borderRadius: radius.pill,
            backgroundImage: gradient.primary,
            opacity: busy ? 0.5 : 1,
          }}>
          <Text style={{...type.label, color: colors.onAccent}}>Answer them</Text>
        </Pressable>
        <Pressable
          onPress={onDecline}
          disabled={busy}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 12,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.accent,
            opacity: busy ? 0.5 : 1,
          }}>
          <Text style={{...type.label, color: colors.accent}}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

// FR-INS-019: the line carries no numbers, no bands and nothing named.
function QuestionnaireTrend({state}: {state: QuestionnaireState}) {
  if (state.trend.points.length < 2) {
    return (
      <Text style={type.body}>
        {state.trend.needed === 1
          ? 'One more set of answers will show how this has moved.'
          : 'Answering these a couple of times will show how this has moved.'}
      </Text>
    );
  }
  return (
    <LineChart
      points={state.trend.points.map(point => ({date: point.date, value: point.position}))}
      min={0}
      max={1}
      showValues={false}
      height={150}
    />
  );
}

// A trend chart, or a line saying how much more is needed before it says anything.
function Trend({trend, minWeeks}: {trend: ItemTrend; minWeeks: number}) {
  if (trend.weeks.length < minWeeks || !trend.series.length) {
    return (
      <Text style={type.body}>
        {trend.needed > 0
          ? `Another ${trend.needed === 1 ? 'week' : `${trend.needed} weeks`} of entries will show how this changes.`
          : 'Nothing recorded yet.'}
      </Text>
    );
  }
  return <TrendChart weeks={trend.weeks} series={trend.series} />;
}

// FR-INS-006/007/008/010: counts of entries, most first, never percentages.
function Counts({rows}: {rows: CountRow[]}) {
  const highest = Math.max(...rows.map(r => r.count), 1);
  return (
    <View>
      {rows.map(row => (
        <View key={row.id} style={{marginBottom: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
            <Text style={{...type.body, color: colors.ink, flex: 1}}>{row.name}</Text>
            <Text style={type.small}>
              {row.count} {row.count === 1 ? 'entry' : 'entries'}
              {/* FR-INS-011: change against the period before, when there was enough to compare. */}
              {row.change === undefined || row.change === 0
                ? ''
                : `  ·  ${row.change > 0 ? '+' : '−'}${Math.abs(row.change)}`}
            </Text>
          </View>
          <View style={{height: 8, backgroundColor: colors.muted, borderRadius: radius.pill, marginTop: 4}}>
            <View
              style={{
                width: `${(row.count / highest) * 100}%`,
                height: 8,
                backgroundImage: gradient.primary,
                borderRadius: radius.pill,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// FR-INS-013/014: the distress of each cycle, in the order they were completed.
function Exposure({group}: {group: ExposureGroup}) {
  return (
    <View style={{marginBottom: 18}}>
      <Text style={{...type.body, color: colors.ink, marginBottom: 8}}>{group.feared_outcome}</Text>
      {!group.enough ? (
        <Text style={type.small}>One cycle so far — a second one will compare them.</Text>
      ) : (
        <CycleChart cycles={group.cycles} />
      )}
    </View>
  );
}

// SRS 4.10: every view describes what she recorded — nothing here explains,
// predicts, recommends, or compares her with anyone else (FR-INS-020, FR-INS-022).
export default function InsightsScreen({onOpenEntry, onStartEntry, onOpenArticle, onBack}: Props) {
  const [period, setPeriod] = useState<Period>(rememberedPeriod());
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [savingChoice, setSavingChoice] = useState(false);
  const [allTraps, setAllTraps] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const load = useCallback((chosen: Period) => {
    setError('');
    setData(null);
    getInsights(chosen)
      .then(setData)
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  // FR-INS-012: the library knows which article covers a pattern.
  async function openTrapArticle(trap: string) {
    try {
      const found = await listArticles({trap});
      if (found.articles.length) {
        onOpenArticle(found.articles[0].slug);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function declineOffer() {
    setSavingChoice(true);
    try {
      await declineQuestionnaire();
      load(period);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingChoice(false);
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <BackButton onPress={onBack} />
        <View style={{flex: 1}} />
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 40}}>
        <Text style={{...type.title, marginBottom: 16}}>Your emotional journey</Text>

        {/* FR-INS-001: one control, applied to every view below. */}
        <View style={{flexDirection: 'row', gap: 8, marginBottom: 18}}>
          {PERIODS.map(option => {
            const on = option.value === period;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  rememberPeriod(option.value);
                  setPeriod(option.value);
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 9,
                  borderRadius: radius.pill,
                  ...(on ? {backgroundImage: gradient.primary} : {backgroundColor: colors.surfaceRaised}),
                }}>
                <Text
                  style={{
                    ...type.small,
                    fontFamily: on ? font.semibold : font.medium,
                    color: on ? colors.onAccent : colors.inkSoft,
                  }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Pressable onPress={() => load(period)}>
            <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
          </Pressable>
        ) : !data ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        ) : (
          <>
            {data.questionnaire.due && (
              <QuestionnaireOffer
                busy={savingChoice}
                onAnswer={() => setFormOpen(true)}
                onDecline={declineOffer}
              />
            )}

            <Card title="Weekly mood trends" subtitle="Tap a point to open that entry.">
              {data.mood.points.length < data.min_points ? (
                <NotEnough needed={data.mood.needed} what="check-in" />
              ) : (
                <>
                  <MoodAreaChart
                    points={data.mood.points}
                    min={data.mood.min}
                    max={data.mood.max}
                    labels={MOOD_LABELS.slice(1)}
                    onOpenEntry={onOpenEntry}
                  />
                  <Text style={{...type.small, marginTop: 10}}>
                    {data.mood.points.length} moods recorded
                    {data.from ? ` since ${shortDate(data.from)}` : ' in all your history'}.
                  </Text>
                </>
              )}
            </Card>

            <Card title="Thinking traps frequency" subtitle="Recognise your patterns">
              {data.thinking_traps.length ? (
                <>
                  <CountGrid
                    rows={data.thinking_traps}
                    icons={TRAP_ICONS}
                    limit={allTraps ? data.thinking_traps.length : 4}
                    onPress={row => openTrapArticle(row.id)}
                  />
                  <Text style={{...type.tiny, marginTop: 10}}>
                    Tap a pattern to read about it.
                  </Text>
                  {data.thinking_traps.length > 4 && (
                    <Pressable
                      onPress={() => setAllTraps(current => !current)}
                      style={{
                        marginTop: 14,
                        alignItems: 'center',
                        paddingVertical: 11,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: colors.surface,
                      }}>
                      <Text style={type.link}>
                        {allTraps ? 'Show fewer' : `View all ${data.thinking_traps.length} traps`}
                      </Text>
                    </Pressable>
                  )}
                  <View style={{marginTop: 18}}>
                    <Text style={{...type.small, marginBottom: 10}}>Week by week</Text>
                    <Trend trend={data.trap_trend} minWeeks={data.trend_min_weeks} />
                  </View>
                </>
              ) : (
                <Text style={type.body}>Nothing recorded yet.</Text>
              )}
            </Card>

            <Card title="Mood summary calendar">
              {data.calendar.days.length ? (
                <MoodCalendar days={data.calendar.days} labels={MOOD_LABELS.slice(1)} />
              ) : (
                <Text style={type.body}>No finished entries in this period yet.</Text>
              )}
            </Card>

            <EntriesCard streak={data.streak} onStartEntry={onStartEntry} />

            {/* The design shows four cards. These are the other views the SRS
                asks for (FR-INS-006/008/013/016/019) — one tap away, so the
                page stays as drawn without dropping a requirement. */}
            <Pressable
              onPress={() => setShowMore(current => !current)}
              style={{alignItems: 'center', paddingVertical: 14}}>
              <Text style={type.link}>
                {showMore ? 'Show less' : 'Everything else you recorded'}
              </Text>
            </Pressable>

            {showMore ? (
              <>
            <Card title="How strong the feelings were" subtitle="Where you named a feeling.">
              {data.feeling_intensity.points.length < data.min_points ? (
                <NotEnough needed={data.feeling_intensity.needed} what="entry" plural="entries" />
              ) : (
                <LineChart
                  points={data.feeling_intensity.points}
                  min={data.feeling_intensity.min}
                  max={data.feeling_intensity.max}
                  lowLabel="barely there"
                  highLabel="as strong as it gets"
                  onSelect={point => {
                    if (point.entry_id) {
                      onOpenEntry(point.entry_id);
                    }
                  }}
                />
              )}
            </Card>

            <Card title="Mood, week by week" subtitle="The average of each week you wrote in.">
              {data.mood_trend.points.length < data.trend_min_weeks ? (
                <Text style={type.body}>
                  {data.mood_trend.needed === 1
                    ? 'Another week of check-ins will show the trend.'
                    : `Another ${data.mood_trend.needed} weeks of check-ins will show the trend.`}
                </Text>
              ) : (
                <LineChart
                  points={data.mood_trend.points.map(point => ({
                    date: point.week_start,
                    value: point.value,
                  }))}
                  min={data.mood_trend.min}
                  max={data.mood_trend.max}
                  lowLabel={MOOD_LABELS[data.mood_trend.min]}
                  highLabel={MOOD_LABELS[data.mood_trend.max]}
                />
              )}
            </Card>

            <Card title="How your mood was spread" subtitle="How many entries sat at each point.">
              {data.completed_entries ? (
                <BarChart
                  bars={data.mood_distribution.map(row => ({
                    key: String(row.value),
                    label: String(row.value),
                    count: row.count,
                  }))}
                />
              ) : (
                <Text style={type.body}>Nothing recorded yet.</Text>
              )}
            </Card>

            <Card title="What you noted as triggers" subtitle="Week by week, then how often in total.">
              <Trend trend={data.trigger_trend} minWeeks={data.trend_min_weeks} />
              <View style={{marginTop: 16}}>
                {data.triggers.length ? (
                  <Counts rows={data.triggers} />
                ) : (
                  <Text style={type.body}>Nothing recorded yet.</Text>
                )}
              </View>
            </Card>

            <Card title="Feelings you chose">
              {data.feelings.length ? (
                <Counts rows={data.feelings} />
              ) : (
                <Text style={type.body}>Nothing recorded yet.</Text>
              )}
            </Card>

            {data.exposure.length ? (
              <Card title="Distress you recorded, cycle by cycle">
                {data.exposure.map(group => (
                  <Exposure key={group.feared_outcome} group={group} />
                ))}
              </Card>
            ) : null}

            <Card
              title="Your answers over time"
              subtitle="From the short questionnaire. No score is shown — only how your answers have moved.">
              <QuestionnaireTrend state={data.questionnaire} />
            </Card>

            <Card title="When you write" subtitle="Which part of the day your entries were finished in.">
              {data.completed_entries ? (
                <BarChart
                  bars={data.writing_times.map(row => ({
                    key: row.part,
                    label: row.label,
                    count: row.count,
                  }))}
                />
              ) : (
                <Text style={type.body}>Nothing recorded yet.</Text>
              )}
            </Card>

            <Card title="Which journals you used">
              {data.journal_types.length ? (
                data.journal_types.map(row => (
                  <View key={row.journal_type} style={{flexDirection: 'row', marginBottom: 6}}>
                    <Text style={{...type.body, color: colors.ink, flex: 1}}>
                      {JOURNAL_TITLES[row.journal_type] ?? row.journal_type}
                    </Text>
                    <Text style={type.small}>
                      {row.count} {row.count === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={type.body}>Nothing finished yet.</Text>
              )}
            </Card>
              </>
            ) : null}

          </>
        )}
      </ScrollView>

      <QuestionnaireForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onDone={() => {
          setFormOpen(false);
          load(period);
        }}
      />

      <Modal
        visible={resourcesOpen}
        animationType="slide"
        onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}
