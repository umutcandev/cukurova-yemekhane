"use client"

import { useState, useRef, useEffect } from "react"
import { Info, Database, Palette, ExternalLink, ArrowUp, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

function MagicIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.0007 1.20825 18.3195 3.68108 20.7923 4.99992 18.3195 6.31876 17.0007 8.79159 15.6818 6.31876 13.209 4.99992 15.6818 3.68108 17.0007 1.20825ZM8.00065 4.33325 10.6673 9.33325 15.6673 11.9999 10.6673 14.6666 8.00065 19.6666 5.33398 14.6666.333984 11.9999 5.33398 9.33325 8.00065 4.33325ZM19.6673 16.3333 18.0007 13.2083 16.334 16.3333 13.209 17.9999 16.334 19.6666 18.0007 22.7916 19.6673 19.6666 22.7923 17.9999 19.6673 16.3333Z"></path>
        </svg>
    )
}

export function InfoDialog() {
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const scrollAreaRef = useRef<HTMLElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setShowScrollTop(false)
            return
        }

        // Wait for the dialog content to be mounted
        const timeoutId = setTimeout(() => {
            if (!containerRef.current) return

            const viewport = containerRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
            if (!viewport) return

            scrollAreaRef.current = viewport

            const handleScroll = () => {
                setShowScrollTop(viewport.scrollTop > 50)
            }

            viewport.addEventListener('scroll', handleScroll)

            // Store cleanup function
            const cleanup = () => viewport.removeEventListener('scroll', handleScroll)
            containerRef.current.setAttribute('data-cleanup-attached', 'true')

                // Attach cleanup to containerRef for later access
                ; (containerRef.current as HTMLDivElement & { cleanup?: () => void }).cleanup = cleanup
        }, 100)

        return () => {
            clearTimeout(timeoutId)
            if (containerRef.current) {
                const container = containerRef.current as HTMLDivElement & { cleanup?: () => void }
                container.cleanup?.()
            }
        }
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-border/40"
                    aria-label="Uygulama hakkında bilgi"
                >
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[360px] sm:max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/40">
                    <DialogTitle className="text-base font-semibold">Uygulama Hakkında</DialogTitle>
                    <DialogDescription className="text-xs">
                        Çukurova Üniversitesi Yemekhane uygulamasının nasıl çalıştığını öğrenin.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative" ref={containerRef}>
                    <ScrollArea className="max-h-[60vh] [&>[data-slot=scroll-area-viewport]]:max-h-[60vh]">
                        <div className="px-4 py-3 space-y-3">
                            {/* Proje Hakkında */}
                            <section className="rounded-lg bg-muted/30 border border-border/40 p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                        <Info className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium mb-1">Yemekhane Uygulaması</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                            Bu uygulama, Çukurova Üniversitesi öğrencilerinin yemekhane menüsüne kolayca erişebilmesi için gönüllü olarak geliştirilen {" "}
                                            <a
                                                href="https://github.com/umutcandev/cukurova-yemekhane"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                                            >
                                                açık kaynaklı
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            {" "} bir projedir.
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-[18px] font-normal">Next.js</Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-[18px] font-normal">TypeScript</Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-[18px] font-normal">shadcn/ui</Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-[18px] font-normal">cheerio</Badge>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-[18px] font-normal">iconv-lite</Badge>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Veri Kaynağı */}
                            <section className="rounded-lg bg-muted/30 border border-border/40 p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                        <Database className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium mb-1">Veri Kaynağı</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Menü verileri günlük olarak{" "}
                                            <a
                                                href="https://yemekhane.cu.edu.tr"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                                            >
                                                yemekhane.cu.edu.tr
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            {" "}üzerinden alınmaktadır. Veriler düzenli olarak güncellense de, yemekhane yönetiminin yaptığı anlık değişiklikler nedeniyle uygulamadaki bilgiler ile sunulan menü arasında nadiren farklılıklar olabilir.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Kalori Bilgileri */}
                            <section className="rounded-lg bg-muted/30 border border-border/40 p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                        <Palette className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium mb-1.5">Kalori Bilgileri</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                                            Günlük toplam kalori değerlerine göre menüler renklendirilir.
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                                            <Badge className="border border-green-500/60 text-green-700 dark:text-green-400 bg-green-500/10 text-[10px] px-1.5 h-[18px]">
                                                800 kcal
                                            </Badge>
                                            <Badge className="border border-amber-500/60 text-amber-700 dark:text-amber-400 bg-amber-500/10 text-[10px] px-1.5 h-[18px]">
                                                800-1100 kcal
                                            </Badge>
                                            <Badge className="border border-red-500/60 text-red-700 dark:text-red-400 bg-red-500/10 text-[10px] px-1.5 h-[18px]">
                                                1100 kcal
                                            </Badge>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/40 rounded-md px-2.5 py-2">
                                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                                            <span>Yetişkinler için günlük önerilen kalori alımı ortalama 2000-2500 kcal&apos;dir.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Beğen/Beğenme */}
                            <section className="rounded-lg bg-muted/30 border border-border/40 p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                        <ThumbsUp className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium mb-1">Beğen/Beğenme</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                                            Günlük menüler için beğen veya beğenme tepkisi verebilirsiniz. Diğer kullanıcıların tepkilerini de canlı olarak görebilirsiniz.
                                        </p>
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="p-1 rounded bg-green-500/10 border border-green-500/30">
                                                    <ThumbsUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-xs text-muted-foreground">Beğen</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="p-1 rounded bg-red-500/10 border border-red-500/30">
                                                    <ThumbsDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                                </div>
                                                <span className="text-xs text-muted-foreground">Beğenme</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/40 rounded-md px-2.5 py-2">
                                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                                            <span>Her menü için sadece bir tepki verebilirsiniz. Tepkinizi değiştirmek isterseniz diğer butona tıklayabilirsiniz.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Yapay Zekâya Sor */}
                            <section className="rounded-lg bg-muted/30 border border-border/40 p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/15 to-purple-500/15 shrink-0">
                                        <MagicIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                                            Yapay Zekâya Sor
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 font-normal">AI</Badge>
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                                            Menü verilerini AI modellerine göndererek menü hakkında yorumlar alın.
                                        </p>

                                        {/* AI Perspektifleri */}
                                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                                            <Badge className="border border-green-500/60 text-green-700 dark:text-green-400 bg-green-500/10 text-[10px] px-1.5 h-[18px]">
                                                Diyetisyen
                                            </Badge>
                                            <Badge className="border border-blue-500/60 text-blue-700 dark:text-blue-400 bg-blue-500/10 text-[10px] px-1.5 h-[18px]">
                                                Sporcu
                                            </Badge>
                                            <Badge className="border border-purple-500/60 text-purple-700 dark:text-purple-400 bg-purple-500/10 text-[10px] px-1.5 h-[18px]">
                                                Öğrenci
                                            </Badge>
                                        </div>

                                        {/* Nasıl Çalışır */}
                                        <div className="rounded-md bg-background/60 border border-border/30 p-2.5 mb-2.5">
                                            <h4 className="text-xs font-medium mb-1.5 text-foreground/80">Kullanım:</h4>
                                            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside marker:text-muted-foreground/50">
                                                <li>Kart altındaki <span className="text-primary font-medium">&quot;Yapay Zekâya Sor&quot;</span> butonuna tıklayın.</li>
                                                <li>AI modelinizi seçin (ChatGPT, Claude, Grok, Perplexity)</li>
                                                <li>Menü otomatik olarak AI&apos;ya gönderilir.</li>
                                            </ol>
                                        </div>

                                        {/* Bilgi Notu */}
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 border border-border/40 rounded-md px-2.5 py-2">
                                            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/70" />
                                            <span>AI yanıtları bu uygulamadan bağımsız, yapay zeka modellerinin yanıtlarıdır.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Alt boşluk - gradient için */}
                            <div className="h-8" />
                        </div>
                    </ScrollArea>

                    {/* Alt gradient overlay */}
                    <AnimatePresence>
                        {showScrollTop && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none rounded-b-lg"
                            />
                        )}
                    </AnimatePresence>

                    {/* Scroll to top butonu */}
                    <AnimatePresence>
                        {showScrollTop && (
                            <motion.button
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border border-border/40 bg-background/90 backdrop-blur-sm hover:bg-muted text-xs font-medium transition-colors"
                                onClick={() => {
                                    scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                aria-label="Yukarı kaydır"
                            >
                                <ArrowUp className="h-3 w-3" />
                                <span>Yukarı Kaydır</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    )
}
