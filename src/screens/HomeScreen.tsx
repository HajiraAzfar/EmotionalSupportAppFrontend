import React, {useCallback, useEffect, useState} from 'react';
import {Image, ImageSourcePropType, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight} from 'lucide-react-native';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {JOURNALS} from './JournalScreen';
import {illustrations} from '../assets/brand';
import {calm} from '../calm/content';
import MoodFace from '../components/MoodFace';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {Insights, getInsights} from '../api/insights';
import {getAccessToken} from '../storage/tokens';
import {colors, font, glass, gradient, moodColours, moodDeep, radius, shadow, space, type} from '../theme';

type Props = {
  // What the user asked to be called, if anything.
  name?: string | null;
  onSignedOut: () => void;
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  // A face tapped on the mood card: start the check-in open now with that mood.
  onCheckInMood: (mood: number) => void;
  onOpenWeekly: () => void;
  onOpenProfile: () => void;
  onOpenLibrary: () => void;
  // Calm opens on its own list, or on its pick-by-need list.
  onOpenCalm: (start?: 'groundYourself') => void;
  onOpenChat: () => void;
};

const MOODS = ['Very low', 'Low', 'Okay', 'Good', 'Very good'];

// The brand brief's names for the three journals with their own tile. The
// check-in starts from the mood card above them.
const LABELS: Partial<Record<JournalType, string>> = {
  thought: 'Thought Journal',
  savouring: 'Saving Journal',
  exposure: 'Exposure Journal',
};
const TILE_JOURNALS = (['thought', 'savouring', 'exposure'] as JournalType[]).map(
  t => JOURNALS.find(j => j.type === t)!,
);

// One gentle line a day, the same all day. Written, not generated, so nothing
// on Home pretends to know how the user is feeling.
const DAILY_MESSAGES = [
  "You don't have to be perfect, just be present.",
  'Small steps still count.',
  'Your feelings make sense, even the hard ones.',
  'Rest is part of the work, not a break from it.',
  'Be as kind to yourself as you would be to a friend.',
  'Noticing a thought is already a step back from it.',
  'Some days are for growing, some are for resting. Both are fine.',
  'You can come back to yourself, one breath at a time.',
  'What you feel today is not who you are forever.',
  'There is no right way to feel today.',
];

function dayOfYear(date: Date) {
  return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
}

