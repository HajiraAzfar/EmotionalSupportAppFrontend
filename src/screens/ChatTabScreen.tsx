import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import ChatEntryScreen from './ChatEntryScreen';
import {listRecentDrafts} from '../api/entries';
import {colors, space, type} from '../theme';

type Props = {
  onOpenEntries: () => void;
};

/**
 * The AI Chat tab is the free write journal: she types as much as she likes,
 * Echo answers when she is ready, and the whole thing is stored as an entry
 * like any other (FR-JRN-003).
 *
 * Opening the tab carries on the conversation she left unfinished rather than
 * starting a blank one, because that is what a chat does.
 */
export default function ChatTabScreen({onOpenEntries}: Props) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  // Changing this remounts the chat, which is how "new chat" starts one.
  const [session, setSession] = useState(0);

  const findDraft = useCallback(async () => {
    setReady(false);
    setError('');
    try {
      const entries = await listRecentDrafts();
      const open = entries.find(entry => entry.journal_type === 'free_write');
      setEntryId(open?.id ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    findDraft();
  }, [findDraft, session]);

  if (!ready) {
    return (
      <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={colors.accent} style={{marginTop: 60}} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <Pressable onPress={findDraft} style={{padding: space.screen}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ChatEntryScreen
        key={`${session}-${entryId ?? 'new'}`}
        journalType="free_write"
        entryId={entryId ?? undefined}
        // Finishing or leaving a chat starts the next one fresh.
        onExit={() => {
          setEntryId(null);
          setSession(current => current + 1);
        }}
        exitLabel="New chat"
        secondaryAction={{label: 'Past chats', onPress: onOpenEntries}}
      />
    </View>
  );
}
