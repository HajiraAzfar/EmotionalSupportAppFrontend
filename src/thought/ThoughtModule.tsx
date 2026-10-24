import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, BackHandler, View} from 'react-native';

import ScreenBackground from '../components/ScreenBackground';
import {newClientId} from '../api/entries';
import {colors} from '../theme';
import {EMPTY, RecordContent, RecordMode, ThoughtRecord, contentOf, getHome, getRecord} from './api';
import HistoryScreen from './screens/HistoryScreen';
import InsightsScreen from './screens/InsightsScreen';
import RecordFlow, {stepsFor} from './screens/RecordFlow';
import RecordScreen from './screens/RecordScreen';
import ThoughtHome from './screens/ThoughtHome';

type Flow = {
  name: 'flow';
  key: string;
  clientId: string;
  mode: RecordMode;
  content: RecordContent;
  step: number;
  recordId: string | null;
  sourceEntryId: string | null;
  editing?: ThoughtRecord;
  asksEvidenceFor: boolean;
  situationRequired: boolean;
};

type View_ =
  | {name: 'home'}
  | Flow
  | {name: 'history'; date?: string}
  | {name: 'record'; id: string}
  | {name: 'insights'};

type Props = {
  onExit: () => void;
  // Opened from a check-in (a new record starting from its feelings), or on one record or draft.
  sourceEntryId?: string;
  entryId?: string;
  onOpenSavoring?: () => void;
  onOpenGrounding?: () => void;
};

/**
 * The Thought Journal, with its own small navigation. Back goes one step back
 * and leaves the module only from where it was opened.
 */
export default function ThoughtModule({onExit, sourceEntryId, entryId, onOpenSavoring, onOpenGrounding}: Props) {
  const [stack, setStack] = useState<View_[]>(() => (entryId || sourceEntryId ? [] : [{name: 'home'}]));
  // Whether this account gets the trauma variant, for a flow opened from anywhere.
  const [flags, setFlags] = useState<{asks_evidence_for: boolean; situation_required: boolean} | null>(null);
  useEffect(() => {
    getHome()
      .then(setFlags)
      .catch(() => undefined);
  }, []);
  const push = (view: View_) => setStack(s => [...s, view]);
  const back = useCallback(() => {
    if (stack.length <= 1) {
      onExit();
    } else {
      setStack(s => s.slice(0, -1));
    }
  }, [stack.length, onExit]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back]);

  const flow = useCallback(
    (over: Partial<Flow>, flags: {asks_evidence_for: boolean; situation_required: boolean} | null): Flow => ({
      name: 'flow',
      key: `${Date.now()}`,
      clientId: newClientId(),
      mode: 'quick',
      content: EMPTY,
      step: 0,
      recordId: null,
      sourceEntryId: null,
      asksEvidenceFor: flags?.asks_evidence_for ?? true,
      situationRequired: flags?.situation_required ?? true,
      ...over,
    }),
    [],
  );

  useEffect(() => {
    if (!entryId && !sourceEntryId) {
      return;
    }
    (async () => {
      const home = await getHome().catch(() => null);
      if (entryId) {
        // A draft carries on where it stopped; a finished record opens to read.
        const record = await getRecord(entryId).catch(() => null);
        if (record?.status === 'in_progress') {
          setStack([flow({clientId: record.client_id ?? newClientId(), mode: record.mode, content: contentOf(record), recordId: record.id}, home)]);
        } else {
          setStack([{name: 'record', id: entryId}]);
        }
      } else {
        setStack([flow({sourceEntryId: sourceEntryId ?? null}, home)]);
      }
    })();
  }, [entryId, sourceEntryId, flow]);

  const view = stack[stack.length - 1];
  if (!view) {
    return (
      <View style={{flex: 1}}>
        <ScreenBackground />
        <ActivityIndicator color={colors.accent} style={{marginTop: 80}} />
      </View>
    );
  }

  switch (view.name) {
    case 'flow':
      return (
        <RecordFlow
          key={view.key}
          clientId={view.clientId}
          mode={view.mode}
          content={view.content}
          step={view.step}
          recordId={view.recordId}
          sourceEntryId={view.sourceEntryId}
          editing={view.editing}
          asksEvidenceFor={view.asksEvidenceFor}
          situationRequired={view.situationRequired}
          onClose={back}
          onDone={back}
          onOpenSavoring={onOpenSavoring}
          onOpenGrounding={onOpenGrounding}
        />
      );
    case 'history':
      return <HistoryScreen date={view.date} onBack={back} onOpenRecord={id => push({name: 'record', id})} />;
    case 'record':
      return (
        <RecordScreen
          id={view.id}
          onBack={back}
          onEdit={record =>
            push(flow({clientId: record.client_id ?? newClientId(), mode: record.mode, content: contentOf(record),
              recordId: record.id, editing: record}, flags))
          }
        />
      );
    case 'insights':
      return <InsightsScreen onBack={back} onOpenRecord={id => push({name: 'record', id})} />;
    default:
      return (
        <ThoughtHome
          onBack={back}
          onStart={(mode, home) => push(flow({mode}, home))}
          onContinue={({local, server}, home) =>
            push(
              local
                ? flow({clientId: local.clientId, mode: local.mode, content: local.content,
                    step: Math.min(local.step, stepsFor(local.mode, home?.asks_evidence_for ?? true).length - 1),
                    sourceEntryId: local.sourceEntryId}, home)
                : flow({clientId: server!.client_id ?? newClientId(), mode: server!.mode, content: contentOf(server!),
                    recordId: server!.id}, home),
            )
          }
          onOpenRecord={id => push({name: 'record', id})}
          onOpenHistory={date => push({name: 'history', date})}
          onOpenInsights={() => push({name: 'insights'})}
          onOpenGrounding={onOpenGrounding}
        />
      );
  }
}
