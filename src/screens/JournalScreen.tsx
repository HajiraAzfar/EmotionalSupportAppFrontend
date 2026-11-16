import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, ImageSourcePropType, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Brain, ChevronRight, CloudSun, History, Leaf, LucideIcon, Mountain} from 'lucide-react-native';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {illustrations} from '../assets/brand';
import {EntrySummary, JOURNAL_TITLES, JournalType, listRecentDrafts} from '../api/entries';
import {cardTints, colors, glass, gradient, radius, shadow, space, type} from '../theme';

type Props = {
  onStartJournal: (journalType: JournalType) => void;
  onResumeDraft: (draft: EntrySummary) => void;
  onOpenEntries: () => void;
};

// The four structured journals, also Home's grid. Free write is no longer
// offered (her choice, 26 Oct); old free write entries stay in History.
// Ordered by expected completion time, shortest first (FR-HOME-001).
// `Icon` is the small line icon (History's rows); `art` is the illustrated one
// from the brand sheet (Home's tiles and this list).
// `tint` is the soft wash at the top of its flashcards.
export const JOURNALS: {type: JournalType; blurb: string; minutes: string; Icon: LucideIcon; art: ImageSourcePropType; tint: string}[] = [
  {type: 'check_in', blurb: 'How are you feeling right now?', minutes: '2 min', Icon: CloudSun, art: illustrations.iconLeaf, tint: cardTints[2].bg},
  {type: 'savouring', blurb: 'Hold on to something good that happened.', minutes: '3 min', Icon: Leaf, art: illustrations.iconHeart, tint: '#F8EAF3'},
  {type: 'thought', blurb: 'Work through a thought that keeps coming back.', minutes: '10 min', Icon: Brain, art: illustrations.iconHeadHeart, tint: cardTints[0].bg},
  {type: 'exposure', blurb: 'Plan one thing you have been avoiding.', minutes: '2 min + later', Icon: Mountain, art: illustrations.iconStar, tint: cardTints[3].bg},
];

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
          <Text style={{...type.small, marginTop: 2}}>Explore your thoughts, one small step at a time.</Text>
        </View>
        {/* Everything she has written: the History list. */}
        <Pressable
          onPress={onOpenEntries}
          accessibilityRole="button"
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 7,
            marginRight: 14,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
            ...shadow.sm,
          })}>
          <History size={15} color={colors.accent} />
          <Text style={type.link}>History</Text>
        </Pressable>
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 24}}>
        {/* The journal and a sprig of lavender, from the brand sheet. */}
        <View
          style={{
            marginTop: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 14,
            paddingLeft: 18,
            paddingRight: 10,
            borderRadius: radius.card,
            backgroundImage: gradient.lavender,
            borderWidth: 1,
            borderColor: colors.glassEdge,
            ...shadow.sm,
          }}>
          <View style={{flex: 1}}>
            <Text style={{...type.heading, fontSize: 18}}>Write it down, gently</Text>
            <Text style={{...type.small, marginTop: 4}}>Pick the one that fits the time you have.</Text>
          </View>
          <Image source={illustrations.lavender} resizeMode="contain" accessible={false} style={{width: 44, height: 60}} />
          <Image source={illustrations.journal} resizeMode="contain" accessible={false} style={{width: 96, height: 100}} />
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
            <Image source={journal.art} resizeMode="contain" accessible={false} style={{width: 56, height: 56}} />
            <View style={{flex: 1}}>
              <Text style={type.label}>{JOURNAL_TITLES[journal.type]}</Text>
              <Text style={{...type.body, fontSize: 14, lineHeight: 20, marginTop: 2}}>{journal.blurb}</Text>
              <Text style={{...type.tiny, marginTop: 4}}>{journal.minutes}</Text>
            </View>
            <ChevronRight size={18} color={colors.inkFaint} />
          </Pressable>
        ))}
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
