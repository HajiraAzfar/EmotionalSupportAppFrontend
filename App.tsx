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
import GoalScreen from './src/screens/GoalScreen';
import HomeScreen from './src/screens/HomeScreen';
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
import {JournalType} from './src/api/entries';
import {clearTokens, getAccessToken} from './src/storage/tokens';
import {colors} from './src/theme';
import ArticleScreen from './src/screens/ArticleScreen';
import ChatTabScreen from './src/screens/ChatTabScreen';
import JournalScreen from './src/screens/JournalScreen';
import TabBar, {Tab} from './src/components/TabBar';
import InsightsScreen from './src/screens/InsightsScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import {AppState} from 'react-native';
import AppLockScreen from './src/screens/AppLockScreen';
import SetAppLockScreen from './src/screens/SetAppLockScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';
import ScreenBackground from './src/components/ScreenBackground';
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
  | 'goal'
  | 'tabs'
  | 'journal'
  | 'entries'
  | 'article'
  | 'appLockSetup'
  | 'settings';

// Screens whose own header has no Get help link (FR-CRIS-009).
const SCREENS_WITHOUT_HELP: Screen[] = [
  'welcome', 'login', 'signup', 'verifySignupCode', 'setPassword', 'forgot', 'verifyResetCode',
  'resetPassword', 'consent', 'focus', 'workIssues', 'lifeVision', 'distress', 'goal', 'article',
  'appLockSetup', 'settings',
];

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
  }>({journalType: 'check_in'});
  // SRS 4.11: which article the reader screen is showing.
  const [articleSlug, setArticleSlug] = useState('');
  // Which of the four areas is showing. The tab bar is the only way between them.
  const [tab, setTab] = useState<Tab>('home');
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
          onGoToSignup={() => setScreen('signup')}
          onGoToLogin={() => setScreen('login')}
        />
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
        <ConsentScreen onAgreed={() => setScreen('focus')} />
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
        <DistressScreen onContinue={() => setScreen('goal')} />
      )}

      {screen === 'goal' && <GoalScreen onContinue={() => setScreen('tabs')} />}

      {/* The four areas of the app, with the tab bar pinned under them. */}
      {screen === 'tabs' && (
        <View style={{flex: 1, backgroundColor: colors.bg}}>
          <ScreenBackground />
          <View style={{flex: 1}}>
            {tab === 'home' && (
              <HomeScreen
                onSignedOut={() => setScreen('welcome')}
                onStartJournal={type => {
                  setJournal({journalType: type});
                  setScreen('journal');
                }}
                onResumeDraft={draft => {
                  setJournal({journalType: draft.journal_type, entryId: draft.id});
                  setScreen('journal');
                }}
                onOpenInsights={() => setTab('insights')}
                onOpenEntries={() => setScreen('entries')}
                onOpenSettings={() => setScreen('settings')}
              />
            )}

            {tab === 'journal' && (
              <JournalScreen
                onStartJournal={type => {
                  setJournal({journalType: type});
                  setScreen('journal');
                }}
                onResumeDraft={draft => {
                  setJournal({journalType: draft.journal_type, entryId: draft.id});
                  setScreen('journal');
                }}
                onOpenEntries={() => setScreen('entries')}
              />
            )}

            {/* AI Chat: a chat with Echo; the free write journal is in the Journal tab. */}
            {tab === 'chat' && <ChatTabScreen onOpenEntries={() => setScreen('entries')} />}

            {tab === 'insights' && (
              <InsightsScreen
                onBack={() => setTab('home')}
                onStartEntry={() => {
                  setJournal({journalType: 'check_in'});
                  setScreen('journal');
                }}
                onOpenArticle={slug => {
                  setArticleSlug(slug);
                  setScreen('article');
                }}
                onOpenEntry={entryId => {
                  // FR-INS-005: a plotted point opens the entry it came from, read-only.
                  setJournal({journalType: 'check_in', entryId, readOnly: true});
                  setScreen('journal');
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

      {/* Every journal, check-in included, runs its own capture schedule here. */}
      {screen === 'journal' && (
        // A rendering bug in the thread shows a retry; every message is already saved.
        <ErrorBoundary>
          <ChatEntryScreen
            key={journal.entryId ?? 'new'}
            journalType={journal.journalType}
            entryId={journal.entryId}
            readOnly={journal.readOnly}
            startMood={startMood ?? undefined}
            onExit={() => {
              setStartMood(null);
              setScreen(journal.readOnly ? 'entries' : 'tabs');
            }}
          />
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
          onOpenAppLock={() => setScreen('appLockSetup')}
          onSignedOut={() => setScreen('welcome')}
          onBack={() => setScreen('tabs')}
        />
      )}

      {screen === 'appLockSetup' && (
        <SetAppLockScreen onDone={() => setScreen('settings')} />
      )}

      {/* FR-CRIS-009: every screen without its own Get help link gets this one,
          including sign-in and onboarding. */}
      {(SCREENS_WITHOUT_HELP.includes(screen) || (screen === 'tabs' && tab === 'library')) && <GetHelp />}
    </SafeAreaProvider>
  );
}

export default App;