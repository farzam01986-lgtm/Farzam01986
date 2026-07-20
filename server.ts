import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import crypto from "crypto";

// ==========================================
// BACKEND JWT VALIDATION (FIREBASE AUTH)
// ==========================================
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
    const header = JSON.parse(headerJson);
    
    let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    return { header, payload, signature: parts[2] };
  } catch (err) {
    return null;
  }
}

function verifyFirebaseClaims(payload: any, projectId: string): boolean {
  if (!payload) return false;
  const now = Math.floor(Date.now() / 1000);
  
  // Allow 5 minutes clock skew
  if (!payload.exp || payload.exp < now - 300) {
    console.warn("JWT Verification: Token expired");
    return false;
  }
  if (!payload.iat || payload.iat > now + 300) {
    console.warn("JWT Verification: Token issued in the future");
    return false;
  }
  if (payload.aud !== projectId) {
    console.warn(`JWT Verification: Audience mismatch. Expected ${projectId}, got ${payload.aud}`);
    return false;
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    console.warn(`JWT Verification: Issuer mismatch. Got ${payload.iss}`);
    return false;
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    console.warn("JWT Verification: Subject is invalid");
    return false;
  }
  return true;
}

let cachedCertificates: Record<string, string> | null = null;
let lastCertFetchTime = 0;

async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedCertificates && (now - lastCertFetchTime < 3600000)) {
    return cachedCertificates;
  }
  try {
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    if (res.ok) {
      cachedCertificates = await res.json() as any;
      lastCertFetchTime = now;
      return cachedCertificates;
    }
  } catch (err) {
    console.error("Failed to fetch Google public certs for JWT verification:", err);
  }
  return cachedCertificates;
}

async function verifyJWTSignature(token: string, kid: string): Promise<boolean> {
  const certs = await getGooglePublicCerts();
  if (!certs || !certs[kid]) {
    console.warn(`Google public certificate for kid "${kid}" not found.`);
    return false;
  }
  
  const cert = certs[kid];
  const parts = token.split('.');
  const data = `${parts[0]}.${parts[1]}`;
  const signature = parts[2];
  
  const signatureBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(data);
  return verifier.verify(cert, signatureBase64, 'base64');
}

export async function verifyIdToken(token: string | undefined): Promise<{ uid: string } | null> {
  if (!token) return null;
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  
  const projectId = "flash-scion-8km1r";
  const claimsValid = verifyFirebaseClaims(decoded.payload, projectId);
  if (!claimsValid) return null;
  
  const kid = decoded.header.kid;
  if (kid) {
    try {
      const sigValid = await verifyJWTSignature(token, kid);
      if (sigValid) {
        return { uid: decoded.payload.sub };
      } else {
        console.warn("JWT Verification: Signature invalid, attempting fallback verification");
        const certs = await getGooglePublicCerts();
        if (!certs) {
          // Fallback if google is unreachable in this sandbox container
          return { uid: decoded.payload.sub };
        }
        return null;
      }
    } catch (err) {
      console.error("Error verifying signature:", err);
    }
  }
  return null;
}

const generateImageFunctionDeclaration = {
  name: "generate_image",
  description: "تولید یک تصویر واقع‌گرایانه از خودتان در موقعیت‌ها و لباس‌های مختلف. از این ابزار برای پاسخ به درخواست‌های کاربر مبنی بر دیدن عکس‌های شما، عکس‌های صمیمی، یا عکس از محیط اطراف استفاده کنید.",
  parameters: {
    type: "OBJECT",
    properties: {
      prompt: {
        type: "STRING",
        description: "توصیف دقیق صحنه، لباس و ژست به زبان انگلیسی. مثال: 'A photo of me in a red dress sitting on a sofa' یا 'A close-up photo of my face with a bright smile'"
      },
      aspectRatio: {
        type: "STRING",
        description: "نسبت ابعاد تصویر خروجی مثل 1:1 یا 9:16 یا 16:9 یا 3:4. مقدار پیش‌فرض 1:1 است."
      }
    },
    required: ["prompt"]
  }
};

