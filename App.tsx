import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import ChatEntryScreen from './src/screens/ChatEntryScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import GetHelp from './src/components/GetHelp';
import ConsentScreen from './src/screens/ConsentScreen';
import DistressScreen from './src/screens/DistressScreen';
import EntriesScreen from './src/screens/EntriesScreen';
import FocusAreasScreen from './src/screens/FocusAreasScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import IntroScreen from './src/screens/IntroScreen';
import LifeVisionScreen from './src/screens/LifeVisionScreen';
import LoginScreen from './src/screens/LoginScreen';
import SetPasswordScreen from './src/screens/SetPasswordScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerifyResetCodeScreen from './src/screens/VerifyResetCodeScreen';
import VerifySignupCodeScreen from './src/screens/VerifySignupCodeScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkIssuesScreen from './src/screens/WorkIssuesScreen';
import {resetPasswordWithCode, setPassword as setPasswordApi} from './src/api/auth';
import {apiRequest} from './src/api/client';
import {CheckInSlot, JournalType} from './src/api/entries';
import {clearTokens, getAccessToken} from './src/storage/tokens';
import {colors} from './src/theme';
import ArticleScreen from './src/screens/ArticleScreen';
import ChatTabScreen from './src/screens/ChatTabScreen';
import JournalScreen from './src/screens/JournalScreen';
import TabBar, {Tab} from './src/components/TabBar';
import InsightsScreen from './src/screens/InsightsScreen';
import WeeklyReportScreen from './src/screens/WeeklyReportScreen';
import DeckScreen from './src/screens/DeckScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import {AppState} from 'react-native';
import AppLockScreen from './src/screens/AppLockScreen';
import SetAppLockScreen from './src/screens/SetAppLockScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NameScreen from './src/screens/NameScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import CheckInSlotsScreen from './src/screens/CheckInSlotsScreen';
import CheckInReportsScreen from './src/screens/CheckInReportsScreen';
import SavoringModule from './src/savoring/SavoringModule';
import ThoughtModule from './src/thought/ThoughtModule';
import ExposureModule from './src/exposure/ExposureModule';
import SplashScreen from './src/screens/SplashScreen';
import ScreenBackground from './src/components/ScreenBackground';
import CalmModule, {CalmView} from './src/calm/CalmModule';
import {LOCK_AFTER_MS, clearLock, isLockSet, takeLockOnReturn} from './src/storage/appLock';

type Screen =
  | 'loading'
  | 'welcome'
  | 'login'
  | 'signup'
  | 'verifySignupCode'
  | 'setPassword'
  | 'forgot'
  | 'verifyResetCode'
  | 'resetPassword'
  | 'consent'
  | 'focus'
  | 'workIssues'
  | 'lifeVision'
  | 'distress'
  | 'tabs'
  | 'journal'
  | 'entries'
  | 'article'
  | 'appLockSetup'
  | 'weeklyReport'
  | 'settings'
  | 'calm'
  | 'intro'
  | 'name'
  | 'editName'
  | 'deleteAccount'
  | 'reminders'
  | 'checkins'
  | 'checkinReports';

// Screens whose own header has no Get help link (FR-CRIS-009).
const SCREENS_WITHOUT_HELP: Screen[] = [
  'welcome', 'login', 'signup', 'verifySignupCode', 'setPassword', 'forgot', 'verifyResetCode',
  'resetPassword', 'consent', 'focus', 'workIssues', 'lifeVision', 'distress', 'article',
  'appLockSetup', 'settings', 'calm', 'intro', 'name', 'editName', 'deleteAccount',
  'reminders',
];

