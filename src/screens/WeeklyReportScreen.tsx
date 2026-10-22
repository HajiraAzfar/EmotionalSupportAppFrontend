import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flower2,
  Footprints,
  LayoutGrid,
  Lightbulb,
  LucideIcon,
  Repeat,
  Search,
  Sprout,
} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import FadeIn from '../components/FadeIn';
import PrimaryButton from '../components/PrimaryButton';
import ScreenBackground from '../components/ScreenBackground';
import BarChart from '../components/insights/BarChart';
import CountGrid, {TRAP_ICONS} from '../components/insights/CountGrid';
import LineChart from '../components/insights/LineChart';
import {JournalType} from '../api/entries';
import {
  Badge,
  HelpedCard,
  WeeklyReport,
  WeekSummary,
  getWeek,
  getWeeks,
  saveReflection,
  weekLabel,
} from '../api/weekly';
import {colors, glass, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
  onOpenEntry: (entryId: string, journalType: JournalType) => void;
};

// The badge icons, by the name stored in content/badges.json.
const BADGE_ICONS: Record<string, LucideIcon> = {
  Footprints,
  CalendarCheck,
  LayoutGrid,
  Search,
  Lightbulb,
  Repeat,
  Flower2,
  Eye,
  Sprout,
};

const REFLECTION_MAX = 300;

function Card({title, subtitle, children}: {title?: string; subtitle?: string; children: React.ReactNode}) {
  return (
    <View style={{...glass, borderRadius: radius.card, padding: 16, marginBottom: 14}}>
      {title ? <Text style={type.heading}>{title}</Text> : null}
      {subtitle ? <Text style={{...type.small, marginTop: 2}}>{subtitle}</Text> : null}
      <View style={{marginTop: title ? 14 : 0}}>{children}</View>
    </View>
  );
}

// One number and what it counts. Only shown when there is something to count:
// a row of zeros reads as a list of things she failed to do.
function Kpi({value, label}: {value: number; label: string}) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '30%',
        backgroundColor: colors.glass,
        borderRadius: radius.tile,
        paddingVertical: 12,
        paddingHorizontal: 10,
        ...shadow.sm,
      }}>
      <Text style={{...type.title, fontSize: 22}}>{value}</Text>
      <Text style={{...type.tiny, marginTop: 2}}>{label}</Text>
    </View>
  );
}

function Glance({report}: {report: WeeklyReport}) {
  const o = report.overview;
  const tiles: {value: number; label: string}[] = [
    {value: o.entries, label: 'entries'},
    {value: o.check_in, label: 'check-ins'},
    {value: o.thought, label: 'thought records'},
    {value: o.savouring, label: 'moments kept'},
    {value: o.exposure_attempted, label: 'steps tried'},
    {value: o.learnings, label: 'things noticed'},
  ].filter(tile => tile.value > 0);

  if (!tiles.length) {
    return null;
  }
  return (
    <Card title="Your week at a glance">
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
        {tiles.map(tile => (
          <Kpi key={tile.label} value={tile.value} label={tile.label} />
        ))}
      </View>
      {o.exposure_planned > o.exposure_attempted ? (
        <Text style={{...type.small, marginTop: 12}}>
          {o.exposure_planned - o.exposure_attempted} step
          {o.exposure_planned - o.exposure_attempted === 1 ? '' : 's'} you planned and have not come back
          to yet. That is still yours whenever you want it.
        </Text>
      ) : null}
    </Card>
  );
}

