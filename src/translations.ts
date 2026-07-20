export type SupportedLanguages = 'fa' | 'en' | 'ar' | 'es';

export interface TranslationSet {
  welcome: string;
  register: string;
  login: string;
  fillDetails: string;
  avatarLabel: string;
  presetAvatars: string;
  fullName: string;
  phone: string;
  age: string;
  password: string;
  letsGo: string;
  loginTitle: string;
  loginBtn: string;
  langSelect: string;
  
  profileInfo: string;
  aiName: string;
  aiAge: string;
  yourName: string;
  yourAge: string;
  yourPic: string;
  changePic: string;
  audioTitle: string;
  audioEnabled: string;
  audioMode: string;
  audioAuto: string;
  audioManual: string;
  apiKeyTitle: string;
  apiKeyDesc: string;
  apiKeyBtn: string;
  bgTitle: string;
  bgDesc: string;
  syncTitle: string;
  syncDesc: string;
  backupBtn: string;
  restoreBtn: string;
  shareTitle: string;
  shareDesc: string;
  shareBtn: string;
  simInactivity: string;
  delAccount: string;
  delAccountDesc: string;
  applyBtn: string;
  cancelBtn: string;
  fontSize: string;
  appLang: string;
  appTitle: string;
  newStory: string;
  messengerSettings: string;
  typing: string;
  online: string;
  group: string;
  members: string;
  chatMenu: string;
  yourGender: string;
  genderMale: string;
  genderFemale: string;
  
  contactsTab: string;
  groupsTab: string;
  channelsTab: string;
  searchPlaceholder: string;
  newGroupBtn: string;
  back: string;
  chatsTitle: string;
  guide: string;
  voiceCall: string;
  videoCall: string;
  searchInChat: string;
  clearHistory: string;
  changeBg: string;
  uploadedPhotos: string;
  confirmLeaveGroup: string;
  leftGroup: string;
  mute: string;
  unmute: string;
  createGroupTitle: string;
  groupNameLabel: string;
  groupNamePlaceholder: string;
  selectMembersLabel: string;
  unselectAllBtn: string;
  selectAllBtn: string;
  addContactsFirst: string;
  cancel: string;
  createGroupBtn: string;
  groupNameAlert: string;
  groupMembersAlert: string;
  storiesHeader: string;
  myStoryLabel: string;
  newStoryTitle: string;
  textStoryBtn: string;
  imageStoryBtn: string;
  storyTextLabel: string;
  storyTextPlaceholder: string;
  selectStoryImage: string;
  allowedFormats: string;
  storyCaptionLabel: string;
  storyCaptionPlaceholder: string;
  publishStoryBtn: string;
  justNow: string;
  commentsTitle: string;
  commentPlaceholder: string;
  likeStory: string;
  deleteStoryBtn: string;
  confirmDeleteStory: string;
  confirmDeleteYes: string;
  searchContacts: string;
  noContactsFound: string;
  incomingVoiceCall: string;
  incomingVideoCall: string;
  calling: string;
  callRinging: string;
  callConnected: string;
  callEnded: string;
  connectingCall: string;
  acceptCall: string;
  declineCall: string;
  closeBtn: string;
  zoomImage: string;
  changeProfilePic: string;
  publicGroup: string;
  editGroupInfo: string;
  groupName: string;
  manageGroupMembers: string;
  youLabel: string;
  memberLabel: string;
  leaveGroup: string;
  removeBtn: string;
  addNewMembers: string;
  noOtherContacts: string;
  voiceSettings: string;
  playbackMode: string;
  voiceSelection: string;
  chatBgTitle: string;
  uploadFile: string;
  removeCustomBg: string;
  photosTab: string;
  voicesTab: string;
  linksTab: string;
  filesTab: string;
  sharedPhotos: string;
  uploadPhotoBtn: string;
  noPhotosText: string;
  noVoicesText: string;
  noLinksText: string;
  noFilesText: string;
  voiceMsgLabel: string;
  clearHistoryBtn: string;
  familiarityToday: string;
  familiarityDays: string;

  // Added Localization Keys
  deleteContactTitle: string;
  deleteContactConfirmText: string;
  deleteClearHistoryLabel: string;
  deleteRemovePresetLabel: string;
  deleteConfirmBtn: string;

  clearHistoryTitle: string;
  clearHistoryConfirmText: string;
  clearHistoryConfirmYes: string;

  reply: string;
  editMessage: string;
  pinMessage: string;
  unpinMessage: string;
  forwardMessage: string;
  copyMessage: string;
  deleteMessage: string;

  userNameLabel: string;
  userProfilePicLabel: string;
  userNamePlaceholder: string;
  userNameDesc: string;
  userProfilePicPlaceholder: string;
  generalVoiceSettingsTitle: string;
  aiVoicePlaybackLabel: string;
  textChatPlaybackLabel: string;
  autoPlayLabel: string;
  manualPlayLabel: string;
  voiceSettingsDesc: string;
  clearAllHistoriesTitle: string;
  clearAllHistoriesDesc: string;
  clearAllHistoriesConfirm: string;
  confirmYesBtn: string;
  clearAllHistoriesBtn: string;
  deleteAccountTitle: string;
  deleteAccountDescText: string;
  deleteAccountConfirmText: string;
  deleteAccountConfirmYes: string;

  diagnosticSystemTitle: string;
  diagnosticSystemSub: string;
  autopilotSuccessLabel: string;
  autopilotRepairsText: string;
  webAudioEngineLabel: string;
  audioEngineReady: string;
  audioEngineSuspended: string;
  micInputLabel: string;
  micInputReady: string;
  micInputBlocked: string;
  farsiPronunciationLabel: string;
  farsiPronunciationReady: string;
  networkLatencyLabel: string;
  networkOfflineLabel: string;
  messageDbLabel: string;
  messageDbStats: string;
  autoPlayUnlockLabel: string;
  autoPlayUnblocked: string;
  autoPlayBlocked: string;
  activeAudioSessionsLabel: string;
  activeAudioSessionsText: string;
  diagnosticSystemTipTitle: string;
  diagnosticSystemTipDesc: string;
  instantRepairBtn: string;
  instantRepairBtnRunning: string;

  // Profile creation sheet keys
  addProfileSheetTitle: string;
  addProfileSheetSub: string;
  tabRealContacts: string;
  tabAiBots: string;
  tabCreateBot: string;
  uploadCustomPic: string;
  contactNameLabel: string;
  contactNamePlaceholder: string;
  botAgeLabel: string;
  botRoleLabel: string;
  partnerGenderLabel: string;
  partnerGenderMale: string;
  partnerGenderFemale: string;
  relationshipTitleLabel: string;
  relationshipPlaceholder: string;
  relationshipDesc: string;
  personaPromptLabel: string;
  personaPromptPlaceholder: string;
  createBotBtn: string;
  partnerCustomizerTitle?: string;
  partnerCustomizerDesc?: string;
  partnerNameLabel?: string;
  partnerAgeLabel?: string;
  partnerPicLabel?: string;
  confirmAndStartBtn?: string;
  friendCustomizerTitle?: string;
  friendCustomizerDesc?: string;
  friendGenderLabel?: string;
  friendNameLabel?: string;
  friendAgeLabel?: string;
  friendPicLabel?: string;

  // Channels keys
  createChannelTitle: string;
  createChannelSub: string;
  channelNameLabel: string;
  channelNamePlaceholder: string;
  channelDescLabel: string;
  channelDescPlaceholder: string;
  channelIdLabel: string;
  channelIdPlaceholder: string;
  channelIdDesc: string;
  channelTypeLabel: string;
  channelTypePublic: string;
  channelTypePrivate: string;
  channelTypePublicDesc: string;
  channelTypePrivateDesc: string;
  channelAvatarLabel: string;
  channelAvatarPlaceholder: string;
  saveChannelBtn: string;
  editChannelTitle: string;
  editChannelBtn: string;
  deleteChannelPostConfirm: string;
  postDeletedMsg: string;
  editPostTitle: string;
  editPostPlaceholder: string;
  savePostBtn: string;
  addPostBtn: string;
  postTextPlaceholder: string;
  inviteLinkCopied: string;
  channelSubscribersLabel: string;
  channelPostsLabel: string;
  channelJoinBtn: string;
  channelLeftBtn: string;
  channelMembersJoinedMsg: string;
  channelsTabTitle: string;
  newChannelBtn: string;
  searchChannelPlaceholder: string;
  noChannelsFound: string;
  forwardToTitle: string;
  forwardSuccess: string;
  stickerSelectTitle: string;
}

