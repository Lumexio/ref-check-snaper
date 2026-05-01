import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';

const VERDICT_CONFIG = {
  FAULT: {
    emoji: '⚠️',
    color: '#FF3B30',
    bgColor: 'rgba(255, 59, 48, 0.15)',
    label: 'FAULT',
  },
  'NOT FAULT': {
    emoji: '✅',
    color: '#34C759',
    bgColor: 'rgba(52, 199, 89, 0.15)',
    label: 'NOT FAULT',
  },
  INCONCLUSIVE: {
    emoji: '❓',
    color: '#FF9500',
    bgColor: 'rgba(255, 149, 0, 0.15)',
    label: 'INCONCLUSIVE',
  },
};

export default function StatusModal({ visible, verdict, reasoning, onClose }) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.INCONCLUSIVE;

  const toggleReasoning = () => {
    const toValue = reasoningExpanded ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
    }).start();
    setReasoningExpanded(!reasoningExpanded);
  };

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleClose = () => {
    setReasoningExpanded(false);
    rotateAnim.setValue(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Verdict */}
          <View style={[styles.verdictBadge, { backgroundColor: config.bgColor }]}>
            <Text style={styles.verdictEmoji}>{config.emoji}</Text>
            <Text style={[styles.verdictText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>

          {/* Reasoning toggle */}
          <TouchableOpacity
            style={styles.reasoningHeader}
            onPress={toggleReasoning}
            activeOpacity={0.7}
          >
            <Text style={styles.reasoningTitle}>View Reasoning</Text>
            <Animated.Text
              style={[styles.arrow, { transform: [{ rotate: arrowRotation }] }]}
            >
              ▼
            </Animated.Text>
          </TouchableOpacity>

          {/* Reasoning content */}
          {reasoningExpanded && (
            <ScrollView
              style={styles.reasoningContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.reasoningText}>{reasoning}</Text>
            </ScrollView>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  verdictBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
  },
  verdictEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 8,
  },
  reasoningTitle: {
    color: '#EBEBF5',
    fontSize: 15,
    fontWeight: '600',
  },
  arrow: {
    color: '#8E8E93',
    fontSize: 12,
  },
  reasoningContent: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  reasoningText: {
    color: '#EBEBF5',
    fontSize: 14,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
