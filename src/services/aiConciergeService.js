/**
 * Date Night AI Concierge Service
 * Powered by Google Gemini 1.5 Flash (Free Tier - 1,500 RPD)
 * with instant romantic/fun heuristic fallback for Timi & Ejay.
 */

const GEMINI_STORAGE_KEY = "timi_gemini_api_key";

export const aiConciergeService = {
  getApiKey() {
    if (typeof window === "undefined") return "";
    return (
      process.env.VUE_APP_GEMINI_API_KEY ||
      window.localStorage.getItem(GEMINI_STORAGE_KEY) ||
      ""
    );
  },

  setApiKey(key) {
    if (typeof window === "undefined") return;
    if (key) {
      window.localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      window.localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  },

  /**
   * Generates a 1-2 sentence personalized date night pitch for Timi & Ejay.
   * Uses Gemini 1.5 Flash if API key is present; otherwise uses smart heuristic engine.
   */
  async generateDateNightPitch(movie) {
    if (!movie) return "";

    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const prompt = `You are Timi & Ejay's charming, witty date-night movie concierge for their private watch-party app "Timi's Stream".
In 1 to 2 engaging, conversational sentences, explain why Timi and Ejay will love watching this movie tonight for their date night:
Title: "${movie.title || movie.name}"
Overview: "${movie.overview || ''}"
Rating: ${movie.vote_average || 'N/A'}/10
Release Year: ${(movie.release_date || movie.first_air_date || '').slice(0, 4)}

Requirements:
- Enthusiastic, warm, romantic or playful tone.
- Mention Timi and Ejay having a fun/cozy couch experience.
- DO NOT use markdown bolding, asterisks, or quotes. Keep it clean text under 40 words.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const pitch =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (pitch) {
            return pitch.replace(/[*_#"`]/g, "").trim();
          }
        }
      } catch (err) {
        console.warn("[AI Concierge] Gemini API fetch failed, falling back to smart heuristic:", err);
      }
    }

    // Smart Local Heuristic Engine (100% offline, zero-latency fallback)
    return this.generateSmartHeuristicPitch(movie);
  },

  /**
   * High-quality tailored date-night pitch engine based on genre & sentiment
   */
  generateSmartHeuristicPitch(movie) {
    const title = movie.title || movie.name || "This film";
    const genres = Array.isArray(movie.genre_ids) ? movie.genre_ids : [];
    const overview = (movie.overview || "").toLowerCase();
    const rating = movie.vote_average || 7.5;

    // Romance / Drama (10749, 18)
    if (genres.includes(10749) || overview.includes("love") || overview.includes("romance")) {
      const romancePitches = [
        `"${title}" brings tender chemistry and an emotional spark — guaranteed to make Timi and Ejay cuddle up closer on the couch tonight! 🕯️🍿`,
        `A breathtaking modern romance with magnetic performances that Timi and Ejay will be talking about long after the credits roll! 💖✨`,
        `Heartfelt, intimate, and deeply touching — "${title}" is the ultimate cozy date night selection for Timi and Ejay tonight! 🥂🌹`,
      ];
      return romancePitches[Math.floor(Math.random() * romancePitches.length)];
    }

    // Comedy (35)
    if (genres.includes(35) || overview.includes("funny") || overview.includes("comedy")) {
      const comedyPitches = [
        `"${title}" is brimming with snappy banter and genuine laughs — an effortless pick for Timi and Ejay to kick back and smile together! 😂🍿`,
        `Fast-paced, hilarious, and packed with feel-good moments perfect for lightening up Timi and Ejay's evening! 🥂✨`,
        `Sharp humor and lovable characters that make date night pure fun for Timi and Ejay! 🍕🎉`,
      ];
      return comedyPitches[Math.floor(Math.random() * comedyPitches.length)];
    }

    // Thriller / Mystery / Horror (53, 9648, 27)
    if (genres.includes(53) || genres.includes(9648) || genres.includes(27) || overview.includes("mystery") || overview.includes("thriller")) {
      const thrillerPitches = [
        `High suspense and edge-of-your-seat twists in "${title}" — perfect for Timi and Ejay to hold hands tight through every sudden turn! 😱🍿`,
        `A pulse-pounding puzzle with mind-bending reveals that will have Timi and Ejay guessing until the final seconds! 🔍⚡`,
        `Gripping from start to finish — grab an extra blanket because "${title}" will keep Timi and Ejay glued to the screen! 🖤🎬`,
      ];
      return thrillerPitches[Math.floor(Math.random() * thrillerPitches.length)];
    }

    // Animation / Family / Fantasy (16, 10751, 14)
    if (genres.includes(16) || genres.includes(14) || overview.includes("adventure") || overview.includes("magic")) {
      const fantasyPitches = [
        `Visually dazzling and brimming with wonder — "${title}" is an enchanting escape that will spark Timi and Ejay's imagination tonight! ✨🍿`,
        `Charming storytelling with gorgeous visuals that make for an effortlessly sweet and relaxing date night watch! 🎈💖`,
      ];
      return fantasyPitches[Math.floor(Math.random() * fantasyPitches.length)];
    }

    // Action / Sci-Fi (28, 878)
    if (genres.includes(28) || genres.includes(878)) {
      return `Electrifying visuals and relentless momentum in "${title}" — a cinematic adrenaline rush made for Timi and Ejay to enjoy together! 🚀🍿`;
    }

    // General high-rated fallback
    if (rating >= 7.8) {
      return `Critically acclaimed and celebrated for its unforgettable storytelling — "${title}" is an absolute must-watch for Timi and Ejay tonight! ⭐🍿`;
    }

    return `A captivating and stylish pick with stellar pacing — "${title}" is tailor-made for Timi and Ejay's date night streaming session! 🥂🍿`;
  },
};

export default aiConciergeService;
