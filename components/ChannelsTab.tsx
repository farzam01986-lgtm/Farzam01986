import React, { useState, useEffect, useRef } from 'react';
import { Channel, ChannelPost, ChannelComment, ChatProfile, ChatSettings } from '../types';
import { translations } from '../src/translations';

interface ChannelsTabProps {
  profiles: ChatProfile[];
  settings: ChatSettings;
  activeLang: 'fa' | 'en' | 'ar' | 'es';
  onChannelSelectStateChange?: (isActive: boolean) => void;
}

// Pre-defined high quality multi-lingual posts and configurations per career
const LOCALIZED_CHANNELS_DATA: Record<string, Record<'fa' | 'en' | 'ar' | 'es', {
  name: string;
  description: string;
  posts: { text: string; image: string }[];
}>> = {
  'channel-dr-tehrani': {
    fa: {
      name: 'کانال تخصصی تندرستی و سلامت 🩺',
      description: 'آخرین یافته‌های علمی پزشکی، پاسخ به سوالات متداول سلامت، رژیم‌های غذایی سالم و توصیه‌های خودمراقبتی برای داشتن زندگی باکیفیت‌تر.',
      posts: [
        {
          text: "🩺 **توصیه مهم روز: با کمبود ویتامین D چه کنیم؟**\n\nویتامین D نقش بسیار حیاتی در جذب کلسیم، سلامت استخوان‌ها و تقویت سیستم ایمنی بدن دارد. متأسفانه بیش از ۷۰ درصد جامعه با سطوح مختلف کمبود این ویتامین مواجه هستند.\n\n💡 **علائم اصلی کمبود ویتامین D:**\n۱. احساس خستگی مداوم و بی‌حالی\n۲. دردهای مبهم استخوانی و ماهیچه‌ای\n۳. ضعف سیستم ایمنی و سرماخوردگی‌های مکرر\n۴. ریزش مو و تغییرات خلق‌وخو\n\n☀️ **راه‌حل چیست؟**\nسعی کنید روزانه ۱۰ الی ۱۵ دقیقه در معرض نور مستقیم خورشید (بدون ضدآفتاب روی دست‌ها و پاها) قرار بگیرید. مصرف ماهی‌های چرب، زرده تخم‌مرغ و قارچ نیز کمک‌کننده است. اما در صورت کمبود شدید، مصرف مکمل تحت نظر پزشک الزامی است.",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💧 **آب بنوشید، حتی اگر تشنه نیستید!**\n\nبسیاری از سردردها، خستگی‌های مفرط و مشکلات گوارشی ناشی از کم‌آبی پنهان بدن هستند. سلول‌های مغزی ما برای عملکرد بهینه به هیدراتاسیون مداوم نیاز دارند.\n\n🍋 یک قاچ لیمو یا چند برگ نعناع به آب اضافه کنید تا طعم بهتری بگیرد و انگیزه شما برای نوشیدن آب بیشتر شود.",
          image: "https://images.unsplash.com/photo-1548839130-3fd0a2e10119?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Specialized Health & Wellness Channel 🩺',
      description: 'Latest scientific medical findings, answers to common health questions, healthy diets, and self-care recommendations for a higher quality life.',
      posts: [
        {
          text: "🩺 **Important Tip of the Day: How to handle Vitamin D deficiency?**\n\nVitamin D plays a critical role in calcium absorption, bone health, and boosting the immune system. Unfortunately, over 70% of people face varying levels of Vitamin D deficiency.\n\n💡 **Key Symptoms of Vitamin D deficiency:**\n1. Persistent fatigue and low energy\n2. Vague bone and muscle pain\n3. Weakened immunity and frequent colds\n4. Hair loss and mood swings\n\n☀️ **What is the solution?**\nTry to spend 10 to 15 minutes daily in direct sunlight (without sunscreen on hands and legs). Eating fatty fish, egg yolks, and mushrooms also helps. However, in cases of severe deficiency, taking supplements under medical supervision is necessary.",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💧 **Drink water, even if you are not thirsty!**\n\nMany headaches, chronic fatigue, and digestive issues stem from hidden dehydration. Our brain cells require constant hydration to function optimally.\n\n🍋 Add a slice of lemon or a few mint leaves to your water to improve the taste and motivate yourself to drink more.",
          image: "https://images.unsplash.com/photo-1548839130-3fd0a2e10119?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة الصحة والعافية التخصصية 🩺',
      description: 'أحدث الاكتشافات الطبية العلمية، الإجابة على الأسئلة الصحية الشائعة، الأنظمة الغذائية الصحية، وتوصيات الرعاية الذاتية لحياة أفضل.',
      posts: [
        {
          text: "🩺 **نصيحة اليوم الهامة: كيف نتعامل مع نقص فيتامين د؟**\n\nيلعب فيتامين د دوراً حيوياً في امتصاص الكالسيوم وصحة العظام وتقوية جهاز المناعة. للأسف، يعاني أكثر من 70% من المجتمع من نقص هذا الفيتامين بدرجات متفاوتة.\n\n💡 **الأعراض الرئيسية لنقص فيتامين د:**\n1. الشعور بالتعب المستمر والخمول\n2. آلام غامضة في العظام والعضلات\n3. ضعف جهاز المناعة ونزلات البرد المتكررة\n4. تساقط الشعر وتقلب المزاج\n\n☀️ **ما هو الحل؟**\nحاول قضاء 10 إلى 15 دقيقة يومياً تحت أشعة الشمس المباشرة (دون واقي شمس على اليدين والساقين). تناول الأسماك الدهنية وصفار البيض والفطر يساعد أيضاً. ولكن في حالة النقص الشديد، فإن تناول المكملات الغذائية تحت إشراف طبي أمر ضروري.",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💧 **اشرب الماء، حتى لو لم تكن عطشانًا!**\n\nالكثير من الصداع والتعب المفرط ومشاكل الجهاز الهضمي ناتجة عن الجفاف الخفي في الجسم. تحتاج خلايا الدماغ إلى ترطيب مستمر للعمل بكفاءة.\n\n🍋 أضف شريحة من الليمون أو بعض أوراق النعناع إلى الماء لتحسين طعمه وتحفيز نفسك على شرب المزيد.",
          image: "https://images.unsplash.com/photo-1548839130-3fd0a2e10119?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Canal Especializado en Salud y Bienestar 🩺',
      description: 'Últimos descubrimientos médicos científicos, respuestas a preguntas de salud frecuentes, dietas saludables y recomendaciones de autocuidado para una vida de mejor calidad.',
      posts: [
        {
          text: "🩺 **Consejo importante del día: ¿Qué hacer con la deficiencia de Vitamina D?**\n\nLa vitamina D juega un papel crucial en la absorción de calcio, la salud de los huesos y el fortalecimiento del sistema inmunológico. Desafortunadamente, más del 70% de la población sufre niveles de deficiencia.\n\n💡 **Síntomas principales de deficiencia de Vitamina D:**\n1. Fatiga constante y debilidad\n2. Dolores difusos en huesos y músculos\n3. Inmunidad debilitada y resfriados frecuentes\n4. Pérdida de cabello y cambios de humor\n\n☀️ **¿Cuál es la solución?**\nIntente pasar de 10 a 15 minutos diarios bajo la luz solar directa (sin protector solar en manos y piernas). Consumir pescados grasos, yemas de huevo y champiñones también ayuda. Sin embargo, en casos de deficiencia severa, es necesario tomar suplementos bajo supervisión médica.",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💧 **¡Beba agua, incluso si no tiene sed!**\n\nMuchos dolores de cabeza, fatiga extrema y problemas digestivos son causados por deshidratación oculta. Nuestras células cerebrales necesitan hidratación constante para funcionar de manera óptima.\n\n🍋 Añada una rodaja de limón o unas hojas de menta al agua para darle mejor sabor y motivarse a beber más.",
          image: "https://images.unsplash.com/photo-1548839130-3fd0a2e10119?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-dr-elahi': {
    fa: {
      name: 'کانال آرامش ذهن و خودشناسی 🧠',
      description: 'همراه شما در مسیر خودآگاهی، غلبه بر استرس، بهبود روابط عاطفی و پرورش آرامش درونی با متدهای روز روانشناسی.',
      posts: [
        {
          text: "🧠 **چگونه نشخوار ذهنی را متوقف کنیم؟**\n\nنشخوار ذهنی (Overthinking) یعنی تکرار مداوم افکار منفی و نگرانی‌ها درباره گذشته یا آینده در ذهن، بدون رسیدن به هیچ راه‌حل عملی.\n\n🛠️ **تکنیک ۵ دقیقه‌ای برای رهایی:**\n\n۱. **پذیرش بدون قضاوت:** به خود بگویید: «من الان دچار افکار تکراری شده‌ام» و با خودتان نجنگید.\n۲. **قانون ۵-۴-۳-۲-۱:** به اطراف نگاه کنید و ۵ چیز را ببینید، ۴ چیز را لمس کنید، ۳ صدا را بشنوید، ۲ بو را حس کنید و ۱ طعم را بچشید. این تمرین فوراً شما را به لحظه حال برمی‌گرداند.\n۳. **برگه تخلیه ذهن:** تمام افکار مزاحم را روی کاغذ بنویسید و سپس آن کاغذ را مچاله کرده و دور بیندازید تا ذهن سیگنال پایان دریافت کند.",
          image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🌸 **خودت را ببخش...**\n\nتو در گذشته بر اساس دانش، تجربه و شرایطی که داشتی بهترین تصمیم ممکن را گرفتی. سرزنش کردن امروزت برای اشتباهات دیروز، فقط انرژی حال حاضرت را هدر می‌دهد. با خودت مثل صمیمی‌ترین دوستت مهربان باش. ❤️",
          image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Mind Peace & Self-Discovery 🧠',
      description: 'Accompanying you on the path of self-awareness, stress management, relationship improvement, and nurturing inner peace.',
      posts: [
        {
          text: "🧠 **How to stop Overthinking?**\n\nOverthinking means repeating negative thoughts and worries about the past or future. Here is a 5-minute technique to break free:\n\n1. **Acceptance without judgment:** Say to yourself, 'I am overthinking,' and stop fighting it.\n2. **The 5-4-3-2-1 rule:** Look around and see 5 things, touch 4 things, hear 3 sounds, smell 2 things, and taste 1 thing. This immediately anchors you to the present.\n3. **Mind dump page:** Write all disturbing thoughts on a piece of paper, crumple it, and throw it away.",
          image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🌸 **Forgive yourself...**\n\nYou made the best decision you could based on the knowledge, experience, and circumstances you had in the past. Be kind to yourself, just like you would be to your best friend. ❤️",
          image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة سلامة العقل واكتشاف الذات 🧠',
      description: 'مرافقتك في طريق الوعي الذاتي، وإدارة التوتر، وتحسين العلاقات، ورعاية السلام الداخلي.',
      posts: [
        {
          text: "🧠 **كيف نوقف الاجترار الفكري؟**\n\nالاجترار الفكري (تجاوز التفكير) هو تكرار الأفكار السلبية والقلق بشأن الماضي أو المستقبل. تقنية من 5 دقائق للتخلص منه:\n\n1. **القبول دون حكم:** قل لنفسك، \"أنا الآن أعاني من أفكار متكررة\" وتوقف عن محاربتها.\n2. **قاعدة 5-4-3-2-1:** انظر حولك وحدد 5 أشياء تراها، 4 أشياء تلمسها، 3 أصوات تسمعها، رائحتين تشمهما، وطعمًا واحدًا تتذوقه. هذا يعيدك للحاضر فوراً.\n3. **ورقة تفريغ الذهن:** اكتب جميع الأفكار المزعجة على ورقة، ثم قم بتمزيقها ورميها.",
          image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🌸 **سامح نفسك...**\n\nلقد اتخذت أفضل قرار ممكن بناءً على المعرفة والخبرة والظروف التي مررت بها في الماضي. كن لطيفاً مع نفسك كما ستكون مع أفضل صديق لك. ❤️",
          image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Paz Mental y Autodescubrimiento 🧠',
      description: 'Acompañándote en el camino del autoconocimiento, manejo del estrés, mejora de relaciones y cultivo de la paz interior.',
      posts: [
        {
          text: "🧠 **¿Cómo detener el pensamiento rumiativo?**\n\nRumiación (pensar demasiado) es repetir constantemente pensamientos negativos y preocupaciones. Técnica de 5 minutos para liberarte:\n\n1. **Aceptación sin juzgar:** Dite a ti mismo 'Estoy rumiando pensamientos' y no luches contra ti mismo.\n2. **Regla del 5-4-3-2-1:** Mira a tu alrededor y ve 5 cosas, toca 4 cosas, escucha 3 sonidos, huele 2 cosas y saborea 1 cosa. Esto te trae al presente de inmediato.\n3. **Hoja de descarga mental:** Escribe todos los pensamientos molestos en un papel, arrúgalo y tíralo.",
          image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🌸 **Perdónate a ti mismo...**\n\nTomas la mejor decisión posible basada en el conocimiento, la experiencia y las circunstancias que tenías en el pasado. Sé amable contigo mismo, al igual que lo serías con tu mejor amigo. ❤️",
          image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-mr-alavi': {
    fa: {
      name: 'کانال راهکار حقوقی و قوانین عدل ⚖️',
      description: 'تحلیل ساده قوانین مدنی، نکات بسیار کاربردی قراردادها، چک، سفته، ارث و مشاوره‌های حقوقی برای کارهای روزمره شما.',
      posts: [
        {
          text: "⚖️ **نکات حقوقی طلایی قبل از امضای هرگونه قرارداد ملکی**\n\nبسیاری از پرونده‌های قضایی در دادگاه‌ها ناشی از بی‌توجهی به جزئیات کوچک در زمان نوشتن مبایعه‌نامه یا اجاره‌نامه است.\n\n📌 **همیشه این موارد را چک کنید:**\n\n۱. **احراز هویت دقیق:** حتماً شناسنامه و کارت ملی طرف مقابل را با مشخصات مندرج در سند مالکیت تطبیق دهید.\n۲. **بررسی وضعیت سند:** مطمئن شوید ملک در رهن بانک نباشد یا توسط مراجع قضایی توقیف نشده باشد.\n۳. **حق فسخ صریح:** شرایط فسخ قرارداد و جریمه دیرکرد تحویل ملک یا پرداخت مبالغ را با عدد دقیق بنویسید.\n۴. **حضور شهود:** قرارداد حتماً باید توسط دو شاهد معتمد امضا و اثر انگشت زده شود.",
          image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📝 **آیا سفته بدون تاریخ ارزش قانونی دارد؟**\n\nبله، سفته بدون تاریخ حواله به رویت تلقی می‌شود و دارنده آن می‌تواند هر زمان که بخواهد تاریخ بگذارد و اقدام قانونی کند. اما برای محکم‌کاری، همیشه سفته ضمانتی را با نوشتن عبارت «بابت ضمانت حسن انجام کار» مقید کنید تا جلوی سوءاستفاده‌های احتمالی گرفته شود.",
          image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Legal Solutions & Justice Channel ⚖️',
      description: 'Simple analysis of civil laws, highly practical tips on contracts, promissory notes, inheritance, and legal advice.',
      posts: [
        {
          text: "⚖️ **Golden legal tips before signing any real estate contract**\n\nMany lawsuits stem from neglecting small details when writing agreements.\n\n📌 **Always check these:**\n1. **Accurate verification:** Cross-check the other party's ID with the ownership title.\n2. **Property status:** Ensure the property is not mortgaged or seized.\n3. **Cancellation clauses:** Clearly define termination conditions and delay penalties.\n4. **Witnesses:** The contract must be signed by at least two trustworthy witnesses.",
          image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📝 **Is an undated promissory note legally valid?**\n\nYes, an undated promissory note is considered demandable on sight. However, for maximum security, always write the purpose clearly, such as 'for performance guarantee', to prevent any potential misuse.",
          image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة الحلول القانونية والعدالة ⚖️',
      description: 'تحليل مبسط للقوانين المدنية، نصائح عملية حول العقود، الكمبيالات، الميراث، والاستشارات القانونية لروتينك اليومي.',
      posts: [
        {
          text: "⚖️ **نصائح قانونية ذهبية قبل توقيع أي عقد عقاري**\n\nالعديد من الدعاوى القضائية تنشأ من إهمال التفاصيل الصغيرة عند كتابة الاتفاقيات.\n\n📌 **تحقق دائماً من التالي:**\n1. **التحقق الدقيق من الهوية:** مطابقة الهوية الشخصية للطرف الآخر مع صك الملكية.\n2. **حالة العقار:** التأكد من أن العقار ليس مرهوناً أو محجوزاً.\n3. **شروط الفسخ:** تحديد شروط الفسخ وغرامات التأخير بوضوح.\n4. **الشهود:** يجب توقيع العقد من قبل شاهدين موثوقين.",
          image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📝 **هل السند لأمر بدون تاريخ له قيمة قانونية؟**\n\nنعم، يعتبر السند لأمر بدون تاريخ مستحق الوفاء لدى الاطلاع. ومع ذلك، لضمان الأمان الأقصى، اكتب دائماً الغرض بوضوح، مثل \"لضمان حسن الأداء\" لمنع أي سوء استخدام محتمل.",
          image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Soluciones Legales y Canal de Justicia ⚖️',
      description: 'Análisis sencillo de leyes civiles, consejos prácticos sobre contratos, pagarés, herencias y asesoría jurídica.',
      posts: [
        {
          text: "⚖️ **Consejos legales de oro antes de firmar cualquier contrato inmobiliario**\n\nMuchas demandas surgen por descuidar pequeños detalles al redactar acuerdos.\n\n📌 **Verifique siempre estos puntos:**\n1. **Verificación precisa:** Compare la identificación de la otra parte con el título de propiedad.\n2. **Estado de la propiedad:** Asegúrese de que la propiedad no esté hipotecada o embargada.\n3. **Cláusulas de rescisión:** Defina claramente las condiciones de rescisión y las del de demora.\n4. **Testigos:** El contrato debe ser firmado por al menos dos testigos de confianza.",
          image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📝 **¿Tiene validez legal un pagaré sin fecha?**\n\nSí, un pagaré sin fecha se considera pagadero a la vista. Sin embargo, para mayor seguridad, siempre escriba claramente el propósito, como 'garantía de cumplimiento', para evitar cualquier posible mal uso.",
          image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-chef-mani': {
    fa: {
      name: 'کانال اسرار سرآشپز و پخت ملل 🍳',
      description: 'دستورپخت‌های هیجان‌انگیز، ترفندهای سری رستوران‌ها، معرفی ادویه‌های جادویی و راهنمای کامل پخت حرفه‌ای انواع غذاها.',
      posts: [
        {
          text: "🍳 **رازهای یک ته‌چین مرغ زعفرانی ترد و مجلسی!**\n\nته‌چین یکی از اصیل‌ترین و لذیذترین غذاهای ایرانی است، اما پختن آن به طوری که ته دیگی ترد و مغزپخت داشته باشد فوت و فن‌های خاص خود را دارد.\n\n✨ **نکات طلایی ته‌چین شف مانی:**\n\n۱. **ماست سفت و چکیده:** حتماً از ماست چکیده ترش‌مزه استفاده کنید. ماست شل ته‌چین را خمیر می‌کند.\n۲. **فقط زرده تخم‌مرغ:** از تخم‌مرغ کامل استفاده نکنید؛ سفیده تخم‌مرغ بافت ته‌چین را سفت و بوی زهم به آن می‌دهد.\n۳. **زعفران غلیظ دم‌کرده:** زعفران را با یخ دم کنید تا خوشرنگ‌تر شود و در ریختن آن دست‌ودلباز باشید!\n۴. **کره حیوانی:** برای عطر بی‌نظیر، ته قابلمه حتماً از ترکیب روغن مایع و کره آب‌شده حیوانی استفاده کنید و بگذارید با شعله بسیار ملایم حداقل ۱ ساعت و نیم دم بکشد.",
          image: "https://images.unsplash.com/photo-1590593162201-f67611a18b87?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🥩 **چگونه استیک را مثل یک حرفه‌ای بپزیم؟**\n\nهرگز گوشت را مستقیم از یخچال به تابه منتقل نکنید! بگذارید حداقل ۳۰ دقیقه در دمای محیط بماند تا یکنواخت پخته شود. تابه چدنی حتماً باید کاملاً داغ و دودی باشد تا رطوبت گوشت حفظ شود. نوش جان! 🥩🔥",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Chef Secrets & International Cooking 🍳',
      description: 'Exciting recipes, secret restaurant tricks, introduction to magical spices, and a complete guide to professional cooking.',
      posts: [
        {
          text: "🍳 **Secrets to a crispy and premium Saffron Chicken Tahchin!**\n\n1. **Strained Yogurt:** Always use thick strained yogurt. Runny yogurt makes the Tahchin mushy.\n2. **Yolk Only:** Do not use egg whites; they harden the texture and add a bad odor.\n3. **Concentrated Saffron:** Brew saffron with ice for a brighter color.\n4. **Animal Butter:** Use a combination of liquid oil and melted animal butter for an extraordinary aroma, and let it cook on low heat for at least 1.5 hours.",
          image: "https://images.unsplash.com/photo-1590593162201-f67611a18b87?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🥩 **How to cook a steak like a pro?**\n\nNever cook cold steak straight from the fridge! Let it sit at room temperature for at least 30 minutes. Use a smoking hot cast-iron skillet to sear the meat and seal in the juices. Enjoy! 🥩🔥",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة أسرار الطاهي والطهي الدولي 🍳',
      description: 'وصفات مثيرة، حيل مطاعم سرية، مقدمة للبهارات السحرية، ودليل كامل للطهي الاحترافي.',
      posts: [
        {
          text: "🍳 **أسرار طهي ته شين الدجاج بالزعفران المقرمش والفاخر!**\n\n1. **الزبادي المصفى:** استخدم دائماً زبادي مصفى سميك. الزبادي الخفيف يجعل الطبخة لينة.\n2. **الصفار فقط:** لا تستخدم بياض البيض؛ فإنه يقسي القوام ويعطي رائحة غير محببة.\n3. **الزعفران المركز:** حضر الزبادي مع الثلج للحصول على لون أكثر إشراقاً.\n4. **الزبدة الحيوانية:** استخدم زبدة حيوانية وناراً خفيفة لطهيه لمدة ساعة ونصف على الأقل.",
          image: "https://images.unsplash.com/photo-1590593162201-f67611a18b87?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🥩 **كيف تطهو شريحة لحم (ستيك) كالمحترفين؟**\n\nلا تطهو اللحم البارد مباشرة من الثلاجة! اتركه في درجة حرارة الغرفة لمدة 30 دقيقة على الأقل. استخدم مقلاة حديدية ساخنة جداً للحفاظ على رطوبة اللحم وتماسك العصارة. بالهناء والشفاء! 🥩🔥",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Secretos del Chef y Cocina Internacional 🍳',
      description: 'Recetas emocionantes, trucos secretos de restaurantes, introducción a especias mágicas y una guía completa de cocina profesional.',
      posts: [
        {
          text: "🍳 **¡Secretos para un Tahchin de pollo con azafrán crujiente y premium!**\n\n1. **Yogur colado:** Utilice siempre yogur colado espeso. El yogur líquido hace que el Tahchin quede pastoso.\n2. **Solo yema:** No use claras de huevo; endurecen la textura y dan mal olor.\n3. **Azafrán concentrado:** Prepare el azafrán con hielo para un color más brillante.\n4. **Mantequilla de calidad:** Use una combinación de aceite y mantequilla derretida para un aroma increíble y cocine a fuego lento durante al menos 1.5 horas.",
          image: "https://images.unsplash.com/photo-1590593162201-f67611a18b87?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "🥩 **¿Cómo cocinar un filete como un profesional?**\n\n¡Nunca cocine un filete frío directamente del refrigerador! Déjelo reposar a temperatura ambiente durante al menos 30 minutos. Use una sartén de hierro fundido muy caliente para sellar la carne y conservar sus jugos. ¡Buen provecho! 🥩🔥",
          image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-mr-arash': {
    fa: {
      name: 'کانال آموزش مکالمه انگلیسی 🇬🇧',
      description: 'تقویت لیسنینگ و اسپیکینگ، اصطلاحات روزمره انگلیسی، ضرب‌المثل‌ها و چالش‌های تعاملی برای تسلط سریع به زبان انگلیسی.',
      posts: [
        {
          text: "🇬🇧 **How to speak English confidently!**\n\nبسیاری از زبان‌آموزان با وجود داشتن دایره لغات بالا، موقع صحبت کردن قفل می‌کنند. راهکار چیست؟\n\n🗣️ **۵ ترفند برای روان صحبت کردن:**\n\n۱. **Don't be afraid of mistakes:** اشتباه کردن بخش طبیعی یادگیری است. بومی‌ها هم اشتباه می‌کنند!\n۲. **Think in English:** سعی کنید اشیاء اطرافتان را در ذهن به انگلیسی نام ببرید، نه اینکه اول فارسی فکر کنید و بعد ترجمه کنید.\n۳. **Shadowing Technique:** صدای یک گوینده انگلیسی‌زبان را پخش کنید و بلافاصله بعد از او کلمات را با همان لحن تکرار کنید.\n۴. **Learn phrases, not just words:** به جای تک‌کلمات، اصطلاحات کامل را یاد بگیرید. مثلاً بجای learn کلمه 'get the hang of' را یاد بگیرید.",
          image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💡 **Idiom of the Day: 'Break a leg!'**\n\nشاید عجیب به نظر برسد اما این اصطلاح در انگلیسی به معنای «موفق باشی!» یا همان 'Good luck' است که معمولاً قبل از رفتن روی صحنه یا امتحان به شوخی استفاده می‌شود!\n\n👉 *Example: \"You have an exam tomorrow? Break a leg!\"*",
          image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'English Conversation Tutorial 🇬🇧',
      description: 'Enhancing listening and speaking skills, everyday English idioms, proverbs, and interactive challenges for fast mastery.',
      posts: [
        {
          text: "🇬🇧 **How to speak English confidently!**\n\nMany language learners freeze when they want to speak despite having a large vocabulary. What is the solution?\n\n🗣️ **5 tricks to speak fluently:**\n\n1. **Don't be afraid of mistakes:** Making mistakes is a natural part of learning. Even natives make them!\n2. **Think in English:** Try to name objects around you in your mind in English.\n3. **Shadowing Technique:** Play an English audio and repeat right after the speaker.\n4. **Learn phrases, not just words:** Learn complete expressions rather than isolated words.",
          image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💡 **Idiom of the Day: 'Break a leg!'**\n\nThis English idiom means 'Good luck!' and is commonly used to wish performers or students success before a show or exam!\n\n👉 *Example: \"You have an exam tomorrow? Break a leg!\"*",
          image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة محادثة اللغة الإنجليزية 🇬🇧',
      description: 'تعزيز مهارات الاستماع والتحدث، المصطلحات الإنجليزية اليومية، والأمثال والتحديات التفاعلية لإتقان سريع.',
      posts: [
        {
          text: "🇬🇧 **كيف تتحدث الإنجليزية بثقة!**\n\nالكثير من متعلمي اللغة يتجمدون عندما يريدون التحدث بالرغم من امتلاكهم مفردات واسعة. ما هو الحل؟\n\n🗣️ **5 حيل للتحدث بطلاقة:**\n\n1. **لا تخف من الأخطاء:** ارتكاب الأخطاء جزء طبيعي من التعلم.\n2. **فكر بالإنجليزية:** حاول تسمية الأشياء من حولك في عقلك بالإنجليزية.\n3. **تقنية التظليل (Shadowing):** استمع إلى تسجيل وكرر الكلمات مباشرة خلف المتحدث.\n4. **تعلم العبارات لا الكلمات المفردة:** تعلم تعابير كاملة بدلاً من كلمات منفصلة.",
          image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💡 **مصطلح اليوم: 'Break a leg!'**\n\nهذا المصطلح الإنجليزي يعني \"بالتوفيق!\" أو \"حظاً سعيداً\"، ويستخدم بشكل شائع لتمني النجاح للممثلين أو الطلاب قبل العرض أو الامتحان!\n\n👉 *مثال: \"لديك امتحان غداً؟ بالتوفيق!\"*",
          image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Tutorial de Conversación en Inglés 🇬🇧',
      description: 'Mejora de habilidades de escucha y habla, modismos en inglés cotidianos, proverbios y desafíos interactivos para un dominio rápido.',
      posts: [
        {
          text: "🇬🇧 **¡Cómo hablar inglés con confianza!**\n\nMuchos estudiantes de idiomas se bloquean al hablar a pesar de tener un gran vocabulario. ¿Cuál es la solución?\n\n🗣️ **5 trucos para hablar con fluidez:**\n\n1. **No temas a los errores:** Cometer errores es parte natural del aprendizaje. ¡Incluso los nativos los cometen!\n2. **Piensa en inglés:** Intenta nombrar objetos a tu alrededor en inglés en tu mente.\n3. **Técnica del sombreado (Shadowing):** Reproduce un audio y repite inmediatamente después del hablante.\n4. **Aprende frases, no palabras sueltas:** Aprende expresiones completas en lugar de palabras aisladas.",
          image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "💡 **Modismo del día: 'Break a leg!'**\n\n¡Este modismo en inglés significa \"¡Buena suerte!\" y se usa comúnmente para desear éxito antes de una presentación o examen!\n\n👉 *Ejemplo: \"¿Tienes un examen mañana? ¡Buena suerte!\"*",
          image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-amir-karimi': {
    fa: {
      name: 'کانال مالیات به زبان ساده 📊',
      description: 'مشاوره‌ها و بخشنامه‌های جدید سازمان امور مالیاتی، آموزش معافیت‌ها و ثبت اظهارنامه به صورت گام‌به‌گام برای مشاغل.',
      posts: [
        {
          text: "💼 **بخشنامه جدید تمدید مهلت اظهارنامه مالیاتی مشاغل**\n\nطبق آخرین ابلاغیه سازمان امور مالیاتی کشور، مهلت تسلیم اظهارنامه مالیاتی عملکرد سال گذشته صاحبان مشاغل و کسب‌وکارهای انفرادی تمدید شد.\n\n⚠️ **نکته بسیار مهم:** مودیان محترم حتماً از تسهیلات تبصره ماده ۱۰۰ استفاده کنند تا از حسابرسی‌های پیچیده معاف شوند و مالیات آنها به صورت مقطوع و عادلانه محاسبه گردد. تاخیر در ثبت اظهارنامه جرایم غیرقابل بخشش در پی دارد.",
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📊 **تفاوت جالب حسابداری و مدیریت مالیاتی:**\n\nحسابدار رویدادهای مالی گذشته را ثبت می‌کند، اما مشاور مالیاتی مسیرهای قانونی آینده را برای کاهش هزینه‌ها و بهره‌مندی از معافیت‌های قانونی هموار می‌سازد. هوشمندانه عمل کنید!",
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Taxes Made Simple 📊',
      description: 'New consultations and circulars from the tax organization, waiver guides, and step-by-step tax declaration for businesses.',
      posts: [
        {
          text: "💼 **New Circular: Extension of tax declaration deadline for businesses**\n\nAccording to the latest directive, the deadline for submitting the tax declaration of businesses and sole proprietorships has been extended.\n\n⚠️ **Very Important Note:** Taxpayers should use the Article 100 facilities to avoid complex audits and settle their taxes easily. Delays incur non-forgivable penalties.",
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📊 **Interesting difference between accounting and tax management:**\n\nAn accountant records past financial events, while a tax consultant paves legal ways for the future to reduce costs and benefit from tax exemptions. Act smart!",
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة الضرائب المبسطة 📊',
      description: 'استشارات وتعميمات جديدة من هيئة الضرائب، أدلة الإعفاء، والإقرارات الضريبية خطوة بخطوة للشركات.',
      posts: [
        {
          text: "💼 **تعميم جديد: تمديد مهلت تقديم الإقرار الضريبي للأعمال**\n\nوفقاً لآخر توجيه، تم تمديد مهلت تقديم الإقرار الضريبي للمؤسسات والشركات الفردية.\n\n⚠️ **ملاحظة هامة جداً:** يجب على المكلفين استخدام تسهيلات المادة 100 لتجنب عمليات التدقيق المعقدة وتسوية ضرائبهم بسهولة. التأخير يؤدي إلى غرامات غير قابلة للإعفاء.",
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📊 **الفرق المثير للاهتمام بين المحاسبة وإدارة الضرائب:**\n\nيقوم المحاسب بتسجيل الأحداث المالية السابقة، بينما يمهد المستشار الضريبي السبل القانونية للمستقبل لتقليل التكاليف والاستفادة من الإعفاءات الضريبية. تصرف بذكاء!",
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Impuestos Simplificados 📊',
      description: 'Nuevas consultas y circulares de la organización tributaria, guías de exenciones y declaración de impuestos paso a paso para empresas.',
      posts: [
        {
          text: "💼 **Nueva Circular: Prórroga del plazo de declaración de impuestos para empresas**\n\nDe acuerdo con la última directiva, se ha prorrogado el plazo para presentar la declaración de impuestos de empresas y unipersonales.\n\n⚠️ **Nota muy importante:** Los contribuyentes deben utilizar los beneficios del Artículo 100 para evitar auditorías complejas y liquidar sus impuestos de manera fácil y segura. Los retrasos generan multas no condonables.",
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "📊 **Interesante diferencia entre contabilidad y gestión fiscal:**\n\nUn contador registra eventos financieros pasados, mientras que un consultor fiscal allana caminos legales para el futuro para reducir costos y beneficiarse de exenciones fiscales. ¡Actúe con inteligencia!",
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  },
  'channel-hadj-alavi': {
    fa: {
      name: 'کانال معارف، اخلاق و نور ایمان 🕌',
      description: 'پاسخ به سوالات شرعی، احکام معاملات، اخلاق اسلامی، آیات آرامش‌بخش قرآن و احادیث اهل بیت (ع) برای ارتقای ایمان روزانه.',
      posts: [
        {
          text: "🕌 **آرامش واقعی در هیاهوی زندگی امروزی**\n\nقرآن کریم در آیه ۲۸ سوره رعد می‌فرماید:\n«الَّذِینَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِکرِ اللَّهِ ۗ أَلَا بِذِکرِ اللَّهِ تَتْمَئِنُّ الْقُلُوب»\n(همان کسانی که ایمان آورده‌اند و دل‌هایشان به یاد خدا آرام می‌گیرد؛ آگاه باشید که تنها با یاد خدا دل‌ها آرامش می‌یابد.)\n\n🌱 آرامش واقعی خریدنی نیست، بلکه نتیجه اتصال به سرچشمه ابدی هستی است. هرگاه دلتان گرفت، سجاده‌ای بگشایید و دقایقی با پروردگارتان نجوا کنید تا سبکی ایمان را حس کنید.",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "❤️ **احسان به پدر و مادر، گشایش‌گر گره‌های زندگی**\n\nیکی از سریع‌ترین راه‌های جلب رحمت الهی و گشایش در کارها، دعای خیر والدین است. حتی با یک تماس ساده یا بوسه بر دستشان، بهشت دنیا و آخرت را برای خود بخرید. پیامبر اکرم (ص) فرمودند: دعای پدر و مادر برای فرزند، مانند دعای پیامبر برای امتش است.",
          image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    en: {
      name: 'Islamic Ethics & Light of Faith 🕌',
      description: 'Answers to religious questions, transaction rules, Islamic ethics, calming Quranic verses, and Hadiths for daily faith.',
      posts: [
        {
          text: "🕌 **Real Peace in the Hustle of Modern Life**\n\nThe Holy Quran states in Surah Ar-Ra'd, Verse 28:\n'Those who believe, and whose hearts find satisfaction in the remembrance of Allah: for without doubt in the remembrance of Allah do hearts find satisfaction.'\n\n🌱 Real peace cannot be bought; it is the result of connecting to the eternal source of existence. Whenever you feel overwhelmed, open your prayer mat and whisper to your Lord.",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "❤️ **Kindness to parents: Unlocking life's difficulties**\n\nOne of the fastest ways to receive divine mercy and unlock obstacles is the prayers of parents. Buy yourself the heaven of this world and the hereafter with a simple call or kissing their hands.",
          image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    ar: {
      name: 'قناة المعارف والأخلاق ونور الإيمان 🕌',
      description: 'الإجابة على الأسئلة الدينية، أحكام المعاملات، الأخلاق الإسلامية، آيات القرآن المهدئة، والأحاديث النبوية للإيمان اليومي.',
      posts: [
        {
          text: "🕌 **السكينة الحقيقية في صخب الحياة العصرية**\n\nيقول الله تعالى في سورة الرعد، الآية 28:\n«الَّذِینَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِکرِ اللَّهِ ۗ أَلَا بِذِکرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»\n\n🌱 الطمأنينة الحقيقية لا تُشترى، بل هي نتيجة الاتصال بمصدر الوجود الأبدي. عندما يضيق صدرك، افتح سجادتك وناجِ ربك لتشعر بخفة الإيمان.",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "❤️ **بر الوالدين: مفتاح حل مصاعب الحياة**\n\nمن أسرع الطرق لنيل الرحمة الإلهية وتيسير الأمور هو دعاء الوالدين. اشترِ لنفسك جنة الدنيا والآخرة باتصال بسيط أو تقبيل أيديهما.",
          image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80"
        }
      ]
    },
    es: {
      name: 'Ética Islámica y Luz de la Fe 🕌',
      description: 'Respuestas a preguntas religiosas, reglas de transacciones, ética islámica, versos relajantes del Corán y Hadices para la fe diaria.',
      posts: [
        {
          text: "🕌 **Paz Real en el Bullicio de la Vida Moderna**\n\nEl Sagrado Corán dice en la Sura Ar-Ra'd, Versículo 28:\n'Aquellos que creen y cuyos corazones encuentran satisfacción en el recuerdo de Alá: porque sin duda en el recuerdo de Alá los corazones encuentran satisfacción.'\n\n🌱 La verdadera paz no se puede comprar; es el resultado de conectarse con la fuente eterna de la existencia. Siempre que te sientas abrumado, abre tu alfombra de oración y susurra a tu Señor.",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
        },
        {
          text: "❤️ **Bondad con los padres: La llave para desbloquear las dificultades de la vida**\n\nUna de las formas más rápidas de recibir la misericordia divina y superar los obstáculos es la oración de los padres. Regálate el cielo de este mundo y del más allá con una simple llamada o besando sus manos.",
          image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80"
        }
      ]
    }
  }
};

const PRESET_CHANNELS_METADATA = [
  {
    id: 'channel-dr-tehrani',
    ownerId: 'dr-tehrani',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    subscribersCount: 14250,
  },
  {
    id: 'channel-dr-elahi',
    ownerId: 'dr-elahi',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    subscribersCount: 22800,
  },
  {
    id: 'channel-mr-alavi',
    ownerId: 'mr-alavi',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    subscribersCount: 9540,
  },
  {
    id: 'channel-chef-mani',
    ownerId: 'chef-mani',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
    subscribersCount: 18100,
  },
  {
    id: 'channel-mr-arash',
    ownerId: 'mr-arash',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    subscribersCount: 31200,
  },
  {
    id: 'channel-amir-karimi',
    ownerId: 'tax-expert', // Matches Tax Specialist profile
    avatar: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400',
    subscribersCount: 12400,
  },
  {
    id: 'channel-hadj-alavi',
    ownerId: 'religious-expert', // Matches Hojjatoleslam Alavi profile
    avatar: '/src/assets/images/mullah_avatar_1783071830456.jpg',
    subscribersCount: 8900,
  }
];

export const ChannelsTab: React.FC<ChannelsTabProps> = ({ profiles, settings, activeLang, onChannelSelectStateChange }) => {
  const isRtl = activeLang === 'fa' || activeLang === 'ar';
  const t = translations[activeLang] || translations.fa;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [activePostCommentsId, setActivePostCommentsId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // User-Created Channels States
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelAvatar, setNewChannelAvatar] = useState("");
  const [userPostText, setUserPostText] = useState("");
  const [isPublishingUserPost, setIsPublishingUserPost] = useState(false);
  const [newChannelHandle, setNewChannelHandle] = useState("");
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState("");
  const hasCheckedAutomatedPost = useRef(false);

  // Notify parent component about channel selection state
  useEffect(() => {
    if (onChannelSelectStateChange) {
      onChannelSelectStateChange(selectedChannelId !== null);
    }
  }, [selectedChannelId, onChannelSelectStateChange]);

  // Load user-created channels from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_created_channels');
      if (saved) {
        setUserChannels(JSON.parse(saved).map((ch: any) => {
          const fallbackSuffix = ch.id.split('-').pop() || String(Math.floor(Math.random() * 1000));
          return {
            ...ch,
            handle: ch.handle || `@user_channel_${fallbackSuffix}`,
            inviteLink: ch.inviteLink || `https://t.me/user_channel_${fallbackSuffix}`,
            posts: ch.posts.map((p: any) => ({
              ...p,
              timestamp: new Date(p.timestamp),
              comments: p.comments.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) }))
            }))
          };
        }));
      }
    } catch (e) {
      console.error("Failed to load user channels", e);
    }
  }, []);

  // Initialize and load channels based on active profiles (contacts) and user created channels
  useEffect(() => {
    // Determine which profiles are added
    const activeProfileIds = new Set(profiles.map(p => p.id));
    
    // Check if tax or religious experts are added via preset or custom name/role matches
    const hasTaxExpert = profiles.some(p => 
      p.id === 'tax-expert' || 
      p.name.includes("امیر کریمی") || 
      (p.customRoleLabel || "").includes("مالیاتی")
    );
    
    const hasReligiousExpert = profiles.some(p => 
      p.id === 'religious-expert' || 
      p.name.includes("علوی 🕌") || 
      p.name.includes("حجت‌الاسلام") || 
      (p.customRoleLabel || "").includes("مذهبی")
    );

    // Initialize channels with dynamic localization
    const initialChannels: Channel[] = PRESET_CHANNELS_METADATA.map(meta => {
      // Find localized details (name, description, posts) for the active language
      const loc = LOCALIZED_CHANNELS_DATA[meta.id]?.[activeLang] || LOCALIZED_CHANNELS_DATA[meta.id]?.fa;
      const channelName = loc ? loc.name : `Channel ${meta.id}`;
      const channelDesc = loc ? loc.description : '';
      const postPresetData = loc ? loc.posts : [];

      const posts: ChannelPost[] = postPresetData.map((data, idx) => {
        const postDate = new Date();
        postDate.setDate(postDate.getDate() - idx);
        
        return {
          id: `${meta.id}-post-${idx}`,
          text: data.text,
          image: data.image,
          timestamp: postDate,
          views: Math.floor(2500 - (idx * 500) + Math.random() * 400),
          likes: ['سارا', 'دکتر الهی', 'کاربر'].slice(0, Math.floor(Math.random() * 4)),
          comments: [
            {
              id: `${meta.id}-comment-${idx}-1`,
              userName: isRtl ? 'مهدی رضایی' : 'John Doe',
              text: isRtl ? 'خیلی مطلب کاربردی و عالی‌ای بود، سپاس فراوان 🙏🏼' : 'Great post! Extremely informative.',
              timestamp: new Date(postDate.getTime() + 1200000)
            },
            {
              id: `${meta.id}-comment-${idx}-2`,
              userName: isRtl ? 'زهرا علوی' : 'Sarah Smith',
              text: isRtl ? 'اتفاقاً منم دقیقاً به همین مشکل برخورده بودم، ممنون که راهنمایی کردید.' : 'Very timely advice, thank you so much.',
              timestamp: new Date(postDate.getTime() + 3600000)
            }
          ]
        };
      });

      // Try to load state from localStorage
      let isSubscribed = true; // Subscribed by default if added to contacts
      try {
        const savedSubState = localStorage.getItem(`channel_sub_${meta.id}`);
        if (savedSubState !== null) {
          isSubscribed = savedSubState === 'true';
        }
      } catch (err) {}

      // Try to load comments & likes updates from localStorage
      const updatedPosts = posts.map(post => {
        try {
          const savedPostData = localStorage.getItem(`channel_post_state_${post.id}`);
          if (savedPostData) {
            const parsed = JSON.parse(savedPostData);
            return {
              ...post,
              likes: parsed.likes || post.likes,
              comments: Array.isArray(parsed.comments) 
                ? parsed.comments.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })) 
                : post.comments
            };
          }
        } catch (err) {}
        return post;
      });

      // Try to load custom AI generated posts for this channel
      let finalPosts = [...updatedPosts];
      try {
        const savedAiPosts = localStorage.getItem(`channel_ai_posts_${meta.id}`);
        if (savedAiPosts) {
          const parsedAi = JSON.parse(savedAiPosts).map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp),
            comments: p.comments.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) }))
          }));
          finalPosts = [...parsedAi, ...finalPosts];
        }
      } catch (err) {}

      const handle = `@${meta.id.replace('channel-', '').replace(/-/g, '_')}`;
      const inviteLink = `https://t.me/${handle.replace('@', '')}`;

      return {
        id: meta.id,
        ownerId: meta.ownerId,
        name: channelName,
        avatar: meta.avatar,
        description: channelDesc,
        subscribersCount: meta.subscribersCount,
        posts: finalPosts,
        isSubscribed,
        handle,
        inviteLink
      };
    });

    // Filter channels so that only channels with corresponding active profiles exist
    const filtered = initialChannels.filter(ch => {
      if (ch.id === 'channel-amir-karimi') return hasTaxExpert;
      if (ch.id === 'channel-hadj-alavi') return hasReligiousExpert;
      
      // Let's check if there is ANY profile in contacts matching this channel's ownerId or role
      const hasMatchingProfile = profiles.some(p => {
        // Direct ID match
        if (p.id === ch.ownerId) return true;
        
        // If profile was added from preset sheet (has profile-preset- prefix in its ID)
        if (p.id.startsWith("profile-preset-")) {
          const rolePart = p.role.toLowerCase();
          const ownerPart = ch.ownerId.toLowerCase();
          if (ownerPart.includes(rolePart) || rolePart.includes(ownerPart)) return true;
        }

        // Exact role match
        if (p.role === 'Doctor' && ch.ownerId === 'dr-tehrani') return true;
        if (p.role === 'Psychologist' && ch.ownerId === 'dr-elahi') return true;
        if (p.role === 'Lawyer' && ch.ownerId === 'mr-alavi') return true;
        if (p.role === 'Chef' && ch.ownerId === 'chef-mani') return true;
        if (p.role === 'EnglishTeacher' && ch.ownerId === 'mr-arash') return true;

        return false;
      });

      return hasMatchingProfile;
    });

    setChannels([...filtered, ...userChannels]);
  }, [profiles, activeLang, userChannels]);

  // Show Toast
  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  // Toggle Subscription
  const handleToggleSubscribe = (channelId: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const nextSub = !ch.isSubscribed;
        localStorage.setItem(`channel_sub_${ch.id}`, String(nextSub));
        showToast(nextSub 
          ? (isRtl ? 'عضویت شما در کانال با موفقیت انجام شد 🎉' : 'Joined channel successfully 🎉')
          : (isRtl ? 'شما از کانال خارج شدید' : 'Left the channel')
        );
        return {
          ...ch,
          isSubscribed: nextSub,
          subscribersCount: nextSub ? ch.subscribersCount + 1 : ch.subscribersCount - 1
        };
      }
      return ch;
    }));
  };

  // Like / Unlike Post
  const handleLikePost = (postId: string, channelId: string) => {
    const userName = settings.userName || (isRtl ? 'کاربر' : 'User');
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const updatedPosts = ch.posts.map(post => {
          if (post.id === postId) {
            let nextLikes = [...post.likes];
            if (nextLikes.includes(userName)) {
              nextLikes = nextLikes.filter(name => name !== userName);
            } else {
              nextLikes.push(userName);
            }
            
            // Save state
            const postState = { likes: nextLikes, comments: post.comments };
            localStorage.setItem(`channel_post_state_${post.id}`, JSON.stringify(postState));
            
            return { ...post, likes: nextLikes };
          }
          return post;
        });
        return { ...ch, posts: updatedPosts };
      }
      return ch;
    }));
  };

  // Add Comment
  const handleAddComment = (postId: string, channelId: string) => {
    if (!newCommentText.trim()) return;
    const userName = settings.userName || (isRtl ? 'کاربر' : 'User');
    
    const newComment: ChannelComment = {
      id: `comment-${Date.now()}`,
      userName,
      text: newCommentText.trim(),
      timestamp: new Date()
    };

    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const updatedPosts = ch.posts.map(post => {
          if (post.id === postId) {
            const nextComments = [...post.comments, newComment];
            
            // Save state
            const postState = { likes: post.likes, comments: nextComments };
            localStorage.setItem(`channel_post_state_${post.id}`, JSON.stringify(postState));
            
            return { ...post, comments: nextComments };
          }
          return post;
        });
        return { ...ch, posts: updatedPosts };
      }
      return ch;
    }));

    setNewCommentText("");
  };

  // Helper to translate text into all program languages in background
  const translateToAllLanguages = async (text: string, sourceLang: string): Promise<Record<'fa' | 'en' | 'ar' | 'es', string>> => {
    const result: Record<'fa' | 'en' | 'ar' | 'es', string> = {
      fa: sourceLang === 'fa' ? text : '',
      en: sourceLang === 'en' ? text : '',
      ar: sourceLang === 'ar' ? text : '',
      es: sourceLang === 'es' ? text : ''
    };

    try {
      const targetLanguages = ['fa', 'en', 'ar', 'es'].filter(l => l !== sourceLang);
      const prompt = `Translate the following text into ${targetLanguages.map(l => l === 'fa' ? 'Persian/Farsi' : l === 'en' ? 'English' : l === 'ar' ? 'Arabic' : 'Spanish').join(', ')}.
Text: "${text}"

Your output MUST be a valid JSON object with keys: ${targetLanguages.map(l => `"${l}"`).join(', ')}. The values should be the translated text. Do not include markdown formatting, backticks, or any explanation. Only the raw JSON string.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: "You are a professional, highly precise multi-lingual translator. You output only raw, valid JSON objects containing the translations.",
          history: [],
          contents: [{ text: prompt }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        let responseText = data.text?.trim() || "";
        responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(responseText);
        targetLanguages.forEach(l => {
          if (parsed[l]) {
            result[l as 'fa' | 'en' | 'ar' | 'es'] = parsed[l].trim();
          }
        });
      }
    } catch (e) {
      console.error("Translation of custom text failed", e);
    }

    // Fallback for empty keys
    ['fa', 'en', 'ar', 'es'].forEach(l => {
      if (!result[l as 'fa' | 'en' | 'ar' | 'es']) {
        result[l as 'fa' | 'en' | 'ar' | 'es'] = text;
      }
    });

    return result;
  };

  // User Post Addition to User-Created Channel
  const handlePublishUserPost = async (channelId: string) => {
    if (!userPostText.trim() || isPublishingUserPost) return;
    setIsPublishingUserPost(true);
    const postText = userPostText.trim();
    setUserPostText("");

    const newPost: ChannelPost = {
      id: `user-post-${Date.now()}`,
      text: postText,
      timestamp: new Date(),
      views: 1,
      likes: [],
      comments: [],
      text_translations: {
        fa: activeLang === 'fa' ? postText : '',
        en: activeLang === 'en' ? postText : '',
        ar: activeLang === 'ar' ? postText : '',
        es: activeLang === 'es' ? postText : ''
      }
    };

    // Update state and storage
    const updatedChannels = channels.map(ch => {
      if (ch.id === channelId) {
        const nextPosts = [newPost, ...ch.posts];
        // Save user created channels specifically
        if (ch.ownerId === 'user') {
          const savedChans = userChannels.map(uc => {
            if (uc.id === channelId) {
              return { ...uc, posts: nextPosts };
            }
            return uc;
          });
          setUserChannels(savedChans);
          localStorage.setItem('user_created_channels', JSON.stringify(savedChans));
        }
        return { ...ch, posts: nextPosts };
      }
      return ch;
    });

    setChannels(updatedChannels);
    setIsPublishingUserPost(false);
    showToast(isRtl ? "مطلب جدید در کانال شما با موفقیت منتشر شد! 🚀" : "Post published successfully in your channel! 🚀");

    // Start background translation for user post
    setTimeout(async () => {
      try {
        const translatedTexts = await translateToAllLanguages(postText, activeLang);
        
        setChannels(prev => prev.map(ch => {
          if (ch.id === channelId) {
            const nextPosts = ch.posts.map(p => {
              if (p.id === newPost.id) {
                return { ...p, text_translations: translatedTexts };
              }
              return p;
            });
            
            if (ch.ownerId === 'user') {
              const savedChans = userChannels.map(uc => {
                if (uc.id === channelId) {
                  return { ...uc, posts: nextPosts };
                }
                return uc;
              });
              setUserChannels(savedChans);
              localStorage.setItem('user_created_channels', JSON.stringify(savedChans));
            }
            return { ...ch, posts: nextPosts };
          }
          return ch;
        }));
      } catch (e) {
        console.error("Background user post translation failed", e);
      }
    }, 100);

    // Trigger 1-2 AI profiles to comment
    const aiCandidates = profiles.filter(p => !p.isGroup && !p.realUser);
    if (aiCandidates.length === 0) return;

    // Pick 1-2 random AI commenters
    const numberOfCommenters = Math.min(2, aiCandidates.length);
    const shuffled = [...aiCandidates].sort(() => 0.5 - Math.random());
    const commenters = shuffled.slice(0, numberOfCommenters);

    commenters.forEach((commenter, index) => {
      setTimeout(async () => {
        try {
          const commenterRole = commenter.customRoleLabel || commenter.role;
          const commentPrompt = `شما به عنوان شخصیت "${commenter.name}" در نقش "${commenterRole}" هستید. یک پست جدید در کانالی که در آن عضو هستید با این متن منتشر شده است: "${postText}". یک کامنت کوتاه، صمیمی، کاملاً متناسب با شخصیت خودتان و مرتبط با پست به زبان فارسی صمیمی و صوتی بنویسید (حداکثر یک یا دو جمله کوتاه). پاسخ شما فقط و فقط متن خام نظر باشد بدون هیچ پیشوند یا حاشیه دیگری.`;

          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: `شما شخصیت ${commenter.name} با نقش ${commenterRole} هستید و برای پست کاربر کامنت می‌گذارید. لحن شما بسیار صمیمی، کوتاه و عامیانه است.`,
              history: [],
              contents: [{ text: commentPrompt }]
            })
          });

          if (!res.ok) throw new Error("Comment generation failed");
          const data = await res.json();
          const commentText = data.text?.trim() || "";

          if (commentText) {
            const aiComment: ChannelComment = {
              id: `comment-ai-${Date.now()}-${index}`,
              userName: commenter.name,
              text: commentText,
              timestamp: new Date()
            };

            setChannels(prev => prev.map(ch => {
              if (ch.id === channelId) {
                const nextPosts = ch.posts.map(post => {
                  if (post.id === newPost.id) {
                    const nextComments = [...post.comments, aiComment];
                    // Save state
                    const postState = { likes: post.likes, comments: nextComments };
                    localStorage.setItem(`channel_post_state_${post.id}`, JSON.stringify(postState));
                    return { ...post, comments: nextComments };
                  }
                  return post;
                });

                if (ch.ownerId === 'user') {
                  const savedChans = userChannels.map(uc => {
                    if (uc.id === channelId) {
                      return { ...uc, posts: nextPosts };
                    }
                    return uc;
                  });
                  localStorage.setItem('user_created_channels', JSON.stringify(savedChans));
                }

                return { ...ch, posts: nextPosts };
              }
              return ch;
            }));
          }
        } catch (err) {
          console.error("AI commenter failed", err);
        }
      }, (index + 1) * 2500);
    });
  };

  // Helper to check duplicate handles
  const handleIsDuplicate = (handle: string, excludeChannelId?: string) => {
    const normalized = handle.trim().toLowerCase();
    
    // Check preset channels
    const presetMatch = PRESET_CHANNELS_METADATA.some(meta => {
      const h = `@${meta.id.replace('channel-', '').replace(/-/g, '_')}`;
      return meta.id !== excludeChannelId && h.toLowerCase() === normalized;
    });
    
    // Check all loaded channels (preset & user)
    const channelsMatch = channels.some(ch => ch.id !== excludeChannelId && ch.handle?.toLowerCase() === normalized);
    
    // Check user created channels list specifically
    const userMatch = userChannels.some(ch => ch.id !== excludeChannelId && (ch.id.toLowerCase() === normalized || ch.handle?.toLowerCase() === normalized));
    
    return presetMatch || channelsMatch || userMatch;
  };

  // Create or Update Custom User Channel
  const handleSaveChannel = () => {
    if (!newChannelName.trim()) {
      showToast(isRtl ? "نام کانال اجباری است" : "Channel name is required");
      return;
    }

    // Handle (Channel ID) Validation
    let rawHandle = newChannelHandle.trim();
    if (!rawHandle) {
      showToast(isRtl ? "انتخاب شناسه (آیدی) کانال اجباری است" : "Channel handle is required");
      return;
    }
    if (!rawHandle.startsWith('@')) {
      rawHandle = '@' + rawHandle;
    }

    const handleRegex = /^@[a-zA-Z0-9_]{3,20}$/;
    if (!handleRegex.test(rawHandle)) {
      showToast(isRtl 
        ? 'شناسه باید با @ شروع شده و فقط شامل حروف انگلیسی، اعداد و خط تیره (_) بین ۳ تا ۲۰ کاراکتر باشد' 
        : 'Handle must start with @ and contain 3-20 alphanumeric characters or underscores'
      );
      return;
    }

    const targetId = isEditingChannel && selectedChannelId ? selectedChannelId : `user-channel-${Date.now()}`;

    if (handleIsDuplicate(rawHandle, isEditingChannel ? targetId : undefined)) {
      showToast(isRtl 
        ? "این شناسه (آیدی) قبلاً توسط کانال دیگری انتخاب شده است و تکراری می‌باشد" 
        : "This handle is already taken. Please choose a unique ID."
      );
      return;
    }

    const defaultAvatar = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400";
    const inviteLink = `https://t.me/${rawHandle.replace('@', '')}`;

    const initialNameTrans = {
      fa: activeLang === 'fa' ? newChannelName.trim() : '',
      en: activeLang === 'en' ? newChannelName.trim() : '',
      ar: activeLang === 'ar' ? newChannelName.trim() : '',
      es: activeLang === 'es' ? newChannelName.trim() : ''
    };

    const initialDescTrans = {
      fa: activeLang === 'fa' ? newChannelDesc.trim() : '',
      en: activeLang === 'en' ? newChannelDesc.trim() : '',
      ar: activeLang === 'ar' ? newChannelDesc.trim() : '',
      es: activeLang === 'es' ? newChannelDesc.trim() : ''
    };

    if (isEditingChannel && selectedChannelId) {
      // Editing existing channel
      const updatedUserChannels = userChannels.map(ch => {
        if (ch.id === selectedChannelId) {
          return {
            ...ch,
            name: newChannelName.trim(),
            description: newChannelDesc.trim(),
            avatar: newChannelAvatar || ch.avatar || defaultAvatar,
            handle: rawHandle,
            inviteLink,
            name_translations: {
              ...(ch.name_translations || {}),
              [activeLang]: newChannelName.trim()
            },
            description_translations: {
              ...(ch.description_translations || {}),
              [activeLang]: newChannelDesc.trim()
            }
          };
        }
        return ch;
      });

      setUserChannels(updatedUserChannels);
      localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChannels));

      // Update channels list immediately
      setChannels(prev => prev.map(ch => {
        if (ch.id === selectedChannelId) {
          return {
            ...ch,
            name: newChannelName.trim(),
            description: newChannelDesc.trim(),
            avatar: newChannelAvatar || ch.avatar || defaultAvatar,
            handle: rawHandle,
            inviteLink,
            name_translations: {
              ...(ch.name_translations || {}),
              [activeLang]: newChannelName.trim()
            },
            description_translations: {
              ...(ch.description_translations || {}),
              [activeLang]: newChannelDesc.trim()
            }
          };
        }
        return ch;
      }));

      showToast(isRtl ? "اطلاعات کانال با موفقیت ویرایش شد" : "Channel details updated successfully");

      // Background translation on Edit
      const editName = newChannelName.trim();
      const editDesc = newChannelDesc.trim();
      setTimeout(async () => {
        try {
          const transNames = await translateToAllLanguages(editName, activeLang);
          const transDescs = await translateToAllLanguages(editDesc, activeLang);
          setUserChannels(prev => {
            const next = prev.map(ch => {
              if (ch.id === selectedChannelId) {
                return { ...ch, name_translations: transNames, description_translations: transDescs };
              }
              return ch;
            });
            localStorage.setItem('user_created_channels', JSON.stringify(next));
            return next;
          });
          setChannels(prev => prev.map(ch => {
            if (ch.id === selectedChannelId) {
              return { ...ch, name_translations: transNames, description_translations: transDescs };
            }
            return ch;
          }));
        } catch (err) {
          console.error("Bg translation failed on edit", err);
        }
      }, 100);

    } else {
      // Creating new channel
      const newChan: Channel = {
        id: targetId,
        ownerId: 'user',
        name: newChannelName.trim(),
        avatar: newChannelAvatar || defaultAvatar,
        description: newChannelDesc.trim() || (isRtl ? "کانال شخصی کاربر" : "User's personal channel"),
        subscribersCount: profiles.filter(p => !p.isGroup && !p.realUser).length || 5,
        posts: [],
        isSubscribed: true,
        handle: rawHandle,
        inviteLink,
        name_translations: initialNameTrans,
        description_translations: initialDescTrans
      };

      const updatedUserChannels = [...userChannels, newChan];
      setUserChannels(updatedUserChannels);
      localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChannels));

      setChannels(prev => [...prev, newChan]);
      setSelectedChannelId(newChan.id);
      showToast(isRtl ? `کانال «${newChan.name}» با موفقیت ساخته شد! شخصیت‌های هوش مصنوعی بلافاصله عضو شدند 👥` : `Channel created successfully!`);

      // Background translation on Create
      const createName = newChannelName.trim();
      const createDesc = newChannelDesc.trim() || (isRtl ? "کانال شخصی کاربر" : "User's personal channel");
      setTimeout(async () => {
        try {
          const transNames = await translateToAllLanguages(createName, activeLang);
          const transDescs = await translateToAllLanguages(createDesc, activeLang);
          setUserChannels(prev => {
            const next = prev.map(ch => {
              if (ch.id === targetId) {
                return { ...ch, name_translations: transNames, description_translations: transDescs };
              }
              return ch;
            });
            localStorage.setItem('user_created_channels', JSON.stringify(next));
            return next;
          });
          setChannels(prev => prev.map(ch => {
            if (ch.id === targetId) {
              return { ...ch, name_translations: transNames, description_translations: transDescs };
            }
            return ch;
          }));
        } catch (err) {
          console.error("Bg translation failed on create", err);
        }
      }, 100);
    }

    // Reset fields & Close modal
    setShowCreateChannelModal(false);
    setIsEditingChannel(false);
    setNewChannelName("");
    setNewChannelDesc("");
    setNewChannelAvatar("");
    setNewChannelHandle("");
  };

  // Simulate real member joining when copying invite link
  const simulateRealUserJoin = (channelId: string) => {
    const names = ['محمدرضا', 'امیرعلی', 'فاطمه زهرا', 'یاسمن', 'سهیل', 'پارسا', 'غزل', 'عاطفه', 'احسان', 'محدثه'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    setTimeout(() => {
      setChannels(prev => prev.map(ch => {
        if (ch.id === channelId) {
          const newSubCount = ch.subscribersCount + 1;
          
          let updatedPosts = [...ch.posts];
          if (updatedPosts.length > 0) {
            const latestPost = { ...updatedPosts[0] };
            const newComment: ChannelComment = {
              id: `sim-comment-${Date.now()}`,
              userName: randomName,
              text: isRtl 
                ? 'من هم با لینک دعوت عضو این کانال فوق‌العاده شدم! 😍🌹' 
                : 'I joined this amazing channel via invite link! 😍🌹',
              timestamp: new Date()
            };
            latestPost.comments = [...latestPost.comments, newComment];
            updatedPosts[0] = latestPost;
          }

          if (ch.ownerId === 'user') {
            const updatedUserChans = userChannels.map(uc => {
              if (uc.id === channelId) {
                return { ...uc, subscribersCount: newSubCount, posts: updatedPosts };
              }
              return uc;
            });
            setUserChannels(updatedUserChans);
            localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChans));
          }

          showToast(isRtl 
            ? `🎉 «${randomName}» با لینک دعوت شما عضو کانال شد!` 
            : `🎉 "${randomName}" joined the channel via your invite link!`
          );

          return {
            ...ch,
            subscribersCount: newSubCount,
            posts: updatedPosts
          };
        }
        return ch;
      }));
    }, 4500);
  };

  // Delete Channel Post
  const handleDeletePost = (postId: string, channelId: string) => {
    if (!window.confirm(isRtl ? 'آیا از حذف این مطلب مطمئن هستید؟' : 'Are you sure you want to delete this post?')) return;
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const updatedPosts = ch.posts.filter(p => p.id !== postId);
        
        // Save to user channels state and localStorage
        const updatedUserChans = userChannels.map(uc => {
          if (uc.id === channelId) {
            return { ...uc, posts: updatedPosts };
          }
          return uc;
        });
        setUserChannels(updatedUserChans);
        localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChans));
        return { ...ch, posts: updatedPosts };
      }
      return ch;
    }));
    showToast(isRtl ? 'مطلب با موفقیت حذف شد' : 'Post deleted successfully');
  };

  // Save Edited Channel Post
  const handleSaveEditPost = (postId: string, channelId: string) => {
    if (!editingPostText.trim()) return;
    const editedText = editingPostText.trim();
    
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        const updatedPosts = ch.posts.map(p => {
          if (p.id === postId) {
            return { 
              ...p, 
              text: editedText,
              text_translations: {
                ...(p.text_translations || {}),
                [activeLang]: editedText
              }
            };
          }
          return p;
        });

        // Save to user channels state and localStorage
        const updatedUserChans = userChannels.map(uc => {
          if (uc.id === channelId) {
            return { ...uc, posts: updatedPosts };
          }
          return uc;
        });
        setUserChannels(updatedUserChans);
        localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChans));
        return { ...ch, posts: updatedPosts };
      }
      return ch;
    }));
    setEditingPostId(null);
    setEditingPostText("");
    showToast(isRtl ? 'مطلب با موفقیت ویرایش شد' : 'Post edited successfully');

    // Background translation of edited post
    setTimeout(async () => {
      try {
        const transTexts = await translateToAllLanguages(editedText, activeLang);
        setChannels(prev => prev.map(ch => {
          if (ch.id === channelId) {
            const updatedPosts = ch.posts.map(p => {
              if (p.id === postId) {
                return { ...p, text_translations: transTexts };
              }
              return p;
            });
            if (ch.ownerId === 'user') {
              const updatedUserChans = userChannels.map(uc => {
                if (uc.id === channelId) {
                  return { ...uc, posts: updatedPosts };
                }
                return uc;
              });
              setUserChannels(updatedUserChans);
              localStorage.setItem('user_created_channels', JSON.stringify(updatedUserChans));
            }
            return { ...ch, posts: updatedPosts };
          }
          return ch;
        }));
      } catch (err) {
        console.error("Background edited post translation failed", err);
      }
    }, 100);
  };

  // AI Channel Post Generator via Gemini API
  const handleGenerateNewAiPost = async (channel: Channel) => {
    if (isGeneratingPost) return;
    setIsGeneratingPost(true);
    showToast(isRtl ? "در حال دریافت خبرنامه و نگارش مطلب جدید توسط هوش مصنوعی..." : "Generating custom article using AI...");

    try {
      const ownerProfile = profiles.find(p => p.id === channel.ownerId) || profiles[0];
      const ownerRole = ownerProfile ? ownerProfile.customRoleLabel || ownerProfile.role : 'Specialist';
      
      const prompt = `شما به عنوان شخصیت "${ownerProfile?.name}" در نقش "${ownerRole}" هستید. یک پست وبلاگی/کانالی جذاب، فوق‌العاده معتبر، دقیق، صمیمی، متناسب با آخرین اخبار واقعی روز، بخشنامه‌های جدید، ترفندها یا راهکارهای طلایی شغل خود برای مخاطبان کانالتان به زبان فارسی صمیمی و روان بنویسید.
      
      ⚠️ بسیار مهم و حیاتی: اخبار و بخشنامه‌های ارائه‌شده باید کاملاً واقعی، معتبر، مستند و علمی باشند. حتماً در انتهای پست یا لابلای متن، لینک‌های مرجع و رسمی واقعی (مانند intamedia.ir برای مالیات، rc.majlis.ir برای حقوقی، behdasht.gov.ir برای پزشکی و بهداشت، یا دیگر مراجع رسمی کشور و سازمان‌های معتبر جهانی به شکل پیوند مستقیم) قرار دهید تا کاملاً قابل پیگیری و مستند باشند.
      
      متن پست باید کامل، غنی، همراه با ایموجی‌های مناسب و پاراگراف‌بندی شکیل باشد.
      همچنین در انتهای پاسخ، یک خط با برچسب "IMAGE_PROMPT: <توصیف عکس به انگلیسی برای Unsplash>" قرار دهید تا یک عکس Unsplash بسیار زیبا و باکیفیت متناسب با متن پست پیدا کنیم.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: `شما یک نگارنده محتوای فوق‌العاده حرفه‌ای، مستندنگار و مشاور دلسوز برای کانال تلگرام صنف خود هستید. لحن شما صمیمی و بسیار دقیق، علمی و مستند است.`,
          history: [],
          contents: [{ text: prompt }] // Corrected body format for parts matching /api/chat route
        })
      });

      if (!res.ok) throw new Error("Gemini API failed");

      const data = await res.json();
      let responseText = data.text || "";

      // Parse Unsplash keyword or prompt from Gemini response
      let imagePrompt = "workplace";
      const imgMatch = responseText.match(/IMAGE_PROMPT:\s*([^\n]+)/i);
      if (imgMatch) {
        imagePrompt = imgMatch[1].trim();
        responseText = responseText.replace(/IMAGE_PROMPT:\s*[^\n]+/i, "").trim();
      }

      // Convert Unsplash keyword/phrase to actual optimized image URL
      const cleanKeyword = encodeURIComponent(imagePrompt.replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 30));
      const fallbackImage = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80`;
      const generatedImageUrl = `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80&sig=${Math.floor(Math.random() * 1000)}&q=${cleanKeyword}` || fallbackImage;

      // Create new channel post
      const newPost: ChannelPost = {
        id: `${channel.id}-ai-post-${Date.now()}`,
        text: responseText,
        image: generatedImageUrl,
        timestamp: new Date(),
        views: Math.floor(1500 + Math.random() * 800),
        likes: [],
        comments: []
      };

      // Retrieve existing AI posts from storage and append the new one
      let existingAiPosts: ChannelPost[] = [];
      try {
        const saved = localStorage.getItem(`channel_ai_posts_${channel.id}`);
        if (saved) {
          existingAiPosts = JSON.parse(saved);
        }
      } catch (err) {}

      const updatedAiPosts = [newPost, ...existingAiPosts];
      localStorage.setItem(`channel_ai_posts_${channel.id}`, JSON.stringify(updatedAiPosts));

      setChannels(prev => prev.map(ch => {
        if (ch.id === channel.id) {
          return {
            ...ch,
            posts: [newPost, ...ch.posts]
          };
        }
        return ch;
      }));

      // Update user created channels in state & storage if applicable
      if (channel.ownerId === 'user') {
        const savedChans = userChannels.map(uc => {
          if (uc.id === channel.id) {
            return { ...uc, posts: [newPost, ...uc.posts] };
          }
          return uc;
        });
        setUserChannels(savedChans);
        localStorage.setItem('user_created_channels', JSON.stringify(savedChans));
      }

      showToast(isRtl ? "مطلب جدید با موفقیت در کانال منتشر شد! 🚀" : "New post published successfully! 🚀");
    } catch (error) {
      console.error(error);
      showToast(isRtl ? "خطا در ارتباط با سرور هوش مصنوعی. دوباره تلاش کنید." : "AI post generation failed.");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Automated background posting check on mount
  useEffect(() => {
    if (channels.length === 0 || hasCheckedAutomatedPost.current) return;

    // Check every 12 hours minimum
    const now = Date.now();
    const lastCheck = localStorage.getItem('last_automated_post_check');
    if (lastCheck && now - Number(lastCheck) < 12 * 60 * 60 * 1000) {
      hasCheckedAutomatedPost.current = true;
      return;
    }

    // Find first channel that could use an automated post (is stale > 24 hrs)
    const eligibleChannel = channels.find(ch => {
      if (ch.ownerId === 'user') return false;
      const lastPost = ch.posts[0];
      if (!lastPost) return true;
      const hoursSinceLastPost = (now - new Date(lastPost.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSinceLastPost > 24;
    });

    if (eligibleChannel) {
      hasCheckedAutomatedPost.current = true;
      localStorage.setItem('last_automated_post_check', String(now));
      
      const timer = setTimeout(() => {
        handleGenerateNewAiPost(eligibleChannel);
      }, 6000); // 6 seconds after load, trigger background update
      
      return () => clearTimeout(timer);
    }
  }, [channels, profiles]);

  const activeChannel = channels.find(c => c.id === selectedChannelId);
  const filteredChannelsList = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPersianDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(new Date(date));
    } catch (e) {
      return new Date(date).toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 relative select-none animate-in fade-in duration-300">
      {/* Toast */}
      {successToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-md text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg border border-white/10 text-center animate-in slide-in-from-top-4 duration-300" dir={isRtl ? "rtl" : "ltr"}>
          {successToast}
        </div>
      )}

      {selectedChannelId === null ? (
        // ================= CHANNELS LIST VIEW =================
        <div className="flex flex-col h-full w-full bg-slate-50 relative">
          {/* Search Bar */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <div className="relative">
              <input 
                type="text" 
                placeholder={isRtl ? "جستجوی کانال‌ها..." : "Search channels..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs text-gray-700 font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm placeholder-gray-400 ${
                  isRtl ? 'text-right' : 'text-left'
                }`}
              />
              <i className={`fas fa-search absolute top-1/2 -translate-y-1/2 text-gray-400 text-xs ${
                isRtl ? 'right-4' : 'left-4'
              }`}></i>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times-circle text-sm"></i>
                </button>
              )}
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto bg-white divide-y divide-gray-50 pb-20 custom-scrollbar">
            {filteredChannelsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400 select-none">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <i className="fas fa-bullhorn text-xl text-gray-300"></i>
                </div>
                <p className="text-xs font-bold text-gray-500">
                  {isRtl ? 'هنوز کانالی فعال نشده است!' : 'No channels active yet!'}
                </p>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed max-w-[240px]">
                  {isRtl 
                    ? 'به محض اضافه کردن شخصیت‌های شغلی (مانند پزشک، روانشناس، سرآشپز، کارشناس مالیاتی و مذهبی) به لیست مخاطبین، کانال رسمی صنف آن‌ها در این قسمت فعال خواهد شد.'
                    : 'As soon as you add professional vocational profiles (Doctor, Psychologist, Chef, Tax Expert, Religious) to your contacts, their channel will appear here.'}
                </p>
              </div>
            ) : (
              filteredChannelsList.map(ch => {
                const latestPost = ch.posts && ch.posts.length > 0 ? ch.posts[0] : null;
                const postText = latestPost ? (latestPost.text_translations?.[activeLang] || latestPost.text) : "";
                const latestText = postText ? postText.substring(0, 60).replace(/[#*`_]/g, "") + '...' : (isRtl ? 'هنوز مطلبی در کانال منتشر نشده است.' : 'No posts published yet.');
                
                return (
                  <div 
                    key={ch.id}
                    onClick={() => setSelectedChannelId(ch.id)}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/75 transition-all cursor-pointer active:bg-slate-100/70"
                    dir={isRtl ? "rtl" : "ltr"}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img src={ch.avatar} alt={ch.name_translations?.[activeLang] || ch.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      {!ch.isSubscribed && (
                        <span className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] text-white font-bold">
                          +
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-gray-950 text-[13.5px] hover:text-[#517da2] transition-colors truncate">
                          {ch.name_translations?.[activeLang] || ch.name}
                        </span>
                        <span className="text-[9px] text-gray-400 font-extrabold whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                          {ch.subscribersCount.toLocaleString()} {isRtl ? 'عضو' : 'subs'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium truncate mt-1 text-right">
                        {latestText}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Create New Channel Button */}
          <button 
            onClick={() => {
              setIsEditingChannel(false);
              setNewChannelName("");
              setNewChannelDesc("");
              setNewChannelAvatar("");
              setNewChannelHandle("");
              setShowCreateChannelModal(true);
            }}
            className="absolute bottom-24 left-5 z-40 bg-gradient-to-r from-[#517da2] to-[#3a5d7c] hover:from-[#436a8d] hover:to-[#2f4d67] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={isRtl ? 'ساخت کانال جدید' : 'Create New Channel'}
          >
            <i className="fas fa-plus text-lg"></i>
          </button>

          {/* Create Channel Modal */}
          {showCreateChannelModal && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 select-text animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col border border-gray-100 text-right animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-50 bg-slate-50 flex items-center justify-between" dir="rtl">
                  <h3 className="font-black text-gray-900 text-sm">
                    {isEditingChannel 
                      ? (isRtl ? 'ویرایش اطلاعات کانال' : 'Edit Channel Info') 
                      : (isRtl ? 'ساخت کانال جدید' : 'Create New Channel')}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowCreateChannelModal(false);
                      setIsEditingChannel(false);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto max-h-[400px]" dir="rtl">
                  {/* Channel Avatar selection */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#517da2]/20 shadow-sm relative group">
                      <img src={newChannelAvatar || "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100"} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById('user-channel-avatar-input');
                          fileInput?.click();
                        }}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-black"
                      >
                        {isRtl ? 'تغییر عکس' : 'Change'}
                      </button>
                      <input 
                        id="user-channel-avatar-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setNewChannelAvatar(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{isRtl ? 'انتخاب عکس کانال' : 'Choose Channel Photo'}</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">{isRtl ? 'نام کانال' : 'Channel Name'}</label>
                    <input 
                      type="text" 
                      placeholder={isRtl ? "نام کانال خود را بنویسید..." : "Enter channel name..."}
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">
                      {isRtl ? 'شناسه منحصر به فرد کانال (آیدی با @)' : 'Unique Channel ID (Handle with @)'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="@my_channel"
                      value={newChannelHandle}
                      onChange={(e) => setNewChannelHandle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-left"
                      dir="ltr"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5 mr-1 text-right">
                      {isRtl ? 'شناسه باید یکتا باشد و نباید با شناسه دیگر کانال‌ها یکی و تکراری باشد.' : 'The handle must be unique and cannot be a duplicate.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">{isRtl ? 'توضیحات کانال' : 'Description'}</label>
                    <textarea 
                      placeholder={isRtl ? "درباره کانال چه محتوایی منتشر می‌کنید؟" : "What is this channel about?"}
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all text-right resize-none"
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex items-center gap-3" dir="rtl">
                  <button 
                    onClick={handleSaveChannel}
                    className="flex-1 py-2.5 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                  >
                    {isEditingChannel 
                      ? (isRtl ? 'ذخیره تغییرات' : 'Save Changes') 
                      : (isRtl ? 'ایجاد کانال' : 'Create Channel')}
                  </button>
                  <button 
                    onClick={() => {
                      setShowCreateChannelModal(false);
                      setIsEditingChannel(false);
                    }}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-black cursor-pointer transition-colors"
                  >
                    {isRtl ? 'انصراف' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ================= CHANNEL VIEW (DETAILED CHATS) =================
        <div className="flex flex-col h-full w-full bg-[#f1f5f9] relative" dir="rtl">
          {/* Channel Detail Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#517da2] to-[#3a5d7c] text-white shadow-md select-none shrink-0" dir="rtl">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button 
                onClick={() => { setSelectedChannelId(null); setActivePostCommentsId(null); }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
                title={t.back}
              >
                <i className="fas fa-arrow-right text-sm"></i>
              </button>

              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/20 shrink-0 bg-gray-50">
                <img src={activeChannel?.avatar} alt={activeChannel?.name_translations?.[activeLang] || activeChannel?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              <div className="flex flex-col text-right min-w-0 flex-1">
                <span className="text-[13px] font-black text-white truncate">{activeChannel?.name_translations?.[activeLang] || activeChannel?.name}</span>
                <span className="text-[10px] text-blue-100/95 font-bold">
                  {activeChannel?.subscribersCount.toLocaleString()} {isRtl ? 'عضو' : 'subscribers'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeChannel && activeChannel.ownerId !== 'user' && (
                <button 
                  onClick={() => handleGenerateNewAiPost(activeChannel)}
                  disabled={isGeneratingPost}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-white text-[10px] font-black rounded-full flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-orange-600/20 cursor-pointer"
                  title="تولید پست جدید با هوش مصنوعی"
                >
                  <i className="fas fa-magic text-[9px] animate-pulse"></i>
                  <span>نگارش مطلب جدید</span>
                </button>
              )}

              {activeChannel && activeChannel.ownerId === 'user' && (
                <button 
                  onClick={() => {
                    setIsEditingChannel(true);
                    setSelectedChannelId(activeChannel.id);
                    setNewChannelName(activeChannel.name);
                    setNewChannelDesc(activeChannel.description || "");
                    setNewChannelAvatar(activeChannel.avatar || "");
                    setNewChannelHandle(activeChannel.handle || "");
                    setShowCreateChannelModal(true);
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title={isRtl ? "ویرایش مشخصات کانال" : "Edit Channel Details"}
                >
                  <i className="fas fa-edit text-base"></i>
                </button>
              )}

              <button 
                onClick={() => setShowChannelInfo(true)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="اطلاعات کانال"
              >
                <i className="fas fa-info-circle text-base"></i>
              </button>
            </div>
          </div>

          {/* Channel Info Modal */}
          {showChannelInfo && activeChannel && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 select-text animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col border border-gray-100 text-right animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center border-b border-gray-50 bg-slate-50 text-center">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#517da2]/20 shadow-md mb-3">
                    <img src={activeChannel.avatar} alt={activeChannel.name_translations?.[activeLang] || activeChannel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-black text-gray-900 text-base">{activeChannel.name_translations?.[activeLang] || activeChannel.name}</h3>
                  <span className="text-xs text-gray-400 font-extrabold mt-1">
                    {activeChannel.subscribersCount.toLocaleString()} {isRtl ? 'عضو رسمی' : 'subscribers'}
                  </span>
                </div>
                <div className="p-5 overflow-y-auto space-y-4 max-h-[300px] text-right font-medium text-xs text-gray-600 leading-relaxed">
                  <div>
                    <span className="block font-black text-gray-900 text-[11px] text-gray-400 mb-1">درباره این کانال:</span>
                    <p>{activeChannel.description_translations?.[activeLang] || activeChannel.description}</p>
                  </div>

                  {/* Channel Invite Link copying section */}
                  <div className="border-t border-gray-100 pt-3">
                    <span className="block font-black text-gray-900 text-[11px] text-gray-400 mb-1">
                      {isRtl ? 'لینک دعوت کانال:' : 'Channel Invite Link:'}
                    </span>
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl mt-1">
                      <span className="font-mono text-[9.5px] text-gray-500 select-all truncate flex-1 text-left" dir="ltr">
                        {activeChannel.inviteLink || `https://t.me/${activeChannel.handle?.replace('@', '')}`}
                      </span>
                      <button
                        onClick={() => {
                          const link = activeChannel.inviteLink || `https://t.me/${activeChannel.handle?.replace('@', '')}`;
                          navigator.clipboard.writeText(link);
                          showToast(isRtl ? 'لینک دعوت با موفقیت کپی شد! 🔗' : 'Invite link copied! 🔗');
                          simulateRealUserJoin(activeChannel.id);
                        }}
                        className="px-2.5 py-1 bg-[#517da2] text-white rounded-lg text-[9px] font-black cursor-pointer hover:bg-[#436a8d] transition-colors shrink-0"
                      >
                        {isRtl ? 'کپی' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[9.5px] text-gray-400 mt-1 leading-normal">
                      {isRtl 
                        ? '💡 با کپی کردن لینک، کاربران واقعی به مرور عضو کانال شما خواهند شد.' 
                        : '💡 By copying the link, real users will join your channel over time.'}
                    </p>
                  </div>

                  {activeChannel.ownerId === 'user' ? (
                    <div className="border-t border-gray-100 pt-3">
                      <span className="block font-black text-gray-900 text-[11px] text-gray-400 mb-1">{isRtl ? 'صاحب کانال:' : 'Channel Owner:'}</span>
                      <p className="font-black text-emerald-600">{settings.userName || (isRtl ? 'شما (کاربر)' : 'You')}</p>
                      
                      <span className="block font-black text-gray-900 text-[11px] text-gray-400 mt-3 mb-1">{isRtl ? 'اعضای هوش مصنوعی عضو کانال:' : 'AI Members:'}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profiles.filter(p => !p.isGroup && !p.realUser).map(p => (
                          <span key={p.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {p.name} ({p.customRoleLabel || p.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 pt-3">
                      <span className="block font-black text-gray-900 text-[11px] text-gray-400 mb-1">صاحب کانال (مخاطب شما):</span>
                      <p className="font-black text-[#517da2]">
                        {profiles.find(p => p.id === activeChannel.ownerId)?.name || 'متخصص شغلی'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 flex items-center gap-3">
                  <button 
                    onClick={() => setShowChannelInfo(false)}
                    className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Channel Posts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar relative bg-[#e7ebf0]">
            {activeChannel?.posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400 select-none">
                <div className="w-14 h-14 bg-white/60 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                  <i className="fas fa-pencil-alt text-lg text-gray-300"></i>
                </div>
                <p className="text-xs font-bold text-gray-500">
                  {isRtl ? 'هنوز هیچ مطلبی منتشر نشده است!' : 'No posts published yet!'}
                </p>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed max-w-[240px]">
                  {activeChannel.ownerId === 'user' 
                    ? (isRtl ? 'از کادر پایین صفحه استفاده کنید و اولین مطلب خود را در کانال منتشر کنید.' : 'Use the box below to publish your first post.')
                    : (isRtl ? 'منتظر انتشار مطالب جذاب و بخشنامه‌های جدید توسط هوش مصنوعی باشید.' : 'Wait for posts to be generated.')}
                </p>
              </div>
            ) : (
              activeChannel?.posts.map(post => (
                <div 
                  key={post.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col text-right hover:shadow-md transition-shadow animate-in slide-in-from-bottom-3 duration-300"
                >
                  {post.image && (
                    <div className="w-full h-44 overflow-hidden relative border-b border-gray-50">
                      <img src={post.image} alt="Post content" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  
                  {/* Text Body */}
                  {editingPostId === post.id ? (
                    <div className="p-4 space-y-2">
                      <textarea
                        value={editingPostText}
                        onChange={(e) => setEditingPostText(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-100 outline-none text-right resize-none font-black"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEditPost(post.id, activeChannel.id)}
                          className="px-3 py-1.5 bg-[#517da2] hover:bg-[#436a8d] text-white text-[10px] font-black rounded-lg cursor-pointer"
                        >
                          {isRtl ? 'ذخیره' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded-lg cursor-pointer"
                        >
                          {isRtl ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-gray-800 font-bold leading-relaxed whitespace-pre-wrap select-text selection:bg-blue-100">
                      {post.text_translations?.[activeLang] || post.text}
                    </div>
                  )}

                  {/* Footer with views, date and actions */}
                  <div className="px-4 py-3 bg-slate-50/80 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                    <div className="flex items-center gap-3.5">
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                        <i className="fas fa-eye text-[10px]"></i>
                        {post.views.toLocaleString()}
                      </span>
                      <span>{formatPersianDate(post.timestamp)}</span>

                      {activeChannel.ownerId === 'user' && (
                        <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-3 text-[9px]">
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditingPostText(post.text);
                            }}
                            className="text-[#517da2] hover:text-[#436a8d] cursor-pointer flex items-center gap-1"
                            title={isRtl ? "ویرایش" : "Edit"}
                          >
                            <i className="fas fa-edit"></i>
                            <span>{isRtl ? "ویرایش" : "Edit"}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id, activeChannel.id)}
                            className="text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-1 ml-2"
                            title={isRtl ? "حذف" : "Delete"}
                          >
                            <i className="fas fa-trash"></i>
                            <span>{isRtl ? "حذف" : "Delete"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Like Action */}
                      <button 
                        onClick={() => handleLikePost(post.id, activeChannel.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                          post.likes.includes(settings.userName || 'کاربر')
                            ? 'bg-red-50 border-red-100 text-red-500 font-black shadow-sm shadow-red-100'
                            : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        <i className="fas fa-heart text-[10px]"></i>
                        <span>{post.likes.length}</span>
                      </button>

                      {/* Comments Action */}
                      <button 
                        onClick={() => setActivePostCommentsId(activePostCommentsId === post.id ? null : post.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                          activePostCommentsId === post.id
                            ? 'bg-blue-50 border-blue-100 text-[#517da2] font-black shadow-sm shadow-blue-50'
                            : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        <i className="fas fa-comment-alt text-[10px]"></i>
                        <span>{post.comments.length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Expandable Panel */}
                  {activePostCommentsId === post.id && (
                    <div className="bg-slate-50 border-t border-gray-100 p-4 space-y-3.5 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between text-[11px] font-black text-gray-400 mb-1 border-b border-gray-100 pb-2">
                        <span>دیدگاه‌ها ({post.comments.length})</span>
                        <i className="fas fa-comments"></i>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {post.comments.length === 0 ? (
                          <p className="text-[10px] text-center text-gray-400 italic py-2">اولین نفری باشید که دیدگاهی ثبت می‌کند...</p>
                        ) : (
                          post.comments.map(c => (
                            <div key={c.id} className="flex gap-2.5 text-right items-start animate-in fade-in duration-300">
                              <div className="w-7 h-7 rounded-full bg-[#517da2]/10 text-[#517da2] font-black flex items-center justify-center text-[10px] shrink-0 border border-[#517da2]/5">
                                {c.userName.charAt(0)}
                              </div>
                              <div className="flex-1 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-black text-gray-900">{c.userName}</span>
                                  <span className="text-[8px] text-gray-400 font-mono">
                                    {new Date(c.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-700 leading-relaxed font-bold">{c.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Write a comment */}
                      <div className="flex gap-2 border-t border-gray-100 pt-3">
                        <input 
                          type="text"
                          placeholder="نوشتن دیدگاه..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id, activeChannel.id);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-[10.5px] font-bold outline-none focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
                        />
                        <button 
                          onClick={() => handleAddComment(post.id, activeChannel.id)}
                          className="w-9 h-9 bg-[#517da2] hover:bg-[#436a8d] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          <i className="fas fa-paper-plane text-[11px] -rotate-45"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom Bar: Mute/Join OR Publishing input for the Owner */}
          <div className="absolute bottom-0 left-0 right-0 z-30 shrink-0 select-none border-t border-gray-100 bg-white shadow-lg">
            {activeChannel?.ownerId === 'user' ? (
              <div className="p-3 bg-white flex gap-2">
                <input 
                  type="text"
                  placeholder={isRtl ? "ارسال مطلب جدید به کانال..." : "Send new post to channel..."}
                  value={userPostText}
                  onChange={(e) => setUserPostText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePublishUserPost(activeChannel.id);
                  }}
                  disabled={isPublishingUserPost}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#517da2]/20 transition-all text-right font-black"
                />
                <button 
                  onClick={() => handlePublishUserPost(activeChannel.id)}
                  disabled={isPublishingUserPost || !userPostText.trim()}
                  className="w-10 h-10 bg-[#517da2] hover:bg-[#436a8d] disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/10 shrink-0 animate-in fade-in"
                >
                  {isPublishingUserPost ? (
                    <i className="fas fa-spinner animate-spin text-xs"></i>
                  ) : (
                    <i className="fas fa-paper-plane text-xs -rotate-45"></i>
                  )}
                </button>
              </div>
            ) : activeChannel?.isSubscribed ? (
              <div className="bg-white flex">
                <button 
                  onClick={() => handleToggleSubscribe(activeChannel.id)}
                  className="flex-1 py-3.5 text-center text-red-500 hover:bg-red-50/50 transition-colors font-black text-xs cursor-pointer border-r border-gray-100"
                >
                  <i className="fas fa-sign-out-alt ml-1.5 text-[10px]"></i>
                  خروج از کانال
                </button>
                <button 
                  onClick={() => showToast(isRtl ? 'اعلان‌های کانال با موفقیت بی‌صدا شد' : 'Channel notifications muted')}
                  className="flex-1 py-3.5 text-center text-gray-500 hover:bg-gray-50 transition-colors font-black text-xs cursor-pointer"
                >
                  <i className="fas fa-bell-slash ml-1.5 text-[10px]"></i>
                  بی‌صدا کردن
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleToggleSubscribe(activeChannel!.id)}
                className="w-full py-4 bg-[#517da2] hover:bg-[#436a8d] text-white text-center font-black text-xs transition-all tracking-wider shadow-inner cursor-pointer"
              >
                عضویت در کانال (JOIN)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
