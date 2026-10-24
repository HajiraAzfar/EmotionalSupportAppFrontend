import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, BackHandler, View} from 'react-native';

import ScreenBackground from '../components/ScreenBackground';
import {newClientId} from '../api/entries';
import {colors} from '../theme';
import {EMPTY, ExposureContent, ExposureMode, ExposureRecord, ExposureStatus, Ladder, contentOf, getHome, getRecord} from './api';
import {cachedLadders, markScreened, screened} from './storage';
import ExposureFlow from './screens/ExposureFlow';
import ExposureHome from './screens/ExposureHome';
import LadderScreen from './screens/LadderScreen';
import {ExportScreen, HistoryScreen, InsightsScreen, RecordScreen, ScreeningScreen} from './screens/MoreScreens';

type Flow = {
  name: 'flow';
  key: string;
  clientId: string;
  mode: ExposureMode;
  content: ExposureContent;
  status: ExposureStatus;
  phase: 'plan' | 'review';
  step: number;
  sourceEntryId: string | null;
};

type View_ =
  | {name: 'home'}
  | Flow
  | {name: 'screening'; then: Flow; professional: boolean}
  | {name: 'ladder'; ladder?: Ladder}
  | {name: 'history'; date?: string}
  | {name: 'record'; id: string}
  | {name: 'insights'}
  | {name: 'export'};

type Props = {
  onExit: () => void;
  // Planned from a check-in or a thought record, or opened on one exposure.
  sourceEntryId?: string;
  entryId?: string;
  onOpenSavoring?: () => void;
};

const newFlow = (over: Partial<Flow>): Flow => ({
  name: 'flow', key: `${Date.now()}`, clientId: newClientId(), mode: 'full', content: EMPTY, status: 'draft',
  phase: 'plan', step: 0, sourceEntryId: null, ...over,
});

// Where a record carries on: a plan made goes to how it went; a draft to its plan.
const resume = (r: ExposureRecord): Flow =>
  newFlow({clientId: r.client_id ?? newClientId(), mode: r.mode, content: contentOf(r), status: r.status,
    phase: r.status === 'draft' ? 'plan' : 'review'});

/**
 * The Exposure Journal, with its own small navigation. The screening note is
 * shown once, before the first exposure. Back goes one step back and leaves
 * the module only from where it was opened.
 */
export default function ExposureModule({onExit, sourceEntryId, entryId, onOpenSavoring}: Props) {
  const [stack, setStack] = useState<View_[]>(() => (entryId || sourceEntryId ? [] : [{name: 'home'}]));
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const push = (view: View_) => setStack(s => [...s, view]);
  const back = useCallback(() => (stack.length <= 1 ? onExit() : setStack(s => s.slice(0, -1))), [stack.length, onExit]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back]);

  // A new exposure: the screening note first, once ever on this phone.
  const begin = useCallback(async (flow: Flow, professional: boolean) => {
    if (await screened()) {
      setStack(s => [...s, flow]);
    } else {
      setStack(s => [...s, {name: 'screening', then: flow, professional}]);
    }
  }, []);

  useEffect(() => {
    cachedLadders().then(setLadders).catch(() => undefined);
    if (!entryId && !sourceEntryId) {
      return;
    }
    (async () => {
      const home = await getHome().catch(() => null);
      if (home) {
        setLadders(home.ladders);
      }
      if (entryId) {
        const record = await getRecord(entryId).catch(() => null);
        setStack([record && (record.status === 'draft' || record.status === 'planned') ? resume(record) : {name: 'record', id: entryId}]);
      } else {
        begin(newFlow({sourceEntryId: sourceEntryId ?? null}), home?.suggest_professional ?? false);
      }
    })();
  }, [entryId, sourceEntryId, begin]);

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
    case 'screening':
      return (
        <ScreeningScreen professional={view.professional} onBack={back}
          onContinue={async () => {
            await markScreened();
            setStack(s => [...s.slice(0, -1), view.then]);
          }} />
      );
    case 'flow':
      return (
        <ExposureFlow key={view.key} clientId={view.clientId} mode={view.mode} content={view.content} status={view.status}
          phase={view.phase} step={view.step} sourceEntryId={view.sourceEntryId} ladders={ladders}
          onClose={back} onDone={back} onOpenSavoring={onOpenSavoring}
          onOpenLadders={() => push({name: 'ladder'})} />
      );
    case 'ladder':
      return (
        <LadderScreen ladder={view.ladder} onBack={back}
          onSaved={fresh => {
            setLadders(fresh);
            back();
          }} />
      );
    case 'history':
      return <HistoryScreen date={view.date} onBack={back} onOpenRecord={id => push({name: 'record', id})} />;
    case 'record':
      return (
        <RecordScreen id={view.id} onBack={back}
          onCorrect={r => push(newFlow({clientId: r.client_id ?? newClientId(), mode: r.mode, content: contentOf(r),
            status: r.status, phase: 'review'}))} />
      );
    case 'insights':
      return <InsightsScreen onBack={back} />;
    case 'export':
      return <ExportScreen onBack={back} />;
    default:
      return (
        <ExposureHome
          onBack={back}
          onPlan={(mode, home, fresh) => {
            setLadders(fresh);
            begin(newFlow({mode}), home?.suggest_professional ?? false);
          }}
          onContinue={({local, server}, fresh) => {
            setLadders(fresh);
            push(local
              ? newFlow({clientId: local.clientId, mode: local.mode, content: local.content, status: local.status,
                  phase: local.phase, step: local.step, sourceEntryId: local.sourceEntryId})
              : resume(server!));
          }}
          onOpenLadder={ladder => push({name: 'ladder', ladder})}
          onOpenRecord={id => push({name: 'record', id})}
          onOpenHistory={date => push({name: 'history', date})}
          onOpenInsights={() => push({name: 'insights'})}
          onOpenExport={() => push({name: 'export'})}
        />
      );
  }
}
