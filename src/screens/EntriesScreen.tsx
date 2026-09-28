import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import CrisisResourcesScreen from './CrisisResourcesScreen';
import {deleteEntry, EntrySummary, JOURNAL_TITLES, listEntries} from '../api/entries';
import {colors, radius, space, type} from '../theme';

const MOOD_LABELS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Very good'];
// Wait this long after the last keystroke before searching.
const SEARCH_DELAY_MS = 350;

type Props = {
  onOpen: (entry: EntrySummary) => void;
  onBack: () => void;
};

function formatDate(iso: string) {
  // Backend timestamps are UTC without a zone suffix.
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// FR-ENT-006: everything she has written — finished entries and drafts —
// newest activity first, searchable by what she wrote.
export default function EntriesScreen({onOpen, onBack}: Props) {
  const [entries, setEntries] = useState<EntrySummary[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback((search: string) => {
    setError('');
    listEntries(search.trim() || undefined)
      .then(setEntries)
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? SEARCH_DELAY_MS : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  // FR-ENT-008: deletion is permanent, so it is always confirmed first.
  function confirmDelete(entry: EntrySummary) {
    const title = entry.name ?? JOURNAL_TITLES[entry.journal_type] ?? entry.journal_type;
    Alert.alert(
      `Delete “${title}”?`,
      'It will be permanently removed, including everything you recorded in it.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id);
              setEntries(current => (current ?? []).filter(e => e.id !== entry.id));
            } catch (e) {
              setError((e as Error).message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={{...type.small, color: colors.inkSoft}}>Back</Text>
        </Pressable>
        <Text style={{...type.label, flex: 1, textAlign: 'center', fontFamily: 'serif'}}>
          Your entries
        </Text>
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12}>
          <Text style={{...type.small, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <View style={{paddingHorizontal: space.screen, paddingTop: 12}}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search what you wrote"
          placeholderTextColor={colors.inkFaint}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.card,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: colors.ink,
          }}
        />
      </View>

      {error ? (
        <Pressable onPress={() => load(query)} style={{padding: space.screen}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      ) : !entries ? (
        <ActivityIndicator color={colors.sage} style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{padding: space.screen}}
          ListEmptyComponent={
            <Text style={{...type.body, textAlign: 'center', marginTop: 40}}>
              {query
                ? `Nothing matches “${query}”.`
                : 'Your entries will appear here, finished or not.'}
            </Text>
          }
          renderItem={({item}) => {
            const draft = item.status === 'in_progress';
            return (
              <Pressable
                onPress={() => onOpen(item)}
                onLongPress={() => confirmDelete(item)}
                style={({pressed}) => ({
                  backgroundColor: pressed ? colors.sageWash : colors.surface,
                  borderWidth: 1,
                  borderColor: draft ? colors.sage : colors.line,
                  borderRadius: radius.card,
                  padding: 14,
                  marginBottom: 10,
                })}>
                <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                  <Text style={{...type.label, fontWeight: '600', flex: 1}}>
                    {item.name ?? JOURNAL_TITLES[item.journal_type] ?? item.journal_type}
                  </Text>
                  {draft ? (
                    <Text style={{...type.small, color: colors.forest}}>Unfinished</Text>
                  ) : null}
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={12} style={{paddingLeft: 12}}>
                    <Text style={{...type.small, color: colors.alert}}>Delete</Text>
                  </Pressable>
                </View>

                {item.name ? (
                  <Text style={type.small}>
                    {JOURNAL_TITLES[item.journal_type] ?? item.journal_type}
                  </Text>
                ) : null}

                {item.preview ? (
                  <Text style={{...type.body, marginTop: 4}} numberOfLines={2}>
                    {item.preview}
                  </Text>
                ) : null}

                <Text style={{...type.small, marginTop: 4}}>
                  {formatDate(item.completed_at ?? item.last_activity_at)}
                  {item.cycle && item.cycle > 1 ? `  ·  Cycle ${item.cycle}` : ''}
                  {item.mood ? `  ·  Mood ${item.mood} — ${MOOD_LABELS[item.mood]}` : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <Modal
        visible={resourcesOpen}
        animationType="slide"
        onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}