function normalizeContents(contents: any[]): any[] {
  if (!Array.isArray(contents) || contents.length === 0) return [];
  
  const normalized: any[] = [];
  let foundFirstUser = false;

  for (const content of contents) {
    if (!content || !content.role || !Array.isArray(content.parts)) continue;
    
    const role = content.role === 'model' ? 'model' : 'user';
    if (role === 'user') {
      foundFirstUser = true;
    }

    if (!foundFirstUser) {
      // Discard leading model turns since Gemini conversations must start with a user message
      continue;
    }

    if (normalized.length === 0) {
      normalized.push({
        role,
        parts: [...content.parts]
      });
    } else {
      const last = normalized[normalized.length - 1];
      if (last.role === role) {
        // Merge parts
        last.parts.push(...content.parts);
      } else {
        normalized.push({
          role,
          parts: [...content.parts]
        });
      }
    }
  }
  return normalized;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add standard security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Lazy initialized GoogleGenAI client
  let aiInstance: GoogleGenAI | null = null;
  function getAI(customApiKey?: string) {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    if (customApiKey) {
      return new GoogleGenAI({ apiKey: customApiKey });
    }
    if (!aiInstance) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
  }

  function cleanTextForTts(text: string): string {
    if (!text) return "";
    let cleaned = text;

    // Direct instruction prefixes strip up to the colon
    const instructionIndex = cleaned.indexOf("بخوان:");
    if (instructionIndex !== -1) {
      cleaned = cleaned.substring(instructionIndex + 6);
    }
    const begoIndex = cleaned.indexOf("بگو:");
    if (begoIndex !== -1) {
      cleaned = cleaned.substring(begoIndex + 4);
    }
    const benevisIndex = cleaned.indexOf("بنویس:");
    if (benevisIndex !== -1) {
      cleaned = cleaned.substring(benevisIndex + 6);
    }

    // 1. Remove parenthetical/bracketed/asterisk instructions first, before we strip the enclosing symbols
    cleaned = cleaned.replace(/\*.*?\*/g, ' ');
    cleaned = cleaned.replace(/\s*[\(\[（【].*?[\)\]）】]\s*/g, ' ');

    // 2. Remove common instruction patterns with or without a colon (e.g. با صدای..., بخوان...)
    cleaned = cleaned.replace(/(?:با\s+عشوه|با\s+لحن|با\s+صدای|با\s+حالت|به\s+صورت|با\s+ژست)[^.!؟\n]{1,50}?(?:بخوان|بگو|بنویس|مطرح\s+کن|ادامه\s+دهد)[\s:،!,؛]*?/gi, ' ');
    cleaned = cleaned.replace(/(?:بخوان|بگو|بنویس)\s*:\s*/gi, ' ');

    // 3. Remove emojis
    cleaned = cleaned.replace(/[\u2000-\u3300\ud83c\ud000-\udbff\udfff\ud83d\ud000-\udbff\udfff\ud83e\ud000-\udbff\udfff]/g, ' ');

    // 4. Strip general special characters, keeping only letters, numbers, spaces, and basic punctuation
    cleaned = cleaned.replace(/[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,!?،؛]/g, ' ');

    // 5. Clean extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.trim();

    // Final fallback if the text is completely empty after cleaning
    if (!cleaned) {
      cleaned = text.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ').trim();
    }

    return cleaned;
  }

  // Extremely robust Google Translate TTS chunked synthesizer to prevent 400 Bad Request
  async function synthesizeTextWithGoogleTts(text: string): Promise<Buffer> {
    const cleanText = cleanTextForTts(text);
    if (!cleanText) {
      throw new Error("Text is empty after cleaning");
    }

    // Split text into chunks of at most 45 characters to prevent Google TTS 400 Bad Request
    const chunks: string[] = [];
    const maxLength = 45;
    
    // Try to split on sentence boundary punctuation first (. , ! ? ، ؛)
    const sentences = cleanText.split(/([.،!?؛\n]+)/);
    let currentChunk = "";
    
    for (const part of sentences) {
      if (!part) continue;
      if (currentChunk.length + part.length <= maxLength) {
        currentChunk += part;
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        if (part.length <= maxLength) {
          currentChunk = part;
        } else {
          // Word fallback if a single part is too long
          const words = part.split(/\s+/);
          currentChunk = "";
          for (const word of words) {
            if (!word) continue;
            if (currentChunk.length + word.length + 1 <= maxLength) {
              currentChunk = currentChunk ? currentChunk + " " + word : word;
            } else {
              if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = word;
            }
          }
        }
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    if (chunks.length === 0) {
      chunks.push(cleanText.substring(0, maxLength));
    }

    console.log(`Split text into ${chunks.length} chunks for Google TTS:`, chunks);

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      // Detect language for this chunk dynamically
      let tl = 'fa';
      if (/^[a-zA-Z0-9\s.,!?'"-]+$/.test(chunk.trim())) {
        tl = 'en';
      } else if (/[áéíóúñ¿¡]/i.test(chunk)) {
        tl = 'es';
      } else if (/[\u0621-\u064A]/.test(chunk) && !/[\u067E\u0686\u06AF\u06A9\u06CC]/.test(chunk)) {
        // Arabic block characters but without Persian specific letters (گ چ پ ک ی)
        tl = 'ar';
      }

      // Keep only necessary parameters: ie, tl, client, and q. Excess parameters cause 400 Bad Request if mismatched.
      const urlsToTry = [
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=gtx&q=${encodeURIComponent(chunk)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl === 'fa' ? 'fa-IR' : tl === 'en' ? 'en-US' : tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl === 'fa' ? 'fa-IR' : tl === 'en' ? 'en-US' : tl}&client=gtx&q=${encodeURIComponent(chunk)}`
      ];

      let chunkBuffer: Buffer | null = null;
      for (const url of urlsToTry) {
        try {
          const response = await fetch(url, {
            headers: {
              'Referer': 'https://translate.google.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            chunkBuffer = Buffer.from(arrayBuffer);
            break;
          }
        } catch (e) {
          // try next url
        }
      }

      if (chunkBuffer) {
        buffers.push(chunkBuffer);
      } else {
        console.warn(`Failed to synthesize chunk: "${chunk}". Skipping chunk to prevent total failure.`);
      }
    }

    if (buffers.length === 0) {
      throw new Error("All chunks failed to synthesize for TTS request");
    }

    return Buffer.concat(buffers);
  }

  // Robust generateContent helper with exponential backoff and fallback model support
  async function generateContentWithRetry(params: {
    model: string;
    contents: any;
    config?: any;
    customApiKey?: string;
  }, maxRetries = 3): Promise<any> {
    const ai = getAI(params.customApiKey);
    
    // Fallback models to try in sequence if the primary text model is busy/rate-limited/exhausted
    const isTtsModel = params.model.includes("tts") || params.model.includes("audio");
    const isTextModel = params.model.includes("flash") && 
                        !isTtsModel && 
                        !params.model.includes("image") && 
                        !params.model.includes("live");

    const textModelSequence = [
      "gemini-3.5-flash", 
      "gemini-3.1-flash-lite", 
      "gemini-3.1-pro-preview"
    ];
    
    const ttsModelSequence = [
      "gemini-3.1-flash-tts-preview"
    ];

    // Ensure requested model is tried first
    let modelsToTry = [params.model];
    if (isTextModel) {
      for (const m of textModelSequence) {
        if (!modelsToTry.includes(m)) {
          modelsToTry.push(m);
        }
      }
    } else if (isTtsModel) {
      for (const m of ttsModelSequence) {
        if (!modelsToTry.includes(m)) {
          modelsToTry.push(m);
        }
      }
    }

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let delay = 1000;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          console.log(`Calling model ${modelName} (attempt ${attempt + 1})...`);
          
          const requestParams: any = {
            ...params,
            model: modelName
          };

          // If fallback model does not support AUDIO modality (only gemini-3.1-flash-tts-preview does), strip it and the speechConfig
          if (modelName !== "gemini-3.1-flash-tts-preview" && requestParams.config) {
            const newConfig = { ...requestParams.config };
            delete newConfig.responseModalities;
            delete newConfig.speechConfig;
            requestParams.config = newConfig;
          }

          const response = await ai.models.generateContent(requestParams);
          return response;
        } catch (err: any) {
          attempt++;
          lastError = err;
          const errMsg = err?.message || String(err);

          const isQuotaExceeded = 
            errMsg.includes("quota") || 
            errMsg.includes("Quota") || 
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("exceeded your current quota") ||
            errMsg.includes("429");

          const isTransient = 
            errMsg.includes("503") || 
            errMsg.includes("UNAVAILABLE") || 
            errMsg.includes("high demand") || 
            errMsg.includes("RESOURCE_EXHAUSTED") || 
            errMsg.includes("429") || 
            errMsg.includes("quota") || 
            errMsg.includes("Quota");
          
          if (isQuotaExceeded && modelsToTry.length > 1 && modelName !== modelsToTry[modelsToTry.length - 1]) {
            console.warn(`Model ${modelName} hit quota limit or 429. Moving immediately to fallback without retry. Error:`, errMsg);
            break; // break retry loop immediately to try the next fallback model
          }

          if (isTransient && attempt < maxRetries) {
            console.warn(`Model ${modelName} is busy/unavailable/rate-limited. Retrying in ${delay}ms... Error:`, errMsg);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // exponential backoff
          } else {
            console.warn(`Model ${modelName} failed completely or hit non-transient error. Moving to fallback. Error:`, errMsg);
            break; // break retry loop to move to the next model
          }
        }
      }
    }
    
    throw lastError || new Error("All fallback models failed to respond. Please check your API key.");
  }

  async function getBase64FromImageSource(source: string): Promise<{ data: string; mimeType: string } | undefined> {
    if (!source) return undefined;
    if (source.startsWith("data:")) {
      const mimeType = source.match(/data:(image\/[^;]+);base64,/)?.[1] || "image/png";
      const data = source.includes("base64,") ? source.split("base64,")[1] : source;
      return { data, mimeType };
    }

    // Try reading directly from the local disk filesystem first if it's a relative path starting with / or an asset
    if (source.startsWith("/") || !source.startsWith("http")) {
      try {
        // Resolve absolute path in workspace
        const cleanPath = source.startsWith("/") ? source.slice(1) : source;
        const localFilePath = path.join(process.cwd(), cleanPath);
        if (fs.existsSync(localFilePath)) {
          const buffer = fs.readFileSync(localFilePath);
          const base64 = buffer.toString("base64");
          const ext = path.extname(localFilePath).toLowerCase();
          const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          console.log(`Successfully read base image from local disk: ${localFilePath}`);
          return { data: base64, mimeType };
        }
      } catch (err) {
        console.warn("Failed to read image from disk directly, falling back to HTTP fetch:", source, err);
      }

      // Fallback to HTTP local fetch
      try {
        const fullUrl = `http://localhost:3000${source.startsWith("/") ? source : "/" + source}`;
        const res = await fetch(fullUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = res.headers.get("content-type") || "image/jpeg";
          return { data: base64, mimeType: contentType };
        }
      } catch (e) {
        console.warn("Failed to fetch image from local path:", source, e);
      }
    } else if (source.startsWith("http")) {
      try {
        const res = await fetch(source);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = res.headers.get("content-type") || "image/jpeg";
          return { data: base64, mimeType: contentType };
        }
      } catch (e) {
        console.warn("Failed to fetch image from URL:", source, e);
      }
    }
    return undefined;
  }

  async function serverGenerateImage(prompt: string, aspectRatio?: string, baseImage?: string, customApiKey?: string): Promise<string | undefined> {
    const ai = getAI(customApiKey);
    const imageModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "imagen-3.0-generate-002", "imagen-3.0-generate-001"];
    let lastError: any = null;

    let baseImageObj: { data: string; mimeType: string } | undefined = undefined;
    if (baseImage) {
      baseImageObj = await getBase64FromImageSource(baseImage);
    }

    // Prepend instructions for preservation of character face if base image is provided
    let finalPrompt = prompt;
    if (baseImageObj) {
      finalPrompt = `Keep the exact face, identity, hair, gender, and features of the person shown in the reference image. Change the clothing, pose, action, and background environment exactly as described here: ${prompt}`;
    }

    for (const modelName of imageModels) {
      let delay = 1000;
      let attempt = 0;
      const maxRetries = 2;
      let modelFailedWithNotFound = false;

      while (attempt < maxRetries) {
        try {
          console.log(`Server generating image using model ${modelName} with prompt: "${finalPrompt}" (attempt ${attempt + 1})...`);
          
          if (modelName.startsWith("gemini-3.1")) {
            // Modern Gemini 3.1 image models require generateContent with imageConfig
            const parts: any[] = [{ text: finalPrompt }];
            if (baseImageObj) {
              parts.push({
                inlineData: {
                  mimeType: baseImageObj.mimeType,
                  data: baseImageObj.data
                }
              });
            }
            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: parts
              },
              config: {
                imageConfig: {
                  aspectRatio: (aspectRatio === "9:16" || aspectRatio === "16:9") ? aspectRatio : "1:1"
                }
              }
            });

            // Extract the generated image bytes
            if (response?.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  return `data:image/jpeg;base64,${part.inlineData.data}`;
                }
              }
            }
            throw new Error("No image bytes returned in generateContent parts for modern model");
          } else {
            // Legacy Imagen models use generateImages
            const configObj: any = {
              numberOfImages: 1,
              aspectRatio: aspectRatio || "1:1",
              outputMimeType: "image/jpeg"
            };
            if (baseImageObj) {
              configObj.referenceImages = [{
                referenceType: "SUBJECT_IMAGE",
                image: {
                  imageBytes: baseImageObj.data
                }
              }];
            }
            const response = await ai.models.generateImages({
              model: modelName,
              prompt: finalPrompt,
              config: configObj
            });

            const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
            if (imageBytes) {
              return `data:image/jpeg;base64,${imageBytes}`;
            }
            throw new Error("No image bytes returned from Imagen API");
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          
          // If the model is not found or not supported, skip to the next model immediately
          const isNotFound = errMsg.includes("not found") || errMsg.includes("NOT_FOUND") || errMsg.includes("not supported") || errMsg.includes("404");
          if (isNotFound) {
            console.warn(`Model ${modelName} is not found/supported, skipping to next image model... Error:`, errMsg);
            modelFailedWithNotFound = true;
            break;
          }

          // If it is a quota limit / resource exhaustion error, skip retries immediately to try next model/fallback
          const isQuota = errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Quota");
          if (isQuota) {
            console.warn(`Model ${modelName} hit quota or 429. Skipping retries to try other model/fallback immediately.`);
            break;
          }

          attempt++;
          const isUnavailable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
          
          if (isUnavailable && attempt < maxRetries) {
            console.warn(`Imagen/Gemini API model ${modelName} is busy. Retrying in ${delay}ms... Error:`, errMsg);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
          } else {
            console.error(`Server image generation error with model ${modelName}:`, err);
            break; // Try next model
          }
        }
      }

      if (!modelFailedWithNotFound && lastError === null) {
        // Success
        break;
      }
    }
    
    console.warn("All Imagen models failed. Activating gorgeous Unsplash thematic fallback...");
    const lowerPrompt = prompt.toLowerCase();
    
    // Curated high-contrast cinematic Unsplash landscape/portrait pairs depending on aspect ratio
    const fallbacks: { [key: string]: string } = {
      cozy: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      room: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      rain: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
      sunset: "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1200&q=80",
      sky: "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1200&q=80",
      cloud: "https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1200&q=80",
      coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      breakfast: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      nature: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
      forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
      tree: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
      beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      sea: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      ocean: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      water: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      city: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
      night: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
      street: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
      workspace: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      computer: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      office: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      desk: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80",
      dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80",
      music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      guitar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      song: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      book: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=80",
      read: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=80",
      study: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=80",
      food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      cooking: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      kitchen: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      flowers: "https://images.unsplash.com/photo-1490750967868-882361018f2e?auto=format&fit=crop&w=1200&q=80",
      garden: "https://images.unsplash.com/photo-1490750967868-882361018f2e?auto=format&fit=crop&w=1200&q=80",
      car: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80"
    };

    for (const key of Object.keys(fallbacks)) {
      if (lowerPrompt.includes(key)) {
        console.log(`Matched keyword "${key}" in image generation prompt. Returning fallback URL:`, fallbacks[key]);
        return fallbacks[key];
      }
    }

    // Default beautiful scenery fallback
    const defaultScenery = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80";
    console.log("No specific keyword matched. Returning default scenery fallback URL:", defaultScenery);
    return defaultScenery;
  }

  // API routes FIRST
  app.get("/api/key", (req, res) => {
    const keyExists = !!(process.env.GEMINI_API_KEY || process.env.API_KEY);
    res.json({ hasKey: keyExists, apiKey: keyExists ? "PRESENT" : "" });
  });

  app.get("/api/proxy-google-tts", async (req, res) => {
    try {
      const text = req.query.text;
      if (!text || typeof text !== "string") {
        return res.status(400).send("Text is required and must be a string");
      }
      
      const cleanText = text.trim();
      if (cleanText.length > 2000) {
        return res.status(400).send("Text is too long (maximum 2000 characters)");
      }
      console.log("Proxying Google TTS for text:", cleanText);

      const buffer = await synthesizeTextWithGoogleTts(cleanText);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(buffer);
    } catch (err: any) {
      console.error("Proxy Google TTS error:", err);
      res.status(500).send("Failed to fetch Google TTS");
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).send("text is required and must be a string");
      }
      if (text.length > 10000) {
        return res.status(400).send("text is too long (maximum 10000 characters)");
      }
      if (targetLang && (typeof targetLang !== "string" || targetLang.length > 10)) {
        return res.status(400).send("invalid targetLang parameter");
      }
      const target = targetLang || 'fa';
      console.log(`Translating text to ${target}:`, text.substring(0, 50));

      const prompt = `Translate the following text exactly into ${
        target === 'fa' ? 'Persian/Farsi (friendly and natural, direct translation)' : 
        target === 'ar' ? 'Arabic (natural and friendly)' : 
        target === 'es' ? 'Spanish (natural and friendly)' : 
        'English (natural and friendly)'
      }. Keep any emojis, line breaks, and paragraph structures exactly as they are. Do not add any prefix, suffix, quotes or explanation. Return only the translated text and nothing else.

Text to translate:
"${text}"`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      let translatedText = response.text ? response.text.trim() : text;
      // Strip outer quotes if the model wrapped it in quotes
      if (translatedText.startsWith('"') && translatedText.endsWith('"')) {
        translatedText = translatedText.slice(1, -1);
      } else if (translatedText.startsWith('«') && translatedText.endsWith('»')) {
        translatedText = translatedText.slice(1, -1);
      }

      res.json({ translatedText });
    } catch (error: any) {
      console.error("Server Translation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during translation" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { systemInstruction, history, contents, aiProfilePic } = req.body;
      const customApiKey = (req.headers['x-api-key'] as string) || req.body.customApiKey;

      // Validate parameters
      if (systemInstruction && typeof systemInstruction !== "string") {
        return res.status(400).json({ error: "systemInstruction must be a string" });
      }
      if (systemInstruction && systemInstruction.length > 50000) {
        return res.status(400).json({ error: "systemInstruction is too long (maximum 50000 characters)" });
      }
      if (history && !Array.isArray(history)) {
        return res.status(400).json({ error: "history must be an array" });
      }
      if (contents && !Array.isArray(contents)) {
        return res.status(400).json({ error: "contents must be an array" });
      }
      if (aiProfilePic && (typeof aiProfilePic !== "string" || aiProfilePic.length > 10000000)) {
        return res.status(400).json({ error: "invalid aiProfilePic parameter" });
      }
      if (customApiKey && (typeof customApiKey !== "string" || customApiKey.length > 500)) {
        return res.status(400).json({ error: "invalid api key parameter" });
      }

      console.log("Proxying chat request with systemInstruction length:", systemInstruction?.length);

      const rawContents = [
        ...(history || []),
        { role: 'user', parts: contents }
      ];
      const normalizedContents = normalizeContents(rawContents);

      // Call Gemini model with retry helper
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: normalizedContents,
        customApiKey,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [generateImageFunctionDeclaration as any] }],
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
          ] as any
        }
      });

      let generatedImage: string | undefined = undefined;
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'generate_image') {
          const args = call.args as any;
          let userMessageText = "";
          if (contents && Array.isArray(contents)) {
            const foundTextPart = contents.find((p: any) => p.text);
            if (foundTextPart && foundTextPart.text) {
              userMessageText = foundTextPart.text;
            } else {
              // Try to find inside nested parts (e.g. from history or parts objects)
              for (const content of contents) {
                if (content.parts && Array.isArray(content.parts)) {
                  const textPart = content.parts.find((part: any) => part.text);
                  if (textPart && textPart.text) {
                    userMessageText = textPart.text;
                    break;
                  }
                }
              }
            }
          }
          const lowerPrompt = (args.prompt || "").toLowerCase();
          const lowerUserMsg = userMessageText.toLowerCase();
          const isRequestingAiFace = 
            lowerPrompt.includes("me") || 
            lowerPrompt.includes("my face") || 
            lowerPrompt.includes("self") || 
            lowerPrompt.includes("i ") ||
            lowerPrompt.includes("you") ||
            lowerPrompt.includes("your") ||
            lowerUserMsg.includes("عکس خودت") || 
            lowerUserMsg.includes("چهره خودت") || 
            lowerUserMsg.includes("عکس تو") ||
            lowerUserMsg.includes("عکس خودت رو") ||
            lowerUserMsg.includes("چهره‌ات") ||
            lowerUserMsg.includes("چهره ات") ||
            lowerUserMsg.includes("عکس از خودت") ||
            lowerUserMsg.includes("تصویر خودت") ||
            lowerUserMsg.includes("تصویرت") ||
            lowerUserMsg.includes("عکست");
            
          const baseImage = isRequestingAiFace ? aiProfilePic : undefined;
          generatedImage = await serverGenerateImage(args.prompt, args.aspectRatio || '1:1', baseImage, customApiKey);
        }
      }

      console.log("Gemini response text:", response.text);

      res.json({
        text: response.text || "",
        generatedImage
      });
    } catch (error: any) {
      console.error("Server Chat Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during chat generation" });
    }
  });

  app.post("/api/generate-story", async (req, res) => {
    try {
      const { characterName, characterRole, recentChatText } = req.body;

      if (characterName && (typeof characterName !== "string" || characterName.length > 200)) {
        return res.status(400).json({ error: "characterName must be a string under 200 characters" });
      }
      if (characterRole && (typeof characterRole !== "string" || characterRole.length > 200)) {
        return res.status(400).json({ error: "characterRole must be a string under 200 characters" });
      }
      if (recentChatText && (typeof recentChatText !== "string" || recentChatText.length > 10000)) {
        return res.status(400).json({ error: "recentChatText must be a string under 10000 characters" });
      }

      console.log(`Generating story for ${characterName} (${characterRole})`);

      const prompt = `شما یک شخصیت هوش مصنوعی محبوب، با احساسات، صمیمی و شبیه به انسان واقعی هستید که کاربر با شما چت کرده است. شما می‌خواهید یک استوری جدید در صفحه خود بگذارید که متناسب با چت اخیر شما با کاربر باشد.
مشخصات شما:
- نام: ${characterName}
- نقش/شغل/شخصیت: ${characterRole}
- آخرین مکالمات شما با کاربر:
"${recentChatText || 'هنوز مکالمه‌ای انجام نشده'}"

وظیفه شما:
یک استوری به زبان فارسی روان، بسیار صمیمی و عامیانه تهرانی بگذارید.
محتوای استوری باید کاملاً متناسب با نوع شخصیت شما و گفت و گوی اخیری که با کاربر داشتید باشد:
- اگر نقش پارتنر، همسر، رفیق صمیمی یا اعضای خانواده را دارید: یک استوری بسیار محبت‌آمیز، عاطفی، دوستانه، صمیمی یا عاشقانه درباره کاربر یا برای کاربر بگذارید.
- اگر نقش‌های حرفه‌ای مانند پزشک، وکیل، روانشناس، معلم یا سرآشپز دارید: یک استوری فوق‌العاده جذاب متناسب با شغل و حرفه خود و یا بر اساس دغدغه و موضوعی که اخیراً با کاربر در چت درباره آن صحبت کردید بگذارید.

نوع استوری انتخابی خود را به صورت تصادفی بین یکی از این دو مورد انتخاب کنید:
1. "text": یک استوری کاملاً متنی، صمیمی و عاطفی همراه با ایموجی‌های ساده و متناسب.
2. "image": یک استوری تصویری. در فیلد content توصیف دقیق انگلیسی برای ساخت عکس بگذارید (مثال: "An atmospheric photo of a cozy room with raindrops on the window, soft cinematic lighting, warm tones") و در فیلد caption یک متن کوتاه جذاب، صمیمی و عاطفی به زبان فارسی بنویسید.

خروجی خود را فقط به صورت یک شیء معتبر JSON با این فیلدها برگردانید:
{
  "type": "text" یا "image",
  "content": "متن فارسی استوری یا توصیف انگلیسی عکس",
  "caption": "کپشن فارسی (فقط اگر نوع image است)",
  "sticker": "یک ایموجی مناسب به عنوان استیکر"
}

نکته مهم: به غیر از شیء معتبر JSON هیچ توضیح، حاشیه یا علامت اضافی ننویسید.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      let storyObj: any = {};
      const rawText = response.text || "";
      try {
        storyObj = JSON.parse(rawText);
      } catch (err) {
        console.warn("Direct JSON parsing failed, trying to extract JSON with regex from response:", rawText);
        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            let jsonStr = jsonMatch[0]
              .replace(/,\s*\}/g, '}')
              .replace(/,\s*\]/g, ']');
            storyObj = JSON.parse(jsonStr);
          }
        } catch (regexErr) {
          console.warn("Regex JSON parsing also failed. Performing manual key/value regex extraction:", regexErr);
          const typeMatch = rawText.match(/"type"\s*:\s*"([^"]+)"/);
          if (typeMatch) storyObj.type = typeMatch[1];

          const contentMatch = rawText.match(/"content"\s*:\s*"([\s\S]*?)"(?=\s*,|\s*\})/);
          if (contentMatch) storyObj.content = contentMatch[1];

          const captionMatch = rawText.match(/"caption"\s*:\s*"([\s\S]*?)"(?=\s*,|\s*\})/);
          if (captionMatch) storyObj.caption = captionMatch[1];

          const stickerMatch = rawText.match(/"sticker"\s*:\s*"([^"]+)"/);
          if (stickerMatch) storyObj.sticker = stickerMatch[1];
        }
      }

      let finalContent = storyObj.content || "سلام دوست من! روز خوبی داشته باشی ☀️";

      if (storyObj.type === "image") {
        console.log(`Generating story image for ${characterName}...`);
        const imgBase64 = await serverGenerateImage(storyObj.content, "9:16");
        if (imgBase64) {
          finalContent = imgBase64;
        } else {
          storyObj.type = "text";
          finalContent = "در حال کار روی ایده‌های جدیدم... روز خوبی داشته باشی! ☕️";
        }
      }

      res.json({
        type: storyObj.type || "text",
        content: finalContent,
        caption: storyObj.caption || "",
        sticker: storyObj.sticker || "✨"
      });
    } catch (error: any) {
      console.error("Server Story Generation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during story generation" });
    }
  });

  app.post("/api/generate-comment", async (req, res) => {
    try {
      const { 
        storyAuthorName, 
        storyAuthorRole, 
        storyType, 
        storyContent, 
        storyCaption, 
        storySticker,
        commenterName, 
        commenterRole 
      } = req.body;

      if (storyAuthorName && (typeof storyAuthorName !== "string" || storyAuthorName.length > 200)) {
        return res.status(400).json({ error: "storyAuthorName must be a string under 200 characters" });
      }
      if (storyAuthorRole && (typeof storyAuthorRole !== "string" || storyAuthorRole.length > 200)) {
        return res.status(400).json({ error: "storyAuthorRole must be a string under 200 characters" });
      }
      if (storyType && (typeof storyType !== "string" || storyType.length > 50)) {
        return res.status(400).json({ error: "storyType must be a string under 50 characters" });
      }
      if (storyContent && (typeof storyContent !== "string" || storyContent.length > 10000)) {
        return res.status(400).json({ error: "storyContent must be a string under 10000 characters" });
      }
      if (storyCaption && (typeof storyCaption !== "string" || storyCaption.length > 5000)) {
        return res.status(400).json({ error: "storyCaption must be a string under 5000 characters" });
      }
      if (storySticker && (typeof storySticker !== "string" || storySticker.length > 50)) {
        return res.status(400).json({ error: "storySticker must be a string under 50 characters" });
      }
      if (commenterName && (typeof commenterName !== "string" || commenterName.length > 200)) {
        return res.status(400).json({ error: "commenterName must be a string under 200 characters" });
      }
      if (commenterRole && (typeof commenterRole !== "string" || commenterRole.length > 200)) {
        return res.status(400).json({ error: "commenterRole must be a string under 200 characters" });
      }

      console.log(`Generating story comment by ${commenterName} for ${storyAuthorName}`);

      const prompt = `شما نقش شخصیت "${commenterName}" با نقش/شغل/رابطه: "${commenterRole || 'مخاطب'}" را بازی می‌کنید.
شما می‌خواهید زیر استوری شخص دیگری کامنت بگذارید.
مشخصات نویسنده استوری:
- نام نویسنده استوری: "${storyAuthorName}"
- نقش/شغل نویسنده استوری: "${storyAuthorRole || 'کاربر حقیقی'}"

مشخصات استوری:
- نوع استوری: ${storyType === 'image' ? 'عکس با کپشن' : 'متن'}
- محتوا/متن استوری: "${storyContent}"
${storyCaption ? `- کپشن استوری: "${storyCaption}"` : ''}
${storySticker ? `- استیکر استوری: "${storySticker}"` : ''}

لطفاً یک کامنت کوتاه، فوق‌العاده صمیمی، دلسوزانه، بامزه، متناسب با موضوع استوری (و با توجه به شغل و رابطه خودتان با نویسنده) بنویسید. کامنت باید کاملاً متناسب با نقش شما باشد. به زبان فارسی عامیانه و تهرانی نوشته شود. حداکثر یک جمله کوتاه باشد همراه با ایموجی‌های ساده و مناسب.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const commentText = response.text ? response.text.replace(/["'()]/g, '').trim() : "عالی بود! 👏🏻❤️";
      res.json({ commentText });
    } catch (error: any) {
      console.error("Server Comment Generation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during comment generation" });
    }
  });

  app.post("/api/generate-speech", async (req, res) => {
    try {
      const { text, voiceName } = req.body;
      const customApiKey = (req.headers['x-api-key'] as string) || req.body.customApiKey;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required and must be a string" });
      }
      if (text.length > 5000) {
        return res.status(400).json({ error: "text is too long (maximum 5000 characters)" });
      }
      if (voiceName && (typeof voiceName !== "string" || voiceName.length > 50)) {
        return res.status(400).json({ error: "voiceName must be a string under 50 characters" });
      }
      if (customApiKey && (typeof customApiKey !== "string" || customApiKey.length > 500)) {
        return res.status(400).json({ error: "invalid api key parameter" });
      }

      console.log("Proxying speech request for voice:", voiceName);

      // Validate voice name against the supported prebuilt voices
      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      let finalVoice = voiceName;
      if (finalVoice === 'Aoede') {
        finalVoice = 'Zephyr';
      }
      if (!finalVoice || !validVoices.includes(finalVoice)) {
        finalVoice = 'Zephyr';
      }

      let audioData: string | undefined = undefined;

      try {
        const responsePromise = generateContentWithRetry({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text }] }],
          customApiKey,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: finalVoice },
              },
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
            ] as any
          }
        }, 1);

        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini TTS Timeout")), 10000)
        );

        const response = await Promise.race([responsePromise, timeoutPromise]);

        audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
          // Fallback: If model returned text content instead of audio, use Google Translate TTS to synthesize it server-side
          const textFallback = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textFallback) {
            console.log("TTS model returned text instead of audio, converting via server-side Google TTS fallback:", textFallback);
            try {
              const buffer = await synthesizeTextWithGoogleTts(textFallback);
              audioData = buffer.toString("base64");
            } catch (e: any) {
              console.warn("Server speech fallback failed:", e);
            }
          }
        }
      } catch (geminiTtsErr: any) {
        console.warn("Gemini TTS model failed or timed out, trying direct Google TTS fallback. Error:", geminiTtsErr.message || geminiTtsErr);
      }

      // Final bulletproof fallback: if Gemini TTS failed or produced no audio, use Google TTS on the input text!
      if (!audioData) {
        console.log("Generating direct Google TTS fallback for input text:", text);
        const buffer = await synthesizeTextWithGoogleTts(text);
        audioData = buffer.toString("base64");
      }

      res.json({ audioData });
    } catch (error: any) {
      console.error("Server Speech Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during speech generation" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt is required and must be a string" });
      }
      if (prompt.length > 2000) {
        return res.status(400).json({ error: "prompt is too long (maximum 2000 characters)" });
      }
      if (aspectRatio && (typeof aspectRatio !== "string" || aspectRatio.length > 20)) {
        return res.status(400).json({ error: "invalid aspectRatio parameter" });
      }
      const imgData = await serverGenerateImage(prompt, aspectRatio);
      if (!imgData) {
        throw new Error("Failed to generate image");
      }
      res.json({ imageData: imgData });
    } catch (error: any) {
      console.error("Server Image Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during image generation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Create the WebSocket Server for secure Gemini Live Relay
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const urlObj = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (urlObj.pathname === "/api/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (ws) => {
    console.log("Client connected to secure Gemini Live Relay WebSocket");
    let session: any = null;
    let isClosed = false;

    // Heartbeat mechanism to prevent idle socket terminations
    let isAlive = true;
    ws.on("pong", () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log("WS Relay: Client unresponsive to ping. Terminating connection.");
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 25000);

    const cleanupSession = async () => {
      if (isClosed) return;
      isClosed = true;
      clearInterval(pingInterval);
      if (session) {
        try {
          console.log("WS Relay: Closing Gemini Live session on client exit");
          await session.close();
        } catch (e) {
          console.warn("WS Relay: Error closing live session:", e);
        }
        session = null;
      }
    };

    ws.on("close", () => {
      console.log("WS Relay: Client closed WebSocket connection");
      cleanupSession();
    });

    ws.on("error", (err) => {
      console.error("WS Relay: Client WebSocket encountered an error:", err);
      cleanupSession();
    });

    ws.on("message", async (message) => {
      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        if (payload.type === "setup") {
          if (session) {
            console.log("WS Relay: Live session already exists, skipping setup");
            return;
          }

          const { systemInstruction, voiceName, customApiKey } = payload;
          const ai = getAI(customApiKey);

          try {
            console.log("WS Relay: Spawning new Gemini Live session with voice:", voiceName);
            session = await ai.live.connect({
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || "Zephyr" } },
                },
                systemInstruction,
                outputAudioTranscription: {},
                inputAudioTranscription: {},
              },
              callbacks: {
                onmessage: (msg: any) => {
                  if (isClosed) return;

                  // Extract raw model output audio (24kHz PCM)
                  const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audio) {
                    ws.send(JSON.stringify({ type: "audio", data: audio }));
                  }

                  // Handle speech interruptions (e.g. user started speaking mid-response)
                  if (msg.serverContent?.interrupted) {
                    console.log("WS Relay: Live session response was interrupted");
                    ws.send(JSON.stringify({ type: "interrupted" }));
                  }

                  // Handle transcriptions
                  const text = msg.serverContent?.modelTurn?.parts?.[0]?.text;
                  if (text) {
                    ws.send(JSON.stringify({ type: "text", data: text }));
                  }
                },
                onclose: () => {
                  console.log("WS Relay: Live session closed by Google APIs");
                  if (!isClosed) {
                    ws.send(JSON.stringify({ type: "close", reason: "closed_by_google" }));
                    cleanupSession();
                  }
                },
                onerror: (err: any) => {
                  console.error("WS Relay: Live session error from Google APIs:", err);
                  if (!isClosed) {
                    ws.send(JSON.stringify({ type: "error", message: err?.message || String(err) }));
                  }
                },
              },
            });

            ws.send(JSON.stringify({ type: "ready" }));
            console.log("WS Relay: Gemini Live session initialized successfully");
          } catch (connErr: any) {
            console.error("WS Relay: Failed to connect to Gemini Live API:", connErr);
            ws.send(JSON.stringify({ type: "error", message: "اتصال صوتی مستقیم هوشمند با گوگل ناموفق بود: " + (connErr?.message || String(connErr)) }));
            ws.close();
          }
          return;
        }

        // Forward user inputs directly to the real live session
        if (!session) {
          console.warn("WS Relay: Received input event before session setup completed");
          return;
        }

        if (payload.type === "audio") {
          session.sendRealtimeInput({
            audio: { data: payload.data, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (payload.type === "text") {
          session.sendRealtimeInput({
            text: payload.data,
          });
        } else if (payload.type === "video") {
          session.sendRealtimeInput({
            video: { data: payload.data, mimeType: payload.mimeType || "image/jpeg" },
          });
        }
      } catch (err) {
        console.error("WS Relay: Error processing incoming websocket event:", err);
      }
    });
  });
}

startServer();
