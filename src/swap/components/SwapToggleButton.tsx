import { cn, pressable } from '../../styles/theme';
import type { SwapToggleButtonReact } from '../types';
import { useSwapContext } from './SwapProvider';

const toggleIcon = (
  <svg
    role="img"
    aria-label="ock-toggle-icon"
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    data-testid="SwapIcon"
  >
    <g clipPath="url(#clip0_2077_4627)">
      <path
        d="M14.5659 4.93434L13.4345 6.06571L11.8002 4.43139L11.8002 10.75L10.2002 10.75L10.2002 4.43139L8.56592 6.06571L7.43455 4.93434L11.0002 1.36865L14.5659 4.93434ZM8.56592 12.0657L5.00023 15.6314L1.43455 12.0657L2.56592 10.9343L4.20023 12.5687L4.20023 6.25002L5.80023 6.25002L5.80023 12.5687L7.43455 10.9343L8.56592 12.0657Z"
        fill="#0A0B0D"
      />
    </g>
    <defs>
      <clipPath id="clip0_2077_4627">
        <rect
          width="16"
          height="16"
          fill="white"
          transform="translate(0 0.5)"
        />
      </clipPath>
    </defs>
  </svg>
);

export function SwapToggleButton({ className }: SwapToggleButtonReact) {
  const { handleToggle } = useSwapContext();

  return (
    <button
      type="button"
      className={cn(
        pressable.alternate,
        '-translate-x-2/4 -translate-y-2/4 absolute top-2/4 left-2/4',
        'flex h-12 w-12 items-center justify-center',
        'rounded-lg border-4 border-gray-100 border-solid',
        className,
      )}
      data-testid="SwapTokensButton"
      onClick={handleToggle}
    >
      {toggleIcon}
    </button>
  );
}
