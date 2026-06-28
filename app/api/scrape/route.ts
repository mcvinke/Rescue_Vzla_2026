import { NextResponse } from "next/server"
import { parsePost } from "@/lib/social-parser"
import type { ImportPlatform, SignalType } from "@/lib/types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "venezuela-rescue-2026"
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const TWITTER_QUERY =
  '(desaparecido OR desaparecida OR atrapado OR derrumbe OR "edificio colapsado" OR "busco a" OR "no sé nada de" OR "La Guaira" OR "Playa Grande" OR Macuto OR Maiquetía OR "sismo Venezuela" OR missing OR trapped OR "earthquake Venezuela" OR "rescue Venezuela") -is:retweet lang:es OR lang:en'

// Telegram public channel usernames to monitor (bot must be a member/admin).
const TELEGRAM_CHANNELS = [
  "@noticiasvam",
  "@terremotovenezuela",
]

// ---------------------------------------------------------------------------
// Firestore REST helpers
// ---------------------------------------------------------------------------

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null }
    } else if (typeof v === "boolean") {
      fields[k] = { booleanValue: v }
    } else if (typeof v === "number") {
      fields[k] = { integerValue: String(v) }
    } else {
      fields[k] = { stringValue: String(v) }
    }
  }
  return fields
}

async function firestoreWrite(collection: string, id: string, data: Record<string, unknown>) {
  const url = `${FIRESTORE_BASE}/${collection}/${id}`
  const body = { fields: toFirestoreFields(data) }
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Firestore write failed (${res.status}): ${err}`)
  }
  return res.json()
}

/** Check if a document with this sourceUrl already exists in socialImports. */
async function importExists(sourceUrl: string): Promise<boolean> {
  if (!sourceUrl) return false
  const url = `${FIRESTORE_BASE}:runQuery`
  const body = {
    structuredQuery: {
      from: [{ collectionId: "socialImports" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "sourceUrl" },
          op: "EQUAL",
          value: { stringValue: sourceUrl },
        },
      },
      limit: 1,
    },
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) return false
  const results = await res.json()
  return Array.isArray(results) && results.length > 0 && !!results[0]?.document
}

/** Get/set the scrape state (last Twitter since_id, Telegram offset) from Firestore. */
async function getScrapeState(): Promise<{ twitterSinceId: string; telegramOffset: number }> {
  const url = `${FIRESTORE_BASE}/_meta/scrapeState`
  try {
    const res = await fetch(url)
    if (!res.ok) return { twitterSinceId: "", telegramOffset: 0 }
    const doc = await res.json()
    return {
      twitterSinceId: doc?.fields?.twitterSinceId?.stringValue ?? "",
      telegramOffset: Number(doc?.fields?.telegramOffset?.integerValue ?? 0),
    }
  } catch {
    return { twitterSinceId: "", telegramOffset: 0 }
  }
}

async function setScrapeState(state: { twitterSinceId?: string; telegramOffset?: number }) {
  try {
    await firestoreWrite("_meta", "scrapeState", {
      ...state,
      updatedAt: Date.now(),
    })
  } catch {
    // Non-fatal: worst case we re-import some posts.
  }
}

// ---------------------------------------------------------------------------
// Scraped post shape
// ---------------------------------------------------------------------------

interface ScrapedPost {
  text: string
  url: string
  postedAt: number
  platform: ImportPlatform
  externalId?: string
}

// ---------------------------------------------------------------------------
// Platform scrapers
// ---------------------------------------------------------------------------

async function scrapeTwitter(sinceId: string): Promise<{ posts: ScrapedPost[]; newestId: string }> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) return { posts: [], newestId: sinceId }

  const params = new URLSearchParams({
    query: TWITTER_QUERY,
    max_results: "20",
    "tweet.fields": "created_at,author_id",
  })
  if (sinceId) params.set("since_id", sinceId)

  const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    console.error("Twitter API error:", res.status, await res.text().catch(() => ""))
    return { posts: [], newestId: sinceId }
  }

  const json = await res.json()
  const tweets: Array<{ id: string; text: string; created_at?: string }> = json.data ?? []
  const newestId = tweets[0]?.id ?? sinceId

  const posts: ScrapedPost[] = tweets.map((t) => ({
    text: t.text,
    url: `https://twitter.com/i/web/status/${t.id}`,
    postedAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
    platform: "twitter" as ImportPlatform,
    externalId: t.id,
  }))

  return { posts, newestId }
}

