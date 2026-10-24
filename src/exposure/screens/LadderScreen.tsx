import React, {useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import ScoreScale from '../../components/ScoreScale';
import Screen, {Card} from '../../components/ModuleScreen';
import Chip from '../../components/chat/Chip';
import {LibraryItem, getLibrary} from '../../api/libraries';
import {colors, radius, type} from '../../theme';
import {Ladder, addStep, createLadder, removeStep, reorderSteps, updateLadder, updateStep} from '../api';
import {LADDER} from '../content';
import {cacheLadders} from '../storage';

type Draft = {id?: string; description: string; expected_suds: number | null};

const input = {
  ...type.input,
  color: colors.ink,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.input,
  paddingHorizontal: 14,
  paddingVertical: 12,
};

/**
 * One fear ladder: its name, what it is about, and its steps from easier to
 * harder (each with how anxious she expects to be). A new ladder is saved at
 * once; an existing one saves each change as she makes it. Online only.
 */
export default function LadderScreen({ladder, onBack, onSaved}: {
  ladder?: Ladder;
  onBack: () => void;
  onSaved: (ladders: Ladder[]) => void;
}) {
  const [name, setName] = useState(ladder?.fear_name ?? '');
  const [tags, setTags] = useState<string[]>(ladder?.tags.map(t => t.id) ?? []);
  const [steps, setSteps] = useState<Draft[]>(
    ladder?.steps.map(s => ({id: s.id, description: s.description, expected_suds: s.expected_suds})) ?? [
      {description: '', expected_suds: null},
    ],
  );
  const [tagItems, setTagItems] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    getLibrary('exposure_tags').then(lib => setTagItems(lib.categories.flatMap(c => c.items))).catch(() => undefined);
  }, []);

  async function run(action: () => Promise<{ladders: Ladder[]}>) {
    setBusy(true);
    setError('');
    try {
      const result = await action();
      await cacheLadders(result.ladders);
      const fresh = result.ladders.find(l => l.id === ladder?.id);
      if (fresh) {
        setSteps(fresh.steps.map(s => ({id: s.id, description: s.description, expected_suds: s.expected_suds})));
      }
      return result;
    } catch (e) {
      setError(`${(e as Error).message} ${LADDER.online}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const ready = steps.filter(s => s.description.trim() && s.expected_suds !== null);

  async function saveNew() {
    const result = await run(() =>
      createLadder({fear_name: name.trim(), tags, steps: ready.map(s => ({description: s.description.trim(), expected_suds: s.expected_suds!}))}),
    );
    if (result) {
      onSaved(result.ladders);
    }
  }

  async function move(i: number, by: number) {
    const ids = steps.map(s => s.id!);
    [ids[i], ids[i + by]] = [ids[i + by], ids[i]];
    await run(() => reorderSteps(ladder!.id, ids));
  }

  async function sortByAnxiety() {
    const ids = [...steps].sort((a, b) => (a.expected_suds ?? 0) - (b.expected_suds ?? 0)).map(s => s.id!);
    await run(() => reorderSteps(ladder!.id, ids));
  }

  const edit = (i: number, patch: Partial<Draft>) => setSteps(list => list.map((s, n) => (n === i ? {...s, ...patch} : s)));

  return (
    <Screen title={LADDER.title} onBack={onBack}>
      <Text style={{...type.label, marginTop: 8, marginBottom: 6}}>{LADDER.name}</Text>
      <TextInput value={name} onChangeText={setName} onEndEditing={() => ladder && name.trim() && run(() => updateLadder(ladder.id, {fear_name: name.trim()}))}
        maxLength={200} placeholder={LADDER.namePlaceholder} placeholderTextColor={colors.inkFaint} accessibilityLabel={LADDER.name} style={input} />
      <Text style={{...type.label, marginTop: 16, marginBottom: 8}}>{LADDER.tags}</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {tagItems.map(t => (
          <Chip key={t.id} label={t.name} on={tags.includes(t.id)} onPress={() => {
            const next = tags.includes(t.id) ? tags.filter(x => x !== t.id) : [...tags, t.id];
            setTags(next);
            if (ladder) {
              run(() => updateLadder(ladder.id, {tags: next}));
            }
          }} />
        ))}
      </View>

      <Text style={{...type.label, marginTop: 20}}>{LADDER.steps}</Text>
      <Text style={{...type.small, marginTop: 2}}>{LADDER.stepsHint}</Text>
      {steps.map((s, i) => (
        <Card key={s.id ?? `new-${i}`}>
          <TextInput value={s.description} onChangeText={v => edit(i, {description: v})} maxLength={300}
            onEndEditing={() => ladder && s.id && s.description.trim() && run(() => updateStep(ladder.id, s.id!, {description: s.description.trim()}))}
            placeholder={LADDER.stepPlaceholder} placeholderTextColor={colors.inkFaint} accessibilityLabel={`Step ${i + 1}`} style={input} />
          <View style={{marginTop: 10}}>
            <ScoreScale value={s.expected_suds} step={10} label={`Step ${i + 1}, expected anxiety`} low="Calm" high="As anxious as it gets"
              onChange={v => {
                edit(i, {expected_suds: v});
                if (ladder && s.id && v !== null) {
                  run(() => updateStep(ladder.id, s.id!, {expected_suds: v}));
                }
              }} />
          </View>
          <View style={{flexDirection: 'row', gap: 18, marginTop: 6}}>
            {ladder && s.id && i > 0 ? (
              <Pressable onPress={() => move(i, -1)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
                <Text style={type.link}>{LADDER.up}</Text>
              </Pressable>
            ) : null}
            {ladder && s.id && i < steps.length - 1 ? (
              <Pressable onPress={() => move(i, 1)} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
                <Text style={type.link}>{LADDER.down}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => (ladder && s.id ? run(() => removeStep(ladder.id, s.id!)) : setSteps(list => list.filter((_, n) => n !== i)))}
              accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
              <Text style={{...type.link, color: colors.alert}}>{LADDER.remove}</Text>
            </Pressable>
          </View>
          {ladder && s.id === undefined && s.description.trim() && s.expected_suds !== null ? (
            <PrimaryButton label="Add this step" busy={busy}
              onPress={() => run(() => addStep(ladder.id, {description: s.description.trim(), expected_suds: s.expected_suds!}))} />
          ) : null}
        </Card>
      ))}
      {steps.length < 10 ? (
        <Pressable onPress={() => setSteps(list => [...list, {description: '', expected_suds: null}])} accessibilityRole="button"
          style={{minHeight: 44, justifyContent: 'center', marginTop: 10}}>
          <Text style={type.link}>{LADDER.add}</Text>
        </Pressable>
      ) : null}
      {ladder && steps.length > 1 ? (
        <Pressable onPress={sortByAnxiety} accessibilityRole="button" style={{minHeight: 44, justifyContent: 'center'}}>
          <Text style={type.link}>{LADDER.sort}</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={{...type.small, color: colors.alert, marginTop: 12}}>{error}</Text> : null}
      {!ladder ? (
        <View style={{marginTop: 20}}>
          <PrimaryButton label={LADDER.save} onPress={saveNew} busy={busy} disabled={!name.trim() || !ready.length} />
        </View>
      ) : null}
    </Screen>
  );
}
