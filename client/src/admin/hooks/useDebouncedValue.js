import { useEffect, useState } from "react";

/*
 * Search boxes in the admin panels feed the API, so the value is debounced
 * before it is used as a request key. Keeps typing smooth without adding a
 * "Search" button to every toolbar.
 */
export default function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
