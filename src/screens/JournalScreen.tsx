import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {colors, radius, space, type} from '../theme';

type Props = {
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenEntries: () => void;
};

// The four structured journals. Free write is not here: it lives in AI Chat,
// because it is a conversation rather than a form.
// Ordered by expected completion time, shortest first (FR-HOME-001).
const JOURNALS: {type: JournalType; blurb: string; minutes: string; icon: string}[] = [
  {type: 'check_in', blurb: 'How are you feeling right now?', minutes: '2 min', icon: '🌤️'},
  {type: 'savouring', blurb: 'Hold on to something good that happened.', minutes: '3 min', icon: '🌷'},
  {type: 'thought', blurb: 'Work through a thought that keeps coming back.', minutes: '10 min', icon: '💭'},
  {type: 'exposure', blurb: 'Plan one thing you have been avoiding.', minutes: '2 min + later', icon: '🚪'},
];

export default function JournalScreen({onStartJournal, onResumeDraft, onOpenEntries}: Props) {
  const [draft, setDraft] = useState<EntrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    listRecentDrafts()
      .then(drafts => setDraft(drafts.find(d => d.journal_type !== 'free_write') ?? null))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingTop: 12,
        }}>
        <Text style={{...type.title, flex: 1}}>Journals</Text>
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.small, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        <Text style={{...type.body, marginTop: 6, marginBottom: 18}}>
          Pick the one that fits the time you have.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{marginBottom: 16}} />
        ) : draft ? (
          <Pressable
            onPress={() => onResumeDraft(draft)}
            style={{
              backgroundColor: colors.accentWash,
              borderRadius: radius.card,
              padding: 16,
              marginBottom: 14,
            }}>
            <Text style={{...type.label, fontWeight: '600'}}>
              Continue your {JOURNAL_TITLES[draft.journal_type]?.toLowerCase() ?? 'entry'}
            </Text>
            <Text style={{...type.small, marginTop: 4}}>Pick up where you left off.</Text>
          </Pressable>
        ) : null}

        {JOURNALS.map(journal => (
          <Pressable
            key={journal.type}
            onPress={() => onStartJournal(journal.type)}
            style={({pressed}) => ({
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            })}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.accentWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{fontSize: 20}}>{journal.icon}</Text>
            </View>
            <View style={{flex: 1}}>
              <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                <Text style={{...type.label, fontWeight: '600', flex: 1}}>
                  {JOURNAL_TITLES[journal.type]}
                </Text>
                <Text style={type.small}>{journal.minutes}</Text>
              </View>
              <Text style={{...type.body, marginTop: 4}}>{journal.blurb}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable onPress={onOpenEntries} style={{paddingVertical: 18}}>
          <Text style={{...type.label, color: colors.accent, textAlign: 'center'}}>
            Everything you have written
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
