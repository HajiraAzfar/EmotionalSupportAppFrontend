import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {colors, space, type} from '../theme';

type Props = {
  onGoToSignup: () => void;
  onGoToLogin: () => void;
};

export default function WelcomeScreen({onGoToSignup, onGoToLogin}: Props) {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View style={{flex: 1, paddingHorizontal: space.screen}}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Text style={type.display}>Echo</Text>
          <Text style={{...type.body, marginTop: 14, maxWidth: 240}}>
            A quiet companion for your loudest thoughts.
          </Text>
        </View>

        <View style={{paddingBottom: 44}}>
          <PrimaryButton label="Get started" onPress={onGoToSignup} />

          <Pressable onPress={onGoToLogin} style={{paddingVertical: 18}}>
            <Text style={{...type.small, textAlign: 'center'}}>
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}