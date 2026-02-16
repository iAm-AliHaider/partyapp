export type Locale = "en" | "ur";

export const translations = {
  en: {
    // Common
    back: "← Back",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    search: "Search",
    noResults: "No results found",
    
    // Landing
    landing: {
      tagline: "Power of the people, government of the people",
      naSeats: "NA Seats",
      paSeats: "PA Seats",
      members: "Members",
      joinNow: "Join Now",
      signIn: "Sign In",
      foundedBy: "Founded by Iqrar Ul Hassan",
    },

    // Auth
    auth: {
      signInTitle: "Sign In",
      welcome: "Welcome back",
      phoneNumber: "Phone Number",
      password: "Password",
      enterPassword: "Enter your password",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid phone number or password",
      noAccount: "Don't have an account?",
      register: "Register",
      joinTitle: "Join the Party",
      step: "Step",
      of: "of",
    },

    // Registration
    register: {
      fullName: "Full Name",
      enterName: "Enter your full name",
      cnic: "CNIC Number",
      phone: "Phone Number",
      createPassword: "Create a password",
      next: "Next →",
      selectConstituency: "Select Your Constituency",
      constituencyHelp: "This determines your ranking area",
      searchPlaceholder: "🔍 Search by code or name...",
      constituencies: "constituencies",
      clear: "✕ Clear",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      email: "Email (optional)",
      optional: "optional",
      residentialStatus: "Residential Status",
      resident: "Resident Pakistani",
      overseas: "Overseas Pakistani",
      referralCode: "Referral Code",
      joining: "Joining...",
      joinParty: "Join Party",
    },

    // Home / Dashboard
    home: {
      welcome: "Welcome",
      dashboard: "Dashboard",
      yourRank: "Your Rank",
      yourScore: "Your Score",
      referrals: "Referrals",
      totalMembers: "Total Members",
      quickActions: "Quick Actions",
      shareCode: "Share Code",
      inviteMembers: "Invite members",
      leaderboard: "Leaderboard",
      checkRankings: "Check rankings",
      tasks: "Tasks",
      campaigns: "Campaigns",
      profile: "Profile",
      editDetails: "Edit details",
      constituencyNotAssigned: "Constituency not assigned",
    },

    // Bottom Nav
    nav: {
      home: "Home",
      tasks: "Tasks",
      refer: "Refer",
      rank: "Rank",
      profile: "Profile",
    },

    // Profile
    profile: {
      title: "Profile",
      personalInfo: "Personal Information",
      name: "Name",
      cnic: "CNIC",
      phone: "Phone",
      email: "Email",
      gender: "Gender",
      constituency: "Constituency",
      status: "Status",
      joined: "Joined",
      editProfile: "✏️ Edit Profile",
      adminPanel: "🛠️ Admin Panel",
      signOut: "Sign Out",
      saving: "Saving...",
    },

    // Referrals
    referral: {
      title: "Your Referrals",
      yourCode: "Your Referral Code",
      copyLink: "📋 Copy Link",
      copied: "✅ Copied!",
      whatsapp: "📱 WhatsApp",
      breakdown: "Referral Breakdown",
      direct: "Direct Referrals",
      pointsEach: "points each",
      level2: "2nd Level",
      level3: "3rd Level",
      activeBonus: "Active Bonus",
      perActive: "+3 per active member",
      totalScore: "Total Score",
      recentReferrals: "Recent Referrals",
      noReferrals: "No referrals yet. Share your code to get started!",
      shareMessage: "🇵🇰 Join Pakistan Awaam Raaj Tehreek!\n\nBe part of the democratic revolution. Join using my referral:",
    },

    // Rankings
    rankings: {
      title: "Rankings",
      myConstituency: "My Constituency",
      national: "National",
      selectConstituency: "Select Constituency",
      noRankings: "No rankings yet",
      rankingsComputed: "Rankings are computed when members join",
      selectToView: "Select a constituency to view rankings",
    },

    // Tasks
    tasks: {
      title: "📋 My Tasks",
      subtitle: "Campaign activities & assignments",
      active: "Active",
      completed: "Completed",
      noTasks: "No tasks",
      tasksAppearHere: "Tasks assigned to you will appear here",
      allCampaigns: "🏛️ All Active Campaigns",
      totalTasks: "total tasks",
      done: "done",
      tasks: "tasks",
      areas: "areas",
    },

    // Notifications
    notifications: {
      title: "Notifications",
      markAllRead: "Mark all read",
      noNotifications: "No notifications yet",
      notifiedAbout: "You'll be notified about referrals, rank changes, and more",
    },
  },

  ur: {
    // Common
    back: "← واپس",
    save: "محفوظ کریں",
    cancel: "منسوخ",
    loading: "لوڈ ہو رہا ہے...",
    search: "تلاش کریں",
    noResults: "کوئی نتیجہ نہیں ملا",

    // Landing
    landing: {
      tagline: "عوام کی طاقت، عوام کی حکومت",
      naSeats: "قومی نشستیں",
      paSeats: "صوبائی نشستیں",
      members: "ارکان",
      joinNow: "رکن بنیں",
      signIn: "سائن ان",
      foundedBy: "بانی: اقرار الحسن",
    },

    // Auth
    auth: {
      signInTitle: "سائن ان",
      welcome: "خوش آمدید",
      phoneNumber: "فون نمبر",
      password: "پاسورڈ",
      enterPassword: "اپنا پاسورڈ درج کریں",
      signingIn: "سائن ان ہو رہا ہے...",
      invalidCredentials: "غلط فون نمبر یا پاسورڈ",
      noAccount: "اکاؤنٹ نہیں ہے؟",
      register: "رکن بنیں",
      joinTitle: "پارٹی میں شامل ہوں",
      step: "مرحلہ",
      of: "از",
    },

    // Registration
    register: {
      fullName: "پورا نام",
      enterName: "اپنا پورا نام درج کریں",
      cnic: "شناختی کارڈ نمبر",
      phone: "فون نمبر",
      createPassword: "پاسورڈ بنائیں",
      next: "اگلا →",
      selectConstituency: "اپنا حلقہ منتخب کریں",
      constituencyHelp: "یہ آپ کی درجہ بندی کا علاقہ ہے",
      searchPlaceholder: "🔍 کوڈ یا نام سے تلاش کریں...",
      constituencies: "حلقے",
      clear: "✕ صاف",
      age: "عمر",
      gender: "جنس",
      male: "مرد",
      female: "عورت",
      other: "دیگر",
      email: "ای میل (اختیاری)",
      optional: "اختیاری",
      residentialStatus: "رہائشی حیثیت",
      resident: "مقیم پاکستانی",
      overseas: "بیرون ملک پاکستانی",
      referralCode: "ریفرل کوڈ",
      joining: "شامل ہو رہے ہیں...",
      joinParty: "رکن بنیں 🌙",
    },

    // Home / Dashboard
    home: {
      welcome: "خوش آمدید",
      dashboard: "ڈیش بورڈ",
      yourRank: "آپ کی درجہ بندی",
      yourScore: "آپ کا اسکور",
      referrals: "ریفرلز",
      totalMembers: "کل ارکان",
      quickActions: "فوری اقدامات",
      shareCode: "کوڈ شیئر کریں",
      inviteMembers: "ارکان کو مدعو کریں",
      leaderboard: "لیڈر بورڈ",
      checkRankings: "درجہ بندی دیکھیں",
      tasks: "کام",
      campaigns: "مہمات",
      profile: "پروفائل",
      editDetails: "تفصیلات میں ترمیم",
      constituencyNotAssigned: "حلقہ تفویض نہیں ہوا",
    },

    // Bottom Nav
    nav: {
      home: "ہوم",
      tasks: "کام",
      refer: "ریفر",
      rank: "رینک",
      profile: "پروفائل",
    },

    // Profile
    profile: {
      title: "پروفائل",
      personalInfo: "ذاتی معلومات",
      name: "نام",
      cnic: "شناختی کارڈ",
      phone: "فون",
      email: "ای میل",
      gender: "جنس",
      constituency: "حلقہ",
      status: "حیثیت",
      joined: "شمولیت",
      editProfile: "✏️ پروفائل میں ترمیم",
      adminPanel: "🛠️ ایڈمن پینل",
      signOut: "سائن آؤٹ",
      saving: "محفوظ ہو رہا ہے...",
    },

    // Referrals
    referral: {
      title: "آپ کے ریفرلز",
      yourCode: "آپ کا ریفرل کوڈ",
      copyLink: "📋 لنک کاپی کریں",
      copied: "✅ کاپی ہو گیا!",
      whatsapp: "📱 واٹس ایپ",
      breakdown: "ریفرل تفصیلات",
      direct: "براہ راست ریفرلز",
      pointsEach: "پوائنٹس فی ریفرل",
      level2: "دوسرا درجہ",
      level3: "تیسرا درجہ",
      activeBonus: "ایکٹو بونس",
      perActive: "+3 فی ایکٹو رکن",
      totalScore: "کل اسکور",
      recentReferrals: "حالیہ ریفرلز",
      noReferrals: "ابھی کوئی ریفرل نہیں۔ شروع کرنے کے لیے کوڈ شیئر کریں!",
      shareMessage: "🇵🇰 پاکستان عوام راج تحریک میں شامل ہوں!\n\nجمہوری انقلاب کا حصہ بنیں۔ میرے ریفرل سے شامل ہوں:",
    },

    // Rankings
    rankings: {
      title: "درجہ بندی",
      myConstituency: "میرا حلقہ",
      national: "قومی",
      selectConstituency: "حلقہ منتخب کریں",
      noRankings: "ابھی کوئی درجہ بندی نہیں",
      rankingsComputed: "ارکان کی شمولیت پر درجہ بندی ہوتی ہے",
      selectToView: "درجہ بندی دیکھنے کے لیے حلقہ منتخب کریں",
    },

    // Tasks
    tasks: {
      title: "📋 میرے کام",
      subtitle: "مہم کی سرگرمیاں اور تفویضات",
      active: "فعال",
      completed: "مکمل",
      noTasks: "کوئی کام نہیں",
      tasksAppearHere: "آپ کو تفویض کردہ کام یہاں نظر آئیں گے",
      allCampaigns: "🏛️ تمام فعال مہمات",
      totalTasks: "کل کام",
      done: "مکمل",
      tasks: "کام",
      areas: "علاقے",
    },

    // Notifications
    notifications: {
      title: "اطلاعات",
      markAllRead: "سب پڑھی ہوئی",
      noNotifications: "ابھی کوئی اطلاع نہیں",
      notifiedAbout: "ریفرلز، درجہ بندی کی تبدیلیوں اور مزید کے بارے میں مطلع کیا جائے گا",
    },
  },
} as const;

type DeepStringify<T> = { [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string; };
export type TranslationKeys = DeepStringify<typeof translations.en>;

export function t(locale: Locale, path: string): string {
  const keys = path.split(".");
  let result: any = translations[locale];
  for (const key of keys) {
    result = result?.[key];
  }
  return result || path;
}
