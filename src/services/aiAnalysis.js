import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Timestamps (ms) at which to sample frames from the video.
// The array has 12 entries; extractVideoFrames() respects the maxFrames cap
// and also stops early when a timestamp exceeds the video duration.
const FRAME_TIMESTAMPS_MS = [0, 500, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000];

const ANALYSIS_PROMPT = `You are a professional soccer/football referee assistant.
You are given a sequence of video frames (extracted at regular intervals from a single clip).
Analyze the frames in order and determine if there is a FAULT (foul/infraction) committed by any player.

A fault includes: tackles from behind, pushing, holding, handball, tripping, dangerous play, etc.

Respond with EXACTLY this JSON format (no markdown, no code blocks):
{
  "verdict": "FAULT" or "NOT FAULT" or "INCONCLUSIVE",
  "reasoning": "Your detailed explanation of what you observed across the frames and why you made this decision"
}

Be precise. If you cannot clearly see a fault or the image quality is poor, use INCONCLUSIVE.`;

/**
 * Extracts up to maxFrames JPEG thumbnails from a local video file and returns
 * them as base64-encoded strings. Stops early if a timestamp exceeds the
 * video duration (getThumbnailAsync throws).
 */
async function extractVideoFrames(videoUri, maxFrames = 10, onProgress) {
  const timestamps = FRAME_TIMESTAMPS_MS.slice(0, maxFrames);
  const frames = [];

  for (let i = 0; i < timestamps.length; i++) {
    try {
      onProgress && onProgress(`Extracting frame ${i + 1}/${timestamps.length}…`);
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timestamps[i],
        quality: 0.7,
      });

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      frames.push(base64);

      // Remove the temporary thumbnail file
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      // getThumbnailAsync throws when the timestamp is beyond the video duration.
      // Any other error (permissions, corrupted file, etc.) is logged for debugging
      // and also stops extraction, since subsequent frames will likely fail too.
      if (e?.message) {
        console.warn('Frame extraction stopped at timestamp', timestamps[i], '—', e.message);
      }
      break;
    }
  }

  return frames;
}

export async function analyzeVideoWithGemini(videoUri, apiKey, onProgress) {
  try {
    // Step 1 — extract frames locally
    onProgress && onProgress('Extracting frames from video…');
    const frames = await extractVideoFrames(videoUri, 10, onProgress);

    if (frames.length === 0) {
      throw new Error('Could not extract any frames from the video. Please try again.');
    }

    // Step 2 — build Gemini request with one image part per frame
    onProgress && onProgress(`Sending ${frames.length} frames to AI…`);

    const imageParts = frames.map(base64 => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: base64,
      },
    }));

    const requestBody = {
      contents: [
        {
          parts: [
            ...imageParts,
            { text: ANALYSIS_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from AI');
    }

    // Step 3 — parse JSON verdict
    onProgress && onProgress('Parsing AI response…');
    const result = JSON.parse(text.trim());

    if (!['FAULT', 'NOT FAULT', 'INCONCLUSIVE'].includes(result.verdict)) {
      throw new Error(`Invalid verdict from AI: "${result.verdict}"`);
    }

    return {
      verdict: result.verdict,
      reasoning: result.reasoning || 'No reasoning provided.',
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        verdict: 'INCONCLUSIVE',
        reasoning: 'The AI response could not be parsed correctly. Please try again.',
      };
    }
    throw error;
  }
}

export async function analyzeVideo(videoUri, provider, apiKey, onProgress) {
  if (provider === 'mock' || !apiKey) {
    // Mock analysis for testing
    onProgress && onProgress('Running mock analysis…');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verdicts = ['FAULT', 'NOT FAULT', 'INCONCLUSIVE'];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    return {
      verdict,
      reasoning: `[MOCK ANALYSIS] This is a simulated result. The video clip was analyzed and the determination is "${verdict}". In a real scenario, the AI would provide detailed reasoning about player positions, contact, and referee interpretation of the rules.`,
    };
  }

  if (provider === 'gemini') {
    return analyzeVideoWithGemini(videoUri, apiKey, onProgress);
  }

  throw new Error(`Unknown provider: ${provider}`);
}
