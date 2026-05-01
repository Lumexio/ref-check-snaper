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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PROVIDER = 'refcheck_ai_provider';
const STORAGE_KEY_GEMINI_KEY = 'refcheck_gemini_key';
const STORAGE_KEY_OPENAI_KEY = 'refcheck_openai_key';
const STORAGE_KEY_DEEPSEEK_KEY = 'refcheck_deepseek_key';

export { STORAGE_KEY_PROVIDER, STORAGE_KEY_GEMINI_KEY, STORAGE_KEY_OPENAI_KEY, STORAGE_KEY_DEEPSEEK_KEY };

const PROVIDERS = [
  { id: 'gemini', label: '✨ Gemini' },
  { id: 'openai', label: '🤖 OpenAI' },
  { id: 'deepseek', label: '🧠 DeepSeek' },
  { id: 'mock', label: '🎲 Mock' },
];

const PROVIDER_HINTS = {
  gemini: { placeholder: 'Enter your Gemini API key', hint: 'Get your free key at aistudio.google.com' },
  openai: { placeholder: 'Enter your OpenAI API key', hint: 'Get your key at platform.openai.com' },
  deepseek: { placeholder: 'Enter your DeepSeek API key', hint: 'Get your key at platform.deepseek.com' },
};

export default function APIKeyModal({ visible, onClose, onSave }) {
  const [provider, setProvider] = useState('mock');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedProvider = await AsyncStorage.getItem(STORAGE_KEY_PROVIDER);
      const savedGemini = await AsyncStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      const savedOpenai = await AsyncStorage.getItem(STORAGE_KEY_OPENAI_KEY);
      const savedDeepseek = await AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_KEY);
      if (savedProvider) setProvider(savedProvider);
      if (savedGemini) setGeminiKey(savedGemini);
      if (savedOpenai) setOpenaiKey(savedOpenai);
      if (savedDeepseek) setDeepseekKey(savedDeepseek);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PROVIDER, provider);
      await AsyncStorage.setItem(STORAGE_KEY_GEMINI_KEY, geminiKey);
      await AsyncStorage.setItem(STORAGE_KEY_OPENAI_KEY, openaiKey);
      await AsyncStorage.setItem(STORAGE_KEY_DEEPSEEK_KEY, deepseekKey);
      onSave({ provider, geminiKey, openaiKey, deepseekKey });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const currentKey = provider === 'gemini' ? geminiKey
    : provider === 'openai' ? openaiKey
    : provider === 'deepseek' ? deepseekKey
    : '';

  const setCurrentKey = (val) => {
    if (provider === 'gemini') setGeminiKey(val);
    else if (provider === 'openai') setOpenaiKey(val);
    else if (provider === 'deepseek') setDeepseekKey(val);
  };

  const hint = PROVIDER_HINTS[provider] ?? { placeholder: '', hint: '' };

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
            <View style={styles.providerRow}>
              {PROVIDERS.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.providerOption,
                    provider === p.id && styles.providerOptionSelected,
                  ]}
                  onPress={() => setProvider(p.id)}
                >
                  <Text
                    style={[
                      styles.providerText,
                      provider === p.id && styles.providerTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* API Key input — hidden for mock provider */}
          {provider !== 'mock' && (
            <>
              <Text style={styles.label}>API Key</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={currentKey}
                  onChangeText={setCurrentKey}
                  placeholder={hint.placeholder}
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
              <Text style={styles.hint}>{hint.hint}</Text>
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
  providerScroll: {
    marginBottom: 20,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  providerOptionSelected: {
    backgroundColor: '#0A84FF',
  },
  providerText: {
    color: '#8E8E93',
    fontSize: 14,
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

