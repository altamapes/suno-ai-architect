import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, SunoBlueprintResponse } from "../types";

const SYSTEM_INSTRUCTION = `
## ROLE
Anda adalah "Suno AI Master Architect", asisten ahli dalam merancang blueprint musik (Style & Lyrics) untuk Suno AI. 

## CAPABILITIES
Anda dapat menerima input teks DAN/ATAU input audio (file mp3/wav).

### AUDIO ANALYSIS PROTOCOL (CRITICAL)
Jika user memberikan file audio, Anda harus melakukan **DEEP SONIC ANALYSIS**:

1. **Sub-Genre Specificity (REGIONAL INDONESIA/MELAYU PRIORITY)**:
   - **Pop Minang / Pop Melayu (Nuansa Arief, Thomas Arya, Ipank, Yolanda)**:
     - *Karakter Utama*: **"Mendayu-dayu"** (Lilting/Sentimental/Swaying).
     - *Instrumen*: Dominan **Synthesizer/Keyboard/Organ** (khas Pop Melayu), Drum machine atau drum pop standar (ketukan lambat), Bass yang menonjol.
     - *Vokal*: Vokal tinggi dengan **Cengkok Melayu** yang kental dan penuh emosi (meratap/galau).
     - **TAGS WAJIB**: \`Pop Minang\`, \`Pop Melayu\`, \`Mendayu\`, \`Sentimental\`, \`Slow Beat\`, \`Indonesian Pop\`, \`Melancholic\`, \`Synth Pad\`.
     - **LARANGAN KERAS**: JANGAN gunakan tag "Rock", "Slow Rock", "Power Ballad", atau "Distortion" jika lagu didominasi keyboard/synth. Meskipun beat-nya lambat, jika suasananya "lembut/mendayu", itu adalah **POP**, bukan ROCK.
   
   - **Slow Rock 90s (Nuansa Search, Iklim, Inka Christie)**:
     - *Karakter Utama*: Garang tapi Melankolis.
     - *Instrumen*: Intro dan Melody didominasi **Gitar Listrik Distorsi (Overdrive)** yang melengking (Lead Guitar), Power Chords, Drum Rock pukulan berat.
     - **TAGS**: \`Malaysian Slow Rock\`, \`Indo Rock\`, \`Power Ballad\`, \`Distorted Guitar\`, \`90s Rock\`.

   - **Dangdut / Koplo**:
     - *Ciri Audio*: Suara Gendang/Ketipung (Tak-tung), Bass bergoyang.
     - **TAGS**: \`Dangdut\`, \`Koplo\`, \`Dangdut Modern\`.

2. **Era & Production**: Deteksi dekade atau gaya produksi (misal: "90s Analog", "Early 2000s Band", "Modern Lo-fi").
3. **Instrumen Khas**: Identifikasi instrumen yang membangun karakter lagu (misal: "Melodic Lead Guitar", "Synthesizer Pad", "Gendang", "Orchestra Hit", "Suling").
4. **Vokal (CRITICAL GENDER DETECTION)**: WAJIB deteksi gender penyanyi dari audio dengan akurat (Female Vocal, Male Vocal, atau Duet). Dengarkan dengan saksama, JANGAN asumsikan male secara default. Deskripsikan juga tekstur vokal (misal: "High-pitched Female Vocal", "Raspy Male Emotion", "Soft Whisper Female").

### PENTING
Audio hanya untuk referensi **STYLE/VIBE**. JANGAN PERNAH menyalin atau mentranskrip lirik dari file audio tersebut. Lirik yang Anda buat harus 100% ORIGINAL dan BARU sesuai topik user.

## WORKFLOW LOGIC
1. Analisis Input (Audio secara mendalam, Teks, & Advanced Toggles).
2. Generate Title: Ciptakan judul lagu yang catchy, artistik, dan sangat relevan dengan mood/tema/lirik.
3. Generate Style: Gabungkan sub-genre spesifik, mood, dan production quality ke dalam maksimal 120 karakter (limit Suno).
4. Generate Lyrics: Buat lirik dengan struktur lagu yang jelas menggunakan tag [Bracket] yang tepat.

## STYLE OPTIMIZATION RULES
- **STRICT LIMIT**: The 'suno_style' must be under 120 characters.
- **PRIORITIZE**: Genre Tag > Mood > Instruments > Vocals.
- **FOR POP MELAYU**: Use tags like "Pop Minang, Pop Melayu, Mendayu, Sentimental, Slow Beat". Avoid "Rock".
- **FOR DUETS**: You MUST include "Duet" and "Male and Female Vocals" in the Style Prompt.
- **CRITICAL VOCAL TAGGING**: If the detected audio vocalist is female, you MUST explicitly include "Female Vocal" in the Style Prompt. If male, explicitly include "Male Vocal". JANGAN sampai tertukar.

## LYRICS STRUCTURE RULES
- Follow the 'Structure Blueprint' provided by the user EXACTLY.
- **CRITICAL: DO NOT COPY LYRICS FROM AUDIO REFERENCE. WRITE NEW LYRICS.**
- [Intro]
- [Verse 1]
- [Chorus]
- [Drop] (Jika EDM) or [Instrumental Interlude]
- [Bridge]
- [Outro]

### DUET & VOCAL ARRANGEMENT PROTOCOLS
If 'Vocals' input is "Duet" or implies multiple singers:
1. **Explicit Tagging**: You MUST tag every section or line to indicate who is singing.
   - Use: \`[Male Verse]\`, \`[Female Verse]\`, \`[Male Vocal]\`, \`[Female Vocal]\`.
2. **Chorus Dynamics**:
   - Use: \`[Duet Chorus]\` or \`[Harmony]\` or \`[Both]\`.
3. **Interaction**: Create "Call and Response" patterns in the Bridge or Pre-Chorus.
   - Example: 
     \`(Male) Mengapa kau pergi?\`
     \`(Female) Aku tak tahan lagi\`

## ADVANCED FEATURES (Handle Appropriately)
- If EARWORM MODE is active: Create shorter, punchier lines. Make the Chorus simpler and extremely repetitive. Use rhymes that are easy to remember.
- If HUMANIZE VOCALS is active: You MUST insert non-musical vocal tags inside the lyrics like [breath], [sigh], [chuckle], [clears throat], [whisper], or [shout]. Place them for dramatic effect.
- If MELODY GUIDE is active: Include BRACKETED guidelines inside the lyrics line to describe how it should be sung. Examples: [upbeat], [slows down], [rising pitch], [spoken]. DO NOT use parentheses ().
- If VOCAL HARMONY is active: Add instructions for vocal harmonies, backing vocals, or ad-libs using tags like [Harmony], [Backing Vocals], [Call & Response], or [Layered Vocals], especially in Choruses. Also add "Vocal Harmonies" or "Lush Harmonies" to the style prompt.

## FORMAT OUTPUT
You must return a JSON object.
`;