async function scrapeTelegram(offset: number): Promise<{ posts: ScrapedPost[]; nextOffset: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { posts: [], nextOffset: offset }

  const params = new URLSearchParams({
    offset: String(offset),
    limit: "50",
    timeout: "0",
  })

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?${params}`)
  if (!res.ok) {
    console.error("Telegram API error:", res.status)
    return { posts: [], nextOffset: offset }
  }

  const json = await res.json()
  if (!json.ok || !Array.isArray(json.result)) return { posts: [], nextOffset: offset }

  const updates: Array<{
    update_id: number
    message?: {
      message_id: number
      text?: string
      caption?: string
      photo?: Array<{ file_id: string }>
      date: number
      chat: { id: number; title?: string; username?: string }
      forward_from_chat?: { username?: string; id: number }
      forward_from_message_id?: number
    }
    channel_post?: {
      message_id: number
      text?: string
      caption?: string
      photo?: Array<{ file_id: string }>
      date: number
      chat: { id: number; title?: string; username?: string }
    }
  }> = json.result

  const nextOffset = updates.length > 0 ? updates[updates.length - 1].update_id + 1 : offset
  const KEYWORDS_LOWER = [
    "desaparecid", "atrapado", "atrapada", "derrumbe", "colaps", "busco a",
    "la guaira", "playa grande", "macuto", "maiquetía", "maiquetia",
    "missing", "trapped", "earthquake venezuela",
  ]

  const posts: ScrapedPost[] = []
  for (const upd of updates) {
    const msg = upd.channel_post ?? upd.message
    if (!msg) continue

    const text = msg.text ?? msg.caption ?? ""
    if (!text && !msg.photo) continue

    const lower = text.toLowerCase()
    if (!KEYWORDS_LOWER.some((kw) => lower.includes(kw))) continue

    const chat = msg.chat
    // If this is a forwarded message, link back to the original channel
    const fwd = (upd.message as typeof upd.message & { forward_from_chat?: { username?: string; id: number }; forward_from_message_id?: number } | undefined)
    const sourceChat = fwd?.forward_from_chat ?? chat
    const sourceMsgId = fwd?.forward_from_message_id ?? msg.message_id
    const url = sourceChat.username
      ? `https://t.me/${sourceChat.username}/${sourceMsgId}`
      : `https://t.me/c/${String(sourceChat.id).replace("-100", "")}/${sourceMsgId}`

    posts.push({
      text: text || "[imagen sin texto]",
      url,
      postedAt: msg.date * 1000,
      platform: "telegram",
      externalId: `${chat.id}_${msg.message_id}`,
    })
  }

  return { posts, nextOffset }
}

/** Generic Apify actor runner — starts a run and waits up to 45 s for results. */
async function scrapeViaApify(
  actorId: string,
  input: Record<string, unknown>,
  platform: ImportPlatform,
): Promise<ScrapedPost[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) return []

  const KEYWORDS_LOWER = [
    "desaparecid", "atrapado", "atrapada", "derrumbe", "colaps", "busco a",
    "la guaira", "playa grande", "macuto", "maiquetía", "maiquetia",
    "missing", "trapped", "earthquake venezuela", "sismo venezuela",
  ]

  // Start run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}&timeout=45&memory=256`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  )
  if (!startRes.ok) {
    console.error(`Apify ${platform} start error:`, startRes.status)
    return []
  }
  const startJson = await startRes.json()
  const runId: string = startJson?.data?.id
  if (!runId) return []

  // Poll for completion (up to 45 s in 5-s steps)
  let status = startJson?.data?.status ?? "RUNNING"
  for (let i = 0; i < 9 && status === "RUNNING"; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const pollRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`)
    if (pollRes.ok) {
      const pollJson = await pollRes.json()
      status = pollJson?.data?.status ?? "RUNNING"
    }
  }

  if (status !== "SUCCEEDED") {
    console.warn(`Apify ${platform} run ${runId} ended with status: ${status}`)
    return []
  }

  // Fetch dataset items
  const datasetId: string = startJson?.data?.defaultDatasetId
  if (!datasetId) return []
  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=50`,
  )
  if (!itemsRes.ok) return []
  const items: Array<Record<string, unknown>> = await itemsRes.json()

  const posts: ScrapedPost[] = []
  for (const item of items) {
    const text = String(item.text ?? item.caption ?? item.content ?? item.body ?? "")
    if (!text) continue
    const lower = text.toLowerCase()
    if (!KEYWORDS_LOWER.some((kw) => lower.includes(kw))) continue
    posts.push({
      text,
      url: String(item.url ?? item.postUrl ?? item.link ?? ""),
      postedAt: item.timestamp
        ? new Date(String(item.timestamp)).getTime()
        : item.createdAt
          ? new Date(String(item.createdAt)).getTime()
          : Date.now(),
      platform,
    })
  }
  return posts
}

async function scrapeInstagram(): Promise<ScrapedPost[]> {
  return scrapeViaApify(
    "apify~instagram-hashtag-scraper",
    {
      hashtags: ["LaGuaira", "SismoVenezuela", "PlayaGrande", "desaparecido", "Venezuela"],
      resultsLimit: 30,
    },
    "instagram",
  )
}

