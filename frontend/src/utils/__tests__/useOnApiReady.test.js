import { render } from "@testing-library/react";
import { useOnApiReady } from "../useOnApiReady";
import { API_READY_EVENT } from "../constants";

function Probe({ onReady }) {
  useOnApiReady(onReady);
  return null;
}

describe("useOnApiReady", () => {
  test("runs the callback when the API announces it is ready", () => {
    const onReady = jest.fn();
    render(<Probe onReady={onReady} />);
    expect(onReady).not.toHaveBeenCalled();
    window.dispatchEvent(new Event(API_READY_EVENT));
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  test("uses the latest callback, not the one from the first render", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<Probe onReady={first} />);
    rerender(<Probe onReady={second} />);
    window.dispatchEvent(new Event(API_READY_EVENT));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("stops listening after unmount", () => {
    const onReady = jest.fn();
    const { unmount } = render(<Probe onReady={onReady} />);
    unmount();
    window.dispatchEvent(new Event(API_READY_EVENT));
    expect(onReady).not.toHaveBeenCalled();
  });
});
