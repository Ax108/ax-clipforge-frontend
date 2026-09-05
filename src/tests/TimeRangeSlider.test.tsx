import {describe, expect, it, jest} from '@jest/globals';
import {fireEvent, render, screen} from '@testing-library/react';
import {useState} from 'react';
import {TimeInputs} from '../components/controls/TimeInputs';
import {TimeRangeSlider} from '../components/controls/TimeRangeSlider';

function RangeHarness() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  return (
    <>
      <TimeRangeSlider
        duration={180}
        start={start}
        end={end}
        onChange={(s, e) => {
          setStart(s);
          setEnd(e);
        }}
      />
      <TimeInputs
        duration={180}
        start={start}
        end={end}
        onChange={(s, e) => {
          setStart(s);
          setEnd(e);
        }}
      />
      <p>clip:{end - start}</p>
    </>
  );
}

describe('trim range', () => {
  it('moves the start handle independently of the end handle', () => {
    const onChange = jest.fn();
    render(
      <TimeRangeSlider duration={180} start={0} end={30} onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole('slider', {name: 'Clip start'}), {
      target: {value: '12'},
    });
    expect(onChange).toHaveBeenCalledWith(12, 30);
  });

  it('keeps numeric inputs and clip length in sync with the slider', () => {
    render(<RangeHarness />);
    fireEvent.change(screen.getByRole('slider', {name: 'Clip start'}), {
      target: {value: '8'},
    });
    expect(
      (screen.getByLabelText('Clip start time') as HTMLInputElement).value,
    ).toBe('00:08');
    expect(screen.getByText('clip:22')).toBeTruthy();

    fireEvent.change(screen.getByRole('slider', {name: 'Clip end'}), {
      target: {value: '40'},
    });
    expect(
      (screen.getByLabelText('Clip end time') as HTMLInputElement).value,
    ).toBe('00:40');
    expect(screen.getByText('clip:32')).toBeTruthy();
  });

  it('writes typed start/end times back onto the slider', () => {
    render(<RangeHarness />);
    const startInput = screen.getByLabelText(
      'Clip start time',
    ) as HTMLInputElement;
    fireEvent.change(startInput, {target: {value: '00:10'}});
    fireEvent.blur(startInput);
    expect(
      (screen.getByRole('slider', {name: 'Clip start'}) as HTMLInputElement)
        .value,
    ).toBe('10');
    expect(screen.getByText('clip:20')).toBeTruthy();
  });

  it('keeps a one-second gap so start cannot reach end', () => {
    const onChange = jest.fn();
    render(
      <TimeRangeSlider duration={180} start={0} end={30} onChange={onChange} />,
    );
    fireEvent.change(screen.getByRole('slider', {name: 'Clip start'}), {
      target: {value: '30'},
    });
    expect(onChange).toHaveBeenCalledWith(29, 30);
  });
});
