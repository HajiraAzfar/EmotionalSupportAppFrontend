import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {clearTokens, getAccessToken} from '../storage/tokens';
import {colors, radius, space, type} from '../theme';

type Props = {
  onSignedOut: () => void;
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenEntries: () => void;
};

// Ordered by expected completion time, shortest first (FR-HOME-001).
const JOURNALS: {type: JournalType; blurb: string; minutes: string}[] = [
  {type: 'check_in', blurb: 'How are you feeling right now?', minutes: '2 min'},
  {type: 'savouring', blurb: 'Hold on to something good that happened.', minutes: '3 min'},
  {type: 'free_write', blurb: 'Write whatever is on your mind.', minutes: '5+ min'},
  {type: 'thought', blurb: 'Work through a thought that keeps coming back.', minutes: '10 min'},
  {type: 'exposure', blurb: 'Plan one thing you have been avoiding.', minutes: '2 min + later'},
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

// Stand-in for the dashboard (module 4): journals, draft resumption, past entries.
export default function HomeScreen({onSignedOut, onStartJournal, onResumeDraft, onOpenEntries}: Props) {
  const [draft, setDraft] = useState<EntrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!(await getAccessToken())) {
          onSignedOut();
          return;
        }
        // FR-HOME-002: offer the most recent draft touched within 7 days.
        const drafts = await listRecentDrafts();
        setDraft(drafts[0] ?? null);
      } catch {
        // A failed draft lookup must not block starting a new entry.
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [onSignedOut]);

  async function handleSignOut() {
    await clearTokens();
    onSignedOut();
  }

  const card = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 12,
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: space.screen,
          paddingTop: 12,
        }}>
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.small, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
        <Text style={{...type.title, marginTop: 12}}>{greeting()}</Text>
        <Text style={{...type.body, marginTop: 6, marginBottom: space.section}}>
          What would you like to do today?
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.sage} style={{marginBottom: 16}} />
        ) : draft ? (
          <Pressable
            onPress={() => onResumeDraft(draft)}
            style={({pressed}) => ({
              ...card,
              backgroundColor: pressed ? colors.sageWash : colors.sageWash,
              borderColor: colors.sage,
            })}>
            <Text style={{...type.label, fontWeight: '600'}}>
              Continue your {JOURNAL_TITLES[draft.journal_type]?.toLowerCase() ?? 'entry'}
            </Text>
            <Text style={{...type.small, marginTop: 4}}>
              Everything you recorded is saved. Pick up where you left off.
            </Text>
          </Pressable>
        ) : null}

        {JOURNALS.map(j => (
          <Pressable
            key={j.type}
            onPress={() => onStartJournal(j.type)}
            style={({pressed}) => ({...card, backgroundColor: pressed ? colors.sageWash : colors.surface})}>
            <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
              <Text style={{...type.label, fontWeight: '600', flex: 1}}>{JOURNAL_TITLES[j.type]}</Text>
              <Text style={type.small}>{j.minutes}</Text>
            </View>
            <Text style={{...type.body, marginTop: 4}}>{j.blurb}</Text>
          </Pressable>
        ))}

        <Pressable onPress={onOpenEntries} style={{paddingVertical: 16}}>
          <Text style={{...type.label, color: colors.forest, textAlign: 'center'}}>Your entries</Text>
        </Pressable>

        <Pressable onPress={handleSignOut} style={{paddingVertical: 12}}>
          <Text style={{...type.small, textAlign: 'center'}}>Sign out</Text>
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
