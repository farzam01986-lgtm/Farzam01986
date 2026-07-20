import React from 'react';

interface ClearConfirmModalProps {
  showClearConfirm: boolean;
  setShowClearConfirm: (show: boolean) => void;
  handleClearOnlyChats: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  showClearConfirm,
  setShowClearConfirm,
  handleClearOnlyChats,
}) => {
  if (!showClearConfirm) return null;

  return (
    <div id="clear-confirm-overlay" className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div id="clear-confirm-container" className="bg-white rounded-2xl p-6 w-full max-w-[300px] shadow-2xl scale-in-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">پاک کردن تاریخچه؟</h3>
        <p className="text-gray-500 text-xs mb-6 text-center leading-relaxed">
          آیا از پاک کردن کل تاریخچه چت با این شخصیت اطمینان دارید؟ این عمل غیرقابل بازگشت است.
        </p>
        <div className="flex flex-col gap-2">
          <button 
            id="btn-confirm-clear"
            type="button"
            onClick={handleClearOnlyChats}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors active:scale-95 text-xs cursor-pointer"
          >
            بله، تمام پیام‌ها پاک شود
          </button>
          <button 
            id="btn-cancel-clear"
            type="button"
            onClick={() => setShowClearConfirm(false)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 text-xs cursor-pointer"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
