import React from 'react';

interface ProfileDeleteModalProps {
  profileToDelete: string | null;
  setProfileToDelete: (id: string | null) => void;
  deleteClearHistory: boolean;
  setDeleteClearHistory: (clear: boolean) => void;
  deleteRemoveFromPresets: boolean;
  setDeleteRemoveFromPresets: (remove: boolean) => void;
  confirmDeleteProfile: () => void;
}

export const ProfileDeleteModal: React.FC<ProfileDeleteModalProps> = ({
  profileToDelete,
  setProfileToDelete,
  deleteClearHistory,
  setDeleteClearHistory,
  deleteRemoveFromPresets,
  setDeleteRemoveFromPresets,
  confirmDeleteProfile,
}) => {
  if (profileToDelete === null) return null;

  return (
    <div id="profile-delete-overlay" className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div id="profile-delete-container" className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-2xl scale-in-center border border-gray-100" dir="rtl">
        <h3 className="text-sm font-black text-gray-900 mb-2 text-center">حذف مخاطب؟</h3>
        <p className="text-gray-500 text-[11px] mb-4 text-center leading-relaxed">
          آیا از حذف این مخاطب مطمئن هستید؟
        </p>
        
        <div className="flex flex-col gap-3 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 select-none">
          <label className="flex items-center gap-2.5 cursor-pointer text-right">
            <input 
              id="chk-delete-clear-history"
              type="checkbox" 
              checked={deleteClearHistory}
              onChange={(e) => setDeleteClearHistory(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-gray-700">پاک کردن کامل تاریخچه چت‌ها</span>
          </label>
          
          <label className="flex items-center gap-2.5 cursor-pointer text-right">
            <input 
              id="chk-delete-remove-presets"
              type="checkbox" 
              checked={deleteRemoveFromPresets}
              onChange={(e) => setDeleteRemoveFromPresets(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-gray-700">حذف کامل از لیست شخصیت‌های آماده پکیج</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            id="btn-confirm-delete-profile"
            type="button"
            onClick={confirmDeleteProfile}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors active:scale-95 text-xs cursor-pointer shadow-sm"
          >
            بله، حذف شود
          </button>
          <button 
            id="btn-cancel-delete-profile"
            type="button"
            onClick={() => {
              setProfileToDelete(null);
              setDeleteClearHistory(false);
              setDeleteRemoveFromPresets(false);
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 text-xs cursor-pointer"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
