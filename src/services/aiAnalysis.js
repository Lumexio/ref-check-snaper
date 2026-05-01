import * as FileSystem from 'expo-file-system';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const ANALYSIS_PROMPT = `You are a professional soccer/football referee assistant. 
Analyze this video clip and determine if there is a FAULT (foul/infraction) committed by any player.

A fault includes: tackles from behind, pushing, holding, handball, tripping, dangerous play, etc.

Respond with EXACTLY this JSON format (no markdown, no code blocks):
{
  "verdict": "FAULT" or "NOT FAULT" or "INCONCLUSIVE",
  "reasoning": "Your detailed explanation of what you observed and why you made this decision"
}

Be precise. If you cannot clearly see a fault or the video quality is poor, use INCONCLUSIVE.`;

export async function analyzeVideoWithGemini(videoUri, apiKey) {
  try {
    // Read video file as base64
    const base64Video = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'video/mp4',
                data: base64Video,
              },
            },
            {
              text: ANALYSIS_PROMPT,
            },
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
      headers: {
        'Content-Type': 'application/json',
      },
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

    // Parse JSON response
    const result = JSON.parse(text.trim());

    if (!['FAULT', 'NOT FAULT', 'INCONCLUSIVE'].includes(result.verdict)) {
      throw new Error(`Invalid verdict from AI: "${result.verdict}"`);
    }

    return {
      verdict: result.verdict,
      reasoning: result.reasoning || 'No reasoning provided.',
    };
  } catch (error) {
    // If JSON parsing fails, return INCONCLUSIVE rather than crashing
    if (error instanceof SyntaxError) {
      return {
        verdict: 'INCONCLUSIVE',
        reasoning: 'The AI response could not be parsed correctly. Please try again.',
      };
    }
    throw error;
  }
}

export async function analyzeVideo(videoUri, provider, apiKey) {
  if (provider === 'mock' || !apiKey) {
    // Mock analysis for testing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verdicts = ['FAULT', 'NOT FAULT', 'INCONCLUSIVE'];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    return {
      verdict,
      reasoning: `[MOCK ANALYSIS] This is a simulated result. The video clip was analyzed and the determination is "${verdict}". In a real scenario, the AI would provide detailed reasoning about player positions, contact, and referee interpretation of the rules.`,
    };
  }

  if (provider === 'gemini') {
    return analyzeVideoWithGemini(videoUri, apiKey);
  }

  throw new Error(`Unknown provider: ${provider}`);
}
