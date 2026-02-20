import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders without label by default', () => {
    const { container } = render(<ProgressBar current={3} total={10} />);
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(screen.queryByText(/Complete/)).not.toBeInTheDocument();
  });

  it('shows label when showLabel is true', () => {
    render(<ProgressBar current={3} total={10} showLabel />);
    expect(screen.getByText('30% Complete')).toBeInTheDocument();
  });

  it('label has text-white/60 class for dark background visibility', () => {
    const { container } = render(<ProgressBar current={5} total={10} showLabel />);
    const label = container.querySelector('span');
    expect(label?.className).toContain('text-white/60');
  });

  it('calculates percentage correctly', () => {
    render(<ProgressBar current={5} total={10} showLabel />);
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('caps percentage at 100%', () => {
    render(<ProgressBar current={15} total={10} showLabel />);
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });

  it('handles total=0 gracefully', () => {
    render(<ProgressBar current={0} total={0} showLabel />);
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
  });

  it('renders with correct width style', () => {
    const { container } = render(<ProgressBar current={3} total={10} />);
    const bar = container.querySelector('[style]');
    expect(bar?.getAttribute('style')).toContain('width: 30%');
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar current={3} total={10} className="bg-white/10" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('bg-white/10');
  });

  it('renders different sizes', () => {
    const { container: sm } = render(<ProgressBar current={3} total={10} size="sm" />);
    const { container: lg } = render(<ProgressBar current={3} total={10} size="lg" />);
    expect(sm.querySelector('.h-1')).toBeInTheDocument();
    expect(lg.querySelector('.h-3')).toBeInTheDocument();
  });
});
