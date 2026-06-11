import Image from 'next/image';

export default function SportCollageSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#070d1e] py-16 sm:py-20 md:py-24"
      aria-label="SATRF athletes in competition"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(201,154,59,0.06),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl p-[1px] bg-gradient-to-br from-satrf-gold/25 via-white/5 to-satrf-gold/10 shadow-[0_0_48px_rgba(201,154,59,0.12),0_0_96px_rgba(10,26,47,0.8),0_24px_64px_rgba(0,0,0,0.45)]">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl ring-1 ring-white/10">
            <div className="relative aspect-[21/9] w-full sm:aspect-[2.4/1]">
              <Image
                src="/images/sport-collage-satrf.png"
                alt="SATRF athletes in 50m prone and 3-position rifle shooting"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