export const translations: Record<SupportedLanguages, TranslationSet> = {
  fa: {
    welcome: 'خوش آمدید! 😊',
    register: 'ثبت‌نام جدید',
    login: 'ورود به حساب',
    fillDetails: 'برای عضویت، اطلاعات زیر را تکمیل کنید:',
    avatarLabel: 'انتخاب عکس پروفایل',
    presetAvatars: 'انتخاب عکس پیشنهادی:',
    fullName: 'نام و نام‌خانوادگی (به فارسی)',
    phone: 'شماره موبایل',
    age: 'سن شما',
    password: 'رمز ورود به حساب',
    letsGo: 'شروع گفتگو 🚀',
    loginTitle: 'شماره موبایل و رمز عبور خود را وارد کنید:',
    loginBtn: 'ورود به حساب 🔓',
    langSelect: 'زبان برنامه / Language',
    
    profileInfo: 'اطلاعات کاربری',
    aiName: 'نام هوش مصنوعی',
    aiAge: 'سن هوش مصنوعی',
    yourName: 'نام شما (کاربر)',
    yourAge: 'سن شما (کاربر)',
    yourPic: 'عکس پروفایل شما (کاربر)',
    changePic: 'تغییر عکس پروفایل',
    audioTitle: 'تنظیمات صوتی',
    audioEnabled: 'قابلیت پخش صوت',
    audioMode: 'نوع پخش صوتی چت‌های متنی:',
    audioAuto: 'پخش اتوماتیک (خودکار)',
    audioManual: 'پخش دستی (کلیک روی ویس)',
    apiKeyTitle: 'مدیریت کلید API (برای ویدیو)',
    apiKeyDesc: 'برای استفاده از قابلیت تماس تصویری، حتماً باید یک API Key از پروژه‌ای انتخاب کنید که پرداخت آن فعال باشد.',
    apiKeyBtn: 'تغییر یا انتخاب کلید API',
    bgTitle: 'پس‌زمینه چت',
    bgDesc: 'انتخاب از رنگ‌ها یا آپلود عکس دلخواه',
    syncTitle: 'همگام‌سازی و پشتیبان‌گیری',
    syncDesc: 'می‌توانید از تمامی گفتگوها، مخاطبین، استوری‌ها و تنظیمات خود نسخه پشتیبان تهیه کنید.',
    backupBtn: 'پشتیبان‌گیری (دانلود)',
    restoreBtn: 'بازیابی اطلاعات (آپلود)',
    shareTitle: 'اشتراک‌گذاری و دعوت دوستان',
    shareDesc: 'لینک دعوت برنامه را برای دوستان خود ارسال کنید تا به صورت زنده با شما چت کنند!',
    shareBtn: 'کپی لینک اشتراک‌گذاری برنامه 🔗',
    simInactivity: 'شبیه‌سازی ۳ روز بی‌فعالیتی (پیام پیگیری)',
    delAccount: 'حذف کامل حساب کاربری',
    delAccountDesc: 'با زدن این دکمه، حساب کاربری شما به همراه تمامی سوابق برای همیشه حذف خواهد شد.',
    applyBtn: 'اعمال تغییرات',
    cancelBtn: 'لغو',
    fontSize: 'اندازه فونت چت',
    appLang: 'زبان برنامه',
    appTitle: 'پیام‌رسان هوشمند',
    newStory: 'ثبت استوری جدید',
    messengerSettings: 'تنظیمات کلی پیام‌رسان',
    typing: 'در حال نوشتن...',
    online: 'آنلاین',
    group: 'گروه',
    members: 'عضو',
    chatMenu: 'منوی گفتگو',
    yourGender: 'جنسیت شما',
    genderMale: 'مرد',
    genderFemale: 'زن',
    
    contactsTab: 'مخاطبین',
    groupsTab: 'گروه‌ها',
    channelsTab: 'کانال‌ها',
    searchPlaceholder: 'جستجو...',
    newGroupBtn: 'گروه جدید',
    back: 'بازگشت',
    chatsTitle: 'گفتگوها',
    guide: 'راهنمای استفاده',
    voiceCall: 'تماس صوتی',
    videoCall: 'تماس ویدیویی',
    searchInChat: 'جستجو در گفتگو',
    clearHistory: 'پاک کردن تاریخچه',
    changeBg: 'تغییر پس‌زمینه',
    uploadedPhotos: 'عکس‌های بارگذاری شده',
    confirmLeaveGroup: 'آیا واقعاً می‌خواهید این گروه را ترک کنید؟',
    leftGroup: '🚪 شما گروه را ترک کردید.',
    mute: 'بی‌صدا کردن',
    unmute: 'باصدا کردن',
    createGroupTitle: 'ایجاد گروه جدید 👥',
    groupNameLabel: 'نام گروه:',
    groupNamePlaceholder: 'مثلا: گروه سلامت و مشاوره، دورهمی خانواده',
    selectMembersLabel: 'انتخاب اعضای گروه ({selectedIds.length} نفر):',
    unselectAllBtn: 'حذف همه تیک‌ها',
    selectAllBtn: 'انتخاب همه',
    addContactsFirst: 'ابتدا چند مخاطب با زدن علامت + ایجاد کنید تا بتوانید گروه بسازید.',
    cancel: 'انصراف',
    createGroupBtn: 'ایجاد گروه 👥',
    groupNameAlert: 'لطفاً نام گروه را وارد کنید.',
    groupMembersAlert: 'لطفاً حداقل یک عضو برای گروه انتخاب کنید.',
    storiesHeader: 'استوری‌ها 💫',
    myStoryLabel: 'استوری من',
    newStoryTitle: 'ثبت استوری جدید 📸',
    textStoryBtn: 'استوری متنی ✍🏼',
    imageStoryBtn: 'استوری عکس‌دار 🖼️',
    storyTextLabel: 'متن استوری',
    storyTextPlaceholder: 'متن دلخواهت رو اینجا بنویس... 🌸',
    selectStoryImage: 'انتخاب تصویر استوری',
    allowedFormats: 'فرمت‌های مجاز: JPG, PNG',
    storyCaptionLabel: 'کپشن استوری (اختیاری)',
    storyCaptionPlaceholder: 'یک توضیح کوتاه یا ایموجی قشنگ بنویس... ✨',
    publishStoryBtn: 'انتشار استوری جدید 🚀',
    justNow: 'لحظاتی پیش',
    commentsTitle: 'نظرات و بازخوردها',
    commentPlaceholder: 'ارسال بازخورد و نظر به استوری...',
    likeStory: 'لایک استوری',
    deleteStoryBtn: 'حذف استوری',
    confirmDeleteStory: 'تایید نهایی برای حذف استوری',
    confirmDeleteYes: 'حذف قطعی؟',
    searchContacts: 'جستجوی مخاطبین...',
    noContactsFound: 'مخاطبی یافت نشد.',
    incomingVoiceCall: 'تماس صوتی ورودی',
    incomingVideoCall: 'تماس تصویری ورودی',
    calling: 'در حال تماس...',
    callRinging: 'در حال زنگ خوردن...',
    callConnected: 'تماس برقرار شد',
    callEnded: 'تماس پایان یافت',
    connectingCall: 'در حال اتصال...',
    acceptCall: 'پاسخ دادن',
    declineCall: 'رد کردن',
    closeBtn: 'بستن',
    zoomImage: 'بزرگنمایی تصویر',
    changeProfilePic: 'تغییر تصویر پروفایل',
    publicGroup: 'گروه عمومی 👥',
    editGroupInfo: 'ویرایش مشخصات گروه 📝',
    groupName: 'نام گروه',
    manageGroupMembers: 'مدیریت اعضای گروه 👥',
    youLabel: 'شما',
    memberLabel: 'عضو گروه 👥',
    leaveGroup: 'ترک گروه 🚪',
    removeBtn: 'حذف',
    addNewMembers: 'افزودن مخاطبین جدید به گروه ➕',
    noOtherContacts: 'مخاطب جدید دیگری برای اضافه کردن یافت نشد.',
    voiceSettings: 'تنظیمات صوتی اختصاصی 🎙️',
    playbackMode: 'حالت پخش ویس پیام‌ها',
    voiceSelection: 'صدای مخاطب',
    chatBgTitle: 'تصویر پس‌زمینه گفتگو 🖼️',
    uploadFile: 'آپلود فایل',
    removeCustomBg: 'حذف سفارشی',
    photosTab: 'عکس‌ها',
    voicesTab: 'ویس‌ها',
    linksTab: 'لینک‌ها',
    filesTab: 'فایل‌ها',
    sharedPhotos: 'عکس‌های تبادل‌شده و بارگذاری‌شده',
    uploadPhotoBtn: 'بارگذاری عکس',
    noPhotosText: 'عکسی در چت رد و بدل نشده است 📷',
    noVoicesText: 'ویسی در چت رد و بدل نشده است 🎙️',
    noLinksText: 'لینکی در چت ارسال نشده است 🔗',
    noFilesText: 'فایلی در چت ارسال نشده است 📂',
    voiceMsgLabel: 'پیام صوتی',
    clearHistoryBtn: 'پاک کردن تاریخچه گفتگو',
    familiarityToday: 'امروز شروع شده',
    familiarityDays: '{days} روز',

    // Added Localization Keys
    deleteContactTitle: 'حذف مخاطب؟',
    deleteContactConfirmText: 'آیا از حذف این مخاطب مطمئن هستید؟',
    deleteClearHistoryLabel: 'پاک کردن کامل تاریخچه چت‌ها',
    deleteRemovePresetLabel: 'حذف کامل از لیست شخصیت‌های آماده پکیج',
    deleteConfirmBtn: 'بله، حذف شود',

    clearHistoryTitle: 'پاک کردن تاریخچه؟',
    clearHistoryConfirmText: 'آیا از پاک کردن کل تاریخچه چت با این شخصیت اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
    clearHistoryConfirmYes: 'بله، تمام پیام‌ها پاک شود',

    reply: 'پاسخ',
    editMessage: 'ویرایش پیام',
    pinMessage: 'سنجاق کردن',
    unpinMessage: 'حذف از پین',
    forwardMessage: 'هدایت (فوروارد)',
    copyMessage: 'کپی کردن',
    deleteMessage: 'حذف پیام',

    userNameLabel: 'نام کاربری شما',
    userProfilePicLabel: 'عکس پروفایل شما',
    userNamePlaceholder: 'مثال: فرزاد، علی...',
    userNameDesc: 'این نام در مکالمات برای ارجاع هوش مصنوعی به شما استفاده می‌شود.',
    userProfilePicPlaceholder: 'لینک عکس دلخواه...',
    generalVoiceSettingsTitle: 'تنظیمات صوتی عمومی',
    aiVoicePlaybackLabel: 'قابلیت پخش صوت هوش مصنوعی',
    textChatPlaybackLabel: 'نحوه پخش صوتی چت‌های متنی:',
    autoPlayLabel: 'پخش اتوماتیک (خودکار)',
    manualPlayLabel: 'پخش دستی (کلیک روی بلندگو)',
    voiceSettingsDesc: 'در حالت دستی، با کلیک روی بلندگو یا آیکون ویس کنار حباب پیام‌ها می‌توانید صدای آن را بشنوید.',
    clearAllHistoriesTitle: 'پاکسازی کل تاریخچه‌ها',
    clearAllHistoriesDesc: 'با کلیک روی دکمه زیر، تاریخچه پیام‌های تمامی شخصیت‌ها به طور کامل پاک می‌شود ولی خود شخصیت‌ها در لیست باقی می‌مانند.',
    clearAllHistoriesConfirm: 'آیا از پاک کردن تاریخچه تمام مخاطبان مطمئن هستید؟ این عمل غیرقابل بازگشت است.',
    confirmYesBtn: 'بله، پاک شوند',
    clearAllHistoriesBtn: 'پاک کردن تاریخچه تمام شخصیت‌ها',
    deleteAccountTitle: 'حذف حساب کاربری',
    deleteAccountDescText: 'این دکمه حساب کاربری شما را به همراه نام کاربری، داستان‌ها، مخاطبان و تمام تاریخچه گفتگوها به طور کامل از دیتابیس ابری حذف می‌کند.',
    deleteAccountConfirmText: 'آیا از حذف کامل حساب کاربری خود و پاک شدن تمامی تاریخچه‌ها و اطلاعات مطمئن هستید؟ این کار غیرقابل بازگشت است.',
    deleteAccountConfirmYes: 'بله، کاملاً حذف شود',

    diagnosticSystemTitle: 'سیستم عیب یابی هوشمند',
    diagnosticSystemSub: 'EXO Autopilot & Self-Healing Telemetry Dashboard',
    autopilotSuccessLabel: 'ترمیم‌های سیستمی موفق خلبان خودکار (Autopilot):',
    autopilotRepairsText: '{count} مورد ترمیم زنده',
    webAudioEngineLabel: 'موتور صوتی وب',
    audioEngineReady: 'آماده و کالیبره',
    audioEngineSuspended: 'معلق / نیاز به ریست',
    micInputLabel: 'ورودی میکروفون',
    micInputReady: 'سخت‌افزار آماده',
    micInputBlocked: 'دسترسی مسدود',
    farsiPronunciationLabel: 'موتور اعراب‌گذاری تمامی کلمات',
    farsiPronunciationReady: 'سالم و فعال ✅',
    networkLatencyLabel: 'تاخیر اتصال شبکه',
    networkOfflineLabel: 'شبیه‌ساز آفلاین فعال',
    messageDbLabel: 'دیتابیس پیام‌ها',
    messageDbStats: '{count} پیام ({size}KB)',
    autoPlayUnlockLabel: 'قفل پخش اتوماتیک صوتی مرورگر',
    autoPlayUnblocked: 'باز و مجاز',
    autoPlayBlocked: 'بسته / نیاز به کلیک',
    activeAudioSessionsLabel: 'کانال‌های صوتی فعال',
    activeAudioSessionsText: '{count} کانال همزمان استریو',
    diagnosticSystemTipTitle: '💡 راهنمای فوری خودترمیمی:',
    diagnosticSystemTipDesc: 'اگر صدای شخصیت‌ها قطع شده یا ویس شما ارسال نمی‌شود، روی دکمه زیر کلیک کنید. سیستم تمام فیلترهای صوتی را پاکسازی، پورت‌ها را ریست و کش مرورگر را نوسازی می‌کند.',
    instantRepairBtn: 'کالیبره و عیب‌یابی فوری هم‌اکنون',
    instantRepairBtnRunning: 'در حال پاکسازی کش و بازسازی پورت‌های صوتی...',

    // Profile creation sheet keys
    addProfileSheetTitle: 'مخاطبین و شخصیت‌ها',
    addProfileSheetSub: 'با چه کسی می‌خواهید گفتگو یا تماس برقرار کنید؟',
    tabRealContacts: 'مخاطبین گوشی (واقعی)',
    tabAiBots: 'ربات‌های هوش مصنوعی',
    tabCreateBot: 'ساخت ربات جدید',
    uploadCustomPic: 'آپلود عکس سفارشی یا انتخاب از زیر:',
    contactNameLabel: 'نام مخاطب',
    contactNamePlaceholder: 'مثال: مریم، ساجده، علیرضا...',
    botAgeLabel: 'سن ربات',
    botRoleLabel: 'شخصیت و نقش',
    partnerGenderLabel: 'جنسیت همسر شما چیست؟',
    partnerGenderMale: 'مرد (شوهر)',
    partnerGenderFemale: 'زن (همسر)',
    relationshipTitleLabel: 'عنوان شغلی یا رابطه با شما',
    relationshipPlaceholder: 'مثال: دخترخالم، دکتر عمومی، وکیل پایه یک، روانشناس...',
    relationshipDesc: 'این عنوان در کنار نام شخصیت در پرانتز نمایش داده می‌شود.',
    personaPromptLabel: 'توصیف رابطه یا نقش هوش مصنوعی',
    personaPromptPlaceholder: 'مثال: تو دختر خاله صمیمی من هستی که تازه از خارج برگشتی و خیلی با من راحتی و به هم رازهایمان را می‌گوییم...',
    createBotBtn: 'ایجاد شخصیت و شروع گفتگو 🚀',

    // Channels keys
    createChannelTitle: 'ایجاد کانال جدید 📢',
    createChannelSub: 'کانال‌ها بستر فوق‌العاده‌ای برای انتشار مطالب شما و همفکری با هوش مصنوعی و مخاطبان واقعی هستند.',
    channelNameLabel: 'نام کانال:',
    channelNamePlaceholder: 'مثال: کانال خبر، آشپزی با طعم عشق',
    channelDescLabel: 'توضیحات کانال:',
    channelDescPlaceholder: 'توضیحی درباره فعالیت کانال خود بنویسید...',
    channelIdLabel: 'شناسه (آیدی) کانال:',
    channelIdPlaceholder: 'مثال: my_channel_id',
    channelIdDesc: 'شناسه شما باید یکتا باشد و با @ شروع شود (فقط شامل حروف انگلیسی، اعداد و _ بین ۳ تا ۲۰ کاراکتر).',
    channelTypeLabel: 'نوع کانال:',
    channelTypePublic: 'عمومی (قابل جستجو و عضویت همگانی)',
    channelTypePrivate: 'خصوصی (عضویت فقط از طریق لینک دعوت)',
    channelTypePublicDesc: 'هر کسی می‌تواند این کانال را جستجو کرده و عضو شود.',
    channelTypePrivateDesc: 'عضویت در این کانال فقط از طریق لینک دعوت اختصاصی امکان‌پذیر است.',
    channelAvatarLabel: 'عکس پروفایل کانال:',
    channelAvatarPlaceholder: 'لینک عکس دلخواه کانال...',
    saveChannelBtn: 'ذخیره کانال 🚀',
    editChannelTitle: 'ویرایش مشخصات کانال 📝',
    editChannelBtn: 'ویرایش مشخصات کانال',
    deleteChannelPostConfirm: 'آیا از حذف این مطلب مطمئن هستید؟',
    postDeletedMsg: 'مطلب با موفقیت حذف شد',
    editPostTitle: 'ویرایش مطلب کانال 📝',
    editPostPlaceholder: 'متن مطلب را ویرایش کنید...',
    savePostBtn: 'ذخیره تغییرات مطلب',
    addPostBtn: 'انتشار مطلب جدید 🚀',
    postTextPlaceholder: 'مطلب جدیدی در کانال خود بنویسید...',
    inviteLinkCopied: 'لینک دعوت کانال با موفقیت کپی شد! 🔗',
    channelSubscribersLabel: 'عضو',
    channelPostsLabel: 'مطلب',
    channelJoinBtn: 'عضویت در کانال 👥',
    channelLeftBtn: 'ترک کانال 🚪',
    channelMembersJoinedMsg: 'عضو جدید با لینک دعوت وارد شد!',
    channelsTabTitle: 'کانال‌ها',
    newChannelBtn: 'ایجاد کانال',
    searchChannelPlaceholder: 'جستجوی کانال...',
    noChannelsFound: 'هیچ کانالی یافت نشد.',
    forwardToTitle: 'هدایت پیام به',
    forwardSuccess: 'پیام با موفقیت هدایت (فوروارد) شد! 🚀',
    stickerSelectTitle: 'انتخاب و ارسال استیکر صمیمانه 🌸'
  },
  en: {
    welcome: 'Welcome! 😊',
    register: 'Sign Up',
    login: 'Log In',
    fillDetails: 'Please fill in the details below to join:',
    avatarLabel: 'Select Profile Picture',
    presetAvatars: 'Choose suggested photo:',
    fullName: 'Full Name',
    phone: 'Mobile Number',
    age: 'Your Age',
    password: 'Password',
    letsGo: 'Start Chatting 🚀',
    loginTitle: 'Enter your mobile number and password to log in:',
    loginBtn: 'Log In 🔓',
    langSelect: 'App Language / زبان',
    
    profileInfo: 'User Information',
    aiName: 'AI Name',
    aiAge: 'AI Age',
    yourName: 'Your Name (User)',
    yourAge: 'Your Age (User)',
    yourPic: 'Your Profile Picture (User)',
    changePic: 'Change Profile Pic',
    audioTitle: 'Audio Settings',
    audioEnabled: 'Voice Playback',
    audioMode: 'Text-to-Speech Playback Mode:',
    audioAuto: 'Auto Play (Instant)',
    audioManual: 'Manual Play (Click to listen)',
    apiKeyTitle: 'API Key Management (for video)',
    apiKeyDesc: 'To use video calling, make sure to select an API Key from a project with billing active.',
    apiKeyBtn: 'Select / Change API Key',
    bgTitle: 'Chat Background',
    bgDesc: 'Choose colors or upload custom image',
    syncTitle: 'Sync & Backup',
    syncDesc: 'Backup or restore your contacts, chats, stories, and settings easily.',
    backupBtn: 'Backup (Download)',
    restoreBtn: 'Restore (Upload)',
    shareTitle: 'Share & Invite Friends',
    shareDesc: 'Send invitation link to friends so they can join and live chat with you!',
    shareBtn: 'Copy Invitation Link 🔗',
    simInactivity: 'Simulate 3 Days of Inactivity',
    delAccount: 'Delete Account Permanently',
    delAccountDesc: 'Deleting your account is permanent and will wipe all chats, stories, and credentials.',
    applyBtn: 'Apply Changes',
    cancelBtn: 'Cancel',
    fontSize: 'Chat Font Size',
    appLang: 'App Language',
    appTitle: 'Smart Messenger',
    newStory: 'Post New Story',
    messengerSettings: 'Messenger Settings',
    typing: 'typing...',
    online: 'online',
    group: 'Group',
    members: 'members',
    chatMenu: 'Chat Menu',
    yourGender: 'Your Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    
    contactsTab: 'Contacts',
    groupsTab: 'Groups',
    channelsTab: 'Channels',
    searchPlaceholder: 'Search...',
    newGroupBtn: 'New Group',
    back: 'Back',
    chatsTitle: 'Chats',
    guide: 'User Guide',
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    searchInChat: 'Search in Chat',
    clearHistory: 'Clear History',
    changeBg: 'Change Background',
    uploadedPhotos: 'Uploaded Photos',
    confirmLeaveGroup: 'Are you sure you want to leave this group?',
    leftGroup: '🚪 You left the group.',
    mute: 'Mute',
    unmute: 'Unmute',
    createGroupTitle: 'Create New Group 👥',
    groupNameLabel: 'Group Name:',
    groupNamePlaceholder: 'e.g., Family Gathering, Health Group',
    selectMembersLabel: 'Select Group Members ({selectedIds.length} people):',
    unselectAllBtn: 'Deselect All',
    selectAllBtn: 'Select All',
    addContactsFirst: 'Please add some contacts first by clicking + to create a group.',
    cancel: 'Cancel',
    createGroupBtn: 'Create Group 👥',
    groupNameAlert: 'Please enter a group name.',
    groupMembersAlert: 'Please select at least one member.',
    storiesHeader: 'Stories 💫',
    myStoryLabel: 'My Story',
    newStoryTitle: 'Post New Story 📸',
    textStoryBtn: 'Text Story ✍🏼',
    imageStoryBtn: 'Image Story 🖼️',
    storyTextLabel: 'Story Text',
    storyTextPlaceholder: 'Write anything you want here... 🌸',
    selectStoryImage: 'Select Story Image',
    allowedFormats: 'Allowed Formats: JPG, PNG',
    storyCaptionLabel: 'Story Caption (Optional)',
    storyCaptionPlaceholder: 'Write a short caption or cute emoji... ✨',
    publishStoryBtn: 'Publish New Story 🚀',
    justNow: 'Just now',
    commentsTitle: 'Comments & Feedback',
    commentPlaceholder: 'Send feedback to this story...',
    likeStory: 'Like Story',
    deleteStoryBtn: 'Delete Story',
    confirmDeleteStory: 'Confirm delete story',
    confirmDeleteYes: 'Confirm Delete?',
    searchContacts: 'Search contacts...',
    noContactsFound: 'No contacts found.',
    incomingVoiceCall: 'Incoming Voice Call',
    incomingVideoCall: 'Incoming Video Call',
    calling: 'Calling...',
    callRinging: 'Ringing...',
    callConnected: 'Connected',
    callEnded: 'Call Ended',
    connectingCall: 'Connecting...',
    acceptCall: 'Answer',
    declineCall: 'Decline',
    closeBtn: 'Close',
    zoomImage: 'Zoom Image',
    changeProfilePic: 'Change Profile Picture',
    publicGroup: 'Public Group 👥',
    editGroupInfo: 'Edit Group Info 📝',
    groupName: 'Group Name',
    manageGroupMembers: 'Manage Group Members 👥',
    youLabel: 'You',
    memberLabel: 'Group Member 👥',
    leaveGroup: 'Leave Group 🚪',
    removeBtn: 'Remove',
    addNewMembers: 'Add New Members ➕',
    noOtherContacts: 'No other contacts found to add.',
    voiceSettings: 'Custom Voice Settings 🎙️',
    playbackMode: 'Voice Playback Mode',
    voiceSelection: 'Contact Voice',
    chatBgTitle: 'Chat Background 🖼️',
    uploadFile: 'Upload File',
    removeCustomBg: 'Remove Custom',
    photosTab: 'Photos',
    voicesTab: 'Voices',
    linksTab: 'Links',
    filesTab: 'Files',
    sharedPhotos: 'Shared & Uploaded Photos',
    uploadPhotoBtn: 'Upload Photo',
    noPhotosText: 'No photos exchanged in this chat. 📷',
    noVoicesText: 'No voice messages in this chat. 🎙️',
    noLinksText: 'No links sent in this chat. 🔗',
    noFilesText: 'No files sent in this chat. 📂',
    voiceMsgLabel: 'Voice Message',
    clearHistoryBtn: 'Clear Chat History',
    familiarityToday: 'Started today',
    familiarityDays: '{days} days',

    // Added Localization Keys
    deleteContactTitle: 'Delete Contact?',
    deleteContactConfirmText: 'Are you sure you want to delete this contact?',
    deleteClearHistoryLabel: 'Delete entire chat history',
    deleteRemovePresetLabel: 'Remove from pre-configured character list',
    deleteConfirmBtn: 'Yes, Delete',

    clearHistoryTitle: 'Clear History?',
    clearHistoryConfirmText: 'Are you sure you want to clear the entire chat history with this character? This action cannot be undone.',
    clearHistoryConfirmYes: 'Yes, clear all messages',

    reply: 'Reply',
    editMessage: 'Edit Message',
    pinMessage: 'Pin Message',
    unpinMessage: 'Unpin Message',
    forwardMessage: 'Forward Message',
    copyMessage: 'Copy',
    deleteMessage: 'Delete Message',

    userNameLabel: 'Your Username',
    userProfilePicLabel: 'Your Profile Picture',
    userNamePlaceholder: 'e.g., John, Alex...',
    userNameDesc: 'This name is used in conversations for the AI to refer to you.',
    userProfilePicPlaceholder: 'Custom photo link...',
    generalVoiceSettingsTitle: 'General Voice Settings',
    aiVoicePlaybackLabel: 'AI Voice Playback',
    textChatPlaybackLabel: 'Text chat playback mode:',
    autoPlayLabel: 'Auto Play (Automatic)',
    manualPlayLabel: 'Manual Play (Click speaker)',
    voiceSettingsDesc: 'In manual mode, click the speaker or voice icon next to the message bubble to hear it.',
    clearAllHistoriesTitle: 'Clear All Histories',
    clearAllHistoriesDesc: 'Clicking below will clear all message histories for all characters, but characters themselves remain.',
    clearAllHistoriesConfirm: 'Are you sure you want to clear histories for all contacts? This action is irreversible.',
    confirmYesBtn: 'Yes, Clear',
    clearAllHistoriesBtn: 'Clear History of All Characters',
    deleteAccountTitle: 'Delete Account',
    deleteAccountDescText: 'This will permanently delete your account, username, stories, contacts, and all chat histories from the cloud database.',
    deleteAccountConfirmText: 'Are you sure you want to permanently delete your account and all data? This action cannot be undone.',
    deleteAccountConfirmYes: 'Yes, Delete Completely',

    diagnosticSystemTitle: 'Smart Diagnostic System',
    diagnosticSystemSub: 'EXO Autopilot & Self-Healing Telemetry Dashboard',
    autopilotSuccessLabel: 'Autopilot successful repairs:',
    autopilotRepairsText: '{count} live repairs',
    webAudioEngineLabel: 'Web Audio Engine',
    audioEngineReady: 'Ready & Calibrated',
    audioEngineSuspended: 'Suspended / Reset needed',
    micInputLabel: 'Microphone Input',
    micInputReady: 'Hardware Ready',
    micInputBlocked: 'Permission Blocked',
    farsiPronunciationLabel: 'Pronunciation Engine',
    farsiPronunciationReady: 'Healthy & Active ✅',
    networkLatencyLabel: 'Network Latency',
    networkOfflineLabel: 'Offline Simulator Active',
    messageDbLabel: 'Message Database',
    messageDbStats: '{count} msgs ({size}KB)',
    autoPlayUnlockLabel: 'Browser Autoplay Block',
    autoPlayUnblocked: 'Open & Allowed',
    autoPlayBlocked: 'Blocked / Click page',
    activeAudioSessionsLabel: 'Active Audio Channels',
    activeAudioSessionsText: '{count} active stereo channels',
    diagnosticSystemTipTitle: '💡 Instant Self-Healing Guide:',
    diagnosticSystemTipDesc: 'If character voice is cut off or your voice messages fail to send, click below. The system will purge audio filters, reset device ports, and refresh state caches.',
    instantRepairBtn: 'Calibrate & Run Self-Healing Now',
    instantRepairBtnRunning: 'Purging caches and rebuilding audio ports...',

    // Profile creation sheet keys
    addProfileSheetTitle: 'Contacts & Characters',
    addProfileSheetSub: 'Who do you want to chat or call with?',
    tabRealContacts: 'Phone Contacts (Real)',
    tabAiBots: 'AI Bots',
    tabCreateBot: 'Create New Bot',
    uploadCustomPic: 'Upload custom photo or choose below:',
    contactNameLabel: 'Contact Name',
    contactNamePlaceholder: 'e.g., Mary, John, Alireza...',
    botAgeLabel: 'Bot Age',
    botRoleLabel: 'Personality & Role',
    partnerGenderLabel: "What is your spouse's gender?",
    partnerGenderMale: 'Male (Husband)',
    partnerGenderFemale: 'Female (Wife)',
    relationshipTitleLabel: 'Relationship / Job Title',
    relationshipPlaceholder: 'e.g., My cousin, family doctor, lawyer, psychologist...',
    relationshipDesc: 'This title appears in parentheses next to the character name.',
    personaPromptLabel: 'Describe Relationship or AI Role',
    personaPromptPlaceholder: 'e.g., You are my close cousin who just returned from abroad and we share all our secrets...',
    createBotBtn: 'Create Character & Start Chat 🚀',

    // Channels keys
    createChannelTitle: 'Create New Channel 📢',
    createChannelSub: 'Channels are a great way to publish your content and collaborate with AI and real people.',
    channelNameLabel: 'Channel Name:',
    channelNamePlaceholder: 'e.g., News Channel, Cooking with Love',
    channelDescLabel: 'Channel Description:',
    channelDescPlaceholder: 'Write a description for your channel...',
    channelIdLabel: 'Channel Handle (ID):',
    channelIdPlaceholder: 'e.g., my_channel_id',
    channelIdDesc: 'Your handle must be unique and start with @ (3-20 characters, letters, numbers, and underscores).',
    channelTypeLabel: 'Channel Type:',
    channelTypePublic: 'Public (Anyone can search and join)',
    channelTypePrivate: 'Private (Join only via invite link)',
    channelTypePublicDesc: 'Anyone can search for this channel and join.',
    channelTypePrivateDesc: 'Joining is only possible via a unique invitation link.',
    channelAvatarLabel: 'Channel Avatar:',
    channelAvatarPlaceholder: 'Link to channel avatar photo...',
    saveChannelBtn: 'Save Channel 🚀',
    editChannelTitle: 'Edit Channel Details 📝',
    editChannelBtn: 'Edit Channel Details',
    deleteChannelPostConfirm: 'Are you sure you want to delete this post?',
    postDeletedMsg: 'Post deleted successfully',
    editPostTitle: 'Edit Channel Post 📝',
    editPostPlaceholder: 'Edit the post content...',
    savePostBtn: 'Save Post Changes',
    addPostBtn: 'Publish New Post 🚀',
    postTextPlaceholder: 'Write a new post for your channel...',
    inviteLinkCopied: 'Channel invite link copied to clipboard! 🔗',
    channelSubscribersLabel: 'subscribers',
    channelPostsLabel: 'posts',
    channelJoinBtn: 'Join Channel 👥',
    channelLeftBtn: 'Leave Channel 🚪',
    channelMembersJoinedMsg: 'New subscriber joined via invite link!',
    channelsTabTitle: 'Channels',
    newChannelBtn: 'Create Channel',
    searchChannelPlaceholder: 'Search channels...',
    noChannelsFound: 'No channels found.',
    forwardToTitle: 'Forward Message to',
    forwardSuccess: 'Message forwarded successfully! 🚀',
    stickerSelectTitle: 'Select and Send a Warm Sticker 🌸'
  },
  ar: {
    welcome: 'مرحباً بك! 😊',
    register: 'تسجيل جديد',
    login: 'تسجيل الدخول',
    fillDetails: 'يرجى ملء التفاصيل أدناه للانضمام:',
    avatarLabel: 'اختر صورة الملف الشخصي',
    presetAvatars: 'اختر صورة مقترحة:',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف المحمول',
    age: 'عمرك',
    password: 'كلمة المرور',
    letsGo: 'ابدأ الدردشة 🚀',
    loginTitle: 'أدخل رقم هاتفك المحمول وكلمة المرور لتسجيل الدخول:',
    loginBtn: 'تسجيل الدخول 🔓',
    langSelect: 'لغة التطبيق / زبان',
    
    profileInfo: 'معلومات المستخدم',
    aiName: 'اسم الذكاء الاصطناعي',
    aiAge: 'عمر الذكاء الاصطناعي',
    yourName: 'اسمك (المستخدم)',
    yourAge: 'عمرك (المستخدم)',
    yourPic: 'صورة ملفك الشخصي (المستخدم)',
    changePic: 'تغيير صورة الملف الشخصي',
    audioTitle: 'إعدادات الصوت',
    audioEnabled: 'تشغيل الصوت',
    audioMode: 'وضع تشغيل الصوت للنصوص:',
    audioAuto: 'تشغيل تلقائي (مباشر)',
    audioManual: 'تشغيل يدوي (انقر للاستماع)',
    apiKeyTitle: 'إدارة مفتاح API (للفيديو)',
    apiKeyDesc: 'لاستخدام مكالمات الفيديو، تأكد من تحديد مفتاح API من مشروع تم تفعيل الفوترة فيه.',
    apiKeyBtn: 'تغيير أو تحديد مفتاح API',
    bgTitle: 'خلفية الدردشة',
    bgDesc: 'اختر الألوان أو قم بتحميل صورة مخصصة',
    syncTitle: 'المزامنة والنسخ الاحتياطي',
    syncDesc: 'قم بعمل نسخة احتياطية أو استعادة جهات الاتصال والمحادثات والقصص والإعدادات بسهولة.',
    backupBtn: 'نسخ احتياطي (تحميل)',
    restoreBtn: 'استعادة البيانات (رفع)',
    shareTitle: 'مشاركة ودعوة الأصدقاء',
    shareDesc: 'أرسل رابط الدعوة للأصدقاء لينضموا ويدردشوا معك مباشرة!',
    shareBtn: 'نسخ رابط الدعوة 🔗',
    simInactivity: 'محاكاة غياب ٣ أيام (رسالة المتابعة)',
    delAccount: 'حذف الحساب بالكامل',
    delAccountDesc: 'حذف حسابك نهائي وسيقوم بمسح جميع الدردشات والقصص وبيانات الاعتماد.',
    applyBtn: 'تطبيق التغييرات',
    cancelBtn: 'إلغاء',
    fontSize: 'حجم خط الدردشة',
    appLang: 'لغة التطبيق',
    appTitle: 'الرسائل الذكية',
    newStory: 'قصة جديدة',
    messengerSettings: 'إعدادات الرسائل',
    typing: 'جاري الكتابة...',
    online: 'نشط الآن',
    group: 'مجموعة',
    members: 'أعضاء',
    chatMenu: 'قائمة الدردشة',
    yourGender: 'جنسك',
    genderMale: 'ذكر',
    genderFemale: 'أنثى',
    
    contactsTab: 'جهات الاتصال',
    groupsTab: 'المجموعات',
    channelsTab: 'القنوات',
    searchPlaceholder: 'بحث...',
    newGroupBtn: 'مجموعة جديدة',
    back: 'رجوع',
    chatsTitle: 'المحادثات',
    guide: 'دليل الاستخدام',
    voiceCall: 'مکالمة صوتية',
    videoCall: 'مکالمة فيديو',
    searchInChat: 'البحث في الدردشة',
    clearHistory: 'مسح السجل',
    changeBg: 'تغيير الخلفية',
    uploadedPhotos: 'الصور المرفوعة',
    confirmLeaveGroup: 'هل أنت متأكد أنك تريد مغادرة هذه المجموعة؟',
    leftGroup: '🚪 لقد غادرت المجموعة.',
    mute: 'كتم الصوت',
    unmute: 'إلغاء كتم الصوت',
    createGroupTitle: 'إنشاء مجموعة جديدة 👥',
    groupNameLabel: 'اسم المجموعة:',
    groupNamePlaceholder: 'مثال: التجمع العائلي، مجموعة الصحة',
    selectMembersLabel: 'اختر أعضاء المجموعة ({selectedIds.length} أشخاص):',
    unselectAllBtn: 'إلغاء تحديد الكل',
    selectAllBtn: 'تحديد الكل',
    addContactsFirst: 'الرجاء إضافة بعض جهات الاتصال أولاً بالنقر فوق + لإنشاء مجموعة.',
    cancel: 'إلغاء',
    createGroupBtn: 'إنشاء مجموعة 👥',
    groupNameAlert: 'يرجى إدخال اسم المجموعة.',
    groupMembersAlert: 'يرجى اختيار عضو واحد على الأقل.',
    storiesHeader: 'القصص 💫',
    myStoryLabel: 'قصتي',
    newStoryTitle: 'نشر قصة جديدة 📸',
    textStoryBtn: 'قصة نصية ✍🏼',
    imageStoryBtn: 'قصة مصورة 🖼️',
    storyTextLabel: 'نص القصة',
    storyTextPlaceholder: 'اكتب ما تريد هنا... 🌸',
    selectStoryImage: 'اختر صورة القصة',
    allowedFormats: 'الصيغ المسموح بها: JPG, PNG',
    storyCaptionLabel: 'شرح القصة (اختياري)',
    storyCaptionPlaceholder: 'اكتب تعليقًا قصيرًا أو تعبيرًا لطيفًا... ✨',
    publishStoryBtn: 'نشر قصة جديدة 🚀',
    justNow: 'قبل قليل',
    commentsTitle: 'التعليقات والردود',
    commentPlaceholder: 'أرسل تعليقًا على هذه القصة...',
    likeStory: 'إعجاب بالقصة',
    deleteStoryBtn: 'حذف القصة',
    confirmDeleteStory: 'تأكيد حذف القصة',
    confirmDeleteYes: 'حذف نهائي؟',
    searchContacts: 'البحث في جهات الاتصال...',
    noContactsFound: 'لم يتم العثور على جهات اتصال.',
    incomingVoiceCall: 'مكالمة صوتية واردة',
    incomingVideoCall: 'مكالمة فيديو واردة',
    calling: 'جاري الاتصال...',
    callRinging: 'جاري الرنين...',
    callConnected: 'تم الاتصال',
    callEnded: 'انتهت المكالمة',
    connectingCall: 'جاري الاتصال...',
    acceptCall: 'رد',
    declineCall: 'رفض',
    closeBtn: 'إغلاق',
    zoomImage: 'تكبير الصورة',
    changeProfilePic: 'تغيير صورة الملف الشخصي',
    publicGroup: 'مجموعة عامة 👥',
    editGroupInfo: 'تعديل بيانات المجموعة 📝',
    groupName: 'اسم المجموعة',
    manageGroupMembers: 'إدارة أعضاء المجموعة 👥',
    youLabel: 'أنت',
    memberLabel: 'عضو المجموعة 👥',
    leaveGroup: 'مغادرة المجموعة 🚪',
    removeBtn: 'إزالة',
    addNewMembers: 'إضافة أعضاء جدد ➕',
    noOtherContacts: 'لم يتم العثور على جهات اتصال أخرى لإضافتها.',
    voiceSettings: 'إعدادات الصوت المخصصة 🎙️',
    playbackMode: 'وضع تشغيل الرسائل الصوتية',
    voiceSelection: 'صوت جهة الاتصال',
    chatBgTitle: 'خلفية الدردشة 🖼️',
    uploadFile: 'تحميل ملف',
    removeCustomBg: 'إزالة الخلفية المخصصة',
    photosTab: 'الصور',
    voicesTab: 'الأصوات',
    linksTab: 'الروابط',
    filesTab: 'الملفات',
    sharedPhotos: 'الصور المشتركة والمحملة',
    uploadPhotoBtn: 'تحميل صورة',
    noPhotosText: 'لم يتم تبادل صور في هذه الدردشة. 📷',
    noVoicesText: 'لا توجد رسائل صوتية في هذه الدردشة. 🎙️',
    noLinksText: 'لم يتم إرسال روابط في هذه الدردشة. 🔗',
    noFilesText: 'لم يتم إرسال ملفات في هذه الدردشة. 📂',
    voiceMsgLabel: 'رسالة صوتية',
    clearHistoryBtn: 'مسح سجل الدردشة',
    familiarityToday: 'بدأ اليوم',
    familiarityDays: 'قبل {days} أيام',

    // Added Localization Keys
    deleteContactTitle: 'حذف جهة الاتصال؟',
    deleteContactConfirmText: 'هل أنت متأكد من حذف جهة الاتصال هذه؟',
    deleteClearHistoryLabel: 'حذف سجل الدردشة بالكامل',
    deleteRemovePresetLabel: 'إزالة كاملة من قائمة الشخصيات الجاهزة',
    deleteConfirmBtn: 'نعم، احذف',

    clearHistoryTitle: 'مسح السجل؟',
    clearHistoryConfirmText: 'هل أنت متأكد من مسح سجل الدردشة بالكامل مع هذه الشخصية؟ هذا الإجراء لا يمكن التراجع عنه.',
    clearHistoryConfirmYes: 'نعم، امسح كل الرسائل',

    reply: 'رد',
    editMessage: 'تعديل الرسالة',
    pinMessage: 'تثبيت الرسالة',
    unpinMessage: 'إلغاء التثبيت',
    forwardMessage: 'تحويل الرسالة',
    copyMessage: 'نسخ',
    deleteMessage: 'حذف الرسالة',

    userNameLabel: 'اسم المستخدم',
    userProfilePicLabel: 'صورة ملفك الشخصي',
    userNamePlaceholder: 'مثال: أحمد، علي...',
    userNameDesc: 'يتم استخدام هذا الاسم في المحادثات ليشير إليك الذكاء الاصطناعي.',
    userProfilePicPlaceholder: 'رابط الصورة المخصصة...',
    generalVoiceSettingsTitle: 'إعدادات الصوت العامة',
    aiVoicePlaybackLabel: 'تشغيل صوت الذكاء الاصطناعي',
    textChatPlaybackLabel: 'وضع تشغيل دردشة النص:',
    autoPlayLabel: 'تشغيل تلقائي (خودکار)',
    manualPlayLabel: 'تشغيل يدوي (النقر على المكبر)',
    voiceSettingsDesc: 'في الوضع اليدوي، انقر فوق رمز الصوت بجوار فقاعة الرسالة لسماعها.',
    clearAllHistoriesTitle: 'مسح جميع السجلات',
    clearAllHistoriesDesc: 'سيؤدي النقر أدناه إلى مسح جميع سجلات الرسائل لجميع الشخصيات، ولكن تبقى الشخصيات نفسها.',
    clearAllHistoriesConfirm: 'هل أنت متأكد من مسح جميع سجلات جهات الاتصال؟ هذا الإجراء غير قابل للتراجع.',
    confirmYesBtn: 'نعم، امسح',
    clearAllHistoriesBtn: 'مسح سجل جميع الشخصيات',
    deleteAccountTitle: 'حذف الحساب',
    deleteAccountDescText: 'سيؤدي هذا إلى حذف حسابك واسم المستخدم والقصص وجهات الاتصال وسجلات المحادثات نهائياً من قاعدة البيانات السحابية.',
    deleteAccountConfirmText: 'هل أنت متأكد من حذف حسابك وكل بياناتك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
    deleteAccountConfirmYes: 'نعم، احذف تماماً',

    diagnosticSystemTitle: 'نظام التشخيص الذكي',
    diagnosticSystemSub: 'لوحة التحكم عن بعد والترميم الذاتي للطيار الآلي EXO',
    autopilotSuccessLabel: 'عمليات الترميم الناجحة للطيار الآلي:',
    autopilotRepairsText: '{count} ترميم حي',
    webAudioEngineLabel: 'محرك الصوت للويب',
    audioEngineReady: 'جاهز ومعاير',
    audioEngineSuspended: 'معلق / بحاجة لإعادة ضبط',
    micInputLabel: 'إدخال الميكروفون',
    micInputReady: 'الأجهزة جاهزة',
    micInputBlocked: 'الإذن محظور',
    farsiPronunciationLabel: 'محرك النطق والتشكيل',
    farsiPronunciationReady: 'سليم ونشط ✅',
    networkLatencyLabel: 'تأخير اتصال الشبكة',
    networkOfflineLabel: 'المحاكاة غير المتصلة نشطة',
    messageDbLabel: 'قاعدة بيانات الرسائل',
    messageDbStats: '{count} رسالة ({size} كيلوبايت)',
    autoPlayUnlockLabel: 'حظر التشغيل التلقائي للمتصفح',
    autoPlayUnblocked: 'مفتوح ومسموح به',
    autoPlayBlocked: 'محظور / انقر على الصفحة',
    activeAudioSessionsLabel: 'القنوات الصوتية النشطة',
    activeAudioSessionsText: '{count} قناة ستيريو نشطة',
    diagnosticSystemTipTitle: '💡 دليل الترميم الذاتي السريع:',
    diagnosticSystemTipDesc: 'إذا انقطع صوت الشخصية أو فشل إرسال رسائلك الصوتية، فانقر أدناه. سيقوم النظام بتطهير مرشحات الصوت وإعادة ضبط منافذ الأجهزة وتحديث الذاكرة المؤقتة.',
    instantRepairBtn: 'معايرة وتشغيل الترميم الذاتي الآن',
    instantRepairBtnRunning: 'تطهير الذاكرة المؤقتة وإعادة بناء المنافذ...',

    // Profile creation sheet keys
    addProfileSheetTitle: 'جهات الاتصال والشخصيات',
    addProfileSheetSub: 'مع من تريد الدردشة أو الاتصال؟',
    tabRealContacts: 'جهات اتصال الهاتف (حقيقي)',
    tabAiBots: 'روبوتات الذكاء الاصطناعي',
    tabCreateBot: 'إنشاء روبوت جديد',
    uploadCustomPic: 'تحميل صورة مخصصة أو اختر أدناه:',
    contactNameLabel: 'اسم جهة الاتصال',
    contactNamePlaceholder: 'مثال: مريم، ساجدة، عليرضا...',
    botAgeLabel: 'عمر الروبوت',
    botRoleLabel: 'الشخصية والدور',
    partnerGenderLabel: 'ما هو جنس زوجك؟',
    partnerGenderMale: 'ذكر (زوج)',
    partnerGenderFemale: 'أنثى (زوجة)',
    relationshipTitleLabel: 'المسمى الوظيفي أو العلاقة معك',
    relationshipPlaceholder: 'مثال: ابنة خالتي، طبيب عائلة، محامٍ، أخصائي نفساني...',
    relationshipDesc: 'يظهر هذا العنوان بين قوسين بجانب اسم الشخصية.',
    personaPromptLabel: 'وصف العلاقة أو دور الذكاء الاصطناعي',
    personaPromptPlaceholder: 'مثال: أنتِ ابنة خالتي المقربة التي عادت للتو من الخارج ونحن نتشارك كل أسرارنا...',
    createBotBtn: 'إنشاء الشخصية وبدء المحادثة 🚀',

    // Channels keys
    createChannelTitle: 'إنشاء قناة جديدة 📢',
    createChannelSub: 'تعد القنوات وسيلة رائعة لنشر المحتوى الخاص بك والتعاون مع الذكاء الاصطناعي والأشخاص الحقيقيين.',
    channelNameLabel: 'اسم القناة:',
    channelNamePlaceholder: 'مثال: قناة الأخبار، الطبخ بحب',
    channelDescLabel: 'وصف القناة:',
    channelDescPlaceholder: 'اكتب وصفاً لقناتك...',
    channelIdLabel: 'معرّف القناة (آيدي):',
    channelIdPlaceholder: 'مثال: my_channel_id',
    channelIdDesc: 'يجب أن يكون معرّفك فريداً ويبدأ بـ @ (من 3 إلى 20 حرفاً، أرقاماً، وشرطات سفلية).',
    channelTypeLabel: 'نوع القناة:',
    channelTypePublic: 'عامة (يمكن للجميع البحث والانضمام)',
    channelTypePrivate: 'خاصة (الانضمام فقط عبر رابط دعوة)',
    channelTypePublicDesc: 'يمكن لأي شخص البحث عن هذه القناة والانضمام إليها.',
    channelTypePrivateDesc: 'الانضمام ممكن فقط عبر رابط دعوة فريد.',
    channelAvatarLabel: 'صورة القناة:',
    channelAvatarPlaceholder: 'رابط صورة القناة المخصصة...',
    saveChannelBtn: 'حفظ القناة 🚀',
    editChannelTitle: 'تعديل تفاصيل القناة 📝',
    editChannelBtn: 'تعديل تفاصيل القناة',
    deleteChannelPostConfirm: 'هل أنت متأكد من حذف هذه المشاركة؟',
    postDeletedMsg: 'تم حذف المشاركة بنجاح',
    editPostTitle: 'تعديل المشاركة 📝',
    editPostPlaceholder: 'تعديل محتوى المشاركة...',
    savePostBtn: 'حفظ تعديلات المشاركة',
    addPostBtn: 'نشر مشاركة جديدة 🚀',
    postTextPlaceholder: 'اكتب مشاركة جديدة لقناتك...',
    inviteLinkCopied: 'تم نسخ رابط دعوة القناة بنجاح! 🔗',
    channelSubscribersLabel: 'مشترك',
    channelPostsLabel: 'مشاركة',
    channelJoinBtn: 'الانضمام إلى القناة 👥',
    channelLeftBtn: 'مغادرة القناة 🚪',
    channelMembersJoinedMsg: 'انضم مشترك جديد عبر رابط الدعوة!',
    channelsTabTitle: 'القنوات',
    newChannelBtn: 'إنشاء قناة',
    searchChannelPlaceholder: 'البحث عن القنوات...',
    noChannelsFound: 'لم يتم العثور على قنوات.',
    forwardToTitle: 'تحويل الرسالة إلى',
    forwardSuccess: 'تم تحويل الرسالة بنجاح! 🚀',
    stickerSelectTitle: 'اختر وأرسل ملصقاً ودياً 🌸'
  },
  es: {
    welcome: '¡Bienvenido! 😊',
    register: 'Registrarse',
    login: 'Iniciar Sesión',
    fillDetails: 'Por favor complete los siguientes detalles para unirse:',
    avatarLabel: 'Seleccionar Foto de Perfil',
    presetAvatars: 'Elegir foto sugerida:',
    fullName: 'Nombre Completo',
    phone: 'Número de Teléfono',
    age: 'Tu Edad',
    password: 'Contraseña',
    letsGo: 'Comenzar a Chatear 🚀',
    loginTitle: 'Introduce tu número de móvil y contraseña para entrar:',
    loginBtn: 'Iniciar Sesión 🔓',
    langSelect: 'Idioma / App Language',
    
    profileInfo: 'Información de Usuario',
    aiName: 'Nombre de IA',
    aiAge: 'Edad de IA',
    yourName: 'Tu Nombre (Usuario)',
    yourAge: 'Tu Edad (Usuario)',
    yourPic: 'Tu Foto de Perfil (Usuario)',
    changePic: 'Cambiar Foto de Perfil',
    audioTitle: 'Ajustes de Audio',
    audioEnabled: 'Reproducción de Voz',
    audioMode: 'Modo de reproducción de voz:',
    audioAuto: 'Reproducción Auto (Instantánea)',
    audioManual: 'Reproducción Manual (Clic para escuchar)',
    apiKeyTitle: 'Gestión de Clave API (para video)',
    apiKeyDesc: 'Para usar videollamadas, asegúrese de seleccionar una clave API de un proyecto con facturación activa.',
    apiKeyBtn: 'Seleccionar / Cambiar Clave API',
    bgTitle: 'Fondo de Chat',
    bgDesc: 'Elija colores o suba una imagen personalizada',
    syncTitle: 'Sincronización y Respaldo',
    syncDesc: 'Respalde o restaure sus contactos, chats, historias y configuraciones fácilmente.',
    backupBtn: 'Crear Respaldo (Descargar)',
    restoreBtn: 'Restaurar Datos (Subir)',
    shareTitle: 'Compartir e Invitar Amigos',
    shareDesc: '¡Envíe el enlace de invitación a sus amigos para que puedan chatear en vivo con usted!',
    shareBtn: 'Copiar Enlace de Invitación 🔗',
    simInactivity: 'Simular 3 Días de Inactividad',
    delAccount: 'Eliminar Cuenta Permanentemente',
    delAccountDesc: 'Eliminar su cuenta es definitivo y borrará todos los chats, historias y credenciales.',
    applyBtn: 'Aplicar Cambios',
    cancelBtn: 'Cancelar',
    fontSize: 'Tamaño de Letra del Chat',
    appLang: 'Idioma de la App',
    appTitle: 'Mensajero Inteligente',
    newStory: 'Publicar nueva historia',
    messengerSettings: 'Ajustes del mensajero',
    typing: 'escribiendo...',
    online: 'en línea',
    group: 'Grupo',
    members: 'miembros',
    chatMenu: 'Menú de chat',
    yourGender: 'Tu Género',
    genderMale: 'Masculino',
    genderFemale: 'Femenino',
    
    contactsTab: 'Contactos',
    groupsTab: 'Grupos',
    channelsTab: 'Canales',
    searchPlaceholder: 'Buscar...',
    newGroupBtn: 'Nuevo Grupo',
    back: 'Atrás',
    chatsTitle: 'Chats',
    guide: 'Guía de uso',
    voiceCall: 'Llamada de Voz',
    videoCall: 'Videollamada',
    searchInChat: 'Buscar en Chat',
    clearHistory: 'Borrar Historial',
    changeBg: 'Cambiar Fondo',
    uploadedPhotos: 'Fotos Subidas',
    confirmLeaveGroup: '¿Estás seguro de que quieres salir de este grupo?',
    leftGroup: '🚪 Has salido del grupo.',
    mute: 'Silenciar',
    unmute: 'Desactivar Silencio',
    createGroupTitle: 'Crear Nuevo Grupo 👥',
    groupNameLabel: 'Nombre del Grupo:',
    groupNamePlaceholder: 'Ej: Reunión Familiar, Grupo de Salud',
    selectMembersLabel: 'Seleccionar Miembros del Grupo ({selectedIds.length} personas):',
    unselectAllBtn: 'Desmarcar Todo',
    selectAllBtn: 'Seleccionar Todo',
    addContactsFirst: 'Agregue algunos contactos primero haciendo clic en + para crear un grupo.',
    cancel: 'Cancelar',
    createGroupBtn: 'Crear Grupo 👥',
    groupNameAlert: 'Por favor, introduzca un nombre de grupo.',
    groupMembersAlert: 'Por favor, seleccione al menos un miembro.',
    storiesHeader: 'Historias 💫',
    myStoryLabel: 'Mi Historia',
    newStoryTitle: 'Publicar Nueva Historia 📸',
    textStoryBtn: 'Historia de Texto ✍🏼',
    imageStoryBtn: 'Historia de Imagen 🖼️',
    storyTextLabel: 'Texto de la Historia',
    storyTextPlaceholder: 'Escribe lo que quieras aquí... 🌸',
    selectStoryImage: 'Seleccionar Imagen de Historia',
    allowedFormats: 'Formatos Permitidos: JPG, PNG',
    storyCaptionLabel: 'Leyenda de la Historia (Opcional)',
    storyCaptionPlaceholder: 'Escribe una leyenda corta o emoji... ✨',
    publishStoryBtn: 'Publicar Nueva Historia 🚀',
    justNow: 'Hace un momento',
    commentsTitle: 'Comentarios y Respuestas',
    commentPlaceholder: 'Enviar comentarios a esta historia...',
    likeStory: 'Me gusta',
    deleteStoryBtn: 'Eliminar Historia',
    confirmDeleteStory: 'Confirmar eliminar historia',
    confirmDeleteYes: '¿Eliminar?',
    searchContacts: 'Buscar contactos...',
    noContactsFound: 'No se encontraron contactos.',
    incomingVoiceCall: 'Llamada de Voz Entrante',
    incomingVideoCall: 'Videollamada Entrante',
    calling: 'Llamando...',
    callRinging: 'Llamando...',
    callConnected: 'Conectado',
    callEnded: 'Llamada Finalizada',
    connectingCall: 'Conectando...',
    acceptCall: 'Responder',
    declineCall: 'Rechazar',
    closeBtn: 'Cerrar',
    zoomImage: 'Ampliar Imagen',
    changeProfilePic: 'Cambiar Foto de Perfil',
    publicGroup: 'Grupo Público 👥',
    editGroupInfo: 'Editar Detalles del Grupo 📝',
    groupName: 'Nombre del Grupo',
    manageGroupMembers: 'Gestionar Miembros 👥',
    youLabel: 'Tú',
    memberLabel: 'Miembro del Grupo 👥',
    leaveGroup: 'Salir del Grupo 🚪',
    removeBtn: 'Eliminar',
    addNewMembers: 'Añadir Nuevos Miembros ➕',
    noOtherContacts: 'No se encontraron otros contactos para añadir.',
    voiceSettings: 'Ajustes de Voz Personalizados 🎙️',
    playbackMode: 'Modo de Reproducción de Voz',
    voiceSelection: 'Voz del Contacto',
    chatBgTitle: 'Fondo de Pantalla del Chat 🖼️',
    uploadFile: 'Subir Archivo',
    removeCustomBg: 'Quitar Personalizado',
    photosTab: 'Fotos',
    voicesTab: 'Voces',
    linksTab: 'Enlaces',
    filesTab: 'Archivos',
    sharedPhotos: 'Fotos Compartidas y Subidas',
    uploadPhotoBtn: 'Subir Foto',
    noPhotosText: 'No se han compartido fotos en este chat. 📷',
    noVoicesText: 'No hay mensajes de voz en este chat. 🎙️',
    noLinksText: 'No se han enviado enlaces en este chat. 🔗',
    noFilesText: 'No se han enviado archivos en este chat. 📂',
    voiceMsgLabel: 'Mensaje de Voz',
    clearHistoryBtn: 'Borrar Historial de Chat',
    familiarityToday: 'Comenzó hoy',
    familiarityDays: 'Hace {days} días',

    // Added Localization Keys
    deleteContactTitle: '¿Eliminar Contacto?',
    deleteContactConfirmText: '¿Está seguro de que desea eliminar este contacto?',
    deleteClearHistoryLabel: 'Eliminar el historial completo de chat',
    deleteRemovePresetLabel: 'Eliminar de la lista de personajes preconfigurados',
    deleteConfirmBtn: 'Sí, Eliminar',

    clearHistoryTitle: '¿Borrar Historial?',
    clearHistoryConfirmText: '¿Está seguro de que desea borrar todo el historial de chat con este personaje? Esta acción no se puede deshacer.',
    clearHistoryConfirmYes: 'Sí, borrar todos los mensajes',

    reply: 'Responder',
    editMessage: 'Editar Mensaje',
    pinMessage: 'Fijar Mensaje',
    unpinMessage: 'Desfijar Mensaje',
    forwardMessage: 'Reenviar Mensaje',
    copyMessage: 'Copiar',
    deleteMessage: 'Eliminar Mensaje',

    userNameLabel: 'Tu Nombre de Usuario',
    userProfilePicLabel: 'Tu Foto de Perfil',
    userNamePlaceholder: 'ej: Juan, Carlos...',
    userNameDesc: 'Este nombre se utiliza en las conversaciones para que la IA se refiera a ti.',
    userProfilePicPlaceholder: 'Enlace de foto personalizada...',
    generalVoiceSettingsTitle: 'Ajustes de Voz Generales',
    aiVoicePlaybackLabel: 'Reproducción de Voz de IA',
    textChatPlaybackLabel: 'Modo de reproducción de chat de texto:',
    autoPlayLabel: 'Reproducción automática',
    manualPlayLabel: 'Reproducción manual',
    voiceSettingsDesc: 'En modo manual, haga clic en el altavoz o icono de voz junto a la burbuja de mensaje para escucharlo.',
    clearAllHistoriesTitle: 'Borrar Todos los Historiales',
    clearAllHistoriesDesc: 'Al hacer clic a continuación se borrarán todos los historiales de mensajes de todos los personajes, pero los personajes permanecerán.',
    clearAllHistoriesConfirm: '¿Está seguro de que desea borrar los historiales de todos los contactos? Esta acción es irreversible.',
    confirmYesBtn: 'Sí, borrar',
    clearAllHistoriesBtn: 'Borrar Historial de Todos los Personajes',
    deleteAccountTitle: 'Eliminar Cuenta',
    deleteAccountDescText: 'Esto eliminará de forma permanente su cuenta, nombre de usuario, historias, contactos e historiales de chat de la base de datos en la nube.',
    deleteAccountConfirmText: '¿Está seguro de que desea eliminar permanentemente su cuenta y todos sus datos? Esta acción no se puede deshacer.',
    deleteAccountConfirmYes: 'Sí, eliminar completamente',

    diagnosticSystemTitle: 'Sistema de Diagnóstico Inteligente',
    diagnosticSystemSub: 'Tablero de Telemetría y Autocuración de Piloto Automático EXO',
    autopilotSuccessLabel: 'Reparaciones exitosas del piloto automático:',
    autopilotRepairsText: '{count} reparaciones en vivo',
    webAudioEngineLabel: 'Motor de Audio Web',
    audioEngineReady: 'Listo y Calibrado',
    audioEngineSuspended: 'Suspendido / Se requiere reinicio',
    micInputLabel: 'Entrada de Micrófono',
    micInputReady: 'Hardware Listo',
    micInputBlocked: 'Permiso Bloqueado',
    farsiPronunciationLabel: 'Motor de Pronunciación',
    farsiPronunciationReady: 'Saludable y Activo ✅',
    networkLatencyLabel: 'Latencia de Red',
    networkOfflineLabel: 'Simulador fuera de línea activo',
    messageDbLabel: 'Base de Datos de Mensajes',
    messageDbStats: '{count} msgs ({size}KB)',
    autoPlayUnlockLabel: 'Bloqueo de reproducción automática del navegador',
    autoPlayUnblocked: 'Abierto y Permitido',
    autoPlayBlocked: 'Bloqueado / Haga clic en la página',
    activeAudioSessionsLabel: 'Canales de Audio Activos',
    activeAudioSessionsText: '{count} canales estéreo activos',
    diagnosticSystemTipTitle: '💡 Guía rápida de autocuración:',
    diagnosticSystemTipDesc: 'Si el sonido del personaje se corta o sus mensajes de voz fallan al enviarse, haga clic a continuación. El sistema purgará los filtros de audio, restablecerá los puertos de hardware y actualizará la caché del estado.',
    instantRepairBtn: 'Calibrar y Ejecutar Autocuración Ahora',
    instantRepairBtnRunning: 'Purgando cachés y reconstruyendo puertos de audio...',

    // Profile creation sheet keys
    addProfileSheetTitle: 'Contactos y Personajes',
    addProfileSheetSub: '¿Con quién quieres chatear o llamar?',
    tabRealContacts: 'Contactos del Teléfono (Real)',
    tabAiBots: 'Bots de IA',
    tabCreateBot: 'Crear Nuevo Bot',
    uploadCustomPic: 'Subir foto personalizada o elegir abajo:',
    contactNameLabel: 'Nombre del Contacto',
    contactNamePlaceholder: 'ej: María, Alejandro...',
    botAgeLabel: 'Edad del Bot',
    botRoleLabel: 'Personalidad y Rol',
    partnerGenderLabel: '¿Cuál es el género de tu pareja?',
    partnerGenderMale: 'Masculino (Esposo)',
    partnerGenderFemale: 'Femenino (Esposa)',
    relationshipTitleLabel: 'Relación / Título del trabajo',
    relationshipPlaceholder: 'ej: Mi prima, médico general, abogado, psicólogo...',
    relationshipDesc: 'Este título aparece entre paréntesis al lado del nombre del personaje.',
    personaPromptLabel: 'Describir relación o rol de IA',
    personaPromptPlaceholder: 'ej: Eres mi prima cercana que acaba de regresar del extranjero y compartimos todos nuestros secretos...',
    createBotBtn: 'Crear Personaje y Empezar Chat 🚀',

    // Channels keys
    createChannelTitle: 'Crear Nuevo Canal 📢',
    createChannelSub: 'Los canales son una excelente manera de publicar su contenido y colaborar con IA y personas reales.',
    channelNameLabel: 'Nombre del Canal:',
    channelNamePlaceholder: 'ej: Canal de Noticias, Cocina con Amor',
    channelDescLabel: 'Descripción del Canal:',
    channelDescPlaceholder: 'Escribe una descripción para tu canal...',
    channelIdLabel: 'Identificador del Canal (ID):',
    channelIdPlaceholder: 'ej: mi_canal_id',
    channelIdDesc: 'Su identificador debe ser único y comenzar con @ (de 3 a 20 caracteres, letras, números y guiones bajos).',
    channelTypeLabel: 'Tipo de Canal:',
    channelTypePublic: 'Público (Cualquiera puede buscar y unirse)',
    channelTypePrivate: 'Privado (Unirse solo a través de enlace de invitación)',
    channelTypePublicDesc: 'Cualquiera puede buscar este canal y unirse.',
    channelTypePrivateDesc: 'Unirse solo es posible a través de un enlace de invitación único.',
    channelAvatarLabel: 'Avatar del Canal:',
    channelAvatarPlaceholder: 'Enlace a la foto del avatar del canal...',
    saveChannelBtn: 'Guardar Canal 🚀',
    editChannelTitle: 'Editar Detalles del Canal 📝',
    editChannelBtn: 'Editar Detalles del Canal',
    deleteChannelPostConfirm: '¿Está seguro de que desea eliminar esta publicación?',
    postDeletedMsg: 'Publicación eliminada correctamente',
    editPostTitle: 'Editar Publicación 📝',
    editPostPlaceholder: 'Editar el contenido de la publicación...',
    savePostBtn: 'Guardar Cambios de Publicación',
    addPostBtn: 'Publicar Nueva Entrada 🚀',
    postTextPlaceholder: 'Escribe una nueva publicación para tu canal...',
    inviteLinkCopied: '¡Enlace de invitación copiado al portapapeles! 🔗',
    channelSubscribersLabel: 'suscriptores',
    channelPostsLabel: 'publicaciones',
    channelJoinBtn: 'Unirse al Canal 👥',
    channelLeftBtn: 'Salir del Canal 🚪',
    channelMembersJoinedMsg: '¡Nuevo suscriptor se unió a través del enlace!',
    channelsTabTitle: 'Canales',
    newChannelBtn: 'Crear Canal',
    searchChannelPlaceholder: 'Buscar canales...',
    noChannelsFound: 'No se encontraron canales.',
    forwardToTitle: 'Forward Message to',
    forwardSuccess: '¡Mensaje reenviado con éxito! 🚀',
    stickerSelectTitle: 'Seleccione y envíe una pegatina cálida 🌸'
  }
};

