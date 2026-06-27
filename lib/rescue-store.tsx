"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { db, isFirebaseConfigured } from "./firebase"
import { SEED_BUILDINGS } from "./seed-data"
import type { Building, BuildingDoc, MissingPersonDoc, Victim, VictimStatus } from "./types"

// Bump this when the bundled sample data changes (e.g. new cities added) so
// already-populated databases receive the new samples exactly once per device.
const SEED_VERSION = "2"
const SEED_VERSION_KEY = "rescate-seed-version"

type NewBuilding = Omit<Building, "id" | "victims" | "createdAt" | "updatedAt">
type NewVictim = Omit<Victim, "id">

interface RescueStore {
  buildings: Building[]
  loading: boolean
  live: boolean
  addBuilding: (data: NewBuilding) => Promise<string>
  addVictim: (buildingId: string, victim: NewVictim) => Promise<void>
  setVictimStatus: (buildingId: string, victimId: string, status: VictimStatus) => Promise<void>
}

const StoreContext = createContext<RescueStore | null>(null)

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

/** Split the embedded seed data into the two-collection shape used everywhere. */
function splitSeed(): { meta: BuildingDoc[]; persons: MissingPersonDoc[] } {
  const meta: BuildingDoc[] = []
  const persons: MissingPersonDoc[] = []
  for (const b of SEED_BUILDINGS) {
    const { victims, ...rest } = b
    meta.push(rest)
    for (const v of victims) {
      persons.push({
        ...v,
        buildingId: b.id,
        nameLower: v.name.toLowerCase(),
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })
    }
  }
  return { meta, persons }
}

