const PATHS = {
  download: 'M12 4.5v10.5M7.5 10.75 12 15.25l4.5-4.5M5 19.5h14',
  folder:
    'M3.75 7.5A1.5 1.5 0 0 1 5.25 6h4.1l2 2.25h7.4a1.5 1.5 0 0 1 1.5 1.5v7.75a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V7.5Z',
  check: 'm5.5 12.5 4.25 4.25L18.5 8',
  alert: 'M12 7.75v5.5M12 16.5v.01M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z',
  close: 'm6.5 6.5 11 11m0-11-11 11',
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
