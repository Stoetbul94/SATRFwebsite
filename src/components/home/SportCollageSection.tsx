import Image from 'next/image';

export default function SportCollageSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#070d1e]"
      aria-label="SATRF athletes in competition"
    >
      <Image
        src="/images/sport-collage-satrf.png"
        alt="SATRF athletes in 50m prone and 3-position rifle shooting"
        width={1672}
        height={941}
        className="block h-auto w-full"
        sizes="100vw"
        priority={false}
      />
    </section>
  );
}
