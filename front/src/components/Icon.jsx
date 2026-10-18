// Свой набор: сетка 24×24, stroke 1.5, скругления round. См. DESIGN.md.
const PATHS = {
  download: 'M12 4.5v10.5M7.5 10.75 12 15.25l4.5-4.5M5 19.5h14',
  plus: 'M12 5.5v13M5.5 12h13',
  folder:
    'M3.75 7.5A1.5 1.5 0 0 1 5.25 6h4.1l2 2.25h7.4a1.5 1.5 0 0 1 1.5 1.5v7.75a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V7.5Z',
  check: 'm5.5 12.5 4.25 4.25L18.5 8',
  alert: 'M12 7.75v5.5M12 16.5v.01M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z',
  close: 'm6.5 6.5 11 11m0-11-11 11',
  pause: 'M9 6v12M15 6v12',
  play: 'M8 5.75v12.5L18 12 8 5.75Z',
  retry: 'M19.25 12a7.25 7.25 0 1 1-2.12-5.13M19.25 4.75v4.5h-4.5',
  trash: 'M4.75 7h14.5M9.5 7V4.75h5V7M6.75 7l.75 12.25h9L17.25 7M10.25 10.5v5.5M13.75 10.5v5.5',
  gear:
    'M12 9.25a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5ZM10.4 3.75h3.2l.5 2.35 1.5.86 2.28-.76 1.6 2.77-1.78 1.6v1.72l1.78 1.6-1.6 2.77-2.28-.76-1.5.86-.5 2.35h-3.2l-.5-2.35-1.5-.86-2.28.76-1.6-2.77 1.78-1.6v-1.72L4.52 9.97l1.6-2.77 2.28.76 1.5-.86.5-2.35Z',
};

const Icon = ({ name, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
);

export default Icon;
