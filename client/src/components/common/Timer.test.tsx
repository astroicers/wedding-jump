import { render, screen } from '@testing-library/react';
import { Timer } from './Timer';

describe('Timer', () => {
  it('renders seconds value', () => {
    render(<Timer seconds={25} maxSeconds={30} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders 0 seconds', () => {
    render(<Timer seconds={0} maxSeconds={30} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies green color when seconds > 10', () => {
    const { container } = render(<Timer seconds={15} maxSeconds={30} />);
    const span = container.querySelector('span.font-bold');
    expect(span?.className).toContain('text-primary');
  });

  it('applies yellow color when seconds <= 10 and > 5', () => {
    const { container } = render(<Timer seconds={8} maxSeconds={30} />);
    const span = container.querySelector('span.font-bold');
    expect(span?.className).toContain('text-game-yellow');
  });

  it('applies red color when seconds <= 5', () => {
    const { container } = render(<Timer seconds={3} maxSeconds={30} />);
    const span = container.querySelector('span.font-bold');
    expect(span?.className).toContain('text-game-red');
  });

  it('applies red color at exactly 5 seconds', () => {
    const { container } = render(<Timer seconds={5} maxSeconds={30} />);
    const span = container.querySelector('span.font-bold');
    expect(span?.className).toContain('text-game-red');
  });

  it('applies yellow color at exactly 10 seconds', () => {
    const { container } = render(<Timer seconds={10} maxSeconds={30} />);
    const span = container.querySelector('span.font-bold');
    expect(span?.className).toContain('text-game-yellow');
  });

  it('renders with default md size', () => {
    const { container } = render(<Timer seconds={10} maxSeconds={30} />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('w-16');
    expect(wrapper?.className).toContain('h-16');
  });

  it('renders with lg size', () => {
    const { container } = render(<Timer seconds={10} maxSeconds={30} size="lg" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('w-24');
    expect(wrapper?.className).toContain('h-24');
  });

  it('renders with sm size', () => {
    const { container } = render(<Timer seconds={10} maxSeconds={30} size="sm" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('w-12');
    expect(wrapper?.className).toContain('h-12');
  });

  it('shows label when showLabel is true', () => {
    render(<Timer seconds={10} maxSeconds={30} showLabel />);
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });

  it('hides label by default', () => {
    render(<Timer seconds={10} maxSeconds={30} />);
    expect(screen.queryByText('Seconds')).not.toBeInTheDocument();
  });

  it('handles maxSeconds=0 without errors', () => {
    const { container } = render(<Timer seconds={0} maxSeconds={0} />);
    expect(container.querySelector('span.font-bold')).toBeInTheDocument();
  });
});
