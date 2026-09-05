import {describe, expect, it} from '@jest/globals';
import {render, screen} from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('shows the splash empty state before a video is loaded', () => {
    window.history.replaceState({}, '', '/');
    render(<App />);
    expect(screen.getByText('ClipForge')).toBeTruthy();
    expect(screen.getByText('No video loaded')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('Paste a YouTube link or video ID…'),
    ).toBeTruthy();
  });
});
