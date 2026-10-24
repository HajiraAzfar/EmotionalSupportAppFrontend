import React, {useState} from 'react';
import {Switch, Text, View} from 'react-native';

import Chip from '../../components/chat/Chip';
import PrimaryButton from '../../components/PrimaryButton';
import {colors, type} from '../../theme';
import {exportCsv, localDay} from '../api';
import {EXPORT, INSIGHTS} from '../content';
import Screen, {Card} from '../../components/ModuleScreen';

/**
 * Consent first: what the file holds, her written notes left out unless she
 * turns them on, and what it is not. Then the CSV goes to Downloads.
 */
export default function ExportScreen({onBack}: {onBack: () => void}) {
  const [days, setDays] = useState<number>(INSIGHTS.periods[0].days);
  const [notes, setNotes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  async function run() {
    setBusy(true);
    setResult('');
    try {
      setResult(EXPORT.saved(await exportCsv(localDay(-(days - 1)), localDay(), notes)));
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={EXPORT.title} onBack={onBack}>
      <Text style={type.body}>{EXPORT.body}</Text>
      <View style={{flexDirection: 'row', gap: 8, marginTop: 14}}>
        {INSIGHTS.periods.map(p => (
          <Chip key={p.days} label={p.label} on={days === p.days} onPress={() => setDays(p.days)} />
        ))}
      </View>
      <Card>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <View style={{flex: 1}}>
            <Text style={type.label}>{EXPORT.notes}</Text>
            <Text style={{...type.small, marginTop: 2}}>{EXPORT.notesHint}</Text>
          </View>
          <Switch
            value={notes}
            onValueChange={setNotes}
            accessibilityLabel={EXPORT.notes}
            trackColor={{true: colors.accentSoft, false: colors.muted}}
            thumbColor={notes ? colors.accent : colors.surface}
          />
        </View>
      </Card>
      <Text style={{...type.label, marginTop: 18}}>{EXPORT.disclaimer}</Text>
      <View style={{marginTop: 16}}>
        <PrimaryButton label={EXPORT.button} onPress={run} busy={busy} />
      </View>
      {result ? <Text style={{...type.small, marginTop: 12}}>{result}</Text> : null}
    </Screen>
  );
}
