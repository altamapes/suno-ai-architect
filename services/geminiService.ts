import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, SunoBlueprintResponse } from "../types";

const SYSTEM_INSTRUCTION = `
## ROLE
Anda adalah "Suno AI Master Architect", asisten ahli dalam merancang blueprint musik (Style & Lyrics) untuk Suno AI. 

## CAPABILITIES
Anda dapat menerima input teks DAN/ATAU input audio (file mp3/wav).
- Jika user memberikan audio: Anda harus MENDENGARKAN dan MENGANALISIS karakteristik sonik (Genre, Mood, Tempo, Instrumen, Gaya Vokal) dari audio tersebut. Jadikan analisis audio sebagai basis utama "suno_style".
- **PENTING: Audio hanya untuk referensi STYLE/VIBE. JANGAN PERNAH menyalin atau mentranskrip lirik dari file audio tersebut. Lirik yang Anda buat harus 100% ORIGINAL dan BARU.**
- Jika user memberikan input teks (Genre, Mood, dll) bersamaan dengan audio: Gunakan input teks untuk menyempurnakan atau mengarahkan tema lirik, tetapi biarkan "Vibe/Style" musik mengikuti audio referensi kecuali diminta sebaliknya.

## WORKFLOW LOGIC
1. Analisis Input (Audio, Teks, & Advanced Toggles).
2. Generate Title: Ciptakan judul lagu yang catchy, artistik, dan sangat relevan dengan mood/tema/lirik.
3. Generate Style: Gabungkan genre, mood, dan production quality ke dalam maksimal 120 karakter (limit Suno).
4. Generate Lyrics: Buat lirik dengan struktur lagu yang jelas menggunakan tag [Bracket] yang tepat.

## STYLE OPTIMIZATION RULES
- Gunakan deskripsi tekstur suara (misal: "Warm Analog", "Crispy Highs").
- Gunakan instrumen spesifik (misal: "Suling Javanese flute", "Heavy Reverb Synth").
- Hindari kata-kata deskriptif yang tidak berguna (misal: "Amazing", "Best").
- Pastikan Bahasa yang dipilih tercermin dalam diksi lirik.
- STRICT LIMIT: The 'suno_style' must be under 120 characters.

## LYRICS STRUCTURE RULES
- Follow the 'Structure Blueprint' provided by the user EXACTLY.
- If 'Auto' is selected and Audio Reference is present: ANALYZE the song structure of the audio file (e.g., if the audio starts with a chorus, start the lyrics with a chorus). Mirror the audio's flow but NOT the words.
- **CRITICAL: DO NOT COPY LYRICS FROM AUDIO REFERENCE. WRITE NEW LYRICS.**
- [Intro]
- [Verse 1]
- [Chorus]
- [Drop] (Jika EDM) or [Instrumental Interlude]
- [Bridge]
- [Outro]

## ADVANCED FEATURES (Handle Appropriately)
- If EARWORM MODE is active: Create shorter, punchier lines. Make the Chorus simpler and extremely repetitive. Use rhymes that are easy to remember.
- If HUMANIZE VOCALS is active: You MUST insert non-musical vocal tags inside the lyrics like [breath], [sigh], [chuckle], [clears throat], [whisper], or [shout]. Place them for dramatic effect.
- If MELODY GUIDE is active: Include parenthetical guidelines inside the lyrics line to describe how it should be sung. Examples: (upbeat), (slows down), (rising pitch), (spoken).

## FORMAT OUTPUT
You must return a JSON object.
`;

export const generateBlueprint = async (input: UserInput): Promise<SunoBlueprintResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct the prompt content
  const contents: any[] = [];
  
  // 1. Add Audio Part if it exists
  if (input.audioData) {
    contents.push({
      inlineData: {
        mimeType: input.audioMimeType || 'audio/mp3',
        data: input.audioData
      }
    });
  }

  // 2. Add Text Prompt Part
  let promptText = `Create a Suno AI blueprint (Title, Style, Lyrics) for the following song concept.`;

  if (input.audioData) {
    promptText += `
    IMPORTANT: An audio reference file has been provided. 
    1. ANALYZE the audio to determine the Genre, Mood, Tempo, and Vocal Style. 
    2. USE these characteristics to construct the 'suno_style'.
    3. Use the following user preferences to guide the lyrical theme and specific nuances, but prioritize the audio's sonic vibe for the style prompt.
    4. CRITICAL: DO NOT TRANSCRIBE THE LYRICS FROM THE AUDIO. The audio is for STYLE reference only. You must generate COMPLETELY NEW LYRICS based on the user's topic/story.
    `;
  }

  promptText += `
    User Preferences:
    - Genre/Style Input: ${input.genre || "Analyze from audio"}
    - Mood/Vibe Input: ${input.mood || "Analyze from audio"}
    
    - Vocals Input: ${input.vocals.includes('Auto') ? "ANALYZE FROM AUDIO (Identify if Male/Female/Duet/etc)" : input.vocals}
    - Tempo Input: ${input.tempo.includes('Auto') ? "ANALYZE FROM AUDIO (Identify BPM range)" : input.tempo}
    - Language: ${input.language.includes('Auto') ? "ANALYZE FROM AUDIO (Identify language or default to English)" : input.language}
    
    - Specific Instruments (MUST BE INCLUDED IN STYLE): ${input.instruments && input.instruments.length > 0 ? input.instruments.join(', ') : "None selected"}
    
    - Additional Details: ${input.additionalDetails}
    
    PRODUCTION TEXTURE PREFERENCE: ${input.productionTexture} (Ensure this sonic characteristic is explicitly included in the 'suno_style' to define the audio quality).

    STRUCTURE BLUEPRINT: ${input.structure ? input.structure : "AUTO-DETECT (If audio is present, analyze and mimic its structure. If not, choose best fit for genre)."}

    ADVANCED SETTINGS:
    - EARWORM MODE: ${input.isEarworm ? "ENABLED (Make it extremely catchy and repetitive)" : "Disabled"}
    - HUMANIZE VOCALS: ${input.isHumanize ? "ENABLED (Inject breaths, laughs, etc)" : "Disabled"}
    - MELODY GUIDE: ${input.isMelodyGuide ? "ENABLED (Add instructional tags)" : "Disabled"}
  `;

  contents.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Supports audio/multimodal
      contents: input.audioData ? { parts: contents } : contents[contents.length - 1].text, 
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suno_title: {
              type: Type.STRING,
              description: "A creative, catchy, and relevant title for the song.",
            },
            suno_style: {
              type: Type.STRING,
              description: "The optimized style prompt for Suno (max 120 chars). Derived from audio reference if provided. Include the production texture tags and the specific instruments requested.",
            },
            suno_lyrics: {
              type: Type.STRING,
              description: "The complete lyrics with bracketed structural tags. IMPORTANT: Structure MUST follow the provided 'Structure Blueprint'. Include [breath] tags if Humanize is on. Lyrics must be ORIGINAL, do not copy from audio.",
            },
            analysis: {
              type: Type.STRING,
              description: "Brief explanation of why this combination was chosen, noting the structure and advanced features applied.",
            },
          },
          required: ["suno_title", "suno_style", "suno_lyrics", "analysis"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as SunoBlueprintResponse;
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};