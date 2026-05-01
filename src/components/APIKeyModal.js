import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PROVIDER = 'refcheck_ai_provider';
const STORAGE_KEY_APIKEY = 'refcheck_api_key';

export { STORAGE_KEY_PROVIDER, STORAGE_KEY_APIKEY };

export default function APIKeyModal({ visible, onClose, onSave }) {
  const [provider, setProvider] = useState('mock');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedProvider = await AsyncStorage.getItem(STORAGE_KEY_PROVIDER);
      const savedKey = await AsyncStorage.getItem(STORAGE_KEY_APIKEY);
      if (savedProvider) setProvider(savedProvider);
      if (savedKey) setApiKey(savedKey);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PROVIDER, provider);
      await AsyncStorage.setItem(STORAGE_KEY_APIKEY, apiKey);
      onSave({ provider, apiKey });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text style={styles.title}>⚙️ AI Settings</Text>

          {/* Provider selection */}
          <Text style={styles.label}>AI Provider</Text>
          <View style={styles.providerRow}>
            {['gemini', 'mock'].map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.providerOption,
                  provider === p && styles.providerOptionSelected,
                ]}
                onPress={() => setProvider(p)}
              >
                <Text
                  style={[
                    styles.providerText,
                    provider === p && styles.providerTextSelected,
                  ]}
                >
                  {p === 'gemini' ? '✨ Gemini' : '🎲 Mock'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* API Key input */}
          {provider !== 'mock' && (
            <>
              <Text style={styles.label}>API Key</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Enter your Gemini API key"
                  placeholderTextColor="#636366"
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowKey(!showKey)}
                >
                  <Text style={styles.eyeIcon}>{showKey ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Get your free API key at aistudio.google.com
              </Text>
            </>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  providerOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  providerOptionSelected: {
    backgroundColor: '#0A84FF',
  },
  providerText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  providerTextSelected: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 14,
  },
  eyeButton: {
    padding: 14,
  },
  eyeIcon: {
    fontSize: 18,
  },
  hint: {
    color: '#636366',
    fontSize: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  cancelText: {
    color: '#EBEBF5',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
