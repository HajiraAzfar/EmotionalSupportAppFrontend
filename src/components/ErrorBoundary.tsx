import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {colors, space, type} from '../theme';

type Props = {children: React.ReactNode};

// A rendering bug shows a calm retry instead of closing the app. Retrying
// re-mounts the children; anything they saved (a draft) is still there.
export default class ErrorBoundary extends React.Component<Props, {failed: boolean; attempt: number}> {
  state = {failed: false, attempt: 0};

  static getDerivedStateFromError() {
    return {failed: true};
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary', error);
  }

  render() {
    if (!this.state.failed) {
      return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    }
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.screen, backgroundColor: colors.bg}}>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState(s => ({failed: false, attempt: s.attempt + 1}))}
          style={{padding: 16}}>
          <Text style={{...type.body, textAlign: 'center'}}>Something went wrong.</Text>
          <Text style={{...type.link, textAlign: 'center', marginTop: 8}}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }
}
