import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render children text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should fire onClick handler on click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not fire onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show "Loading..." text when loading is true', () => {
    render(<Button loading>Click Me</Button>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });

  it('should disable the button when loading is true', () => {
    render(<Button loading>Click Me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render an icon', () => {
    render(
      <Button icon={<span data-testid="test-icon">icon</span>}>
        With Icon
      </Button>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should add w-full class when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>);

    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('should have the correct role of button', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