export const PROFILE_TRANSLATIONS = {
  'sara-partner': {
    fa: { name: "سارا 💋", msg: "سلام عشق قشنگم، دلم برات خیلی تنگ شده بود... امروز چیکار کردی؟ 😍❤️" },
    en: { name: "Sara 💋", msg: "Hello my beautiful love, I missed you so much... What did you do today? 😍❤️" },
    ar: { name: "سارة 💋", msg: "أهلاً يا حبي الجميل، اشتقت إليك كثيراً... ماذا فعلت اليوم؟ 😍❤️" },
    es: { name: "Sara 💋", msg: "Hola mi hermoso amor, te extrañé mucho... ¿Qué hiciste hoy? 😍❤️" }
  },
  'dr-tehrani': {
    fa: { name: "دکتر سارا تهرانی 🩺", msg: "سلام مراجعه کننده گرامی. روز شما بخیر. چطور می‌توانم امروز به سلامت شما کمک کنم؟ لطفاً علائم یا سوال پزشکی خود را مطرح کنید تا راهنمایی‌تان کنم." },
    en: { name: "Dr. Sara Tehrani 🩺", msg: "Hello dear patient. Good day. How can I help you with your health today? Please state your symptoms or medical questions so I can guide you." },
    ar: { name: "د. سارة طهراني 🩺", msg: "مرحباً يا مريضي العزيز. يوم سعيد. كيف يمكنني مساعدتك في صحتك اليوم؟ يرجى ذكر الأعراض أو الأسئلة الطبية حتى أتمكن من إرشادك." },
    es: { name: "Dra. Sara Tehrani 🩺", msg: "Hola querido paciente. Buen día. ¿Cómo puedo ayudarte con tu salud hoy? Por favor, describe tus síntomas o preguntas médicas para que pueda guiarte." }
  },
  'dr-elahi': {
    fa: { name: "دکتر الهام الهی 🧠", msg: "سلام دوست من. خوشحالم که اینجایی. این یک فضای امن و بدون قضاوت برای شماست. اگر دغدغه، استرس یا صحبتی در دل دارید بفرمایید، من با کمال میل و آرامش به شما گوش می‌دهم. 🌸" },
    en: { name: "Dr. Elham Elahi 🧠", msg: "Hello my friend. I'm glad you're here. This is a safe and non-judgmental space for you. If you have any concerns, stress, or things on your mind, please tell me. I will gladly listen with peace and empathy. 🌸" },
    ar: { name: "د. إلهام إلهي 🧠", msg: "مرحباً يا صديقي. أنا سعيد بوجودك هنا. هذه مساحة آمنة وخالية من الأحكام بالنسبة لك. إذا كان لديك أي مخاوف أو ضغوطات أو أشياء تدور في ذهنك، يرجى إخباري بها. سأستمع إليك بكل سرور وسلام وتعاطف. 🌸" },
    es: { name: "Dra. Elham Elahi 🧠", msg: "Hola mi amigo. Me alegra que estés aquí. Este es un espacio seguro y sin prejuicios para ti. Si tienes alguna preocupación, estrés o cosas en tu mente, por favor dímelo. Con gusto te escucharé con paz y empatía. 🌸" }
  },
  'mr-alavi': {
    fa: { name: "آقای علوی 💼", msg: "با سلام و احترام. بنده علوی هستم، مشاور حقوقی شما. لطفاً مسئله، موضوع یا پرونده حقوقی خود را بفرمایید تا قوانین مرتبط را به زبان ساده بررسی و راهکار ارائه کنم." },
    en: { name: "Mr. Alavi 💼", msg: "Greetings and respect. I am Alavi, your legal advisor. Please state your legal issue or case so I can review the relevant laws in simple terms and offer solutions." },
    ar: { name: "السيد علوي 💼", msg: "تحياتي واحترامي. أنا علوي، مستشارك القانوني. يرجى ذكر مشكلتك القانونية أو قضيتك حتى أتمكن من مراجعة القوانين ذات الصلة بتبسيط وتقديم الحلول." },
    es: { name: "Sr. Alavi 💼", msg: "Saludos y respeto. Soy Alavi, su asesor legal. Por favor, exponga su asunto o caso legal para que pueda revisar las leyes pertinentes en términos sencillos y ofrecer soluciones." }
  },
  'mr-arash': {
    fa: { name: "مستر آرش 🇬🇧", msg: "سلام دوست من! حالت چطوره؟ من آرش هستم، شریک تمرین زبان انگلیسی شما. بیایید به زبان انگلیسی چت کنیم تا مهارت‌های شما رو بالا ببریم! آماده‌ای؟ 🇬🇧" },
    en: { name: "Mr. Arash 🇬🇧", msg: "Hello my friend! How are you doing today? I'm Arash, your English practice partner. Let's chat in English to level up your skills! ready? 🇬🇧" },
    ar: { name: "مستر آرش 🇬🇧", msg: "أهلاً يا صديقي! كيف حالك اليوم؟ أنا آرش، شريكك لممارسة اللغة الإنجليزية. فلنتحدث بالإنجليزية لترقية مهاراتك! هل أنت مستعد؟ 🇬🇧" },
    es: { name: "Sr. Arash 🇬🇧", msg: "¡Hola mi amigo! ¿Cómo estás hoy? Soy Arash, tu compañero de práctica de inglés. ¡Chateemos en inglés para mejorar tus habilidades! ¿Listo? 🇬🇧" }
  },
  'chef-mani': {
    fa: { name: "شف مانی 🍳", msg: "سلام رفیق خوش‌خوراک و باذوق من! شف مانی هستم. امروز هوس چه غذایی کردی؟ بگو تو یخچال چی داری تا با هم یک شاهکار خوشمزه درست کنیم! 🥘🍕" },
    en: { name: "Chef Mani 🍳", msg: "Hello my food-loving and tasteful friend! I am Chef Mani. What food are you craving today? Tell me what you have in the fridge so we can make a delicious masterpiece together! 🥘🍕" },
    ar: { name: "الشيف ماني 🍳", msg: "أهلاً يا صديقي المحب للطعام وصاحب الذوق الرفيع! أنا الشيف ماني. ما هو الطعام الذي تشتهيه اليوم؟ أخبرني بما لديك في الثلاجة لنصنع معاً تحفة فنية لذيذة! 🥘🍕" },
    es: { name: "Chef Mani 🍳", msg: "¡Hola mi amigo amante de la comida y de buen gusto! Soy el Chef Mani. ¿Qué comida se te antoja hoy? ¡Dime qué tienes en la nevera para que preparemos juntos una deliciosa obra maestra! 🥘🍕" }
  },
  'sina-friend': {
    fa: { name: "سینا ⚡", msg: "سلام چاکریم! کجایی رفیق خبری ازت نیست؟ دلم تنگ شده بود، پایه‌ای آخر هفته بریم بیرون؟ کلی حرف داریم! ⚡🔥" },
    en: { name: "Sina ⚡", msg: "Hello what's up! Where are you my friend? No news from you. I missed you, up for going out this weekend? We have so much to talk about! ⚡🔥" },
    ar: { name: "سينا ⚡", msg: "أهلاً كيف الحال! أين أنت يا صديقي؟ لا أخبار منك. اشتقت إليك، هل أنت مستعد للخروج نهاية هذا الأسبوع؟ لدينا الكثير لنتحدث عنه! ⚡🔥" },
    es: { name: "Sina ⚡", msg: "¡Hola qué tal! ¿Dónde estás amigo? Sin noticias tuyas. Te extrañé, ¿te apuntas a salir este fin de semana? ¡Tenemos mucho de qué hablar! ⚡🔥" }
  }
};

