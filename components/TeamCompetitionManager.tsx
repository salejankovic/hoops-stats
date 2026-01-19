
import React, { useState, useRef } from 'react';
import { TeamConfig, CompetitionConfig, AppSettings } from '../types';

interface TeamCompetitionManagerProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  activeTeam: 'Partizan' | 'Reprezentacija';
}

// Default placeholder logo (simple basketball icon as SVG data URI)
const PLACEHOLDER_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAydjIwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48cGF0aCBkPSJNMTIgMmE4IDggMCAwIDAgOCA4Ii8+PHBhdGggZD0iTTEyIDIyYTggOCAwIDAgMCA4LTgiLz48cGF0aCBkPSJNMTIgMmE4IDggMCAwIDEtOCA4Ii8+PHBhdGggZD0iTTEyIDIyYTggOCAwIDAgMS04LTgiLz48L3N2Zz4=';

// Theme configuration
const themes = {
  Partizan: {
    bg: 'bg-black',
    cardBg: 'bg-zinc-900',
    cardBorder: 'border-zinc-800',
    inputBg: 'bg-zinc-800',
    inputBorder: 'border-zinc-700',
    inputFocus: 'focus:border-white/50',
    text: 'text-white',
    textMuted: 'text-zinc-400',
    textLabel: 'text-zinc-500',
    accent: 'bg-white text-black',
    accentHover: 'hover:bg-zinc-200',
    secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    tabActive: 'bg-white text-black',
    tabInactive: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
  },
  Reprezentacija: {
    bg: 'bg-blue-950',
    cardBg: 'bg-blue-900',
    cardBorder: 'border-blue-800',
    inputBg: 'bg-blue-800',
    inputBorder: 'border-blue-700',
    inputFocus: 'focus:border-blue-400/50',
    text: 'text-white',
    textMuted: 'text-blue-300',
    textLabel: 'text-blue-400',
    accent: 'bg-blue-500 text-white',
    accentHover: 'hover:bg-blue-400',
    secondary: 'bg-blue-800 text-blue-200 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    tabActive: 'bg-blue-500 text-white',
    tabInactive: 'bg-blue-800 text-blue-300 hover:bg-blue-700',
  }
};

