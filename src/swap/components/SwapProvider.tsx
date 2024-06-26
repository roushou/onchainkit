import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { buildSwapTransaction } from '../core/buildSwapTransaction';
import { isSwapError } from '../core/isSwapError';
import { useSwapBalances } from './useSwapBalances';
import { getSwapQuote } from '../core/getSwapQuote';
import { formatTokenAmount } from '../../utils/formatTokenAmount';
import type {
  SwapError,
  SwapErrorState,
  BuildSwapTransaction,
  SwapContextType,
} from '../types';
import type { Token } from '../../token';
import type { Address } from 'viem';

function useValue<T>(object: T): T {
  return useMemo(() => object, [object]);
}

const emptyContext = {} as SwapContextType;

export const SwapContext = createContext<SwapContextType>(emptyContext);

export function useSwapContext() {
  const context = useContext(SwapContext);
  if (context === emptyContext) {
    throw new Error('useSwapContext must be used within a Swap component');
  }
  return context;
}

function useFromTo(address: Address) {
  const [fromAmount, setFromAmount] = useState('');
  const [fromToken, setFromToken] = useState<Token>();
  const [toAmount, setToAmount] = useState('');
  const [toToken, setToToken] = useState<Token>();
  const [toLoading, setToLoading] = useState(false);
  const [fromLoading, setFromLoading] = useState(false);

  const {
    fromBalanceString,
    fromTokenBalanceError,

    toBalanceString,
    toTokenBalanceError,
  } = useSwapBalances({ address, fromToken, toToken });

  const from = useValue({
    balance: fromBalanceString,
    amount: fromAmount,
    setAmount: setFromAmount,
    token: fromToken,
    setToken: setFromToken,
    loading: fromLoading,
    setLoading: setFromLoading,
    error: fromTokenBalanceError,
  });

  const to = useValue({
    balance: toBalanceString,
    amount: toAmount,
    setAmount: setToAmount,
    token: toToken,
    setToken: setToToken,
    loading: toLoading,
    setLoading: setToLoading,
    error: toTokenBalanceError,
  });

  return { from, to };
}

export function SwapProvider({
  address,
  children,
}: {
  children: React.ReactNode;
  address: Address;
}) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<SwapErrorState>();
  const handleError = useCallback(
    (e: Record<string, SwapError | undefined>) => {
      setError({ ...error, ...e });
    },
    [error],
  );

  const { from, to } = useFromTo(address);

  /* istanbul ignore next */
  const handleToggle = useCallback(() => {
    from.setAmount(to.amount);
    to.setAmount(from.amount);

    from.setToken(to.token);
    to.setToken(from.token);
  }, [from, to]);

  const handleAmountChange = useCallback(
    async (
      type: 'from' | 'to',
      amount: string,
      sToken?: Token,
      dToken?: Token,
    ) => {
      const source = type === 'from' ? from : to;
      const destination = type === 'from' ? to : from;

      source.token = sToken ?? source.token;
      destination.token = dToken ?? destination.token;

      if (source.token === undefined || destination.token === undefined) {
        return;
      }

      if (amount === '' || Number.parseFloat(amount) === 0) {
        return destination.setAmount('');
      }

      /* when toAmount changes we fetch quote for fromAmount
        so set isFromQuoteLoading to true */
      destination.setLoading(true);
      handleError({
        quoteError: undefined,
      });

      try {
        const response = await getSwapQuote({
          from: source.token,
          to: destination.token,
          amount,
          amountReference: 'from',
        });
        /* if request resolves to error response set the quoteError
        property of error state to the SwapError response */
        if (isSwapError(response)) {
          return handleError({ quoteError: response });
        }

        const formattedAmount = formatTokenAmount(
          response.toAmount,
          response?.to?.decimals,
        );

        destination.setAmount(formattedAmount);
      } catch (err) {
        handleError({ quoteError: err as SwapError });
      } finally {
        /* reset loading state when quote request resolves */
        destination.setLoading(false);
      }
    },
    [from, to, handleError],
  );

  const handleSubmit = useCallback(
    async function handleSubmit(
      onSubmit?: (swapTransaction: BuildSwapTransaction) => void,
    ) {
      if (!address || !from.token || !to.token || !from.amount) {
        return;
      }

      setLoading(true);
      handleError({ swapError: undefined });

      try {
        const response = await buildSwapTransaction({
          amount: from.amount,
          fromAddress: address,
          from: from.token,
          to: to.token,
        });

        if (isSwapError(response)) {
          return handleError({ swapError: response });
        }

        onSubmit?.(response);
      } catch (e) {
        handleError({ swapError: e as SwapError });
      } finally {
        setLoading(false);
      }
    },
    [address, handleError, from.amount, from.token, to.token],
  );

  const value = useValue({
    to,
    from,
    error,
    loading,
    handleAmountChange,
    handleToggle,
    handleSubmit,
  });

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
}
