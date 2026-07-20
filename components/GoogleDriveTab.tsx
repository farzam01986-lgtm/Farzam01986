import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initDriveAuth,
  loginWithGoogleDrive,
  listBackupFiles,
  uploadBackupFile,
  downloadBackupContent,
  deleteBackupFile,
  setDriveAccessToken,
  DriveFile
} from '../src/googleDriveService';

interface GoogleDriveTabProps {
  activeLang: 'fa' | 'en' | 'ar' | 'es';
}

const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({ activeLang }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const isRtl = activeLang === 'fa' || activeLang === 'ar';

  const t = {
    fa: {
      title: 'پشتیبان‌گیری ابری گوگل درایو ☁️',
      desc: 'نسخه پشتیبان از تمام چت‌ها، پیام‌ها، استوری‌ها و تنظیمات خود را روی فضای ابری گوگل درایو اختصاصی خودتان ذخیره کنید و در هر زمان آن‌ها را بازگردانید.',
      connectBtn: 'اتصال به حساب گوگل درایو',
      connectedAs: 'متصل به عنوان:',
      createBackupBtn: 'ایجاد نسخه پشتیبان جدید روی درایو 📥',
      uploading: 'در حال آپلود نسخه پشتیبان...',
      backupListTitle: 'نسخه‌های پشتیبان موجود در گوگل درایو 📁',
      noBackups: 'هیچ نسخه پشتیبانی روی درایو شما یافت نشد.',
      restoreBtn: 'بازیابی 📤',
      deleteBtn: 'حذف ❌',
      disconnectBtn: 'قطع اتصال و خروج 🚪',
      confirmRestore: '⚠️ آیا مطمئن هستید که می‌خواهید این نسخه پشتیبان را بازیابی کنید؟ تمام چت‌ها و اطلاعات فعلی شما با اطلاعات این فایل جایگزین شده و برنامه مجدداً بارگذاری خواهد شد.',
      confirmDelete: '❌ آیا مطمئن هستید که می‌خواهید این فایل پشتیبان را برای همیشه از گوگل درایو خود پاک کنید؟ این عملیات غیرقابل بازگشت است.',
      successUpload: 'نسخه پشتیبان با موفقیت روی گوگل درایو ذخیره شد! 🎉',
      successRestore: 'بازیابی اطلاعات با موفقیت انجام شد! در حال راه‌اندازی مجدد برنامه... 🔄',
      successDelete: 'فایل پشتیبان با موفقیت حذف شد.',
      loading: 'در حال بارگذاری فایل‌های درایو...'
    },
    en: {
      title: 'Google Drive Cloud Backup ☁️',
      desc: 'Save your chats, messages, stories, and settings securely inside your personal Google Drive storage. Restore them on any device in one click.',
      connectBtn: 'Connect Google Drive Account',
      connectedAs: 'Connected as:',
      createBackupBtn: 'Create New Cloud Backup 📥',
      uploading: 'Uploading backup to Drive...',
      backupListTitle: 'Available Backups in Google Drive 📁',
      noBackups: 'No backups found in your Drive account.',
      restoreBtn: 'Restore 📤',
      deleteBtn: 'Delete ❌',
      disconnectBtn: 'Disconnect & Sign Out 🚪',
      confirmRestore: '⚠️ Are you sure you want to restore this backup? All current conversations and settings will be overwritten, and the app will reload.',
      confirmDelete: '❌ Are you sure you want to permanently delete this backup file from Google Drive? This action cannot be undone.',
      successUpload: 'Backup successfully uploaded to Google Drive! 🎉',
      successRestore: 'Data successfully restored! Reloading application... 🔄',
      successDelete: 'Backup file successfully deleted.',
      loading: 'Loading Drive files...'
    },
    ar: {
      title: 'النسخ الاحتياطي السحابي جوجل درايف ☁️',
      desc: 'احفظ محادثاتك ورسائلك وقصصك وإعداداتك بأمان داخل مساحة تخزين جوجل درايف الخاصة بك. قم باستعادتها بضغطة زر.',
      connectBtn: 'الاتصال بحساب جوجل درايف',
      connectedAs: 'متصل كـ:',
      createBackupBtn: 'إنشاء نسخة احتياطية سحابية جديدة 📥',
      uploading: 'جاري رفع النسخة الاحتياطية...',
      backupListTitle: 'النسخ الاحتياطية المتاحة في جوجل درايف 📁',
      noBackups: 'لم يتم العثور على أي نسخ احتياطية في حسابك.',
      restoreBtn: 'استعادة 📤',
      deleteBtn: 'حذف ❌',
      disconnectBtn: 'تسجيل الخروج وقطع الاتصال 🚪',
      confirmRestore: '⚠️ هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال كافة المحادثات والإعدادات الحالية، وستتم إعادة تشغيل التطبيق.',
      confirmDelete: '❌ هل أنت متأكد من رغبتك في حذف ملف النسخ الاحتياطي هذا نهائياً من حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
      successUpload: 'تم رفع النسخة الاحتياطية بنجاح إلى جوجل درايف! 🎉',
      successRestore: 'تمت استعادة البيانات بنجاح! جاري إعادة تشغيل التطبيق... 🔄',
      successDelete: 'تم حذف ملف النسخ الاحتياطي بنجاح.',
      loading: 'جاري تحميل ملفات درايف...'
    },
    es: {
      title: 'Copia de Seguridad en Google Drive ☁️',
      desc: 'Guarde sus chats, mensajes, historias y configuraciones de forma segura dentro de su almacenamiento personal de Google Drive. Restáurelos con un clic.',
      connectBtn: 'Conectar cuenta de Google Drive',
      connectedAs: 'Conectado como:',
      createBackupBtn: 'Crear nueva copia de seguridad 📥',
      uploading: 'Subiendo copia de seguridad...',
      backupListTitle: 'Copias de seguridad en Google Drive 📁',
      noBackups: 'No se encontraron copias de seguridad en su cuenta de Drive.',
      restoreBtn: 'Restaurar 📤',
      deleteBtn: 'Eliminar ❌',
      disconnectBtn: 'Desconectar y cerrar sesión 🚪',
      confirmRestore: '⚠️ ¿Está seguro de que desea restaurar esta copia de seguridad? Se sobrescribirán todas las conversaciones y configuraciones actuales, y la aplicación se recargará.',
      confirmDelete: '❌ ¿Está seguro de que desea eliminar permanentemente este archivo de copia de seguridad de Google Drive? Esta acción no se puede deshacer.',
      successUpload: '¡Copia de seguridad subida con éxito a Google Drive! 🎉',
      successRestore: '¡Datos restaurados con éxito! Recargando aplicación... 🔄',
      successDelete: 'Copia de seguridad eliminada con éxito.',
      loading: 'Cargando archivos de Drive...'
    }
  }[activeLang] || {
    title: 'Google Drive Cloud Backup ☁️',
    desc: 'Save your chats, messages, stories, and settings securely inside your personal Google Drive storage.',
    connectBtn: 'Connect Google Drive Account',
    connectedAs: 'Connected as:',
    createBackupBtn: 'Create New Cloud Backup 📥',
    uploading: 'Uploading backup to Drive...',
    backupListTitle: 'Available Backups in Google Drive 📁',
    noBackups: 'No backups found in your Drive account.',
    restoreBtn: 'Restore 📤',
    deleteBtn: 'Delete ❌',
    disconnectBtn: 'Disconnect & Sign Out 🚪',
    confirmRestore: '⚠️ Are you sure you want to restore this backup? All current conversations will be overwritten.',
    confirmDelete: '❌ Are you sure you want to permanently delete this backup? This action cannot be undone.',
    successUpload: 'Backup successfully uploaded! 🎉',
    successRestore: 'Data successfully restored! Reloading... 🔄',
    successDelete: 'Backup deleted successfully.',
    loading: 'Loading Drive files...'
  };

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (currentUser, activeToken) => {
        setUser(currentUser);
        setToken(activeToken);
        setAuthChecking(false);
        fetchDriveFiles(activeToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthChecking(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchDriveFiles = async (activeToken: string) => {
    setIsLoading(true);
    try {
      const backupFiles = await listBackupFiles(activeToken);
      setFiles(backupFiles);
    } catch (e) {
      console.error('Error listing backup files:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogleDrive();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        await fetchDriveFiles(res.accessToken);
      }
    } catch (e) {
      console.error('Connection failed:', e);
      alert('Connection failed. Please make sure Google Drive popup is permitted.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const backupData = {
        chat_profiles: localStorage.getItem('chat_profiles'),
        chat_history_archive: localStorage.getItem('chat_history_archive'),
        user_stories: localStorage.getItem('user_stories'),
        chat_settings: localStorage.getItem('chat_settings'),
        viewed_stories: localStorage.getItem('viewed_stories'),
        liked_stories: localStorage.getItem('liked_stories'),
        backupDate: new Date().toISOString()
      };

      await uploadBackupFile(token, backupData);
      alert(t.successUpload);
      await fetchDriveFiles(token);
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Failed to upload backup to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreBackup = async (fileId: string) => {
    if (!token) return;
    if (!window.confirm(t.confirmRestore)) return;

    setIsLoading(true);
    try {
      const backupData = await downloadBackupContent(token, fileId);
      if (backupData) {
        if (backupData.chat_profiles) localStorage.setItem('chat_profiles', backupData.chat_profiles);
        if (backupData.chat_history_archive) localStorage.setItem('chat_history_archive', backupData.chat_history_archive);
        if (backupData.user_stories) localStorage.setItem('user_stories', backupData.user_stories);
        if (backupData.chat_settings) localStorage.setItem('chat_settings', backupData.chat_settings);
        if (backupData.viewed_stories) localStorage.setItem('viewed_stories', backupData.viewed_stories);
        if (backupData.liked_stories) localStorage.setItem('liked_stories', backupData.liked_stories);

        alert(t.successRestore);
        window.location.reload();
      }
    } catch (e) {
      console.error('Restore failed:', e);
      alert('Failed to download or restore backup data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!token) return;
    if (!window.confirm(t.confirmDelete)) return;

    setIsLoading(true);
    try {
      await deleteBackupFile(token, fileId);
      alert(t.successDelete);
      await fetchDriveFiles(token);
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete backup file from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setDriveAccessToken(null);
    setUser(null);
    setToken(null);
    setFiles([]);
  };

  if (authChecking) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <i className="fas fa-spinner animate-spin text-2xl text-[#517da2]"></i>
          <span className="text-xs font-bold">{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto custom-scrollbar pb-24 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Brand Header */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center mb-5">
        <div className="w-16 h-16 bg-[#e8f0fe] text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <i className="fab fa-google-drive text-3xl"></i>
        </div>
        <h3 className="text-[15px] font-black text-gray-900 mb-2">{t.title}</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed max-w-[320px] mx-auto mb-4">{t.desc}</p>

        {!user ? (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="gsi-material-button mx-auto flex items-center justify-center w-full max-w-[280px]"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">{t.connectBtn}</span>
            </div>
          </button>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 text-right">
            <div className="flex items-center gap-3 justify-start" dir="ltr">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#517da2] text-white flex items-center justify-center font-bold text-sm">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-black text-gray-800">{user.displayName || 'Google User'}</p>
                <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={isUploading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-[#517da2] to-blue-600 hover:opacity-95 text-white text-xs font-black rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fas fa-cloud-upload-alt text-sm"></i>
              <span>{isUploading ? t.uploading : t.createBackupBtn}</span>
            </button>
          </div>
        )}
      </div>

      {user && (
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{t.backupListTitle}</h4>
            <button
              onClick={() => fetchDriveFiles(token!)}
              disabled={isLoading}
              className="text-[10px] font-black text-[#517da2] hover:text-[#3c6181] flex items-center gap-1 cursor-pointer"
            >
              <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-center text-gray-400">
              <i className="fas fa-spinner animate-spin text-xl text-[#517da2] mr-2"></i>
              <span className="text-xs font-bold">{t.loading}</span>
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm text-gray-400 select-none">
              <i className="fas fa-folder-open text-2xl text-gray-300 mb-2 block"></i>
              <p className="text-xs font-bold">{t.noBackups}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {files.map(f => {
                const date = new Date(f.createdTime);
                const localDateStr = date.toLocaleDateString(activeLang === 'fa' ? 'fa-IR' : activeLang === 'ar' ? 'ar-EG' : undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const sizeKb = f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : 'Unknown';

                return (
                  <div key={f.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
                    <div className="text-right min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-start">
                        <i className="fas fa-file-alt text-blue-400 shrink-0 text-sm"></i>
                        <span className="text-xs font-black text-gray-800 truncate" dir="ltr">{f.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 font-bold">
                        <span>{localDateStr}</span>
                        <span className="mx-1.5 font-mono">•</span>
                        <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">{sizeKb}</span>
                      </p>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreBackup(f.id)}
                        className="px-3 py-2 bg-green-50 hover:bg-green-100/90 text-green-600 rounded-xl text-[10px] font-black border border-green-100 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {t.restoreBtn}
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(f.id)}
                        className="p-2 bg-red-50 hover:bg-red-100/90 text-red-500 rounded-xl text-[10px] font-bold border border-red-100 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title={t.deleteBtn}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleDisconnect}
            className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-gray-200/50"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>{t.disconnectBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveTab;