// Short enough to answer a card at a time. Thought and exposure keep the
// thread: they are long, and a pause, a resume and a conversation all live there.
const DECK_JOURNALS: JournalType[] = ['check_in'];
// Journals that are their own modules: new entries, and any entry reopened.
const MODULE_JOURNALS: JournalType[] = ['savouring', 'thought', 'exposure'];

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading');

  // Transient state carried between steps of the signup and reset flows.
  const [pendingEmail, setPendingEmail] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  // What the journal screen should open: a new entry, a draft to resume, or a past entry to read.
  const [journal, setJournal] = useState<{
    journalType: JournalType;
    entryId?: string;
    readOnly?: boolean;
    // A check-in's slot, and its day when adding a past one.
    slot?: CheckInSlot;
    localDate?: string;
    // The check-in a journal was opened from (cross-links).
    sourceEntryId?: string;
    // Where leaving it goes back to, when not the tabs.
    returnTo?: Screen;
  }>({journalType: 'check_in'});

  // Check-ins come three times a day, so they start from their own list of
  // slots; every other journal opens straight away.
  function startJournal(journalType: JournalType) {
    if (journalType === 'check_in') {
      setScreen('checkins');
      return;
    }
    setJournal({journalType});
    setScreen('journal');
  }
  // SRS 4.11: which article the reader screen is showing.
  const [articleSlug, setArticleSlug] = useState('');
  // The reports open from the check-ins list and from Insights; back goes to whichever it was.
  const [reportsBack, setReportsBack] = useState<Screen>('checkins');
  // Which of the four areas is showing. The tab bar is the only way between them.
  const [tab, setTab] = useState<Tab>('home');
  // Where Calm opens: its own list, or straight into an exercise (Home's quick tools).
  const [calmStart, setCalmStart] = useState<CalmView>('home');
  // What the user asked to be called (optional), for the greeting on Home.
  const [userName, setUserName] = useState<string | null>(null);
  // A mood tapped on the home card is recorded as soon as the check-in opens.
  const [startMood, setStartMood] = useState<number | null>(null);
    // FR-AUTH-009: the app lock. `locked` is null until we know whether a PIN
  // exists, so the app never flashes its contents before locking.
  // The logo and the name are the first thing the app shows, before it knows
  // anything else about her.
  const [splashDone, setSplashDone] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    // A cold start always locks, if a PIN is set.
    isLockSet().then(exists => setLocked(exists));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async state => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (state !== 'active' || backgroundedAt.current === null) {
        return;
      }
      const away = Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;
      const forced = takeLockOnReturn();
      // A few seconds in another app should not cost her the PIN; a real
      // absence should, and so does a quick exit.
      if ((away >= LOCK_AFTER_MS || forced) && (await isLockSet())) {
        setLocked(true);
      }
    });
    return () => subscription.remove();
  }, []);

  async function routeSignedInUser() {
    try {
      const token = await getAccessToken();
      if (!token) {
        setScreen('welcome');
        return;
      }

      const status = await apiRequest('/onboarding/status', {token});
      setUserName(status.preferred_name ?? null);

      if (status.consent_version !== status.current_consent_version) {
        setScreen('consent');
      } else if (status.distress_baseline === null) {
        setScreen('distress');
      } else {
        setScreen('tabs');
      }
    } catch {
      setScreen('welcome');
    }
  }

  useEffect(() => {
    routeSignedInUser();
  }, []);
    if (!splashDone) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <SplashScreen onDone={() => setSplashDone(true)} />
      </SafeAreaProvider>
    );
  }

  // Until we know whether a PIN exists, the app shows nothing at all — that is
  // what makes the lock the first thing she sees rather than a flash of content.
  if (locked === null) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <View style={{flex: 1, backgroundColor: colors.bg}} />
      </SafeAreaProvider>
    );
  }

  // Nothing of the app renders while it is locked, not even for a frame.
  if (locked) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        {/* Help is reachable without the PIN. */}
        <GetHelp />
        <AppLockScreen
          onUnlocked={() => setLocked(false)}
          onForgot={async () => {
            // The PIN only exists here, so forgetting it means signing in again.
            await clearLock();
            await clearTokens();
            setLocked(false);
            setScreen('welcome');
          }}
        />
      </SafeAreaProvider>
    );
  }
  if (screen === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* The app is light throughout, so the clock and battery must be dark. */}
      <StatusBar barStyle="dark-content" />
      {screen === 'welcome' && (
        <WelcomeScreen
          onGoToSignup={() => setScreen('intro')}
          onGoToLogin={() => setScreen('login')}
        />
      )}

      {/* What the app is for, before an account is asked for. */}
      {screen === 'intro' && (
        <IntroScreen onDone={() => setScreen('signup')} onBack={() => setScreen('welcome')} />
      )}

      {screen === 'signup' && (
        <SignupScreen
          onCodeSent={email => {
            setPendingEmail(email);
            setScreen('verifySignupCode');
          }}
          onGoToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'verifySignupCode' && (
        <VerifySignupCodeScreen
          email={pendingEmail}
          onVerified={token => {
            setSetupToken(token);
            setScreen('setPassword');
          }}
          onBack={() => setScreen('signup')}
        />
      )}

      {screen === 'setPassword' && (
        <SetPasswordScreen
          title="Set your password"
          submit={password => setPasswordApi(setupToken, password)}
          onDone={() => setScreen('consent')}
        />
      )}

      {screen === 'login' && (
        <LoginScreen
          onSignedIn={routeSignedInUser}
          onGoToSignup={() => setScreen('signup')}
          onGoToForgot={() => setScreen('forgot')}
        />
      )}

      {screen === 'forgot' && (
        <ForgotPasswordScreen
          onCodeSent={email => {
            setPendingEmail(email);
            setScreen('verifyResetCode');
          }}
          onBack={() => setScreen('login')}
        />
      )}

      {screen === 'verifyResetCode' && (
        <VerifyResetCodeScreen
          email={pendingEmail}
          onVerified={token => {
            setResetToken(token);
            setScreen('resetPassword');
          }}
        />
      )}

      {screen === 'resetPassword' && (
        <SetPasswordScreen
          title="Choose a new password"
          submit={password => resetPasswordWithCode(resetToken, password)}
          onDone={() => setScreen('tabs')}
        />
      )}

      {screen === 'consent' && (
        <ConsentScreen onAgreed={() => setScreen('name')} />
      )}

      {/* Optional: what to call the user in the greeting. */}
      {screen === 'name' && (
        <NameScreen
          mode="onboarding"
          onDone={name => {
            setUserName(name);
            setScreen('focus');
          }}
        />
      )}

      {screen === 'focus' && (
        <FocusAreasScreen onContinue={() => setScreen('workIssues')} />
      )}

      {screen === 'workIssues' && (
        <WorkIssuesScreen onContinue={() => setScreen('lifeVision')} />
      )}

      {screen === 'lifeVision' && (
        <LifeVisionScreen onContinue={() => setScreen('distress')} />
      )}

      {screen === 'distress' && (
        <DistressScreen onContinue={() => setScreen('tabs')} />
      )}

      {/* The four areas of the app, with the tab bar pinned under them. */}
      {screen === 'tabs' && (
        <View style={{flex: 1, backgroundColor: colors.bg}}>
          <ScreenBackground />
          <View style={{flex: 1}}>
            {tab === 'home' && (
              <HomeScreen
                name={userName}
                onSignedOut={() => {
                  setUserName(null);
                  setScreen('welcome');
                }}
                onStartJournal={startJournal}
                onResumeDraft={draft => {
                  setJournal({journalType: draft.journal_type, entryId: draft.id});
                  setScreen('journal');
                }}
                onOpenInsights={() => setTab('insights')}
                onOpenEntries={() => setScreen('entries')}
                onOpenSettings={() => setScreen('settings')}
                onOpenCalm={start => {
                  setCalmStart(start ?? 'home');
                  setScreen('calm');
                }}
                onOpenChat={() => setTab('chat')}
              />
            )}

            {tab === 'journal' && (
              <JournalScreen
                onStartJournal={startJournal}
                onResumeDraft={draft => {
                  setJournal({journalType: draft.journal_type, entryId: draft.id});
                  setScreen('journal');
                }}
                onOpenEntries={() => setScreen('entries')}
              />
            )}

            {/* AI Chat: a chat with Echo; the free write journal is in the Journal tab. */}
            {tab === 'chat' && (
              <ChatTabScreen
                onOpenEntries={() => setScreen('entries')}
                onOpenCalm={() => {
                  setCalmStart('home');
                  setScreen('calm');
                }}
              />
            )}

            {tab === 'insights' && (
              <InsightsScreen
                onBack={() => setTab('home')}
                onStartEntry={() => startJournal('check_in')}
                onOpenArticle={slug => {
                  setArticleSlug(slug);
                  setScreen('article');
                }}
                onOpenEntry={entryId => {
                  // FR-INS-005: a plotted point opens the entry it came from, read-only.
                  setJournal({journalType: 'check_in', entryId, readOnly: true});
                  setScreen('journal');
                }}
                onOpenWeekly={() => setScreen('weeklyReport')}
                onOpenReports={() => {
                  setReportsBack('tabs');
                  setScreen('checkinReports');
                }}
              />
            )}

            {tab === 'library' && (
              <LibraryScreen
                onBack={() => setTab('home')}
                onOpenArticle={slug => {
                  setArticleSlug(slug);
                  setScreen('article');
                }}
              />
            )}
          </View>

          <TabBar current={tab} onChange={setTab} />
        </View>
      )}

      {/* The two short journals run as a deck of cards: one question on screen
          at a time, the next decided by the last answer. A new entry only —
          reopening a past one shows the thread it was recorded in. */}
      {screen === 'journal' && !journal.entryId && DECK_JOURNALS.includes(journal.journalType) && (
        <ErrorBoundary>
          <DeckScreen
            // A new deck for each journal, slot or cross-link: nothing carries over.
            key={`${journal.journalType}-${journal.slot ?? ''}-${journal.localDate ?? ''}-${journal.sourceEntryId ?? ''}`}
            journalType={journal.journalType as 'check_in' | 'savouring' | 'thought'}
            slot={journal.slot}
            localDate={journal.localDate}
            sourceEntryId={journal.sourceEntryId}
            onExit={() => {
              setStartMood(null);
              setScreen(journal.returnTo ?? 'tabs');
            }}
            onContinueInThread={(entryId, journalType) => {
              setJournal({journalType, entryId});
            }}
            onOpenJournal={(journalType, sourceEntryId) => {
              setJournal({journalType, sourceEntryId, returnTo: 'checkins'});
            }}
          />
        </ErrorBoundary>
      )}

      {/* The Saving Journal is its own module: new moments, and any moment reopened. */}
      {screen === 'journal' && journal.journalType === 'savouring' && (
        <ErrorBoundary>
          <SavoringModule
            key={`${journal.entryId ?? ''}-${journal.sourceEntryId ?? ''}`}
            entryId={journal.entryId}
            sourceEntryId={journal.sourceEntryId}
            onExit={() => setScreen(journal.returnTo ?? (journal.readOnly ? 'entries' : 'tabs'))}
          />
        </ErrorBoundary>
      )}

      {/* The Thought Journal is its own module too: new records, drafts and finished ones. */}
      {screen === 'journal' && journal.journalType === 'thought' && (
        <ErrorBoundary>
          <ThoughtModule
            key={`${journal.entryId ?? ''}-${journal.sourceEntryId ?? ''}`}
            entryId={journal.entryId}
            sourceEntryId={journal.sourceEntryId}
            onExit={() => setScreen(journal.returnTo ?? (journal.readOnly ? 'entries' : 'tabs'))}
            onOpenSavoring={() => setJournal({journalType: 'savouring', returnTo: journal.returnTo})}
            onOpenExposure={sourceEntryId => setJournal({journalType: 'exposure', sourceEntryId, returnTo: journal.returnTo})}
            onOpenGrounding={() => {
              setCalmStart('groundYourself');
              setScreen('calm');
            }}
          />
        </ErrorBoundary>
      )}

      {/* The Exposure Journal: ladders, plans, and exposures reopened. */}
      {screen === 'journal' && journal.journalType === 'exposure' && (
        <ErrorBoundary>
          <ExposureModule
            key={`${journal.entryId ?? ''}-${journal.sourceEntryId ?? ''}`}
            entryId={journal.entryId}
            sourceEntryId={journal.sourceEntryId}
            onExit={() => setScreen(journal.returnTo ?? (journal.readOnly ? 'entries' : 'tabs'))}
            onOpenSavoring={() => setJournal({journalType: 'savouring', returnTo: journal.returnTo})}
          />
        </ErrorBoundary>
      )}

      {/* Everything else — and every entry reopened — stays a thread. */}
      {screen === 'journal' &&
        !MODULE_JOURNALS.includes(journal.journalType) &&
        !(!journal.entryId && DECK_JOURNALS.includes(journal.journalType)) && (
        // A rendering bug in the thread shows a retry; every message is already saved.
        <ErrorBoundary>
          <ChatEntryScreen
            key={journal.entryId ?? `new-${journal.journalType}-${journal.sourceEntryId ?? ''}`}
            journalType={journal.journalType}
            entryId={journal.entryId}
            sourceEntryId={journal.sourceEntryId}
            readOnly={journal.readOnly}
            startMood={startMood ?? undefined}
            onExit={() => {
              setStartMood(null);
              setScreen(journal.returnTo ?? (journal.readOnly ? 'entries' : 'tabs'));
            }}
          />
        </ErrorBoundary>
      )}

      {/* The day's three check-ins, and yesterday's, to start, carry on or read. */}
      {screen === 'checkins' && (
        <ErrorBoundary>
          <CheckInSlotsScreen
            onBack={() => setScreen('tabs')}
            onStart={(slot, localDate) => {
              setJournal({journalType: 'check_in', slot, localDate, returnTo: 'checkins'});
              setScreen('journal');
            }}
            onOpenEntry={entryId => {
              setJournal({journalType: 'check_in', entryId, readOnly: true, returnTo: 'checkins'});
              setScreen('journal');
            }}
            onOpenReports={() => {
              setReportsBack('checkins');
              setScreen('checkinReports');
            }}
          />
        </ErrorBoundary>
      )}

      {/* The reports: a finished day, week or month of all four journals, as a PDF. */}
      {screen === 'checkinReports' && (
        <ErrorBoundary>
          <CheckInReportsScreen onBack={() => setScreen(reportsBack)} />
        </ErrorBoundary>
      )}

      {screen === 'entries' && (
        <EntriesScreen
          onBack={() => setScreen('tabs')}
          onOpen={item => {
            setJournal({
              journalType: item.journal_type,
              entryId: item.id,
              // FR-ENT-028: a finished thread is a record; a draft, or an AI Chat
              // that is still going, can be carried on.
              readOnly:
                item.status === 'completed' &&
                !(item.journal_type === 'chat' && item.conversation_status === 'active'),
            });
            setScreen('journal');
          }}
        />
      )}

      {screen === 'article' && (
        <ArticleScreen slug={articleSlug} onBack={() => setScreen('tabs')} />
      )}
            {screen === 'settings' && (
        <SettingsScreen
          name={userName}
          onOpenName={() => setScreen('editName')}
          onOpenAppLock={() => setScreen('appLockSetup')}
          onOpenReminders={() => setScreen('reminders')}
          onOpenDeleteAccount={() => setScreen('deleteAccount')}
          onSignedOut={() => {
            setUserName(null);
            setScreen('welcome');
          }}
          onBack={() => setScreen('tabs')}
        />
      )}

      {screen === 'editName' && (
        <NameScreen
          mode="settings"
          initial={userName}
          onDone={name => {
            setUserName(name);
            setScreen('settings');
          }}
          onCancel={() => setScreen('settings')}
        />
      )}

      {screen === 'reminders' && <RemindersScreen onBack={() => setScreen('settings')} />}

      {/* SRS 4.12: the account and everything in it, deleted for good. */}
      {screen === 'deleteAccount' && (
        <DeleteAccountScreen
          onBack={() => setScreen('settings')}
          onDeleted={() => {
            setUserName(null);
            setTab('home');
            setScreen('welcome');
          }}
        />
      )}

      {/* Breathing and grounding, offline: nothing is saved or sent. */}
      {screen === 'calm' && <CalmModule initial={calmStart} onExit={() => setScreen('tabs')} />}

      {screen === 'appLockSetup' && (
        <SetAppLockScreen onDone={() => setScreen('settings')} />
      )}

      {screen === 'weeklyReport' && (
        <WeeklyReportScreen
          onBack={() => setScreen('tabs')}
          onOpenEntry={(entryId, journalType) => {
            setJournal({journalType, entryId, readOnly: true});
            setScreen('journal');
          }}
        />
      )}

      {/* FR-CRIS-009: every screen without its own Get help link gets this one,
          including sign-in and onboarding. */}
      {(SCREENS_WITHOUT_HELP.includes(screen) || (screen === 'tabs' && tab === 'library')) && <GetHelp />}
    </SafeAreaProvider>
  );
}

export default App;