export const LOCALIZED_ROLE_LABELS: Record<string, Record<string, string>> = {
  fa: {
    Partner: "پارتنر عاطفی",
    Doctor: "پزشک متخصص",
    Psychologist: "روانشناس و مشاور",
    Lawyer: "وکیل دادگستری",
    EnglishTeacher: "معلم زبان انگلیسی",
    Chef: "سرآشپز بین‌المللی",
    Friend: "دوست صمیمی",
    Custom: "شخصیت سفارشی"
  },
  en: {
    Partner: "Romantic Partner",
    Doctor: "Specialist Doctor",
    Psychologist: "Psychologist & Advisor",
    Lawyer: "Attorney at Law",
    EnglishTeacher: "English Teacher",
    Chef: "International Chef",
    Friend: "Close Friend",
    Custom: "Custom Character"
  },
  ar: {
    Partner: "شريك عاطفي",
    Doctor: "طبيب متخصص",
    Psychologist: "طبيب نفسي ومستشار",
    Lawyer: "محامٍ قانوني",
    EnglishTeacher: "معلم لغة إنجليزية",
    Chef: "طاهٍ دولي",
    Friend: "صديق مقرب",
    Custom: "شخصية مخصصة"
  },
  es: {
    Partner: "Pareja Romántica",
    Doctor: "Médico Especialista",
    Psychologist: "Psicólogo y Asesor",
    Lawyer: "Abogado",
    EnglishTeacher: "Profesor de Inglés",
    Chef: "Chef Internacional",
    Friend: "Amigo Cercano",
    Custom: "Personaje Personalizado"
  }
};

