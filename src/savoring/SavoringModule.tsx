import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, BackHandler, View} from 'react-native';

import ScreenBackground from '../components/ScreenBackground';
import {colors} from '../theme';
import {DayRoom, Moment, MomentMode, MomentType, getHome} from './api';
import {QUICK_FIRST, getDefaultMode} from './storage';
import CaptureFlow from './screens/CaptureFlow';
import ExportScreen from './screens/ExportScreen';
import HistoryScreen from './screens/HistoryScreen';
import InsightsScreen from './screens/InsightsScreen';
import MomentScreen from './screens/MomentScreen';
import SavoringHome from './screens/SavoringHome';
import SettingsScreen from './screens/SettingsScreen';
import YearScreen from './screens/YearScreen';

type Room = {today: DayRoom; yesterday: DayRoom};

type View_ =
  | {name: 'home'}
  | {
      name: 'capture';
      key: number;
      type: MomentType;
      mode: MomentMode;
      offerDeeper: boolean;
      room?: Room;
      sourceEntryId?: string;
      editing?: Moment;
    }
  | {name: 'history'; date?: string}
  | {name: 'moment'; id: string}
  | {name: 'insights'}
  | {name: 'export'}
  | {name: 'settings'}
  | {name: 'year'};

type Props = {
  onExit: () => void;
  // Opened from a check-in (a new moment starting from its feelings), or on one moment.
  sourceEntryId?: string;
  entryId?: string;
};

/**
 * The Saving Journal, with its own small navigation so App.tsx knows one
 * screen. Back (on screen or Android's button) goes one step back, and leaves
 * the module only from where it was opened.
 */
export default function SavoringModule({onExit, sourceEntryId, entryId}: Props) {
  const [stack, setStack] = useState<View_[]>(() =>
    entryId ? [{name: 'moment', id: entryId}] : sourceEntryId ? [] : [{name: 'home'}],
  );

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

  // Quick for her first few moments, then a deeper one is offered; or her own setting.
  const begin = useCallback(async (type: MomentType, room: Room | undefined, total: number, source?: string) => {
    const preference = await getDefaultMode();
    const mode: MomentMode = preference === 'full' ? 'full' : 'quick';
    const view: View_ = {
      name: 'capture',
      key: Date.now(),
      type,
      mode,
      offerDeeper: preference === 'auto' && total >= QUICK_FIRST,
      room,
      sourceEntryId: source,
    };
    setStack(s => [...s, view]);
  }, []);

  useEffect(() => {
    if (!sourceEntryId || entryId) {
      return;
    }
    // From the evening check-in's "good moment": straight into a new one.
    getHome()
      .then(home => begin('moment', {today: home.today, yesterday: home.yesterday}, home.total_entries, sourceEntryId))
      .catch(() => begin('moment', undefined, 0, sourceEntryId));
  }, [sourceEntryId, entryId, begin]);

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
    case 'capture':
      return (
        <CaptureFlow
          key={view.key}
          initialType={view.type}
          mode={view.mode}
          offerDeeper={view.offerDeeper}
          room={view.room}
          sourceEntryId={view.sourceEntryId}
          editing={view.editing}
          onClose={back}
          onDone={back}
          onAnother={type =>
            setStack(s => [...s.slice(0, -1), {...view, key: Date.now(), type, sourceEntryId: undefined, offerDeeper: false}])
          }
        />
      );
    case 'history':
      return <HistoryScreen date={view.date} onBack={back} onOpenMoment={id => push({name: 'moment', id})} />;
    case 'moment':
      return (
        <MomentScreen
          id={view.id}
          onBack={back}
          onEdit={moment =>
            push({name: 'capture', key: Date.now(), type: moment.type, mode: moment.mode, offerDeeper: false, editing: moment})
          }
        />
      );
    case 'insights':
      return (
        <InsightsScreen
          onBack={back}
          onOpenMoment={id => push({name: 'moment', id})}
          onExport={() => push({name: 'export'})}
        />
      );
    case 'export':
      return <ExportScreen onBack={back} />;
    case 'settings':
      return <SettingsScreen onBack={back} />;
    case 'year':
      return <YearScreen onBack={back} onOpenDay={date => push({name: 'history', date})} />;
    default:
      return (
        <SavoringHome
          onBack={back}
          onStart={(type, room, total) => begin(type, room, total)}
          onOpenMoment={id => push({name: 'moment', id})}
          onOpenHistory={date => push({name: 'history', date})}
          onOpenInsights={() => push({name: 'insights'})}
          onOpenSettings={() => push({name: 'settings'})}
          onOpenYear={() => push({name: 'year'})}
        />
      );
  }
}
