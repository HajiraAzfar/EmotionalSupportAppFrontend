import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import ChatEntryScreen from './src/screens/ChatEntryScreen';
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
import {getAccessToken} from './src/storage/tokens';
import {colors} from './src/theme';

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
  | 'home'
  | 'journal'
  | 'entries';

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
        setScreen('home');
      }
    } catch {
      setScreen('welcome');
    }
  }

  useEffect(() => {
    routeSignedInUser();
  }, []);

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
          onDone={() => setScreen('home')}
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

      {screen === 'goal' && <GoalScreen onContinue={() => setScreen('home')} />}

      {screen === 'home' && (
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
          onOpenEntries={() => setScreen('entries')}
        />
      )}

      {screen === 'journal' && (
        <ChatEntryScreen
          key={journal.entryId ?? 'new'}
          journalType={journal.journalType}
          entryId={journal.entryId}
          readOnly={journal.readOnly}
          onExit={() => setScreen(journal.readOnly ? 'entries' : 'home')}
        />
      )}

      {screen === 'entries' && (
        <EntriesScreen
          onBack={() => setScreen('home')}
          onOpen={item => {
            setJournal({
              journalType: item.journal_type,
              entryId: item.id,
              // FR-ENT-028: a finished thread is a record; a draft can be carried on.
              readOnly: item.status === 'completed',
            });
            setScreen('journal');
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

export default App;