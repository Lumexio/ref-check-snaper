import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';

export default function RecordButton({ onStartRecording, onStopRecording, isRecording, disabled }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
    onStartRecording();
  }, [disabled, onStartRecording, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onStopRecording();
  }, [disabled, onStopRecording, scaleAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={styles.touchable}
      >
        <View style={[styles.outerRing, isRecording && styles.outerRingRecording]}>
          <View style={[styles.innerCircle, isRecording && styles.innerCircleRecording]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingRecording: {
    borderColor: '#FF3B30',
  },
  innerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
  },
  innerCircleRecording: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
});
