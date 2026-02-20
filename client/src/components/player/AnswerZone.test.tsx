import { render, screen, fireEvent } from '@testing-library/react';
import { AnswerZone } from './AnswerZone';

describe('AnswerZone', () => {
  it('should render the label text', () => {
    render(<AnswerZone zone="O" label="Yes" />);

    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should render the zone letter', () => {
    render(<AnswerZone zone="O" label="Yes" />);

    expect(screen.getByText('O')).toBeInTheDocument();
  });

  it('should fire onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<AnswerZone zone="X" label="No" onClick={handleClick} />);

    fireEvent.click(screen.getByText('No'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show check_circle icon when isRevealed and isCorrect are true', () => {
    render(<AnswerZone zone="O" label="Yes" isRevealed isCorrect />);

    expect(screen.getByText('check_circle')).toBeInTheDocument();
  });

  it('should display the player count number when playerCount is provided', () => {
    render(<AnswerZone zone="A" label="Answer A" playerCount={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not show check_circle icon when isRevealed is false', () => {
    render(<AnswerZone zone="O" label="Yes" isCorrect />);

    expect(screen.queryByText('check_circle')).not.toBeInTheDocument();
  });
});
