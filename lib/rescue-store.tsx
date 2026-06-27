"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { db, isFirebaseConfigured } from "./firebase"
import { SEED_BUILDINGS } from "./seed-data"
import type { Building, Victim, VictimStatus } from "./types"

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

export function RescueStoreProvider({ children }: { children: ReactNode }) {
  const [buildings, setBuildings] = useState<Building[]>(isFirebaseConfigured ? [] : SEED_BUILDINGS)
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured)

  // Subscribe to live Firestore updates when configured.
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    let unsub: (() => void) | undefined

    ;(async () => {
      const { collection, onSnapshot, query, orderBy, setDoc, doc } = await import("firebase/firestore")
      const colRef = collection(db, "buildings")

      unsub = onSnapshot(query(colRef, orderBy("updatedAt", "desc")), async (snap) => {
        if (snap.empty) {
          // First run: seed the database so all teams share a starting picture.
          await Promise.all(
            SEED_BUILDINGS.map((b) => setDoc(doc(db, "buildings", b.id), b)),
          )
          return
        }
        const list = snap.docs.map((d) => d.data() as Building)
        setBuildings(list)
        setLoading(false)
      })
    })()

    return () => unsub?.()
  }, [])

  const addBuilding = useCallback<RescueStore["addBuilding"]>(async (data) => {
    const id = newId()
    const ts = Date.now()
    const building: Building = { ...data, id, victims: [], createdAt: ts, updatedAt: ts }

    if (isFirebaseConfigured && db) {
      const { doc, setDoc } = await import("firebase/firestore")
      await setDoc(doc(db, "buildings", id), building)
    } else {
      setBuildings((prev) => [building, ...prev])
    }
    return id
  }, [])

  const addVictim = useCallback<RescueStore["addVictim"]>(async (buildingId, victim) => {
    const full: Victim = { ...victim, id: newId() }
    if (isFirebaseConfigured && db) {
      const { doc, getDoc, updateDoc } = await import("firebase/firestore")
      const ref = doc(db, "buildings", buildingId)
      const snap = await getDoc(ref)
      const current = (snap.data() as Building | undefined)?.victims ?? []
      await updateDoc(ref, { victims: [...current, full], updatedAt: Date.now() })
    } else {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId ? { ...b, victims: [...b.victims, full], updatedAt: Date.now() } : b,
        ),
      )
    }
  }, [])

  const setVictimStatus = useCallback<RescueStore["setVictimStatus"]>(
    async (buildingId, victimId, status) => {
      if (isFirebaseConfigured && db) {
        const { doc, getDoc, updateDoc } = await import("firebase/firestore")
        const ref = doc(db, "buildings", buildingId)
        const snap = await getDoc(ref)
        const current = (snap.data() as Building | undefined)?.victims ?? []
        const updated = current.map((v) => (v.id === victimId ? { ...v, status } : v))
        await updateDoc(ref, { victims: updated, updatedAt: Date.now() })
      } else {
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  victims: b.victims.map((v) => (v.id === victimId ? { ...v, status } : v)),
                  updatedAt: Date.now(),
                }
              : b,
          ),
        )
      }
    },
    [],
  )

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
