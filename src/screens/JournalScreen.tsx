import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Brain, ChevronRight, CloudSun, Leaf, LucideIcon, Mountain, PenLine} from 'lucide-react-native';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {brandImages} from '../assets/brand';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {cardTints, colors, glass, radius, shadow, space, type} from '../theme';

type Props = {
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenEntries: () => void;
};

// The four structured journals. Free write is not here: it lives in AI Chat,
// because it is a conversation rather than a form.
// Ordered by expected completion time, shortest first (FR-HOME-001).
// The home screen's grid reuses these (all but free write).
export const JOURNALS: {type: JournalType; blurb: string; minutes: string; Icon: LucideIcon}[] = [
  {type: 'check_in', blurb: 'How are you feeling right now?', minutes: '2 min', Icon: CloudSun},
  {type: 'savouring', blurb: 'Hold on to something good that happened.', minutes: '3 min', Icon: Leaf},
  {type: 'thought', blurb: 'Work through a thought that keeps coming back.', minutes: '10 min', Icon: Brain},
  {type: 'exposure', blurb: 'Plan one thing you have been avoiding.', minutes: '2 min + later', Icon: Mountain},
  // FR-JRN-003: the AI Chat tab is a plain chat now, so the free write journal lives here.
  {type: 'free_write', blurb: 'Write whatever is on your mind, then talk it through.', minutes: 'Any length', Icon: PenLine},
];

// Each journal's icon sits on its own soft tint, matching its card on Home.
const ICON_TINTS: Partial<Record<JournalType, string>> = {
  check_in: colors.sageWash,
  savouring: cardTints[2].icon,
  thought: cardTints[0].icon,
  exposure: cardTints[1].icon,
  free_write: cardTints[3].icon,
};

export default function JournalScreen({onStartJournal, onResumeDraft, onOpenEntries}: Props) {
  const [draft, setDraft] = useState<EntrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    listRecentDrafts()
      .then(drafts => setDraft(drafts.find(d => d.journal_type !== 'chat') ?? null))
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
        <View style={{flex: 1}}>
          <Text style={type.title}>Journals</Text>
          <Text style={{...type.small, marginTop: 2}}>Small steps. Big shifts.</Text>
        </View>
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        {/* A woman writing at a window, from the brand artwork. */}
        <View
          style={{
            marginTop: 14,
            borderRadius: radius.card,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            ...shadow.sm,
          }}>
          <Image
            source={brandImages.journalingWide}
            resizeMode="cover"
            accessible={false}
            style={{width: '100%', height: 150}}
          />
          <Text style={{...type.small, color: colors.inkSoft, textAlign: 'center', paddingVertical: 10}}>
            Pick the one that fits the time you have.
          </Text>
        </View>
        <View style={{height: 18}} />

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
            <Text style={type.label}>
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
              ...glass,
              backgroundColor: pressed ? colors.surfaceRaised : colors.glass,
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
                borderRadius: radius.pill,
                backgroundColor: ICON_TINTS[journal.type] ?? colors.accentWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <journal.Icon size={22} color={colors.accent} />
            </View>
            <View style={{flex: 1}}>
              <Text style={type.label}>{JOURNAL_TITLES[journal.type]}</Text>
              <Text style={{...type.body, fontSize: 14, lineHeight: 20, marginTop: 2}}>{journal.blurb}</Text>
              <Text style={{...type.tiny, marginTop: 4}}>{journal.minutes}</Text>
            </View>
            <ChevronRight size={18} color={colors.inkFaint} />
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
