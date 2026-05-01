import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecordButton from '../components/RecordButton';
import StatusModal from '../components/StatusModal';
import APIKeyModal, {
  STORAGE_KEY_PROVIDER,
  STORAGE_KEY_GEMINI_KEY,
  STORAGE_KEY_OPENAI_KEY,
  STORAGE_KEY_DEEPSEEK_KEY,
} from '../components/APIKeyModal';
import { analyzeVideo } from '../services/aiAnalysis';

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [aiSettings, setAiSettings] = useState({
    provider: 'mock',
    geminiKey: '',
    openaiKey: '',
    deepseekKey: '',
  });

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  // Ref-based recording flag so stopRecording never reads stale state.
  const isRecordingRef = useRef(false);
  // Timestamp (ms) at which recordAsync was called — used to enforce a
  // minimum recording duration and avoid the "Unknown error" race condition
  // where stopRecording is called before the native recorder has fully started.
  const recordStartTimeRef = useRef(null);
  // 2 000 ms gives the native camera recorder enough time to fully initialize
  // before stopRecording() can be dispatched to it.
  const MIN_RECORDING_MS = 2000;

  useEffect(() => {
    loadAiSettings();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadAiSettings = async () => {
    try {
      const provider = await AsyncStorage.getItem(STORAGE_KEY_PROVIDER);
      const geminiKey = await AsyncStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      const openaiKey = await AsyncStorage.getItem(STORAGE_KEY_OPENAI_KEY);
      const deepseekKey = await AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK_KEY);
      setAiSettings({
        provider: provider || 'mock',
        geminiKey: geminiKey || '',
        openaiKey: openaiKey || '',
        deepseekKey: deepseekKey || '',
      });
    } catch (e) {
      console.error('Failed to load AI settings', e);
    }
  };

  const handlePermissions = async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    if (!micPermission?.granted) {
      await requestMicPermission();
    }
  };

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecordingRef.current || isAnalyzing || !cameraReady) return;

    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    recordStartTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 15,
      });
      if (video?.uri) {
        handleVideoCapture(video.uri);
      }
    } catch (e) {
      // Suppress the Android "Unknown error" that fires when stopRecording is
      // called before the native encoder has fully initialised.  Any other
      // unexpected error is surfaced to the user.
      const msg = e?.message ?? '';
      if (!msg.includes('Unknown error') && !msg.includes('already in progress')) {
        console.error('Recording error', e);
        Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      }
    } finally {
      isRecordingRef.current = false;
      recordStartTimeRef.current = null;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isAnalyzing, cameraReady]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecordingRef.current || !recordStartTimeRef.current) return;

    const elapsed = Date.now() - recordStartTimeRef.current;
    const remaining = MIN_RECORDING_MS - elapsed;

    const doStop = () => {
      try {
        cameraRef.current?.stopRecording();
      } catch (e) {
        // Recording may have already stopped (e.g. maxDuration reached)
      }
    };

    if (remaining > 0) {
      // Wait until the native recorder has had time to fully initialize
      setTimeout(doStop, remaining);
    } else {
      doStop();
    }
  }, []);

  const handleVideoCapture = async (uri) => {
    setIsAnalyzing(true);
    setAnalyzingStep('Preparing…');
    const apiKeyMap = {
      gemini: aiSettings.geminiKey,
      openai: aiSettings.openaiKey,
      deepseek: aiSettings.deepseekKey,
    };
    const apiKey = apiKeyMap[aiSettings.provider] || '';
    try {
      const result = await analyzeVideo(
        uri,
        aiSettings.provider,
        apiKey,
        (step) => setAnalyzingStep(step),
      );
      setVerdict(result.verdict);
      setReasoning(result.reasoning);
      setShowStatus(true);
    } catch (e) {
      Alert.alert(
        'Analysis Error',
        e.message || 'Failed to analyze the video. Please check your API key and try again.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
  };

  const handleGalleryPick = async () => {
    if (isRecording || isAnalyzing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      handleVideoCapture(result.assets[0].uri);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Permissions not loaded yet
  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Permissions denied
  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          📷 Camera access is required to use RefCheck
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handlePermissions}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        mode="video"
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>⚽ RefCheck</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
            disabled={isRecording || isAnalyzing}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>{formatTime(recordingSeconds)}</Text>
          </View>
        )}

        {/* Analyzing indicator */}
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text style={styles.analyzingText}>Analyzing clip…</Text>
            {!!analyzingStep && (
              <Text style={styles.analyzingStep}>{analyzingStep}</Text>
            )}
          </View>
        )}

        {/* AI provider badge */}
        <View style={styles.providerBadge}>
          <Text style={styles.providerBadgeText}>
            {{ mock: '🎲 Mock', gemini: '✨ Gemini', openai: '🤖 OpenAI', deepseek: '🧠 DeepSeek' }[aiSettings.provider] ?? '🎲 Mock'}
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Gallery button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleGalleryPick}
            disabled={isRecording || isAnalyzing}
          >
            <Text style={styles.galleryIcon}>🖼️</Text>
          </TouchableOpacity>

          {/* Record button */}
          <RecordButton
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={isRecording}
            disabled={isAnalyzing || !cameraReady}
          />

          {/* Spacer for symmetry */}
          <View style={styles.galleryButton} />
        </View>
      </SafeAreaView>

      {/* Status Modal */}
      <StatusModal
        visible={showStatus}
        verdict={verdict}
        reasoning={reasoning}
        onClose={() => setShowStatus(false)}
      />

      {/* API Key Modal */}
      <APIKeyModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(settings) => {
          setAiSettings(settings);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) + 12 : 12,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  analyzingContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingStep: {
    color: '#AEAEB2',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  providerBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  providerBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    fontSize: 24,
  },
});
