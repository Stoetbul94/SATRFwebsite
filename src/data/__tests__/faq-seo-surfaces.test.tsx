import fs from 'fs';
import path from 'path';
import { render, screen } from '../../__tests__/setup';
import Footer from '@/components/layout/Footer';

describe('FAQ SEO surfaces', () => {
  it('includes production /faq in the sitemap with no satrf.org.za or vercel.app loc URLs', () => {
    const xml = fs.readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8');
    expect(xml).toContain('<loc>https://www.rifleshooting.co.za/faq</loc>');
    expect(xml).not.toContain('satrf.org.za');
    expect(xml).not.toContain('vercel.app');
  });

  it('includes FAQ in footer Quick Links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });
});
