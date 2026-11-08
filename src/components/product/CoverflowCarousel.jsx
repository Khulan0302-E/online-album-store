/**
 * Coverflow Carousel — пянзны хавтсыг 3D налуу эгнээгээр харуулах carousel.
 * Эх сурвалж: 21st.dev дээрх "Coverflow Carousel" компонент (багшийн зөвшөөрлөөр ашиглав).
 * Өөрчлөлт: TypeScript → JavaScript, lucide-react → react-icons, shadcn cn() хассан,
 * Хөвөөгийн өнгө, зураггүй хавтасны орлуулга, голын хавтсан дээр дарахад onActivate нэмсэн.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function CoverflowCarousel({
  slides,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  cardWidth = 'clamp(160px, 24vw, 300px)',
  gap = 0.05,
  loop = true,
  showNavigation = true,
  label = 'Пянзны цуглуулга',
  onSelect,
  onActivate,
}) {
  const count = slides.length

  const frameRef = useRef(null)
  const cardRefs = useRef([])
  const posRef = useRef(0)
  const targetRef = useRef(0)
  const widthRef = useRef(0)
  const rafRef = useRef(null)
  const dragRef = useRef(null)

  const [selected, setSelected] = useState(0)

  useEffect(() => {
    onSelect?.(selected)
  }, [selected, onSelect])

  const indexAt = useCallback((pos) => ((Math.round(pos) % count) + count) % count, [count])

  // Фрэйм бүрийг React state-ээр биш, шууд DOM-д бичнэ.
  const paint = useCallback(() => {
    const width = widthRef.current
    if (!width) return
    const pitch = width * (1 + gap)
    const pos = posRef.current

    cardRefs.current.forEach((card, index) => {
      if (!card) return

      // Цагираг шиг эргэлдэхийн тулд зайг богино тал руу нь нугална.
      let offset = index - pos
      if (loop) {
        offset = ((offset % count) + count) % count
        if (offset > count / 2) offset -= count
      }

      const distance = Math.abs(offset)
      const ramp = Math.pow(distance, falloff)
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset)

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`

      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge)
      card.style.zIndex = String(100 - Math.round(distance))
    })
  }, [count, depth, fade, falloff, gap, loop, rotate])

  const settle = useCallback(
    (target) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      targetRef.current = target
      setSelected(indexAt(target))

      const step = () => {
        const remaining = target - posRef.current
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target
          paint()
          rafRef.current = null
          return
        }
        posRef.current += remaining * 0.16
        paint()
        rafRef.current = requestAnimationFrame(step)
      }
      rafRef.current = requestAnimationFrame(step)
    },
    [indexAt, paint],
  )

  const clamp = useCallback((pos) => (loop ? pos : Math.max(0, Math.min(count - 1, pos))), [count, loop])

  const goTo = useCallback(
    (index) => {
      const target = loop ? index + Math.round((targetRef.current - index) / count) * count : index
      settle(clamp(target))
    },
    [clamp, count, loop, settle],
  )

  const nudge = useCallback((by) => settle(clamp(Math.round(targetRef.current) + by)), [clamp, settle])

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const card = event.target.closest('[data-index]')
    event.currentTarget.setPointerCapture(event.pointerId)
    targetRef.current = posRef.current
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      startX: event.clientX,
      pos: posRef.current,
      v: 0,
      t: performance.now(),
      card: card ? Number(card.dataset.index) : null,
    }
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return

    const pitch = widthRef.current * (1 + gap)
    if (!pitch) return

    const now = performance.now()
    const previous = posRef.current
    posRef.current = clamp(drag.pos - (event.clientX - drag.x) / pitch)
    drag.v = ((posRef.current - previous) / Math.max(now - drag.t, 1)) * 1000
    drag.t = now

    const index = indexAt(posRef.current)
    if (index !== selected) setSelected(index)
    paint()
  }

  const endDrag = (event) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null

    // Бараг хөдлөөгүй бол энэ нь товшилт.
    if (event.type === 'pointerup' && Math.abs(event.clientX - drag.startX) < 6 && drag.card !== null) {
      if (drag.card === indexAt(targetRef.current)) {
        settle(Math.round(posRef.current))
        onActivate?.(drag.card)
      } else {
        goTo(drag.card)
      }
      return
    }

    const carried = Math.max(-2, Math.min(2, drag.v * 0.18))
    settle(clamp(Math.round(posRef.current + carried)))
  }

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const measure = () => {
      const card = cardRefs.current[0]
      if (!card) return
      widthRef.current = card.offsetWidth
      paint()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [paint])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  return (
    <div className="w-full" style={{ '--cf-card': cardWidth }} role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="relative">
        <div
          ref={frameRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              nudge(-1)
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              nudge(1)
            } else if (event.key === 'Enter') {
              onActivate?.(selected)
            }
          }}
          className="cursor-grab overflow-hidden py-12 outline-none focus-visible:ring-2 focus-visible:ring-soft/50 active:cursor-grabbing"
          style={{ perspective: `calc(var(--cf-card) * ${perspective})`, touchAction: 'pan-y' }}
        >
          <div className="relative select-none" style={{ height: 'var(--cf-card)', transformStyle: 'preserve-3d' }}>
            {slides.map((slide, index) => (
              <div
                key={slide.id ?? index}
                data-index={index}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${count}: ${slide.alt}`}
                className="absolute left-1/2 top-0 aspect-square overflow-hidden rounded-2xl bg-elevated shadow-[0_30px_50px_-20px_rgba(15,20,32,0.45)] ring-1 ring-black/5 will-change-transform"
                style={{ width: 'var(--cf-card)' }}
              >
                {slide.src ? (
                  <img src={slide.src} alt={slide.alt} draggable={false} className="h-full w-full select-none object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand to-[#0f1f38] p-6 text-center">
                    <img src="/khuvuu-mark.svg" alt="" draggable={false} className="w-1/3 opacity-60" />
                    <span className="font-display text-sm font-bold uppercase tracking-wider text-white/90">{slide.alt}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showNavigation && count > 1 && (
          <>
            <button
              type="button"
              aria-label="Өмнөх"
              onClick={() => nudge(-1)}
              className="absolute left-2 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-line bg-white/85 p-2.5 text-cream backdrop-blur transition hover:border-soft hover:text-soft sm:left-4"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Дараах"
              onClick={() => nudge(1)}
              className="absolute right-2 top-1/2 z-[200] -translate-y-1/2 rounded-full border border-line bg-white/85 p-2.5 text-cream backdrop-blur transition hover:border-soft hover:text-soft sm:right-4"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
