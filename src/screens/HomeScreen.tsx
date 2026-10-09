import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, Settings} from 'lucide-react-native';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {JOURNALS} from './JournalScreen';
import Logo from '../components/Logo';
import ProgressRing from '../components/insights/ProgressRing';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {Insights, getInsights} from '../api/insights';
import {getAccessToken} from '../storage/tokens';
import {colors, glass, gradient, radius, space, type} from '../theme';

type Props = {
  onSignedOut: () => void;
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenInsights: () => void;
  onOpenEntries: () => void;
  onOpenSettings: () => void;
};

// The design's short names for the four structured journals. Free write stays
// in the Journal tab.
const LABELS: Partial<Record<JournalType, string>> = {
  check_in: 'Daily Check-in',
  savouring: 'Savouring',
  thought: 'Thought',
  exposure: 'Exposure',
};
const QUICK = JOURNALS.filter(journal => LABELS[journal.type]);

export default function HomeScreen({
  onSignedOut,
  onStartJournal,
  onResumeDraft,
  onOpenInsights,
  onOpenEntries,
  onOpenSettings,
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

  const days = insights?.streak.days_this_week ?? 0;

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12}}>
          {/* FR-CRIS-009: crisis resources on every screen. */}
          <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} style={{flex: 1}}>
            <Text style={{...type.link, color: colors.alert}}>Get help</Text>
          </Pressable>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Logo size={30} />
            <Text style={type.heading}>Mind Doc</Text>
          </View>
          <Pressable
            onPress={onOpenSettings}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={{flex: 1, alignItems: 'flex-end'}}>
            <Settings size={22} color={colors.inkSoft} />
          </Pressable>
        </View>

        {/* Module 4: the week, stated and not celebrated. Shown only once it
            has loaded, so a slow network never reads as 0 days. */}
        <Pressable
          onPress={onOpenInsights}
          disabled={!insights}
          accessibilityRole="button"
          accessibilityLabel={`Weekly streak: ${days} of 7 days. Opens insights.`}
          style={{alignItems: 'center', marginTop: 28, minHeight: 160}}>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{marginTop: 50}} />
          ) : insights ? (
            <>
              <ProgressRing value={days} fraction={days / 7} size={128} />
              <Text style={{...type.label, marginTop: 12}}>
                Weekly Streak: {days}/7 days{days > 0 ? ' 🔥' : ''}
              </Text>
            </>
          ) : null}
        </Pressable>

        {/* FR-HOME-002 */}
        {draft ? (
          <View
            style={{
              ...glass,
              borderRadius: radius.card,
              padding: 16,
              marginTop: 20,
            }}>
            <Text style={type.label}>Resume Draft</Text>
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

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12,
            marginTop: 20,
          }}>
          {QUICK.map(journal => (
            <Pressable
              key={journal.type}
              onPress={() => onStartJournal(journal.type)}
              style={({pressed}) => ({
                ...glass,
                width: '48%',
                backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
                borderRadius: radius.card,
                padding: 14,
              })}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.pill,
                  backgroundColor: colors.accentWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <journal.Icon size={20} color={colors.accent} />
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}>
                <Text style={{...type.label, flex: 1}}>
                  {LABELS[journal.type]}
                </Text>
                <ChevronRight size={16} color={colors.inkFaint} />
              </View>
              <Text style={{...type.small, marginTop: 4}} numberOfLines={3}>
                {journal.blurb}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onOpenEntries} style={{paddingVertical: 18, marginTop: 8}}>
          <Text style={{...type.link, textAlign: 'center'}}>
            Your entries
          </Text>
        </Pressable>
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
