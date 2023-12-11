import { readable } from "svelte/store";

export const currentTime = readable(window.moment(), (set) => {
  const interval = setInterval(() => {
    set(window.moment());
  }, 60000);

  return () => {
    clearInterval(interval);
  };
});
