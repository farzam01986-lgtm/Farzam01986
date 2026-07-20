import React, { useState } from 'react';
import { ChatProfile } from '../types';
import { translations } from '../src/translations';

interface GroupCreationModalProps {
  profiles: ChatProfile[];
  onClose: () => void;
  onCreateGroup: (groupName: string, selectedMemberIds: string[]) => void;
  userName?: string;
  activeLang?: string;
}

export const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
  profiles,
  onClose,
  onCreateGroup,
  userName = "",
  activeLang = "fa"
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Get active translation set
  const t = translations[activeLang as 'fa' | 'en' | 'ar' | 'es'] || translations.fa;
  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  // Filter out any groups so they only select individual characters
  const individualProfiles = profiles.filter(p => !p.isGroup);

  const isAllSelected = individualProfiles.length > 0 && selectedIds.length === individualProfiles.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(individualProfiles.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const formatRelation = (roleLabel: string) => {
    const nameOfUser = userName || (activeLang === 'fa' ? 'کاربر' : 'User');
    if (!roleLabel) return '';
    const relationsToSuffix = ['مادر', 'پدر', 'همسر', 'دوست', 'خواهر', 'برادر', 'دخترخاله', 'پسرخاله', 'عمه', 'خاله', 'دایی', 'عمو'];
    const matched = relationsToSuffix.find(r => roleLabel.includes(r));
    if (matched && isRtl) {
      // Return e.g. "مادر میثم" or "همسر میثم"
      return `${roleLabel} ${nameOfUser}`;
    }
    return roleLabel;
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert(t.groupNameAlert);
      return;
    }
    if (selectedIds.length === 0) {
      alert(t.groupMembersAlert);
      return;
    }

    onCreateGroup(groupName.trim(), selectedIds);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" dir={isRtl ? "rtl" : "ltr"}>
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#517da2] to-[#3a5d7c] p-4 text-center shrink-0 flex justify-between items-center text-white">
          <h2 className="text-sm font-extrabold text-white">{t.createGroupTitle}</h2>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Group Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-gray-700">{t.groupNameLabel}</label>
            <input
              type="text"
              placeholder={t.groupNamePlaceholder}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:ring-1 focus:ring-blue-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white transition-all text-gray-800"
            />
          </div>

          {/* Members list checkbox */}
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-gray-700">
                {t.selectMembersLabel.replace('{selectedIds.length}', selectedIds.length.toString())}
              </label>
              {individualProfiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[10px] text-blue-500 hover:text-blue-600 font-extrabold hover:underline transition-all"
                >
                  {isAllSelected ? t.unselectAllBtn : t.selectAllBtn}
                </button>
              )}
            </div>
            
            {individualProfiles.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-gray-400 font-bold bg-gray-50 rounded-2xl">
                {t.addContactsFirst}
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[250px] border border-gray-100 p-2 rounded-xl bg-gray-50/50">
                {individualProfiles.map(p => {
                  const isChecked = selectedIds.includes(p.id);
                  const displayRelation = formatRelation(p.customRoleLabel || p.role);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isChecked ? 'bg-blue-50 border border-blue-200/50' : 'bg-white hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className={`flex items-center gap-2.5 min-w-0 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shrink-0">
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className={`${isRtl ? 'text-right' : 'text-left'} min-w-0`}>
                          <span className="text-xs font-extrabold text-gray-800 block truncate">{p.name}</span>
                          {displayRelation && (
                            <span className="text-[9px] text-[#517da2] font-black truncate block">
                              ({displayRelation})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Custom circular checkbox */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all border ${
                        isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <i className="fas fa-check text-[10px]"></i>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedIds.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#517da2] hover:bg-[#3d6384] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {t.createGroupBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
