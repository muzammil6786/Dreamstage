import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function localScore(event, artist) {
  let score = 0;
  const reasons = [];

  const eventGenre = normalize(event.genre);
  const eventType = normalize(event.type);
  const artistGenres = (artist.genres || []).map(normalize);
  const artistTags = (artist.tags || []).map(normalize);
  const genreAliases = {
    "stand-up comedy": ["standup", "stand-up", "comedy", "stand up"],
    "open mic": ["open mic", "spoken word", "poetry"],
    "clubbing / dj": ["dj", "clubbing", "house", "electronic"],
    "celebrity appearance": ["celebrity", "guest", "public speaking"]
  };
  const requestedTerms = [eventGenre, ...(genreAliases[eventGenre] || []), ...(genreAliases[eventType] || [])].filter(Boolean);
  const matchesRequestedTerm = (value) => requestedTerms.some((term) => value.includes(term) || term.includes(value));
  const eventLocation = normalize(event.location);
  const artistLocation = normalize(artist.location);

  if (eventGenre && (artistGenres.includes(eventGenre) || artistGenres.some(matchesRequestedTerm))) {
    score += 35;
    reasons.push(`${artist.name} matches the ${event.genre} genre`);
  } else if (eventGenre && artistTags.some(matchesRequestedTerm)) {
    score += 25;
    reasons.push("their tags are compatible with the requested genre");
  }

  if (eventLocation && artistLocation === eventLocation) {
    score += 20;
    reasons.push(`they are based in ${artist.location}`);
  } else {
    score += 5;
  }

  const budget = Number(event.budget) || 0;
  const fee = Number(artist.fee) || 0;

  if (budget > 0 && fee <= budget) {
    score += 20;
    reasons.push(`their fee of ₹${fee.toLocaleString("en-IN")} fits the budget`);
  } else if (budget > 0 && fee <= budget * 1.2) {
    score += 10;
    reasons.push("their fee is close to the event budget");
  }

  const rating = Number(artist.rating) || 0;
  score += Math.round((rating / 5) * 15);

  if (Number(artist.experience) >= 5) {
    score += 10;
    reasons.push(`${artist.experience} years of experience`);
  } else {
    score += Number(artist.experience) || 0;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    artistId: String(artist._id),
    score,
    reason: reasons.length ? reasons.join(", ") + "." : "Good overall fit for this event."
  };
}

export function getLocalArtistMatches(event, artists) {
  return artists
    .map((artist) => localScore(event, artist))
    .sort((a, b) => b.score - a.score);
}

export async function matchArtistsWithAI(event, artists) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is missing; using local artist matching.");
    return {
      matches: getLocalArtistMatches(event, artists),
      source: "local"
    };
  }

  const artistData = artists.map((artist) => ({
    id: String(artist._id),
    name: artist.name,
    location: artist.location,
    genres: artist.genres || [],
    tags: artist.tags || [],
    experience: Number(artist.experience) || 0,
    rating: Number(artist.rating) || 0,
    fee: Number(artist.fee) || 0,
    bio: artist.bio || ""
  }));

  const prompt = `
You are Dream Stage's AI artist matching engine.

Match the available artists to the event. Score EVERY artist from 0 to 100.
Use genre, location, budget, rating, experience and bio/tags.
Do not invent artists or IDs.

EVENT:
${JSON.stringify({
    title: event.title,
    type: event.type,
    location: event.location,
    date: event.date,
    budget: event.budget,
    genre: event.genre,
    duration: event.duration,
    description: event.description
  })}

AVAILABLE ARTISTS:
${JSON.stringify(artistData)}

Return one match for every available artist.
The artistId must be copied exactly from the available artists.
The score must be an integer from 0 to 100.
The reason must be a short plain-text explanation.
`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      reasoning_effort: "low",
      reasoning_format: "hidden",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "artist_matches",
          strict: true,
          schema: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    artistId: { type: "string" },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    reason: { type: "string" }
                  },
                  required: ["artistId", "score", "reason"],
                  additionalProperties: false
                }
              }
            },
            required: ["matches"],
            additionalProperties: false
          }
        }
      }
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");

    const parsed = JSON.parse(content);
    const validIds = new Set(artists.map((artist) => String(artist._id)));

    const matches = (parsed.matches || [])
      .filter((match) => validIds.has(String(match.artistId)))
      .map((match) => ({
        artistId: String(match.artistId),
        score: Math.max(0, Math.min(100, Number(match.score) || 0)),
        reason: String(match.reason || "Good fit for this event.")
      }))
      .sort((a, b) => b.score - a.score);

    if (!matches.length) {
      throw new Error("Groq returned no valid artist matches");
    }

    return { matches, source: "groq" };
  } catch (error) {
    console.error("Groq matching failed; using local fallback:", error?.message || error);

    return {
      matches: getLocalArtistMatches(event, artists),
      source: "local-fallback",
      aiError: error?.message || "Unknown Groq error"
    };
  }
}
