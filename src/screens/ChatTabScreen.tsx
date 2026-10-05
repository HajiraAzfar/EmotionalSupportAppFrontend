import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import ChatEntryScreen from './ChatEntryScreen';
import {latestChat} from '../api/entries';
import {colors, space, type} from '../theme';

type Props = {
  onOpenEntries: () => void;
};

/**
 * The AI Chat tab: she writes or speaks, Echo answers, like any chat. There is
 * no journal before the conversation (the free write journal lives in the
 * Journal tab), and the chat is stored as an entry of type "chat".
 *
 * Opening the tab carries on the most recent chat that is still going, because
 * that is what a chat does. "New chat" starts a blank one, which is only saved
 * once she sends something.
 */
export default function ChatTabScreen({onOpenEntries}: Props) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  // Changing this remounts the chat, which is how "new chat" starts one.
  const [session, setSession] = useState(0);

  const findChat = useCallback(async () => {
    setReady(false);
    setError('');
    try {
      const latest = await latestChat();
      // A chat goes on until crisis support or the length failsafe closes it.
      setEntryId(latest?.conversation_status === 'active' ? latest.id : null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    findChat();
  }, [findChat]);

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
        <Pressable onPress={findChat} style={{padding: space.screen}}>
          <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ChatEntryScreen
        key={`${session}-${entryId ?? 'new'}`}
        journalType="chat"
        entryId={entryId ?? undefined}
        // "New chat": a blank chat, not the one she just left.
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
