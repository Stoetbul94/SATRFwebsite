import Image from 'next/image';

interface AffiliateLogo {
  name: string;
  imageUrl: string;
  websiteUrl: string;
}

const affiliateLogos: AffiliateLogo[] = [
  {
    name: "Team SA",
    imageUrl: "/images/affiliates/TeamSa.jpg",
    websiteUrl: "https://www.teamsa.co.za/"
  },
  {
    name: "ISSF",
    imageUrl: "/images/affiliates/ISSF-Logo.jpg",
    websiteUrl: "https://www.issf-sports.org/"
  },
  {
    name: "SASSCO",
    imageUrl: "/images/affiliates/SASSCO_Logo.jpeg",
    websiteUrl: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FSouth_African_Shooting_Sport_Confederation&psig=AOvVaw1ws5l-o6n0wGInOyD8nsXx&ust=1749309418708000&source=images&cd=vfe&opi=89978449&ved=0CBQQjhxqFwoTCLj1xciL3Y0DFQAAAAAdAAAAABAE"
  }
];

export default function AffiliateLogos() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Our Affiliates
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Proud to partner with these amazing organizations
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {affiliateLogos.map((affiliate) => (
            <a
              key={affiliate.name}
              href={affiliate.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="relative w-full h-24">
                <Image
                  src={affiliate.imageUrl}
                  alt={affiliate.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
} 