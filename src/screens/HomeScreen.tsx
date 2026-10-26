import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, Footprints, LucideIcon, MessageCircle, Wind} from 'lucide-react-native';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {JOURNALS} from './JournalScreen';
import {brandImages} from '../assets/brand';
import {calm} from '../calm/content';
import ProgressRing from '../components/insights/ProgressRing';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {Insights, getInsights} from '../api/insights';
import {getAccessToken} from '../storage/tokens';
import {cardTints, colors, glass, gradient, radius, shadow, space, type} from '../theme';

type Props = {
  // What the user asked to be called, if anything.
  name?: string | null;
  onSignedOut: () => void;
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenInsights: () => void;
  // Calm opens on its own list, or on its pick-by-need list.
  onOpenCalm: (start?: 'groundYourself') => void;
  onOpenChat: () => void;
};

// The brand brief's names for the four structured journals on Home. Free
// write stays in the Journal tab.
const LABELS: Partial<Record<JournalType, string>> = {
  check_in: 'Check-in',
  savouring: 'Saving Journal',
  thought: 'Thought Journal',
  exposure: 'Exposure Journal',
};
const QUICK = JOURNALS.filter(journal => LABELS[journal.type]);

// Each quick action's soft fill, as on the brand board.
const TINTS: Partial<Record<JournalType, {bg: string; icon: string}>> = {
  check_in: cardTints[3],
  savouring: cardTints[2],
  thought: cardTints[0],
  exposure: cardTints[1],
};

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

function SectionTitle({children}: {children: string}) {
  return (
    <Text accessibilityRole="header" style={{...type.heading, marginTop: 26, marginBottom: 12}}>
      {children}
    </Text>
  );
}

function QuickTool({label, Icon, onPress}: {label: string; Icon: LucideIcon; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({pressed}) => ({
        ...glass,
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderRadius: radius.card,
        backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
      })}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: colors.sageWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={20} color={colors.accent} />
      </View>
      <Text style={{...type.tiny, color: colors.ink, marginTop: 8, textAlign: 'center'}} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({
  name,
  onSignedOut,
  onStartJournal,
  onResumeDraft,
  onOpenInsights,
  onOpenCalm,
  onOpenChat,
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

  const now = new Date();
  const message = DAILY_MESSAGES[dayOfYear(now) % DAILY_MESSAGES.length];
  const days = insights?.streak.days_this_week ?? 0;

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        {/* Greeting: the time of day, the user's chosen name (if any), and the
            date; crisis resources beside it (FR-CRIS-009). */}
        <View style={{flexDirection: 'row', alignItems: 'flex-start', marginTop: 16}}>
          <View style={{flex: 1}}>
            <Text style={{...type.title, fontSize: 27}}>
              {greeting(now)}
              {name ? `, ${name}` : ''}
            </Text>
            <Text style={{...type.small, marginTop: 4}}>
              {now.toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}
            </Text>
          </View>
          <Pressable
            onPress={() => setResourcesOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            style={{paddingTop: 6, paddingLeft: 12}}>
            <Text style={{...type.link, color: colors.alert}}>Get help</Text>
          </Pressable>
        </View>

        {/* The day's gentle line, with the brand's sage sprig. */}
        <View
          style={{
            marginTop: 18,
            borderRadius: radius.card,
            backgroundImage: gradient.lavender,
            borderWidth: 1,
            borderColor: colors.glassEdge,
            paddingVertical: 20,
            paddingLeft: 18,
            paddingRight: 86,
            overflow: 'hidden',
            ...shadow.sm,
          }}>
          <Text style={{...type.tiny, letterSpacing: 1.5}}>FOR TODAY</Text>
          <Text style={{...type.heading, fontSize: 18, lineHeight: 26, marginTop: 6}}>
            “{message}”
          </Text>
          <Image
            source={brandImages.lavender}
            resizeMode="contain"
            accessible={false}
            style={{position: 'absolute', right: 10, bottom: -6, width: 64, height: 120}}
          />
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

        <SectionTitle>Quick actions</SectionTitle>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 10,
          }}>
          {QUICK.map(journal => {
            const tint = TINTS[journal.type];
            return (
              <Pressable
                key={journal.type}
                onPress={() => onStartJournal(journal.type)}
                accessibilityRole="button"
                accessibilityLabel={LABELS[journal.type]}
                accessibilityHint={journal.blurb}
                style={({pressed}) => ({
                  width: '48.5%',
                  minHeight: 96,
                  borderRadius: radius.card,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.glassEdge,
                  backgroundColor: tint?.bg,
                  opacity: pressed ? 0.85 : 1,
                  ...shadow.sm,
                })}>
                {/* Icon and name on one line, the blurb under them at full
                    width: beside the icon it had room for two words a line. */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radius.pill,
                      backgroundColor: tint?.icon,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <journal.Icon size={17} color={colors.accent} />
                  </View>
                  <Text style={{...type.label, fontSize: 14, flex: 1}} numberOfLines={2}>
                    {LABELS[journal.type]}
                  </Text>
                </View>
                <Text style={{...type.tiny, fontSize: 12, marginTop: 8, lineHeight: 16}} numberOfLines={2}>
                  {journal.blurb}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>Quick tools</SectionTitle>
        <View style={{flexDirection: 'row', gap: 10}}>
          <QuickTool label={calm.entry.grounding} Icon={Wind} onPress={() => onOpenCalm()} />
          <QuickTool
            label={calm.entry.groundYourself}
            Icon={Footprints}
            onPress={() => onOpenCalm('groundYourself')}
          />
          <QuickTool label="AI Chat" Icon={MessageCircle} onPress={onOpenChat} />
        </View>

        {/* Module 4: the week, stated and not celebrated. Shown only once it
            has loaded, so a slow network never reads as 0 days. */}
        <SectionTitle>Your week</SectionTitle>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{marginVertical: 16}} />
        ) : insights ? (
          <Pressable
            onPress={onOpenInsights}
            accessibilityRole="button"
            accessibilityLabel={`${days} of 7 days with an entry this week. Opens insights.`}
            style={({pressed}) => ({
              ...glass,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              borderRadius: radius.card,
              backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
            })}>
            <ProgressRing value={days} fraction={days / 7} size={56} compact />
            <View style={{flex: 1}}>
              <Text style={type.label}>
                {days === 0 ? 'A fresh week' : `${days} of 7 days with an entry`}
              </Text>
              <Text style={{...type.small, marginTop: 2}}>
                {days === 0 ? 'Whenever you are ready.' : 'See your insights'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.inkFaint} />
          </Pressable>
        ) : null}
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
