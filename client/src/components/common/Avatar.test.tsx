import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('should render an img element with correct alt when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" name="Alice" />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Alice');
  });

  it('should render the initial letter when src is not provided', () => {
    render(<Avatar name="Bob" />);

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should render the initial as uppercase first character', () => {
    render(<Avatar name="charlie" />);

    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('should display the name text when showName is true', () => {
    render(<Avatar name="Diana" showName />);

    expect(screen.getByText('Diana')).toBeInTheDocument();
  });

  it('should fire onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Avatar name="Eve" onClick={handleClick} />);

    fireEvent.click(screen.getByText('E'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not have cursor-pointer class when onClick is not provided', () => {
    const { container } = render(<Avatar name="Frank" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('cursor-pointer');
  });
});