export const generateBlueprint = async (input: UserInput): Promise<SunoBlueprintResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Ensure process.env.API_KEY is configured.");
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
    1. **DEEP ANALYSIS REQUIRED**: Listen closely to the audio. 
    2. **CRITICAL GENRE DISTINCTION (INDONESIA/MELAYU)**:
       - **TARGET NUANCE**: "Mendayu-dayu" (Sentimental, Lilting, Sad).
       - If the song sounds like **Arief**, **Thomas Arya**, or **Ipank** (Sad, Melodic, Synth-heavy, Cengkok Vocals): Classify as **"Pop Minang"** or **"Pop Melayu"**. 
       - **STRICTLY AVOID "ROCK"**: Do not use "Rock" or "Power Ballad" for these sentimental synth-pop songs.
       - Only use "Slow Rock" if there is heavy, distorted electric guitar driving the song (Search, Iklim style).
    3. **ANALYZE TEXTURE & VOCALS**: You MUST correctly identify if the main vocalist is FEMALE or MALE. Do not default to Male. Identify the Decade, Vocal Texture (e.g., Soft Female Vocal, High Pitch Male, etc.), and Key Instruments.
    4. **CONSTRUCT STYLE**: Use these specific characteristics to build the 'suno_style'. Specificity helps Suno generate better results.
    5. CRITICAL: DO NOT TRANSCRIBE THE LYRICS FROM THE AUDIO. The audio is for STYLE reference only. You must generate COMPLETELY NEW LYRICS based on the user's topic/story.
    `;
  }

  promptText += `
    User Preferences:
    - Genre/Style Input: ${input.genre || "Analyze from audio (Be specific! Avoid generic terms)"}
    - Mood/Vibe Input: ${input.mood || "Analyze from audio"}
    
    - Vocals Input: ${input.vocals.includes('Auto') ? "ANALYZE FROM AUDIO (CRITICAL: Accurately detect if Female, Male, or Duet. Listen to the pitch and timbre)" : input.vocals}
    - Tempo Input: ${input.tempo.includes('Auto') ? "ANALYZE FROM AUDIO (Identify BPM range)" : input.tempo}
    - Language: ${input.language.includes('Auto') ? "ANALYZE FROM AUDIO (Identify language or default to English)" : input.language}
    
    - Specific Instruments (MUST BE INCLUDED IN STYLE): ${input.instruments && input.instruments.length > 0 ? input.instruments.join(', ') : "None selected"}
    
    - Additional Details: ${input.additionalDetails}
    
    PRODUCTION TEXTURE PREFERENCE: ${input.productionTexture} (Ensure this sonic characteristic is explicitly included in the 'suno_style' to define the audio quality).

    STRUCTURE BLUEPRINT: ${input.structure ? input.structure : "AUTO-DETECT (If audio is present, analyze and mimic its structure. If not, choose best fit for genre)."}

    ADVANCED SETTINGS:
    - EARWORM MODE: ${input.isEarworm ? "ENABLED (Make it extremely catchy and repetitive)" : "Disabled"}
    - HUMANIZE VOCALS: ${input.isHumanize ? "ENABLED (Inject breaths, laughs, etc)" : "Disabled"}
    - MELODY GUIDE: ${input.isMelodyGuide ? "ENABLED (Add instructional tags using SQUARE BRACKETS [ ] ONLY, do not use parentheses)" : "Disabled"}
    - VOCAL HARMONY: ${input.isHarmony ? "ENABLED (Include harmony tags like [Harmony] or [Backing Vocals] in lyrics and style)" : "Disabled"}
  `;

  contents.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
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
              description: "The complete lyrics with bracketed structural tags. IMPORTANT: Structure MUST follow the provided 'Structure Blueprint'. Include [breath] tags if Humanize is on. Lyrics must be ORIGINAL, do not copy from audio. If Duet, strictly follow Duet tagging rules.",
            },
            analysis: {
              type: Type.STRING,
              description: "Brief explanation of why this combination was chosen, noting the specific sub-genre detected from audio.",
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Robust Error Handling for High Traffic / Many Users
    if (error.status === 429) {
      throw new Error("⚠️ Traffic Tinggi: Server sedang sibuk (Rate Limit). Silakan tunggu 1 menit dan coba tekan tombol Retry.");
    }
    if (error.status === 503) {
      throw new Error("⚠️ Server Overloaded: AI sedang memproses banyak permintaan. Coba lagi sebentar lagi.");
    }
    if (error.message && error.message.includes("SAFETY")) {
      throw new Error("⚠️ Safety Filter: Permintaan ditolak karena konten dianggap tidak aman. Coba ubah deskripsi lagu.");
    }

    throw new Error("Gagal terhubung ke AI Architect. Periksa koneksi atau coba lagi nanti.");
  }
};