async function scrapeFacebook(): Promise<ScrapedPost[]> {
  return scrapeViaApify(
    "apify~facebook-search-scraper",
    {
      queries: ["desaparecido La Guaira", "atrapado Venezuela sismo", "collapsed building Venezuela"],
      resultsLimit: 20,
    },
    "facebook",
  )
}

async function scrapeTikTok(): Promise<ScrapedPost[]> {
  return scrapeViaApify(
    "clockworks~tiktok-scraper",
    {
      hashtags: ["LaGuaira", "SismoVenezuela", "terremotoVenezuela"],
      resultsPerPage: 20,
    },
    "tiktok",
  )
}

// ---------------------------------------------------------------------------
// Save scraped posts to Firestore
// ---------------------------------------------------------------------------

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

async function savePosts(posts: ScrapedPost[]): Promise<number> {
  let saved = 0
  for (const post of posts) {
    try {
      if (post.url && (await importExists(post.url))) continue

      const parsed = parsePost(post.text)
      const id = newId()
      const now = Date.now()

      await firestoreWrite("socialImports", id, {
        originalText: post.text.slice(0, 5000),
        platform: post.platform,
        sourceUrl: post.url,
        postedAt: post.postedAt,
        parsedName: parsed.name,
        parsedLocation: parsed.location,
        parsedPhone: parsed.phone,
        parsedBuilding: parsed.building,
        signalType: parsed.signalType,
        verificationStatus: "unverified",
        status: "pending",
        linkedRecordId: "",
        createdAt: now,
        reviewedAt: 0,
        reviewedBy: "",
        isSample: false,
      })

      // Auto-create stub in missingPersons for clear missing-person signals.
      if (parsed.signalType === "missing_person" && parsed.name) {
        const personId = newId()
        await firestoreWrite("missingPersons", personId, {
          id: personId,
          buildingId: "",
          name: parsed.name || "Unknown",
          nameLower: (parsed.name || "unknown").toLowerCase(),
          cedula: "",
          floor: 0,
          apartment: "",
          status: "missing",
          contactName: "",
          contactPhone: parsed.phone,
          notes: `Auto-importado de ${post.platform}. Texto: ${post.text.slice(0, 200)}`,
          createdAt: now,
          updatedAt: now,
        })
      }

      saved++
    } catch (err) {
      console.error("Failed to save post:", err)
    }
  }
  return saved
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  return handler()
}

export async function POST() {
  return handler()
}

async function handler() {
  const startedAt = Date.now()
  const activePlatforms: string[] = []
  const errors: string[] = []
  let totalSaved = 0

  const state = await getScrapeState()
  const newState: { twitterSinceId?: string; telegramOffset?: number } = {}

  // --- Twitter ---
  if (process.env.TWITTER_BEARER_TOKEN) {
    activePlatforms.push("twitter")
    try {
      const { posts, newestId } = await scrapeTwitter(state.twitterSinceId)
      totalSaved += await savePosts(posts)
      if (newestId) newState.twitterSinceId = newestId
    } catch (err) {
      errors.push(`twitter: ${String(err)}`)
    }
  }

  // --- Telegram ---
  if (process.env.TELEGRAM_BOT_TOKEN) {
    activePlatforms.push("telegram")
    try {
      const { posts, nextOffset } = await scrapeTelegram(state.telegramOffset)
      totalSaved += await savePosts(posts)
      newState.telegramOffset = nextOffset
    } catch (err) {
      errors.push(`telegram: ${String(err)}`)
    }
  }

  // --- Apify platforms ---
  if (process.env.APIFY_API_TOKEN) {
    const apifyRuns = [
      { name: "instagram", fn: scrapeInstagram },
      { name: "facebook", fn: scrapeFacebook },
      { name: "tiktok", fn: scrapeTikTok },
    ]
    for (const { name, fn } of apifyRuns) {
      activePlatforms.push(name)
      try {
        const posts = await fn()
        totalSaved += await savePosts(posts)
      } catch (err) {
        errors.push(`${name}: ${String(err)}`)
      }
    }
  }

  if (Object.keys(newState).length) {
    await setScrapeState(newState)
  }

  const elapsed = Date.now() - startedAt
  const body = {
    ok: true,
    activePlatforms,
    totalSaved,
    elapsedMs: elapsed,
    ...(errors.length ? { errors } : {}),
    ...(activePlatforms.length === 0
      ? { note: "No API keys configured. Set TWITTER_BEARER_TOKEN, APIFY_API_TOKEN, or TELEGRAM_BOT_TOKEN to enable auto-scraping." }
      : {}),
  }

  return NextResponse.json(body)
}
