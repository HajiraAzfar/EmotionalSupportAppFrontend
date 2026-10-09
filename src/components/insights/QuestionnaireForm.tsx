import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../PrimaryButton';
import {
  QuestionnaireSpec,
  getQuestionnaire,
  submitQuestionnaire,
} from '../../api/insights';
import ScreenBackground from '../ScreenBackground';
import {colors, glass, radius, space, type} from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
};

// FR-INS-017/018: she answers, the answers are stored, and she is shown no
// score — not at the end, not anywhere. Nothing here names what is measured.
export default function QuestionnaireForm({visible, onClose, onDone}: Props) {
  const [spec, setSpec] = useState<QuestionnaireSpec | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setAnswers({});
    setError('');
    getQuestionnaire()
      .then(setSpec)
      .catch(e => setError((e as Error).message));
  }, [visible]);

  const answered = spec ? spec.items.every(item => answers[item.id] !== undefined) : false;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await submitQuestionnaire(answers);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex: 1}}>
        <ScreenBackground />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.screen,
            paddingVertical: 12,
          }}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{...type.link, color: colors.inkSoft}}>Close</Text>
          </Pressable>
        </View>

        {!spec ? (
          <ActivityIndicator color={colors.sage} style={{marginTop: 40}} />
        ) : (
          <ScrollView contentContainerStyle={{padding: space.screen}}>
            <Text style={{...type.title, marginBottom: 6}}>{spec.title}</Text>
            <Text style={{...type.body, marginBottom: space.section}}>{spec.intro}</Text>

            {spec.items.map(item => (
              <View key={item.id} style={{marginBottom: space.section}}>
                <Text style={{...type.body, color: colors.ink, marginBottom: 10}}>{item.text}</Text>
                {spec.scale.map(option => {
                  const chosen = answers[item.id] === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setAnswers(current => ({...current, [item.id]: option.value}))}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        marginBottom: 8,
                        ...glass,
                        borderRadius: radius.card,
                        borderColor: chosen ? colors.accent : colors.glassEdge,
                        backgroundColor: chosen ? colors.surface : colors.glass,
                      }}>
                      <Text style={{...type.body, color: chosen ? colors.ink : colors.inkSoft}}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {error ? (
              <Text style={{...type.small, color: colors.alert, marginBottom: 12}}>{error}</Text>
            ) : null}

            <PrimaryButton
              label={answered ? 'Done' : 'Answer every question to finish'}
              busy={busy}
              disabled={!answered}
              onPress={submit}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
