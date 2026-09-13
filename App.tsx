import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import ConsentScreen from './src/screens/ConsentScreen';
import DistressScreen from './src/screens/DistressScreen';
import FocusAreasScreen from './src/screens/FocusAreasScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import GoalScreen from './src/screens/GoalScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SetPasswordScreen from './src/screens/SetPasswordScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerifyResetCodeScreen from './src/screens/VerifyResetCodeScreen';
import VerifySignupCodeScreen from './src/screens/VerifySignupCodeScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import {resetPasswordWithCode, setPassword as setPasswordApi} from './src/api/auth';
import {apiRequest} from './src/api/client';
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
  | 'distress'
  | 'goal'
  | 'home';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('loading');

  // Transient state carried between steps of the signup and reset flows.
  const [pendingEmail, setPendingEmail] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [resetToken, setResetToken] = useState('');

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
        <FocusAreasScreen onContinue={() => setScreen('distress')} />
      )}

      {screen === 'distress' && (
        <DistressScreen onContinue={() => setScreen('goal')} />
      )}

      {screen === 'goal' && <GoalScreen onContinue={() => setScreen('home')} />}

      {screen === 'home' && (
        <HomeScreen onSignedOut={() => setScreen('welcome')} />
      )}
    </SafeAreaProvider>
  );
}

export default App;