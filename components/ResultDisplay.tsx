import React, { useState } from 'react';
import { SunoBlueprintResponse } from '../types';
import { Copy, Check, Music, FileText, Info, Type as TypeIcon } from 'lucide-react';

interface ResultDisplayProps {
  data: SunoBlueprintResponse;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
  const [copiedStyle, setCopiedStyle] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  const copyToClipboard = async (text: string, type: 'style' | 'lyrics' | 'title') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'style') {
        setCopiedStyle(true);
        setTimeout(() => setCopiedStyle(false), 2000);
      } else if (type === 'lyrics') {
        setCopiedLyrics(true);
        setTimeout(() => setCopiedLyrics(false), 2000);
      } else if (type === 'title') {
        setCopiedTitle(true);
        setTimeout(() => setCopiedTitle(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Title Section */}
      <div className="bg-suno-card border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400">
            <TypeIcon className="w-4 h-4" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Song Title</h3>
          </div>
        </div>
        <div className="p-6 relative group flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{data.suno_title}</h2>
          <button
            onClick={() => copyToClipboard(data.suno_title, 'title')}
            className="p-2 bg-white/10 hover:bg-yellow-400/20 hover:text-yellow-400 text-white rounded-lg transition-colors"
            title="Copy Title"
          >
            {copiedTitle ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Style Section */}
      <div className="bg-suno-card border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-suno-secondary">
            <Music className="w-4 h-4" />
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Suno Style Prompt</h3>
          </div>
          <span className={`text-xs font-mono ${data.suno_style.length > 120 ? 'text-red-400' : 'text-green-400'}`}>
            {data.suno_style.length}/120 chars
          </span>
        </div>
        <div className="p-6 relative group">
          <p className="font-medium text-lg text-white font-mono break-words pr-12">
            {data.suno_style}
          </p>
          <button
            onClick={() => copyToClipboard(data.suno_style, 'style')}
            className="absolute top-1/2 -translate-y-1/2 right-4 p-2 bg-white/10 hover:bg-suno-secondary text-white rounded-lg transition-colors"
            title="Copy Style"
          >
            {copiedStyle ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lyrics Section */}
        <div className="md:col-span-2 bg-suno-card border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-suno-primary">
              <FileText className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Lyrics & Structure</h3>
            </div>
            <button
              onClick={() => copyToClipboard(data.suno_lyrics, 'lyrics')}
              className="flex items-center gap-2 text-xs font-mono uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-white"
            >
              {copiedLyrics ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedLyrics ? 'Copied' : 'Copy All'}
            </button>
          </div>
          <div className="p-6 bg-[#0c0c0e] flex-grow">
            <pre className="font-mono text-sm leading-relaxed text-white/80 whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {data.suno_lyrics}
            </pre>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-suno-card border border-white/10 rounded-xl overflow-hidden shadow-lg h-full">
            <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center gap-2 text-blue-400">
              <Info className="w-4 h-4" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Architect Analysis</h3>
            </div>
            <div className="p-6">
              <p className="text-white/70 text-sm leading-relaxed">
                {data.analysis}
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-suno-primary/20 to-suno-secondary/20 border border-white/5 rounded-xl p-6">
            <h4 className="text-white font-bold mb-2 text-sm">Pro Tip</h4>
            <p className="text-xs text-white/60">
              Paste the "Style Prompt" into the Style field in Suno Custom Mode. Paste the lyrics into the Lyrics field. If the song cuts off, use the "Extend" feature from the Outro.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResultDisplay;