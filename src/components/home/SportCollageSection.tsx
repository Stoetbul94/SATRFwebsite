import Image from 'next/image';

export default function SportCollageSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#070d1e]"
      aria-label="SATRF athletes in competition"
    >
      <Image
        src="/images/sport-collage-satrf.webp"
        alt="SATRF athletes in 50m prone and 3-position rifle shooting"
        width={1600}
        height={900}
        className="block h-auto w-full"
        sizes="(max-width: 768px) 100vw, 1200px"
        loading="lazy"
      />
    </section>
  );
}
