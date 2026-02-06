import React, { useState, useRef, useEffect } from 'react';
import { UserInput, LoadingState, Preset } from '../types';
import { VOCAL_TYPES, TEMPO_OPTIONS, GENRE_EXAMPLES, PRODUCTION_TEXTURES, STRUCTURE_OPTIONS } from '../constants';
import { Sparkles, Loader2, UploadCloud, Music, X, Star, User, TrendingUp, AudioLines, Layers, Save, Bookmark, Trash2, Check, Guitar, History, Mic2 } from 'lucide-react';

interface BlueprintFormProps {
  onSubmit: (data: UserInput) => void;
  loadingState: LoadingState;
}

const BlueprintForm: React.FC<BlueprintFormProps> = ({ onSubmit, loadingState }) => {
  const [formData, setFormData] = useState<UserInput>({
    genre: '',
    mood: '',
    vocals: 'Male Vocal',
    language: 'English',
    tempo: 'Mid-Tempo (90-110 BPM)',
    instruments: [], // Initialize instruments array
    additionalDetails: '',
    productionTexture: 'Warm Analog (Anti-Metallic)',
    structure: '', // Default to empty (Auto)
    isEarworm: false,
    isHumanize: true, 
    isMelodyGuide: false,
    isHarmony: false
  });
  
  // Audio State
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instrument Input State
  const [instrumentInput, setInstrumentInput] = useState('');

  // Preset & History State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [recents, setRecents] = useState<Preset[]>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Load presets and history from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('suno_architect_presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to parse presets", e);
      }
    }
    
    const savedRecents = localStorage.getItem('suno_architect_recents');
    if (savedRecents) {
      try {
        setRecents(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Failed to parse recent history", e);
      }
    }
  }, []);

  const addToRecents = (data: UserInput) => {
    const { audioData, audioMimeType, ...dataToSave } = data;
    // Generate a name for the recent item
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const name = `${data.genre || 'No Genre'} • ${data.mood || 'No Mood'} (${timestamp})`;
    
    const newRecent: Preset = {
      id: `recent-${Date.now()}`,
      name: name,
      data: dataToSave
    };

    // Keep last 5, prevent exact duplicates at the top if needed (optional, keeping simple FIFO here)
    const updatedRecents = [newRecent, ...recents].slice(0, 5);
    setRecents(updatedRecents);
    localStorage.setItem('suno_architect_recents', JSON.stringify(updatedRecents));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    // Create preset object (excluding large audio data)
    const { audioData, audioMimeType, ...dataToSave } = formData;
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      data: dataToSave
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('suno_architect_presets', JSON.stringify(updatedPresets));
    
    setIsSavingPreset(false);
    setNewPresetName('');
    setSelectedPresetId(newPreset.id);
  };

  const handleLoadPreset = (id: string) => {
    setSelectedPresetId(id);
    if (!id) return;

    // Check Saved Presets
    let preset = presets.find(p => p.id === id);
    
    // Check Recent History if not found
    if (!preset) {
      preset = recents.find(p => p.id === id);
    }

    if (preset) {
      // Preserve current audio data if exists, overwrite other fields
      setFormData(prev => ({
        ...prev,
        ...preset!.data,
        instruments: preset!.data.instruments || [], // Fallback for legacy presets
        audioData: prev.audioData, // Keep existing audio
        audioMimeType: prev.audioMimeType // Keep existing audio
      }));
    }
  };

  const handleDeletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Only delete from Saved Presets
    if (presets.some(p => p.id === id)) {
      const updatedPresets = presets.filter(p => p.id !== id);
      setPresets(updatedPresets);
      localStorage.setItem('suno_architect_presets', JSON.stringify(updatedPresets));
      if (selectedPresetId === id) setSelectedPresetId("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: keyof UserInput) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Instrument Tag Logic
  const handleInstrumentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = instrumentInput.trim();
      if (val && !formData.instruments.includes(val)) {
        setFormData(prev => ({ ...prev, instruments: [...prev.instruments, val] }));
        setInstrumentInput('');
      }
    } else if (e.key === 'Backspace' && !instrumentInput && formData.instruments.length > 0) {
      // Remove last tag on backspace if input is empty
      setFormData(prev => ({ ...prev, instruments: prev.instruments.slice(0, -1) }));
    }
  };

  const removeInstrument = (tag: string) => {
    setFormData(prev => ({ ...prev, instruments: prev.instruments.filter(t => t !== tag) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size too large. Please upload an MP3 under 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setFormData(prev => ({
          ...prev,
          audioData: base64String,
          audioMimeType: file.type,
          // Auto-detect triggers
          vocals: '✨ Auto-detect (Match Audio)',
          tempo: '✨ Auto-detect (Match Audio)',
          language: '✨ Auto-detect (Match Audio)'
        }));
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setFormData(prev => ({ 
      ...prev, 
      audioData: undefined, 
      audioMimeType: undefined,
      // Reset to defaults if file is removed
      vocals: 'Male Vocal',
      tempo: 'Mid-Tempo (90-110 BPM)',
      language: 'English'
    }));
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLanguageFocus = () => {
    if (formData.language.includes('Auto-detect')) {
      setFormData(prev => ({ ...prev, language: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToRecents(formData); // Save to history
    onSubmit(formData);
  };

  const isLoading = loadingState === LoadingState.LOADING;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-suno-card border border-white/10 rounded-2xl shadow-xl space-y-6">
      
      {/* PRESET MANAGER TOOLBAR */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white/70 w-full md:w-auto">
          <Bookmark className="w-4 h-4 text-suno-primary" />
          <span className="text-sm font-mono uppercase tracking-wider">Presets</span>
        </div>

        {isSavingPreset ? (
          <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
            <input
              type="text"
              placeholder="Preset Name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-suno-primary w-full md:w-48"
              autoFocus
            />
            <button 
              onClick={handleSavePreset}
              className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsSavingPreset(false)}
              className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 min-w-[200px]">
              <select
                value={selectedPresetId}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-white/30 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
              >
                <option value="">Load a preset...</option>
                
                {presets.length > 0 && (
                  <optgroup label="Saved Presets">
                    {presets.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
                
                {recents.length > 0 && (
                  <optgroup label="Recently Used">
                    {recents.map(p => (
                      <option key={p.id} value={p.id}>History: {p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              {/* Only show delete for Saved Presets */}
              {selectedPresetId && !selectedPresetId.startsWith('recent-') && (
                 <button
                 onClick={(e) => handleDeletePreset(e, selectedPresetId)}
                 className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-red-400 transition-colors"
                 title="Delete Preset"
               >
                 <Trash2 className="w-3 h-3" />
               </button>
              )}
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <button
              onClick={() => setIsSavingPreset(true)}
              className="flex items-center gap-2 px-3 py-2 bg-suno-primary/20 hover:bg-suno-primary/30 text-suno-primary border border-suno-primary/30 rounded-lg text-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Audio Reference Upload */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50">
            Audio Reference (Optional)
          </label>
          <div className="relative group">
            {!fileName ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-suno-primary/50 hover:bg-white/5 transition-all"
              >
                <UploadCloud className="w-8 h-8 text-suno-primary/70" />
                <p className="text-sm text-white/60">Click to upload MP3 reference</p>
                <p className="text-xs text-white/30">AI will auto-detect Genre, Vocals & Tempo</p>
              </div>
            ) : (
              <div className="w-full bg-suno-primary/10 border border-suno-primary/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-suno-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-suno-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-xs">{fileName}</span>
                    <span className="text-xs text-white/50">Reference Loaded • Auto-detect Active</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={clearFile}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              accept="audio/mp3,audio/wav,audio/mpeg" 
              onChange={handleFileChange}
              className="hidden" 
            />
          </div>
        </div>

        <div className="border-t border-white/5 my-4"></div>

        {/* Genre & Mood Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Genre / Style</label>
            <input
              type="text"
              name="genre"
              list="genre-suggestions"
              value={formData.genre}
              onChange={handleChange}
              placeholder={fileName ? "Auto-detected from audio" : "e.g. Synthwave"}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-primary focus:ring-1 focus:ring-suno-primary transition-all placeholder:text-white/20"
            />
            <datalist id="genre-suggestions">
              {GENRE_EXAMPLES.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Mood / Vibe</label>
            <input
              type="text"
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              placeholder={fileName ? "Auto-detected from audio" : "e.g. Melancholic, High Energy"}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-secondary focus:ring-1 focus:ring-suno-secondary transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Vocals, Language, Tempo Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Vocals</label>
            <select
              name="vocals"
              value={formData.vocals}
              onChange={handleChange}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-primary appearance-none cursor-pointer"
            >
              {VOCAL_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Tempo</label>
            <select
              name="tempo"
              value={formData.tempo}
              onChange={handleChange}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-primary appearance-none cursor-pointer"
            >
              {TEMPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              onFocus={handleLanguageFocus}
              placeholder={fileName ? "Auto-detected" : "e.g. English"}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-primary"
            />
          </div>
        </div>

        {/* Specific Instruments Input (Tag Style) */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50 flex items-center gap-2">
             <Guitar className="w-3 h-3 text-orange-400" />
             Specific Instruments
          </label>
          <div className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-2 flex flex-wrap gap-2 items-center focus-within:border-suno-primary focus-within:ring-1 focus-within:ring-suno-primary transition-all">
            {formData.instruments.map((inst) => (
              <span key={inst} className="bg-suno-primary/20 border border-suno-primary/30 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                {inst}
                <button 
                  type="button" 
                  onClick={() => removeInstrument(inst)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={instrumentInput}
              onChange={(e) => setInstrumentInput(e.target.value)}
              onKeyDown={handleInstrumentKeyDown}
              placeholder={formData.instruments.length === 0 ? "Type instrument & press Enter (e.g. Saxophone)..." : "Add another..."}
              className="bg-transparent outline-none flex-grow text-white placeholder:text-white/20 min-w-[150px] px-2 py-1"
            />
          </div>
        </div>

        {/* Structure Blueprint Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50 flex items-center gap-2">
             <Layers className="w-3 h-3 text-purple-400" />
             Structure Blueprint
          </label>
          <div className="relative">
            <select
              name="structure"
              value={formData.structure}
              onChange={handleChange}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer transition-all hover:bg-black/30"
            >
              <option value="">
                {fileName ? "✨ Auto-detect from Audio Reference" : "✨ Auto / AI Decision"}
              </option>
              {STRUCTURE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50">Story / Theme / Other Details</label>
          <textarea
            name="additionalDetails"
            value={formData.additionalDetails}
            onChange={handleChange}
            rows={3}
            placeholder="A song about a robot falling in love with a toaster..."
            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-suno-primary resize-none"
          />
        </div>

        {/* Production Texture Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50 flex items-center gap-2">
             <AudioLines className="w-3 h-3 text-blue-400" />
             Production Texture (Anti-Artifacts)
          </label>
          <div className="relative">
            <select
              name="productionTexture"
              value={formData.productionTexture}
              onChange={handleChange}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-all hover:bg-black/30"
            >
              {PRODUCTION_TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Advanced Toggles */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-mono uppercase tracking-wider text-white/50">Advanced Mode</label>
          
          {/* Earworm Mode */}
          <div 
            onClick={() => handleToggle('isEarworm')}
            className={`
              w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300
              ${formData.isEarworm 
                ? 'bg-[#3A2410] border-orange-500/50' 
                : 'bg-black/20 border-white/10 hover:border-white/20'}
            `}
          >
            <div className="flex items-center gap-3">
              <Star className={`w-5 h-5 ${formData.isEarworm ? 'text-orange-400 fill-orange-400' : 'text-white/40'}`} />
              <div>
                <h3 className={`font-bold text-sm ${formData.isEarworm ? 'text-orange-100' : 'text-white'}`}>Earworm Mode</h3>
                <p className="text-xs text-white/50">Repetitive & catchy hooks</p>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${formData.isEarworm ? 'bg-orange-500' : 'bg-gray-700'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.isEarworm ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

          {/* Humanize Vocals */}
          <div 
            onClick={() => handleToggle('isHumanize')}
            className={`
              w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300
              ${formData.isHumanize 
                ? 'bg-[#10243A] border-blue-500/50' 
                : 'bg-black/20 border-white/10 hover:border-white/20'}
            `}
          >
            <div className="flex items-center gap-3">
              <User className={`w-5 h-5 ${formData.isHumanize ? 'text-blue-400' : 'text-white/40'}`} />
              <div>
                <h3 className={`font-bold text-sm ${formData.isHumanize ? 'text-blue-100' : 'text-white'}`}>Humanize Vocals</h3>
                <p className="text-xs text-white/50">Injects breaths & imperfections</p>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${formData.isHumanize ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.isHumanize ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

          {/* Melody Guide */}
          <div 
            onClick={() => handleToggle('isMelodyGuide')}
            className={`
              w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300
              ${formData.isMelodyGuide 
                ? 'bg-[#2D103A] border-purple-500/50' 
                : 'bg-black/20 border-white/10 hover:border-white/20'}
            `}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-5 h-5 ${formData.isMelodyGuide ? 'text-purple-400' : 'text-white/40'}`} />
              <div>
                <h3 className={`font-bold text-sm ${formData.isMelodyGuide ? 'text-purple-100' : 'text-white'}`}>Melody Guide</h3>
                <p className="text-xs text-white/50">Insert melodic contour cues</p>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${formData.isMelodyGuide ? 'bg-purple-500' : 'bg-gray-700'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.isMelodyGuide ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

          {/* Vocal Harmony */}
          <div 
            onClick={() => handleToggle('isHarmony')}
            className={`
              w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300
              ${formData.isHarmony 
                ? 'bg-[#3A1024] border-pink-500/50' 
                : 'bg-black/20 border-white/10 hover:border-white/20'}
            `}
          >
            <div className="flex items-center gap-3">
              <Mic2 className={`w-5 h-5 ${formData.isHarmony ? 'text-pink-400' : 'text-white/40'}`} />
              <div>
                <h3 className={`font-bold text-sm ${formData.isHarmony ? 'text-pink-100' : 'text-white'}`}>Vocal Harmony</h3>
                <p className="text-xs text-white/50">Add backing vocals & layers</p>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${formData.isHarmony ? 'bg-pink-500' : 'bg-gray-700'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.isHarmony ? 'translate-x-5' : ''}`}></div>
            </div>
          </div>

        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-suno-primary to-suno-secondary p-[1px] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          <div className="relative flex items-center justify-center gap-2 bg-black/80 hover:bg-black/40 transition-colors rounded-xl px-6 py-4 h-full w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span className="font-semibold text-white tracking-wide">Architecting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold text-white tracking-wide">Generate Blueprint</span>
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
};

export default BlueprintForm;