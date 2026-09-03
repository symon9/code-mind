import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App component', () => {
  it('renders without crashing and displays the CodeMind header and layout', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(screen.getAllByText(/CodeMind/i).length).toBeGreaterThan(0);
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });
});
