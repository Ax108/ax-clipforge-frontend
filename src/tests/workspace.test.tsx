import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DirectUrlCard} from '../components/controls/DirectUrlCard';
import {FormatSelector} from '../components/controls/FormatSelector';
import {ModeToggle} from '../components/controls/ModeToggle';
import {readUrlParams} from '../hooks/useUrlSync';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('FormatSelector', () => {
  it('exposes video quality and audio format chips', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormatSelector format="mp4" quality="1080p" onChange={onChange} />);
    expect(screen.getByText('MP4 1080p')).toBeTruthy();
    expect(screen.getByText('MP3')).toBeTruthy();
    await user.click(screen.getByText('MP4 720p'));
    expect(onChange).toHaveBeenCalledWith('mp4', '720p');
    await user.click(screen.getByText('FLAC'));
    expect(onChange).toHaveBeenCalledWith('flac', 'best');
  });
});

describe('ModeToggle', () => {
  it('switches between full video and precision clip', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ModeToggle value="clip" onChange={onChange} />);
    expect(screen.getByText('Precision Clip')).toBeTruthy();
    expect(screen.getByRole('radio', {name: /precision clip/i})).toBeTruthy();
    await user.click(screen.getByRole('radio', {name: /full video/i}));
    expect(onChange).toHaveBeenCalledWith('full');
  });
});

describe('DirectUrlCard', () => {
  it('renders the backend download endpoint', () => {
    render(
      <DirectUrlCard
        downloadUrl="http://localhost:5000/api/v1/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9wgGcQ&format=mp4&quality=1080p"
        shareUrl="http://localhost:3000/?v=dQw4w9wgGcQ&start=0&end=30&format=mp4"
        onCopy={() => {}}
      />,
    );
    expect(screen.getByDisplayValue(/\/api\/v1\/download/)).toBeTruthy();
    expect(screen.getByLabelText('Open Direct download API')).toBeTruthy();
  });
});

describe('readUrlParams', () => {
  it('hydrates workspace query keys', () => {
    window.history.replaceState(
      {},
      '',
      '/?v=dQw4w9wgGcQ&start=4&end=20&format=mp3&quality=320kbps&mode=clip&view=focus',
    );
    expect(readUrlParams()).toEqual({
      v: 'dQw4w9wgGcQ',
      start: 4,
      end: 20,
      format: 'mp3',
      quality: '320kbps',
      mode: 'clip',
      view: 'focus',
    });
  });
});
