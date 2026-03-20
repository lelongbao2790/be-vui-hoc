// components/SpeechText.tsx
import React, { useEffect, useRef, useState } from "react";

// Speaker SVG icon (big, kid-friendly)
const SpeakerIcon = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    aria-hidden="true"
  >
    <rect width="48" height="48" rx="12" fill="#FEE440" />
    <path
      d="M18 18H12v12h6l9 9V9l-9 9z"
      fill="#22223B"
    />
    <path
      d="M33.5 14.5a9 9 0 010 19"
      stroke="#22223B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M36.5 11.5a13 13 0 010 25"
      stroke="#22223B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="2 4"
    />
  </svg>
);

type SpeechTextProps = {
  text: string;
  lang: "vi" | "en";
  className?: string;
};

const LANG_MAP = {
  vi: "vi-VN",
  en: "en-US",
};

const CHUNK_REGEX = /[^.!?]+[.!?]?/g; // Split by sentence-ending punctuation

export const SpeechText: React.FC<SpeechTextProps> = ({
  text,
  lang,
  className = "",
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [highlight, setHighlight] = useState<{ start: number; end: number } | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const textRef = useRef<HTMLSpanElement>(null);

  // Load voices
  useEffect(() => {
    function loadVoices() {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      setLoading(false);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Find best voice for language
  function getVoice(langCode: string) {
    // Prefer localService voices for better quality
    const filtered = voices.filter(
      (v) =>
        v.lang === langCode &&
        (!v.name.toLowerCase().includes("google translate") || v.localService)
    );
    if (filtered.length > 0) return filtered[0];
    // Fallback: any matching language
    return voices.find((v) => v.lang.startsWith(langCode.split("-")[0])) || null;
  }

  // Split text into chunks (sentences)
  function splitChunks(txt: string) {
    const matches = txt.match(CHUNK_REGEX);
    if (!matches) return [txt];
    // Further split long sentences by commas for kids
    return matches.flatMap((sentence) =>
      sentence.length > 60 ? sentence.split(/, /g).map((s, i, arr) => (i < arr.length - 1 ? s + "," : s)) : [sentence]
    );
  }

  // Dynamically adjust pitch for questions/exclamations
  function getPitch(chunk: string) {
    if (chunk.trim().endsWith("?")) return 1.2; // Higher pitch for questions
    if (chunk.trim().endsWith("!")) return 1.1; // Slightly higher for exclamations
    return 1.0; // Normal
  }

  // Handle speech
  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech Synthesis not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    setHighlight(null);

    const langCode = LANG_MAP[lang];
    const voice = getVoice(langCode);
    if (!voice) {
      alert("No suitable voice found for this language.");
      return;
    }

    const chunks = splitChunks(text);
    let charIndex = 0;
    utterancesRef.current = [];

    setSpeaking(true);

    const speakChunk = (i: number) => {
      if (i >= chunks.length) {
        setSpeaking(false);
        setHighlight(null);
        return;
      }
      const chunk = chunks[i];
      const utter = new window.SpeechSynthesisUtterance(chunk);
      utter.voice = voice;
      utter.lang = langCode;
      utter.rate = 0.85; // Slow for kids
      utter.pitch = getPitch(chunk);
      utter.volume = 1.0;

      // Highlight words as they are spoken
      utter.onboundary = (event) => {
        if (event.name === "word") {
          setHighlight({
            start: charIndex + event.charIndex,
            end: charIndex + event.charIndex + event.charLength,
          });
        }
      };

      utter.onend = () => {
        charIndex += chunk.length;
        setHighlight(null);
        setTimeout(() => speakChunk(i + 1), 250); // Small pause between chunks
      };

      utter.onerror = () => {
        setSpeaking(false);
        setHighlight(null);
      };

      utterancesRef.current.push(utter);
      window.speechSynthesis.speak(utter);
    };

    speakChunk(0);
  };

  // Cancel speech if already speaking
  const handleButtonClick = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setHighlight(null);
    } else {
      handleSpeak();
    }
  };

  // Render text with highlight
  function renderTextWithHighlight() {
    if (!highlight) return text;
    const { start, end } = highlight;
    return (
      <>
        {text.slice(0, start)}
        <span style={{ background: "#FFD166", borderRadius: 4, padding: "0 2px" }}>
          {text.slice(start, end)}
        </span>
        {text.slice(end)}
      </>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 p-3 rounded-xl bg-white shadow-md ${className}`}
      style={{ fontSize: 22, minHeight: 64 }}
    >
      <span ref={textRef} style={{ flex: 1, userSelect: "text" }}>
        {renderTextWithHighlight()}
      </span>
      <button
        type="button"
        aria-label={speaking ? "Stop reading" : "Read aloud"}
        onClick={handleButtonClick}
        disabled={loading}
        style={{
          marginLeft: 16,
          background: speaking ? "#FFD166" : "#FEE440",
          border: "none",
          borderRadius: "50%",
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px #0001",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
          transition: "background 0.2s",
        }}
      >
        {loading ? (
          <span style={{ fontSize: 18, color: "#888" }}>...</span>
        ) : (
          <SpeakerIcon size={36} />
        )}
      </button>
    </div>
  );
};

export default SpeechText;