function Helped({cards, onOpenEntry}: {cards: HelpedCard[]; onOpenEntry: Props['onOpenEntry']}) {
  if (!cards.length) {
    return null;
  }
  return (
    <Card title="What helped you" subtitle="Things you wrote down for yourself.">
      <View style={{gap: 12}}>
        {cards.map(card => (
          <View
            key={card.entry_id + card.kind}
            style={{
              backgroundColor: colors.glass,
              borderRadius: radius.tile,
              padding: 14,
              ...shadow.sm,
            }}>
            <Text style={type.label}>{card.title}</Text>
            <Text style={{...type.tiny, marginTop: 2}}>{card.blurb}</Text>
            <Text style={{...type.body, marginTop: 8}}>“{card.text}”</Text>
            <Pressable
              onPress={() => onOpenEntry(card.entry_id, card.journal_type)}
              hitSlop={8}
              accessibilityRole="button">
              <Text style={{...type.link, marginTop: 10}}>View reflection</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Badges({badges}: {badges: Badge[]}) {
  if (!badges.length) {
    return null;
  }
  return (
    <Card title={badges.length === 1 ? 'A new badge' : 'New badges'}>
      <View style={{gap: 12}}>
        {badges.map((badge, index) => {
          const Icon = BADGE_ICONS[badge.icon] ?? Sprout;
          return (
            <FadeIn key={badge.id} order={index}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accentWash,
                  }}>
                  <Icon size={21} color={colors.accent} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={type.label}>{badge.name}</Text>
                  <Text style={{...type.small, marginTop: 1}}>{badge.description}</Text>
                  <Text style={{...type.tiny, marginTop: 3}}>{badge.how}</Text>
                </View>
              </View>
            </FadeIn>
          );
        })}
      </View>
    </Card>
  );
}

function Carry({
  weekStart,
  saved,
  onSaved,
}: {
  weekStart: string;
  saved: string | null;
  onSaved: (text: string | null) => void;
}) {
  const [text, setText] = useState(saved ?? '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setText(saved ?? '');
    setDone(false);
  }, [saved, weekStart]);

  async function save() {
    setBusy(true);
    try {
      const result = await saveReflection(weekStart, text);
      onSaved(result.text ?? null);
      setDone(true);
    } catch {
      // Keeping what she typed matters more than reporting the failure loudly.
      setDone(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Carry into next week"
      subtitle="One thing you would like to understand, practise, or make space for.">
      <TextInput
        value={text}
        onChangeText={value => {
          setText(value);
          setDone(false);
        }}
        placeholder="Only if you want to."
        placeholderTextColor={colors.inkFaint}
        multiline
        maxLength={REFLECTION_MAX}
        style={{
          ...type.input,
          color: colors.ink,
          backgroundColor: colors.glass,
          borderRadius: radius.input,
          padding: 12,
          minHeight: 72,
          textAlignVertical: 'top',
        }}
      />
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12}}>
        <PrimaryButton
          label={saved ? 'Update' : 'Save'}
          onPress={save}
          busy={busy}
          disabled={text.trim() === (saved ?? '')}
        />
        {done ? <Text style={type.small}>Saved. You will see it next week.</Text> : null}
      </View>
    </Card>
  );
}

export default function WeeklyReportScreen({onBack, onOpenEntry}: Props) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [week, setWeek] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async (which?: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getWeek(which);
      setReport(data);
      setWeek(data.week_start);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getWeeks()
      .then(data => setWeeks(data.weeks))
      .catch(() => setWeeks([]));
  }, [load]);

  function shift(days: number) {
    if (!report) {
      return;
    }
    const moved = new Date(`${report.week_start}T00:00:00`);
    moved.setDate(moved.getDate() + days);
    load(moved.toISOString().slice(0, 10));
  }

  const body = () => {
    if (loading) {
      return <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />;
    }
    if (error || !report) {
      return (
        <Card>
          <Text style={type.body}>{error || 'That week could not be opened.'}</Text>
          <Pressable onPress={() => load(week)} hitSlop={8} accessibilityRole="button">
            <Text style={{...type.link, marginTop: 10}}>Try again</Text>
          </Pressable>
        </Card>
      );
    }

    const quiet = report.overview.entries === 0;
    const traps = report.journals.thought.patterns;

    return (
      <>
        {report.carried_in ? (
          <Card>
            <Text style={type.small}>What you wanted to carry into this week</Text>
            <Text style={{...type.body, marginTop: 4}}>“{report.carried_in}”</Text>
          </Card>
        ) : null}

        {quiet ? (
          <Card title="A quiet week">
            <Text style={type.body}>
              Nothing was saved in this week, so there is nothing to show you. That is allowed — a week
              without entries is not a week you got wrong.
            </Text>
          </Card>
        ) : null}

        <Glance report={report} />

        {report.mood.points.length ? (
          <Card title="How you rated your mood" subtitle="One point for each time you recorded it.">
            <LineChart
              points={report.mood.points}
              min={report.mood.min}
              max={report.mood.max}
              lowLabel="Very low"
              highLabel="Very good"
              onSelect={point =>
                point.entry_id &&
                onOpenEntry(
                  point.entry_id,
                  report.mood.points.find(p => p.entry_id === point.entry_id)!.journal_type,
                )
              }
            />
            <Text style={{...type.small, marginTop: 10}}>
              Days you did not rate are left out rather than filled in. Tap a point to open that entry.
            </Text>
          </Card>
        ) : null}

        {report.feeling_intensity.points.length ? (
          <Card
            title="How strong the feeling was"
            subtitle="Recorded separately from your mood, and not the same thing.">
            <LineChart
              points={report.feeling_intensity.points}
              min={report.feeling_intensity.min}
              max={report.feeling_intensity.max}
              lowLabel="Mild"
              highLabel="Very strong"
            />
          </Card>
        ) : null}

        {report.feelings.length ? (
          <Card
            title="Feelings you recorded"
            subtitle="How often each came up — not how strong it was.">
            <BarChart
              bars={report.feelings.slice(0, 6).map(row => ({
                key: row.id,
                label: row.name,
                count: row.count,
              }))}
            />
          </Card>
        ) : null}

        <Card title="Know your week" subtitle="Written from what you saved, nothing else.">
          {report.narrative ? (
            <Text style={type.body}>{report.narrative}</Text>
          ) : (
            <Text style={type.body}>
              {quiet || report.overview.entries < 2
                ? 'There is not enough here yet to say anything worth reading. A couple more entries and this will have something to work with.'
                : 'This part could not be written just now. Everything above is still your week.'}
            </Text>
          )}
        </Card>

        {traps.length ? (
          <Card
            title="Patterns you picked out"
            subtitle="The ones you named yourself in your thought records.">
            <CountGrid rows={traps} icons={TRAP_ICONS} />
          </Card>
        ) : null}

        <Helped cards={report.helped} onOpenEntry={onOpenEntry} />

        {report.wins.length ? (
          <Card title="Your small wins" subtitle="Things you did, not how you felt about them.">
            <View style={{gap: 10}}>
              {report.wins.map((win, index) => (
                <FadeIn key={win.id} order={index}>
                  <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 10}}>
                    <Text style={{...type.label, color: colors.accent}}>{win.count}</Text>
                    <View style={{flex: 1}}>
                      <Text style={type.label}>{win.title}</Text>
                      <Text style={type.tiny}>{win.detail}</Text>
                    </View>
                  </View>
                </FadeIn>
              ))}
            </View>
          </Card>
        ) : null}

        <Badges badges={report.badges.new} />

        <Carry
          weekStart={report.week_start}
          saved={report.reflection}
          onSaved={text => setReport({...report, reflection: text})}
        />
      </>
    );
  };

  return (
    <View style={{flex: 1}}>
      <ScreenBackground />
      <SafeAreaView style={{flex: 1}} edges={['top']}>
        <View style={{paddingHorizontal: space.screen, paddingTop: 8}}>
          <BackButton onPress={onBack} />
          <Text style={{...type.title, marginTop: 10}}>Your Week in Reflection</Text>
          <Text style={{...type.small, marginTop: 4}}>
            A little time to understand what your week was really like.
          </Text>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14}}>
            <Pressable onPress={() => shift(-7)} hitSlop={8} accessibilityRole="button"
                       accessibilityLabel="The week before">
              <ChevronLeft size={22} color={colors.accent} />
            </Pressable>
            <Text style={{...type.label, flex: 1, textAlign: 'center'}}>
              {report ? weekLabel(report.week_start, report.week_end) : ' '}
            </Text>
            <Pressable
              onPress={() => shift(7)}
              disabled={!report || report.is_current}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="The week after">
              <ChevronRight
                size={22}
                color={!report || report.is_current ? colors.inkFaint : colors.accent}
              />
            </Pressable>
          </View>

          {weeks.length > 1 ? (
            <Pressable onPress={() => setShowHistory(v => !v)} hitSlop={8} accessibilityRole="button">
              <Text style={{...type.link, marginTop: 10, textAlign: 'center'}}>
                {showHistory ? 'Hide earlier weeks' : 'Earlier weeks'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {showHistory ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: space.screen, gap: 8, paddingVertical: 12}}>
            {weeks.map(summary => {
              const open = summary.week_start === report?.week_start;
              return (
                <Pressable
                  key={summary.week_start}
                  onPress={() => {
                    setShowHistory(false);
                    load(summary.week_start);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                    backgroundColor: open ? colors.accent : colors.glass,
                    ...shadow.sm,
                  }}>
                  <Text style={{...type.small, color: open ? colors.onAccent : colors.ink}}>
                    {weekLabel(summary.week_start, summary.week_end)}
                  </Text>
                  <Text style={{...type.tiny, color: open ? colors.onAccent : colors.inkFaint}}>
                    {summary.entries === 1 ? '1 entry' : `${summary.entries} entries`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: space.screen,
            paddingTop: 16,
            paddingBottom: 40,
          }}>
          {body()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
