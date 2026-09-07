"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useAllergenPreferences } from "@/hooks/use-allergen-preferences"

/**
 * Alerjen tercihi yapmamış kullanıcıyı tercihe yönlendiren dürtme.
 *
 * Neden ayrı bir "reddettim" kaydı tutuyoruz: /api/allergens, alerjeni
 * OLMAYAN kullanıcı ile ayarlara hiç uğramamış kullanıcıyı aynı şekilde (boş
 * liste) döndürüyor. Sunucudaki veriyle bu ikisi ayırt edilemiyor; ayırt
 * edemediğimiz için "alerjim yok" diyen kullanıcıyı sonsuza kadar dürtmemek
 * adına reddi client'ta saklıyoruz.
 *
 * localStorage: oturumsuz kullanıcıda tek seçenek, oturumlu kullanıcıda da
 * sunucuya yazmaya değmeyecek kadar hafif bir tercih. Aynı kalıp menü
 * sayfasındaki "hide-github-notice-until" bandında da kullanılıyor.
 */
const STORAGE_KEY = "allergen-nudge-dismissed-until"
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000

const subscribers = new Set<() => void>()
let snapshot: number | null = null

function readStore(): number {
    try {
        return Number(window.localStorage.getItem(STORAGE_KEY)) || 0
    } catch {
        // Gizli sekme / depolama kapalı: dürtme her oturumda bir kez çıkar.
        return 0
    }
}

function subscribe(onChange: () => void) {
    subscribers.add(onChange)
    return () => {
        subscribers.delete(onChange)
    }
}

function getSnapshot(): number {
    if (snapshot === null) snapshot = readStore()
    return snapshot
}

/**
 * Sunucuda ve hydration render'ında "reddedilmiş" say.
 *
 * localStorage sunucuda okunamaz; buradan 0 dönseydi dürtme ilk boyamada
 * uygun görünür, hydration'dan sonra kaybolurdu. Bir kare bile yanlış yerde
 * CTA göstermektense hiç göstermemek doğru.
 */
function getServerSnapshot(): number {
    return Number.MAX_SAFE_INTEGER
}

export function useAllergenNudge() {
    const { showsWarnings, isLoading } = useAllergenPreferences()
    const dismissedUntil = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    )

    /** Reddi kaydeder ve dürtmeyi kullanan HER yüzeyi anında günceller. */
    const dismiss = useCallback(() => {
        snapshot = Date.now() + DISMISS_MS
        try {
            window.localStorage.setItem(STORAGE_KEY, String(snapshot))
        } catch {
            // Yazılamazsa da bu oturum boyunca kapalı kalır.
        }
        subscribers.forEach((notify) => notify())
    }, [])

    return {
        /**
         * Tercihler yüklendi, kullanıcının ne alerjen ne beslenme tercihi var
         * ve dürtmeyi daha önce reddetmemiş → dürtme gösterilebilir.
         */
        isEligible: !isLoading && !showsWarnings && dismissedUntil <= Date.now(),
        dismiss,
    }
}