export const TeamCompetitionManager: React.FC<TeamCompetitionManagerProps> = ({
  settings,
  onSave,
  onClose,
  activeTeam
}) => {
  const theme = themes[activeTeam];
  const [activeTab, setActiveTab] = useState<'teams' | 'competitions'>('teams');
  const [teams, setTeams] = useState<TeamConfig[]>(settings.teams);
  const [competitions, setCompetitions] = useState<CompetitionConfig[]>(settings.competitions);
  const [editingTeam, setEditingTeam] = useState<TeamConfig | null>(null);
  const [editingCompetition, setEditingCompetition] = useState<CompetitionConfig | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newCompName, setNewCompName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'team' | 'competition'; id: string } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      if (uploadTarget.type === 'team') {
        setTeams(prev => prev.map(t =>
          t.id === uploadTarget.id ? { ...t, logo: base64 } : t
        ));
        if (editingTeam?.id === uploadTarget.id) {
          setEditingTeam(prev => prev ? { ...prev, logo: base64 } : null);
        }
      } else {
        setCompetitions(prev => prev.map(c =>
          c.id === uploadTarget.id ? { ...c, logo: base64 } : c
        ));
        if (editingCompetition?.id === uploadTarget.id) {
          setEditingCompetition(prev => prev ? { ...prev, logo: base64 } : null);
        }
      }
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerUpload = (type: 'team' | 'competition', id: string) => {
    setUploadTarget({ type, id });
    fileInputRef.current?.click();
  };

  const addTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeam: TeamConfig = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      shortName: newTeamName.trim().substring(0, 3).toUpperCase()
    };
    setTeams([...teams, newTeam]);
    setNewTeamName('');
  };

  const addCompetition = () => {
    if (!newCompName.trim()) return;
    const newComp: CompetitionConfig = {
      id: `comp_${Date.now()}`,
      name: newCompName.trim(),
      shortName: newCompName.trim().substring(0, 3).toUpperCase()
    };
    setCompetitions([...competitions, newComp]);
    setNewCompName('');
  };

  const deleteTeam = (id: string) => {
    if (confirm('Delete this team? This cannot be undone.')) {
      setTeams(teams.filter(t => t.id !== id));
      if (editingTeam?.id === id) setEditingTeam(null);
    }
  };

  const deleteCompetition = (id: string) => {
    if (confirm('Delete this competition? This cannot be undone.')) {
      setCompetitions(competitions.filter(c => c.id !== id));
      if (editingCompetition?.id === id) setEditingCompetition(null);
    }
  };

  const updateTeam = (team: TeamConfig) => {
    setTeams(teams.map(t => t.id === team.id ? team : t));
    setEditingTeam(null);
  };

  const updateCompetition = (comp: CompetitionConfig) => {
    setCompetitions(competitions.map(c => c.id === comp.id ? comp : c));
    setEditingCompetition(null);
  };

  const handleSave = () => {
    onSave({ teams, competitions });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme.cardBorder} flex justify-between items-center`}>
          <h2 className={`text-xl font-black uppercase tracking-widest ${theme.text}`}>
            Team & Competition Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${theme.secondary} transition-all`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 p-4 border-b ${theme.cardBorder}`}>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'teams' ? theme.tabActive : theme.tabInactive
            }`}
          >
            Opponent Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'competitions' ? theme.tabActive : theme.tabInactive
            }`}
          >
            Competitions ({competitions.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'teams' && (
            <>
              {/* Add new team */}
              <div className={`flex gap-3 p-4 ${theme.inputBg} rounded-2xl border ${theme.inputBorder}`}>
                <input
                  type="text"
                  placeholder="Add new opponent team..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                  className={`flex-1 bg-transparent outline-none ${theme.text} placeholder:${theme.textMuted}`}
                />
                <button
                  onClick={addTeam}
                  disabled={!newTeamName.trim()}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${theme.accent} ${theme.accentHover} disabled:opacity-30 transition-all`}
                >
                  Add
                </button>
              </div>

              {/* Team list */}
              <div className="space-y-3">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className={`flex items-center gap-4 p-4 ${theme.inputBg} rounded-2xl border ${theme.inputBorder}`}
                  >
                    {/* Logo */}
                    <button
                      onClick={() => triggerUpload('team', team.id)}
                      className="relative group"
                    >
                      <img
                        src={team.logo || PLACEHOLDER_LOGO}
                        alt={team.name}
                        className="w-12 h-12 rounded-xl object-cover bg-black/20"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </button>

                    {/* Name */}
                    {editingTeam?.id === team.id ? (
                      <input
                        type="text"
                        value={editingTeam.name}
                        onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                        className={`flex-1 bg-transparent border-b ${theme.inputBorder} outline-none ${theme.text} py-1`}
                        autoFocus
                      />
                    ) : (
                      <span className={`flex-1 ${theme.text} font-medium`}>{team.name}</span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {editingTeam?.id === team.id ? (
                        <>
                          <button
                            onClick={() => updateTeam(editingTeam)}
                            className={`p-2 rounded-lg ${theme.accent} ${theme.accentHover} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingTeam(null)}
                            className={`p-2 rounded-lg ${theme.secondary} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTeam(team)}
                            className={`p-2 rounded-lg ${theme.secondary} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteTeam(team.id)}
                            className={`p-2 rounded-lg ${theme.danger} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className={`text-center py-8 ${theme.textMuted}`}>
                    No opponent teams added yet. Add one above!
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'competitions' && (
            <>
              {/* Add new competition */}
              <div className={`flex gap-3 p-4 ${theme.inputBg} rounded-2xl border ${theme.inputBorder}`}>
                <input
                  type="text"
                  placeholder="Add new competition..."
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCompetition()}
                  className={`flex-1 bg-transparent outline-none ${theme.text} placeholder:${theme.textMuted}`}
                />
                <button
                  onClick={addCompetition}
                  disabled={!newCompName.trim()}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${theme.accent} ${theme.accentHover} disabled:opacity-30 transition-all`}
                >
                  Add
                </button>
              </div>

              {/* Competition list */}
              <div className="space-y-3">
                {competitions.map(comp => (
                  <div
                    key={comp.id}
                    className={`flex items-center gap-4 p-4 ${theme.inputBg} rounded-2xl border ${theme.inputBorder}`}
                  >
                    {/* Logo */}
                    <button
                      onClick={() => triggerUpload('competition', comp.id)}
                      className="relative group"
                    >
                      <img
                        src={comp.logo || PLACEHOLDER_LOGO}
                        alt={comp.name}
                        className="w-12 h-12 rounded-xl object-cover bg-black/20"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </button>

                    {/* Name */}
                    {editingCompetition?.id === comp.id ? (
                      <input
                        type="text"
                        value={editingCompetition.name}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, name: e.target.value })}
                        className={`flex-1 bg-transparent border-b ${theme.inputBorder} outline-none ${theme.text} py-1`}
                        autoFocus
                      />
                    ) : (
                      <span className={`flex-1 ${theme.text} font-medium`}>{comp.name}</span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {editingCompetition?.id === comp.id ? (
                        <>
                          <button
                            onClick={() => updateCompetition(editingCompetition)}
                            className={`p-2 rounded-lg ${theme.accent} ${theme.accentHover} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingCompetition(null)}
                            className={`p-2 rounded-lg ${theme.secondary} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingCompetition(comp)}
                            className={`p-2 rounded-lg ${theme.secondary} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteCompetition(comp.id)}
                            className={`p-2 rounded-lg ${theme.danger} transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {competitions.length === 0 && (
                  <p className={`text-center py-8 ${theme.textMuted}`}>
                    No competitions added yet. Add one above!
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.cardBorder} flex gap-3`}>
          <button
            onClick={onClose}
            className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest ${theme.secondary} transition-all`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-[2] py-4 rounded-xl font-black text-xs uppercase tracking-widest ${theme.accent} ${theme.accentHover} transition-all`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
