"use client"

import { useCallback, useEffect, useState } from "react"
import type { AllergenId, DietPreference } from "@/lib/allergens"

export type { DietPreference }

export interface AllergenPreferences {
    allergens: AllergenId[]
    includeProbable: boolean
    notifyAllergens: boolean
    dietPreference: DietPreference
}

const DEFAULTS: AllergenPreferences = {
    allergens: [],
    includeProbable: true,
    notifyAllergens: false,
    dietPreference: "none",
}

/**
 * Modül düzeyinde önbellek.
 *
 * Tercihler yemek detay modalı her açıldığında okunuyor; her açılışta ağa
 * çıkmak gereksiz. Oturum boyunca bir kez çekilir, kaydetme sonrası
 * güncellenir. (Bu, MENÜ İÇERİĞİ cache'i değil — kullanıcının kendi
 * tercihleri; bayatlaması diye bir durum yok, değişimi biz yapıyoruz.)
 */
let cache: AllergenPreferences | null = null
let inflight: Promise<AllergenPreferences> | null = null
const subscribers = new Set<(prefs: AllergenPreferences) => void>()

function publish(prefs: AllergenPreferences) {
    cache = prefs
    subscribers.forEach((notify) => notify(prefs))
}

async function load(): Promise<AllergenPreferences> {
    if (cache) return cache
    if (inflight) return inflight

    inflight = (async () => {
        try {
            const res = await fetch("/api/allergens")
            if (!res.ok) return DEFAULTS
            const data = (await res.json()) as AllergenPreferences
            return {
                allergens: Array.isArray(data.allergens) ? data.allergens : [],
                includeProbable: data.includeProbable ?? DEFAULTS.includeProbable,
                notifyAllergens: data.notifyAllergens ?? DEFAULTS.notifyAllergens,
                dietPreference: data.dietPreference ?? DEFAULTS.dietPreference,
            }
        } catch {
            // Ağ hatasında varsayılana düş: alerjen bilgisi GÖSTERİLMEZ.
            // Yanlış/eksik bir uyarı göstermektense hiç göstermemek doğru.
            return DEFAULTS
        } finally {
            inflight = null
        }
    })()

    const result = await inflight
    publish(result)
    return result
}

/** Kaydedilmiş tercihleri sıfırlar — çıkış yapıldığında çağrılmalı. */
export function resetAllergenPreferencesCache() {
    cache = null
    inflight = null
}

export function useAllergenPreferences() {
    const [preferences, setPreferences] = useState<AllergenPreferences>(
        cache ?? DEFAULTS
    )
    const [isLoading, setIsLoading] = useState(cache === null)

    useEffect(() => {
        let active = true

        subscribers.add(setPreferences)
        load().then(() => {
            if (active) setIsLoading(false)
        })

        return () => {
            active = false
            subscribers.delete(setPreferences)
        }
    }, [])

    /** Kısmi güncelleme; iyimser yazar, hata olursa geri alır. */
    const save = useCallback(
        async (patch: Partial<AllergenPreferences>): Promise<boolean> => {
            const previous = cache ?? DEFAULTS
            publish({ ...previous, ...patch })

            try {
                const res = await fetch("/api/allergens", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                })

                if (!res.ok) {
                    publish(previous)
                    return false
                }

                publish((await res.json()) as AllergenPreferences)
                return true
            } catch {
                publish(previous)
                return false
            }
        },
        []
    )

    return {
        preferences,
        isLoading,
        save,
        /**
         * Alerjen arayüzü yalnızca bunu açan kullanıcıya gösterilir.
         * Seçim yapmamış kullanıcı hiçbir rozet/şerit görmez.
         */
        hasAllergenSelection: preferences.allergens.length > 0,
        /** Beslenme uyarısı alerjenden BAĞIMSIZ açılır */
        hasDietPreference: preferences.dietPreference !== "none",
        /** Alerjen ya da diyet — herhangi bir uyarı arayüzü açık mı? */
        showsWarnings:
            preferences.allergens.length > 0 || preferences.dietPreference !== "none",
    }
}