/** Stitch building metadata + people docs back into the Building[] the UI renders. */
function mergeBuildings(meta: BuildingDoc[], persons: MissingPersonDoc[]): Building[] {
  const byBuilding = new Map<string, Victim[]>()
  for (const p of persons) {
    const arr = byBuilding.get(p.buildingId) ?? []
    arr.push(p)
    byBuilding.set(p.buildingId, arr)
  }
  return meta
    .map((m) => ({ ...m, victims: byBuilding.get(m.id) ?? [] }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function RescueStoreProvider({ children }: { children: ReactNode }) {
  const seed = useMemo(splitSeed, [])
  const [meta, setMeta] = useState<BuildingDoc[]>(isFirebaseConfigured ? [] : seed.meta)
  const [persons, setPersons] = useState<MissingPersonDoc[]>(isFirebaseConfigured ? [] : seed.persons)
  const [loadedBuildings, setLoadedBuildings] = useState<boolean>(!isFirebaseConfigured)
  const [loadedPersons, setLoadedPersons] = useState<boolean>(!isFirebaseConfigured)
  // Guards the one-time sample top-up so it can't run on every snapshot.
  const toppedUp = useRef(false)

  // Subscribe to live Firestore updates when configured. Two listeners: one for
  // building metadata, one for the missingPersons collection. Both feed the
  // local on-device cache first, so the UI renders instantly even offline.
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsubs: Array<() => void> = []

    ;(async () => {
      const { collection, onSnapshot, query, orderBy, setDoc, doc } = await import("firebase/firestore")

      const buildingsRef = collection(db, "buildings")
      unsubs.push(
        onSnapshot(query(buildingsRef, orderBy("updatedAt", "desc")), async (snap) => {
          if (snap.empty) {
            // First run on a fresh database: seed both collections fully.
            await Promise.all([
              ...seed.meta.map((m) => setDoc(doc(db, "buildings", m.id), m)),
              ...seed.persons.map((p) => setDoc(doc(db, "missingPersons", p.id), p)),
            ])
            if (typeof window !== "undefined") localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
            return
          }

          const existingIds = new Set(snap.docs.map((d) => d.id))
          setMeta(snap.docs.map((d) => d.data() as BuildingDoc))
          setLoadedBuildings(true)

          // Top-up: database already has data but may predate newly-added sample
          // cities. Write only the missing sample buildings (and their people),
          // once per device, so we never resurrect records a team has deleted.
          if (!toppedUp.current) {
            toppedUp.current = true
            const seenVersion =
              typeof window !== "undefined" ? localStorage.getItem(SEED_VERSION_KEY) : SEED_VERSION
            if (seenVersion !== SEED_VERSION) {
              const missing = seed.meta.filter((m) => !existingIds.has(m.id))
              if (missing.length > 0) {
                const missingIds = new Set(missing.map((m) => m.id))
                await Promise.all([
                  ...missing.map((m) => setDoc(doc(db, "buildings", m.id), m)),
                  ...seed.persons
                    .filter((p) => missingIds.has(p.buildingId))
                    .map((p) => setDoc(doc(db, "missingPersons", p.id), p)),
                ])
              }
              if (typeof window !== "undefined") localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
            }
          }
        }),
      )

      const personsRef = collection(db, "missingPersons")
      unsubs.push(
        onSnapshot(query(personsRef, orderBy("updatedAt", "desc")), (snap) => {
          setPersons(snap.docs.map((d) => d.data() as MissingPersonDoc))
          setLoadedPersons(true)
        }),
      )
    })()

    return () => unsubs.forEach((u) => u())
  }, [seed])

  const addBuilding = useCallback<RescueStore["addBuilding"]>(async (data) => {
    const id = newId()
    const ts = Date.now()
    const docData: BuildingDoc = { ...data, id, createdAt: ts, updatedAt: ts }

    if (isFirebaseConfigured && db) {
      const { doc, setDoc } = await import("firebase/firestore")
      await setDoc(doc(db, "buildings", id), docData)
    } else {
      setMeta((prev) => [docData, ...prev])
    }
    return id
  }, [])

  const addVictim = useCallback<RescueStore["addVictim"]>(async (buildingId, victim) => {
    const ts = Date.now()
    const person: MissingPersonDoc = {
      ...victim,
      id: newId(),
      buildingId,
      nameLower: victim.name.toLowerCase(),
      createdAt: ts,
      updatedAt: ts,
    }

    if (isFirebaseConfigured && db) {
      const { doc, setDoc, updateDoc } = await import("firebase/firestore")
      // Generate the id client-side so the write succeeds offline and replays later.
      await setDoc(doc(db, "missingPersons", person.id), person)
      // Touch the building so it surfaces as recently updated.
      await updateDoc(doc(db, "buildings", buildingId), { updatedAt: ts }).catch(() => {})
    } else {
      setPersons((prev) => [person, ...prev])
      setMeta((prev) => prev.map((m) => (m.id === buildingId ? { ...m, updatedAt: ts } : m)))
    }
  }, [])

  const setVictimStatus = useCallback<RescueStore["setVictimStatus"]>(
    async (buildingId, victimId, status) => {
      const ts = Date.now()
      if (isFirebaseConfigured && db) {
        const { doc, updateDoc } = await import("firebase/firestore")
        // Atomic single-document update: no read-modify-write, no lost updates
        // when several rescuers act on different people at the same time.
        await updateDoc(doc(db, "missingPersons", victimId), { status, updatedAt: ts })
        await updateDoc(doc(db, "buildings", buildingId), { updatedAt: ts }).catch(() => {})
      } else {
        setPersons((prev) =>
          prev.map((p) => (p.id === victimId ? { ...p, status, updatedAt: ts } : p)),
        )
        setMeta((prev) => prev.map((m) => (m.id === buildingId ? { ...m, updatedAt: ts } : m)))
      }
    },
    [],
  )

  const buildings = useMemo(() => mergeBuildings(meta, persons), [meta, persons])
  const loading = !(loadedBuildings && loadedPersons)

  const value = useMemo<RescueStore>(
    () => ({ buildings, loading, live: isFirebaseConfigured, addBuilding, addVictim, setVictimStatus }),
    [buildings, loading, addBuilding, addVictim, setVictimStatus],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useRescueStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useRescueStore must be used within RescueStoreProvider")
  return ctx
}
