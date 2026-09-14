import {describe, expect, it, jest} from '@jest/globals';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UrlInputBar} from '../components/controls/UrlInputBar';

describe('UrlInputBar', () => {
  it('submits a trimmed url and can clear the field', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<UrlInputBar onSubmit={onSubmit} loading={false} />);

    const input = screen.getByLabelText('YouTube URL');
    await user.type(input, '  https://youtu.be/dQw4w9wgGcQ  ');
    await user.click(screen.getByRole('button', {name: /load/i}));

    expect(onSubmit).toHaveBeenCalledWith('https://youtu.be/dQw4w9wgGcQ');
  });

  it('calls onClear when the reset button is pressed', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(
      <UrlInputBar
        onSubmit={() => {}}
        onClear={onClear}
        loading={false}
        initialValue="https://youtu.be/dQw4w9wgGcQ"
      />,
    );

    await user.click(
      screen.getByRole('button', {name: /clear and reset workspace/i}),
    );
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByLabelText('YouTube URL') as HTMLInputElement).value,
    ).toBe('');
  });
});