function greeting(date: Date) {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function SectionTitle({children}: {children: string}) {
  return (
    <Text accessibilityRole="header" style={{...type.heading, marginTop: 26, marginBottom: 12}}>
      {children}
    </Text>
  );
}

function Tile({
  label,
  hint,
  image,
  onPress,
}: {
  label: string;
  hint?: string;
  image: ImageSourcePropType;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({pressed}) => ({
        ...glass,
        width: '31.5%',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 6,
        borderRadius: radius.card,
        backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
      })}>
      <Image source={image} resizeMode="contain" accessible={false} style={{width: 56, height: 56}} />
      <Text
        numberOfLines={2}
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          lineHeight: 16,
          color: colors.ink,
          marginTop: 8,
          textAlign: 'center',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

// The last seven days as small bars: taller for more entries, in the day's mood colour.
const TRACK = 46;

// The last seven days, today on the right: a soft track per day, filled from
// the bottom by how many entries it had (a third each, full at three), in the
// day's mood colour. Today's letter is darker, so "T T S S" can't be misread.
function WeekBars({days}: {days: {date: string; mood: number | null; entries: number}[]}) {
  const today = days[days.length - 1]?.date;
  return (
    <View testID="week-bars" style={{flexDirection: 'row', alignItems: 'flex-end', gap: 6}} accessible={false}>
      {days.map(day => {
        const mood = day.mood ? Math.round(day.mood) - 1 : null;
        const fill = Math.min(day.entries, 3) / 3;
        const isToday = day.date === today;
        return (
          <View key={day.date} style={{alignItems: 'center', gap: 6}}>
            <View
              style={{
                width: 11,
                height: TRACK,
                borderRadius: radius.pill,
                backgroundColor: colors.accentWash,
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}>
              {fill ? (
                <View
                  style={{
                    height: Math.max(TRACK * fill, 14),
                    borderRadius: radius.pill,
                    backgroundImage:
                      mood === null
                        ? `linear-gradient(180deg, ${colors.accentLight}, ${colors.sage})`
                        : `linear-gradient(180deg, ${moodDeep[mood]}, ${moodColours[mood]})`,
                  }}
                />
              ) : null}
            </View>
            <Text
              style={{
                ...type.tiny,
                fontSize: 10,
                ...(isToday ? {fontFamily: font.semibold, color: colors.ink} : null),
              }}>
              {new Date(`${day.date}T12:00`).toLocaleDateString(undefined, {weekday: 'narrow'})}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HomeScreen({
  name,
  onSignedOut,
  onStartJournal,
  onResumeDraft,
  onCheckInMood,
  onOpenWeekly,
  onOpenProfile,
  onOpenLibrary,
  onOpenCalm,
  onOpenChat,
}: Props) {
  const [draft, setDraft] = useState<EntrySummary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(async () => {
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
  }, [onSignedOut]);

  useEffect(() => {
    load();
  }, [load]);

  const now = new Date();
  const message = DAILY_MESSAGES[dayOfYear(now) % DAILY_MESSAGES.length];
  const days = insights?.streak.days_this_week ?? 0;
  // The server lists only days with an entry, so the seven days are laid out
  // here and an empty day is a grey bar.
  const byDate = new Map((insights?.calendar?.days ?? []).map(d => [d.date, d]));
  const week = insights
    ? Array.from({length: 7}, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return byDate.get(date) ?? {date, mood: null, entries: 0};
      })
    : [];

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        {/* The date, with crisis resources beside it (FR-CRIS-009). */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 14}}>
          <Text style={{...type.tiny, letterSpacing: 1.2, flex: 1}}>
            {now.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'}).toUpperCase()}
          </Text>
          <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
            <Text style={{...type.link, color: colors.alert}}>Get help</Text>
          </Pressable>
        </View>

        {/* Greeting: the time of day, the chosen name (if any), and the day's line. */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14}}>
          <View style={{flex: 1}}>
            <Text style={{...type.title, fontSize: 27}}>
              {greeting(now)}
              {name ? `, ${capitalise(name)}` : ''}
            </Text>
            <Text style={{...type.body, marginTop: 4}}>{message}</Text>
          </View>
          <Pressable
            onPress={onOpenProfile}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.pill,
              backgroundColor: colors.sageWash,
              borderWidth: 2,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadow.sm,
            }}>
            <Text style={{fontFamily: font.serifBold, fontSize: 20, color: colors.accent}}>
              {name ? capitalise(name).charAt(0) : '·'}
            </Text>
          </Pressable>
        </View>

        {/* The check-in, one tap away: the face is its first answer. */}
        <View style={{...glass, borderRadius: radius.card, padding: 16, marginTop: 20}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text accessibilityRole="header" style={{...type.heading, fontSize: 17, flex: 1}}>
              How are you feeling today?
            </Text>
            <Pressable onPress={() => onStartJournal('check_in')} hitSlop={10} accessibilityRole="button">
              <Text style={type.link}>Check-ins</Text>
            </Pressable>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 14}}>
            {MOODS.map((label, i) => (
              <Pressable
                key={label}
                onPress={() => onCheckInMood(i + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Check in: ${label}`}
                style={({pressed}) => ({alignItems: 'center', width: '19%', opacity: pressed ? 0.7 : 1})}>
                <MoodFace level={i + 1} size={46} />
                <Text style={{...type.tiny, marginTop: 6, textAlign: 'center'}} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* FR-HOME-002 */}
        {draft ? (
          <View style={{...glass, borderRadius: radius.card, padding: 16, marginTop: 14}}>
            <Text style={type.label}>Pick up where you left off</Text>
            <Text style={{...type.small, marginTop: 4}} numberOfLines={2}>
              {JOURNAL_TITLES[draft.journal_type] ?? 'Entry'}
              {draft.preview ? `: ${draft.preview}` : ''}
            </Text>
            <Pressable
              onPress={() => onResumeDraft(draft)}
              style={({pressed}) => ({
                alignSelf: 'flex-start',
                marginTop: 12,
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundImage: gradient.primary,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{...type.label, color: colors.onAccent}}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Module 4: the week, stated and not celebrated. The count shows only
            once it has loaded, so a slow network never reads as 0 days. */}
        <Pressable
          onPress={onOpenWeekly}
          accessibilityRole="button"
          accessibilityLabel={`Your week in reflection. ${days} of 7 days with an entry. Opens the report.`}
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            padding: 16,
            borderRadius: radius.card,
            backgroundImage: gradient.lavender,
            borderWidth: 1,
            borderColor: colors.glassEdge,
            opacity: pressed ? 0.85 : 1,
            ...shadow.sm,
          })}>
          <View style={{flex: 1}}>
            <Text style={{...type.heading, fontSize: 17}}>Your week in reflection</Text>
            {insights ? (
              <>
                <Text style={{...type.label, fontSize: 14, marginTop: 6}}>
                  {days === 0 ? 'A fresh week' : `${days} of 7 days with an entry`}
                </Text>
                <Text style={{...type.small, marginTop: 2}}>
                  {days === 0 ? 'Whenever you are ready.' : 'Small steps, noticed.'}
                </Text>
              </>
            ) : null}
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
              <Text style={type.link}>View report</Text>
              <ChevronRight size={14} color={colors.accent} />
            </View>
          </View>
          {week.length ? <WeekBars days={week} /> : null}
        </Pressable>

        {/* AI Chat, with its own card: the companion is one tap from Home. */}
        <Pressable
          onPress={onOpenChat}
          accessibilityRole="button"
          accessibilityLabel="AI Chat"
          accessibilityHint="Talk through what is on your mind."
          style={({pressed}) => ({
            ...glass,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: radius.card,
            backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
          })}>
          <Image source={illustrations.robot} resizeMode="contain" accessible={false} style={{width: 104, height: 73}} />
          <View style={{flex: 1}}>
            <Text style={{...type.heading, fontSize: 17}}>AI Chat</Text>
            <Text style={{...type.small, marginTop: 2}}>Talk through what is on your mind, at your pace.</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
              <Text style={type.link}>Start a chat</Text>
              <ChevronRight size={14} color={colors.accent} />
            </View>
          </View>
        </Pressable>

        <SectionTitle>Quick access</SectionTitle>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12}}>
          {TILE_JOURNALS.map(journal => (
            <Tile
              key={journal.type}
              label={LABELS[journal.type]!}
              hint={journal.blurb}
              image={journal.art}
              onPress={() => onStartJournal(journal.type)}
            />
          ))}
          <Tile label={calm.entry.title} image={illustrations.iconMeditate} onPress={() => onOpenCalm()} />
          <Tile
            label={calm.entry.groundYourself}
            image={illustrations.iconLotus}
            onPress={() => onOpenCalm('groundYourself')}
          />
          <Tile label="Library" image={illustrations.books} onPress={onOpenLibrary} />
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
