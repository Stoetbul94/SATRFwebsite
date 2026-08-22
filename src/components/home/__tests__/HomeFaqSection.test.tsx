import { render, screen } from '../../../__tests__/setup';
import HomeFaqSection from '@/components/home/HomeFaqSection';
import { featuredFaqItems } from '@/data/faq';

describe('Homepage FAQ section', () => {
  it('renders featured questions and the all-FAQ CTA', () => {
    render(<HomeFaqSection />);
    featuredFaqItems().forEach((item) => {
      expect(screen.getByRole('heading', { level: 3, name: item.question })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'View all FAQs' })).toHaveAttribute('href', '/faq');
    expect(
      screen.queryByRole('heading', { name: /Does SATRF govern air rifle/i })
    ).not.toBeInTheDocument();
  });
});
