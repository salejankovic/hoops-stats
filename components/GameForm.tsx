
import React, { useState, useMemo, useRef } from 'react';
import { GameEntry, GameStats } from '../types';
import { parseRawGameText } from '../utils/parser';
import { aiService } from '../services/ai';

interface GameFormProps {
  onSave: (game: Partial<GameEntry>) => void;
  onCancel: () => void;
  initialData?: GameEntry | null;
  existingGames?: GameEntry[];
  activeTeam?: 'Partizan' | 'Reprezentacija';
}

// Theme configuration for form styling
const formThemes = {
  Partizan: {
    // Core colors - pure black and white
    pageBg: 'bg-black/90',
    cardBg: 'bg-zinc-900/50',
    cardBorder: 'border-zinc-800',
    inputBg: 'bg-zinc-900/50',
    inputBorder: 'border-zinc-700',
    inputFocus: 'focus:ring-white/20 focus:border-white/50',
    inputHover: 'hover:border-zinc-600',
    dropdownBg: 'bg-zinc-900',
    dropdownHover: 'hover:bg-zinc-800',
    dropdownBorder: 'border-zinc-800',
    // Text colors
    labelText: 'text-zinc-500',
    labelDisabled: 'text-zinc-700',
    mutedText: 'text-zinc-600',
    placeholderText: 'placeholder-zinc-700',
    // Accent colors
    accent: 'bg-white',
    accentText: 'text-white',
    accentBorder: 'border-white',
    accentHover: 'hover:bg-zinc-200',
    accentFocus: 'focus:border-white',
    // Section headers
    sectionAccent: 'text-white',
    sectionGradient: 'from-white/50',
    // Buttons
    primaryBtn: 'bg-white text-black hover:bg-zinc-200',
    primaryBtnShadow: 'shadow-white/10',
    secondaryBtn: 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800',
    tabActive: 'bg-white text-black shadow-xl shadow-white/20',
    tabInactive: 'text-zinc-500 bg-zinc-900/50 hover:bg-zinc-800',
    // Special colors - keep consistent
    addNewText: 'text-white',
  },
  Reprezentacija: {
    // Core colors - Serbian blue and white
    pageBg: 'bg-blue-950/90',
    cardBg: 'bg-blue-900/30',
    cardBorder: 'border-blue-800/50',
    inputBg: 'bg-blue-900/50',
    inputBorder: 'border-blue-700',
    inputFocus: 'focus:ring-blue-400/20 focus:border-blue-400/50',
    inputHover: 'hover:border-blue-600',
    dropdownBg: 'bg-blue-900',
    dropdownHover: 'hover:bg-blue-800',
    dropdownBorder: 'border-blue-800',
    // Text colors
    labelText: 'text-blue-300',
    labelDisabled: 'text-blue-800',
    mutedText: 'text-blue-400/60',
    placeholderText: 'placeholder-blue-700',
    // Accent colors
    accent: 'bg-blue-500',
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-400',
    accentHover: 'hover:bg-blue-400',
    accentFocus: 'focus:border-blue-400',
    // Section headers
    sectionAccent: 'text-blue-400',
    sectionGradient: 'from-blue-400/50',
    // Buttons
    primaryBtn: 'bg-blue-500 text-white hover:bg-blue-400',
    primaryBtnShadow: 'shadow-blue-500/20',
    secondaryBtn: 'bg-blue-900/50 border-blue-700 text-blue-300 hover:text-white hover:bg-blue-800',
    tabActive: 'bg-blue-500 text-white shadow-xl shadow-blue-500/20',
    tabInactive: 'text-blue-400/60 bg-blue-900/50 hover:bg-blue-800',
    // Special colors - keep consistent
    addNewText: 'text-blue-400',
  }
};

// Themed InputField component
const InputField: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
  placeholder?: string;
  disabled?: boolean;
  theme: typeof formThemes.Partizan;
}> = ({ label, value, onChange, type = "text", full, placeholder, disabled, theme }) => (
  <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
    <label className={`text-[9px] font-black uppercase tracking-widest ${disabled ? theme.labelDisabled : theme.labelText}`}>{label}</label>
    <input
      type={type}
      inputMode={type === 'number' ? 'numeric' : 'text'}
      value={value === undefined || value === null ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${theme.inputBg} ${theme.inputBorder} border-2 rounded-2xl p-4 text-sm ${theme.inputFocus} outline-none transition-all ${theme.placeholderText} ${disabled ? 'opacity-30' : theme.inputHover}`}
    />
  </div>
);

// Themed DropdownField component
const DropdownField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  full?: boolean;
  theme: typeof formThemes.Partizan;
}> = ({ label, value, options, onSelect, full, theme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const uniqueOptions: string[] = (Array.from(new Set(options)) as string[]).filter((o: string) => o && o.length > 0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions: string[] = searchTerm
    ? uniqueOptions.filter((opt: string) => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueOptions;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onSelect(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`} ref={dropdownRef}>
      <label className={`text-[9px] font-black ${theme.labelText} uppercase tracking-widest`}>{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full ${theme.inputBg} ${theme.inputBorder} border-2 rounded-2xl p-4 text-sm ${theme.inputFocus} outline-none transition-all ${theme.inputHover}`}
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={value || `Search or add new ${label.toLowerCase()}...`}
        />
        {isOpen && (
          <div className={`absolute z-50 w-full mt-2 ${theme.dropdownBg} border-2 ${theme.dropdownBorder} rounded-2xl shadow-2xl max-h-60 overflow-y-auto`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-3 text-sm ${theme.dropdownHover} transition-all border-b ${theme.dropdownBorder} last:border-b-0`}
                >
                  {opt}
                </button>
              ))
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => handleSelect(searchTerm)}
                className={`w-full text-left px-4 py-3 text-sm ${theme.addNewText} ${theme.dropdownHover} transition-all font-black`}
              >
                + Add "{searchTerm}"
              </button>
            ) : (
              <div className={`px-4 py-3 text-sm ${theme.mutedText}`}>No options available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const GameForm: React.FC<GameFormProps> = ({ onSave, onCancel, initialData, existingGames = [], activeTeam = 'Partizan' }) => {
  const theme = formThemes[activeTeam];
  const [rawText, setRawText] = useState('');
  const [mode, setMode] = useState<'manual' | 'parse' | 'ai'>('manual'); // Default to manual
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [basic, setBasic] = useState({
    date: initialData?.date || new Date().toLocaleDateString('sr-RS'),
    competition: initialData?.competition || '',
    opponent: initialData?.opponent || '',
    finalScore: initialData?.finalScore || '',
    result: initialData?.result || 'W' as 'W' | 'L',
    seasonRecord: initialData?.seasonRecord || '',
    season: initialData?.season || '2025/26',
    isDnp: initialData?.isDnp || false,
    dnpReason: initialData?.dnpReason || '',
    isGameWinner: initialData?.isGameWinner || false,
    isHome: initialData?.isHome ?? true,
    isOvertime: initialData?.isOvertime || false
  });

  const [stats, setStats] = useState<GameStats>(initialData?.stats || {
    minutes: '', points: '', rebounds: '', assists: '', turnovers: '', steals: '',
    blocks: '', fouls: '', foulsDrawn: '', twoPtMade: '', twoPtAtt: '', threePtMade: '',
    threePtAtt: '', ftMade: '', ftAtt: '', indexRating: ''
  } as any);

  const comps = useMemo(() => existingGames.map(g => g.competition), [existingGames]);
  const opponents = useMemo(() => existingGames.map(g => g.opponent), [existingGames]);
  const seasons = useMemo(() => existingGames.map(g => g.season), [existingGames]);

  const handleParse = () => {
    const parsed = parseRawGameText(rawText);
    if (parsed) {
      if (parsed.date) setBasic(b => ({ ...b, ...parsed }));
      if (parsed.stats) setStats(parsed.stats);
      setMode('manual');
    } else {
      alert("Format mismatch. Try manual entry.");
    }
  };

  const startVoiceEntry = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setRawText(transcript);
      setAiLoading(true);
      const result = await aiService.parseVoiceInput(transcript);
      if (result) {
        if (result.opponent) setBasic(b => ({ ...b, opponent: result.opponent!, finalScore: result.finalScore!, result: result.result! }));
        if (result.stats) setStats(prev => ({ ...prev, ...result.stats }));
        setMode('manual');
      }
      setAiLoading(false);
    };
    recognition.start();
  };

  const handleStatChange = (field: keyof GameStats, value: string) => {
    // Allow empty string or numeric values
    setStats(prev => ({ ...prev, [field]: value }));
  };

  const calculatePIR = () => {
    // PIR Formula: (Pts + Reb + Ast + Stl + Blk + Fouls Drawn) - (Missed FG + Missed FT + TO + Fouls Committed)
    const pts = parseInt(stats.points as string) || 0;
    const reb = parseInt(stats.rebounds as string) || 0;
    const ast = parseInt(stats.assists as string) || 0;
    const stl = parseInt(stats.steals as string) || 0;
    const blk = parseInt(stats.blocks as string) || 0;
    const foulsDrawn = parseInt(stats.foulsDrawn as string) || 0;

    const twoPtMade = parseInt(stats.twoPtMade as string) || 0;
    const twoPtAtt = parseInt(stats.twoPtAtt as string) || 0;
    const threePtMade = parseInt(stats.threePtMade as string) || 0;
    const threePtAtt = parseInt(stats.threePtAtt as string) || 0;
    const ftMade = parseInt(stats.ftMade as string) || 0;
    const ftAtt = parseInt(stats.ftAtt as string) || 0;
    const to = parseInt(stats.turnovers as string) || 0;
    const fouls = parseInt(stats.fouls as string) || 0;

    const missedFG = (twoPtAtt - twoPtMade) + (threePtAtt - threePtMade);
    const missedFT = ftAtt - ftMade;

    const pir = (pts + reb + ast + stl + blk + foulsDrawn) - (missedFG + missedFT + to + fouls);

    setStats(prev => ({ ...prev, indexRating: pir.toString() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!basic.competition || !basic.opponent || !basic.season) {
        alert("Missing Core Data: Competition, Opponent, and Season are required.");
        return;
    }

    // Convert empty strings to 0 before saving
    const finalStats = Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, value === '' ? 0 : parseInt(value as string) || 0])
    );

    onSave({
      ...basic,
      stats: finalStats as GameStats,
      id: initialData?.id || Math.random().toString(36).substr(2, 9)
    });
  };

  return (
    <div className="pb-32 animate-in slide-in-from-bottom-6 duration-700">
      <div className={`flex gap-2 mb-10 sticky top-0 ${theme.pageBg} backdrop-blur-xl py-6 z-10 border-b ${theme.cardBorder}`}>
        {[
          { id: 'manual', label: 'Manual', icon: '⌨️' },
          { id: 'parse', label: 'Paste', icon: '📋' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id as any)}
            className={`flex-1 py-3.5 text-[10px] font-black rounded-2xl transition-all tracking-[0.2em] uppercase flex items-center justify-center gap-2 ${mode === tab.id ? theme.tabActive : theme.tabInactive}`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {mode === 'ai' && (
        <div className="space-y-10 text-center py-12 px-6">
          <div className="max-w-md mx-auto space-y-8">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 border-4 ${isRecording ? 'bg-red-600/20 border-red-500 animate-pulse scale-110 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : `${theme.cardBg} ${theme.accentBorder}/20`}`}>
               <button
                 onClick={startVoiceEntry}
                 disabled={aiLoading}
                 className={`w-24 h-24 rounded-full flex items-center justify-center ${theme.accent} ${activeTeam === 'Partizan' ? 'text-black' : 'text-white'} shadow-2xl transition-all active:scale-90 ${aiLoading ? 'opacity-50' : 'hover:scale-105'}`}
               >
                 {aiLoading ? (
                   <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 ) : (
                   <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 )}
               </button>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black oswald tracking-tight text-white uppercase">{isRecording ? 'Listening...' : 'Voice Entry'}</h3>
              <p className={`text-sm ${theme.mutedText} font-medium leading-relaxed`}>
                Describe your game: "I played 25 minutes against Real Madrid, scored 15 points with 3 triples, 5 rebounds and 2 steals. We won 88 to 82."
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === 'parse' && (
        <div className="space-y-6">
          <textarea
            className={`w-full h-72 ${theme.inputBg} ${theme.inputBorder} border-2 rounded-3xl p-8 text-sm font-mono ${theme.inputFocus} outline-none transition-all shadow-inner ${theme.placeholderText}`}
            placeholder="Paste raw text here... (e.g. 3.10. - EL - Baskonia - Partizan 86:82)"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className={`w-full ${theme.primaryBtn} py-5 rounded-2xl font-black uppercase tracking-[0.3em] disabled:opacity-20 transition-all text-sm shadow-2xl ${theme.primaryBtnShadow}`}
          >
            PARSE RAW DATA
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SECTION 1: GAME INFORMATION */}
          <div className={`${theme.cardBg} border-2 ${theme.cardBorder} rounded-3xl p-8 space-y-8`}>
            <div className="flex items-center gap-4">
              <h3 className={`text-sm font-black ${theme.sectionAccent} tracking-[0.3em] uppercase whitespace-nowrap`}>GAME INFORMATION</h3>
              <div className={`h-[2px] w-full bg-gradient-to-r ${theme.sectionGradient} to-transparent`}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Match Date" value={basic.date} onChange={(v) => setBasic({...basic, date: v})} placeholder="8. 1. 2026." theme={theme} />
              <DropdownField label="Competition" value={basic.competition} options={comps} onSelect={(v) => setBasic({...basic, competition: v})} theme={theme} />
              <DropdownField label="Season" value={basic.season} options={seasons} onSelect={(v) => setBasic({...basic, season: v})} theme={theme} />
              <InputField label="Season Record" value={basic.seasonRecord} onChange={(v) => setBasic({...basic, seasonRecord: v})} placeholder="15-2" theme={theme} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownField label="Opponent" value={basic.opponent} options={opponents} onSelect={(v) => setBasic({...basic, opponent: v})} full theme={theme} />

              <div className="flex flex-col gap-1.5">
                <label className={`text-[9px] font-black ${theme.labelText} uppercase tracking-widest`}>VENUE</label>
                <div className="grid grid-cols-2 h-14 gap-3">
                  <button type="button" onClick={() => setBasic({...basic, isHome: true})} className={`rounded-2xl font-black border-2 transition-all text-sm tracking-widest ${basic.isHome ? `${theme.accent}/10 ${theme.accentBorder} ${theme.accentText}` : `${theme.inputBg} ${theme.inputBorder} ${theme.mutedText} ${theme.inputHover}`}`}>HOME</button>
                  <button type="button" onClick={() => setBasic({...basic, isHome: false})} className={`rounded-2xl font-black border-2 transition-all text-sm tracking-widest ${!basic.isHome ? `${theme.accent}/10 ${theme.accentBorder} ${theme.accentText}` : `${theme.inputBg} ${theme.inputBorder} ${theme.mutedText} ${theme.inputHover}`}`}>AWAY</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Final Score" value={basic.finalScore} onChange={(v) => setBasic({...basic, finalScore: v})} placeholder="88:82" theme={theme} />

              <div className="flex flex-col gap-1.5">
                <label className={`text-[9px] font-black ${theme.labelText} uppercase tracking-widest`}>RESULT</label>
                <div className="grid grid-cols-2 h-14 gap-3">
                  <button type="button" onClick={() => setBasic({...basic, result: 'W'})} className={`rounded-2xl font-black border-2 transition-all text-sm tracking-widest ${basic.result === 'W' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : `${theme.inputBg} ${theme.inputBorder} ${theme.mutedText} ${theme.inputHover}`}`}>WIN</button>
                  <button type="button" onClick={() => setBasic({...basic, result: 'L'})} className={`rounded-2xl font-black border-2 transition-all text-sm tracking-widest ${basic.result === 'L' ? 'bg-red-500/10 border-red-500 text-red-500' : `${theme.inputBg} ${theme.inputBorder} ${theme.mutedText} ${theme.inputHover}`}`}>LOSS</button>
                </div>
              </div>
            </div>

            {/* DNP, Overtime, and Game Winner Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* DNP Checkbox */}
              <div className="flex flex-col gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setBasic({...basic, isDnp: !basic.isDnp, dnpReason: basic.isDnp ? '' : basic.dnpReason})}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${basic.isDnp ? 'bg-red-500/10 border-red-500' : `${theme.inputBg} ${theme.inputBorder} ${theme.inputHover}`}`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${basic.isDnp ? 'bg-red-500 border-red-500' : theme.inputBorder}`}>
                    {basic.isDnp && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${basic.isDnp ? 'text-red-500' : theme.labelText}`}>DNP (Did Not Play)</span>
                </button>

                {basic.isDnp && (
                  <input
                    type="text"
                    value={basic.dnpReason}
                    onChange={(e) => setBasic({...basic, dnpReason: e.target.value})}
                    placeholder="Reason (e.g., injury, coach's decision...)"
                    className={`${theme.inputBg} border-red-500/30 border-2 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 outline-none transition-all ${theme.placeholderText}`}
                  />
                )}
              </div>

              {/* Right column: Overtime and Game Winner */}
              <div className="flex flex-col gap-3">
                {/* Overtime Checkbox */}
                <button
                  type="button"
                  onClick={() => setBasic({...basic, isOvertime: !basic.isOvertime})}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${basic.isOvertime ? 'bg-amber-500/10 border-amber-500' : `${theme.inputBg} ${theme.inputBorder} ${theme.inputHover}`}`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${basic.isOvertime ? 'bg-amber-500 border-amber-500' : theme.inputBorder}`}>
                    {basic.isOvertime && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${basic.isOvertime ? 'text-amber-500' : theme.labelText}`}>OT</span>
                </button>

                {/* Game Winner Checkbox */}
                <button
                  type="button"
                  onClick={() => setBasic({...basic, isGameWinner: !basic.isGameWinner})}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${basic.isGameWinner ? `${theme.accent}/10 ${theme.accentBorder}` : `${theme.inputBg} ${theme.inputBorder} ${theme.inputHover}`}`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${basic.isGameWinner ? `${theme.accent} ${theme.accentBorder}` : theme.inputBorder}`}>
                    {basic.isGameWinner && (
                      <svg className={`w-4 h-4 ${activeTeam === 'Partizan' ? 'text-black' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${basic.isGameWinner ? theme.accentText : theme.labelText}`}>🎯 GAME WINNER</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: BASIC STATS */}
          <div className={`${theme.cardBg} border-2 ${theme.cardBorder} rounded-3xl p-8 space-y-8 transition-all duration-500 ${basic.isDnp ? 'opacity-30' : 'opacity-100'}`}>
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-indigo-400 tracking-[0.3em] uppercase whitespace-nowrap">BASIC STATS</h3>
              <div className="h-[2px] w-full bg-gradient-to-r from-indigo-400/50 to-transparent"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <InputField disabled={basic.isDnp} type="number" label="MIN" value={stats.minutes} onChange={(v) => handleStatChange('minutes', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="PTS" value={stats.points} onChange={(v) => handleStatChange('points', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="REB" value={stats.rebounds} onChange={(v) => handleStatChange('rebounds', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="AST" value={stats.assists} onChange={(v) => handleStatChange('assists', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="STL" value={stats.steals} onChange={(v) => handleStatChange('steals', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="BLK" value={stats.blocks} onChange={(v) => handleStatChange('blocks', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="TO" value={stats.turnovers} onChange={(v) => handleStatChange('turnovers', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="FOULS" value={stats.fouls} onChange={(v) => handleStatChange('fouls', v)} placeholder="0" theme={theme} />
              <InputField disabled={basic.isDnp} type="number" label="FOULS DRAWN" value={stats.foulsDrawn} onChange={(v) => handleStatChange('foulsDrawn', v)} placeholder="0" theme={theme} />
            </div>
          </div>

          {/* SECTION 3: SHOOTING */}
          <div className={`${theme.cardBg} border-2 ${theme.cardBorder} rounded-3xl p-8 space-y-8 transition-all duration-500 ${basic.isDnp ? 'opacity-30' : 'opacity-100'}`}>
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-emerald-400 tracking-[0.3em] uppercase whitespace-nowrap">SHOOTING</h3>
              <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: '2-Pointers', fieldM: 'twoPtMade', fieldA: 'twoPtAtt', color: 'orange' },
                { label: '3-Pointers', fieldM: 'threePtMade', fieldA: 'threePtAtt', color: 'cyan' },
                { label: 'Free Throws', fieldM: 'ftMade', fieldA: 'ftAtt', color: 'emerald' },
              ].map(shooting => (
                <div key={shooting.label} className={`${theme.inputBg} p-6 rounded-3xl border-2 ${theme.inputBorder} space-y-4`}>
                  <p className={`text-xs font-black ${theme.labelText} uppercase tracking-widest text-center`}>{shooting.label} (M/A)</p>
                  <div className="flex items-center gap-4">
                    <input disabled={basic.isDnp} type="number" placeholder="0" className={`w-full ${activeTeam === 'Partizan' ? 'bg-black' : 'bg-blue-950'} border-2 ${theme.inputBorder} rounded-2xl p-5 text-center text-2xl font-bold outline-none ${theme.accentFocus} transition-all text-white ${theme.placeholderText}`} value={(stats as any)[shooting.fieldM]} onChange={(e) => handleStatChange(shooting.fieldM as any, e.target.value)} />
                    <span className={`${theme.mutedText} font-bold text-3xl`}>/</span>
                    <input disabled={basic.isDnp} type="number" placeholder="0" className={`w-full ${activeTeam === 'Partizan' ? 'bg-black' : 'bg-blue-950'} border-2 ${theme.inputBorder} rounded-2xl p-5 text-center text-2xl font-bold outline-none ${theme.accentFocus} transition-all text-white ${theme.placeholderText}`} value={(stats as any)[shooting.fieldA]} onChange={(e) => handleStatChange(shooting.fieldA as any, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            {/* PIR INDEX with Auto-Calculate */}
            <div className={`bg-gradient-to-br ${activeTeam === 'Partizan' ? 'from-indigo-950/50 to-purple-950/30' : 'from-indigo-900/30 to-purple-900/20'} p-8 rounded-3xl border-2 border-indigo-500/30 space-y-6`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">PIR Index</p>
                <button
                  type="button"
                  onClick={calculatePIR}
                  disabled={basic.isDnp}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-indigo-900/50"
                >
                  Auto Calculate
                </button>
              </div>
              <input
                disabled={basic.isDnp}
                type="number"
                placeholder="0"
                className={`w-full ${activeTeam === 'Partizan' ? 'bg-black' : 'bg-blue-950'} border-2 border-indigo-600/40 rounded-2xl p-6 text-center text-4xl font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all ${theme.placeholderText}`}
                value={stats.indexRating}
                onChange={(e) => handleStatChange('indexRating', e.target.value)}
              />
              <p className={`text-xs ${theme.mutedText} text-center font-medium`}>
                Formula: (Pts + Reb + Ast + Stl + Blk + Fouls Drawn) - (Missed FG + Missed FT + TO + Fouls)
              </p>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row gap-4 pt-10 border-t ${theme.cardBorder}`}>
            <button type="button" onClick={onCancel} className={`flex-1 py-5 ${theme.secondaryBtn} border-2 rounded-2xl font-black uppercase tracking-widest transition-all text-xs`}>DISCARD</button>
            <button type="submit" className={`flex-[2] py-5 ${theme.primaryBtn} rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl ${theme.primaryBtnShadow} active:scale-95 transition-all text-sm`}>SAVE PERFORMANCE</button>
          </div>
        </form>
      )}
    </div>
  );
};
