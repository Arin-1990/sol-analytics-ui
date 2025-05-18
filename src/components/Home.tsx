import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Image,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

interface TokenMarketData {
  token_address: string;
  symbol: string;
  name: string;
  image: string;
  price_usd: number;
  market_cap: number;
  price_change_24h: number;
  volume_24h: number;
}

const Home: React.FC = () => {
  const [tokens, setTokens] = useState<TokenMarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'JPY' | 'CNY'>('USD');
  const tableRef = useRef<HTMLDivElement>(null);
  const { authState, login } = useAuth();
  const { t } = useTranslation();

  const currencies = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'JPY (¥)', value: 'JPY' },
    { label: 'CNY (¥)', value: 'CNY' },
  ];

  const fetchTokens = useCallback(
    async (offset: number = 0) => {
      if (loading && offset > 0) return;
      try {
        setLoading(true);
        const response = await axios.post(
          `${API_BASE_URL}/api/tokens/market-list/`,
          {
            offset,
            limit: 10,
            vs_currency: currency,
          },
        );
        const newTokens: TokenMarketData[] = response.data.tokens || [];
        console.log('API Response:', response.data);
        console.log('New Tokens:', newTokens);
        if (newTokens.length === 0) {
          setHasMore(false);
        } else {
          setTokens((prev) => {
            const updated = offset === 0 ? newTokens : [...prev, ...newTokens];
            console.log('Updated Tokens:', updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    },
    [loading, currency],
  );

  useEffect(() => {
    setHasMore(true);
    fetchTokens(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const bottomDist = scrollHeight - scrollTop - clientHeight;
      if (bottomDist < 100 && !loading && hasMore) {
        fetchTokens(tokens.length);
      }
    },
    [loading, hasMore, tokens.length, fetchTokens],
  );

  const formatPrice = (price: number) => {
    if (isNaN(price)) return '-';
    switch (currency) {
      case 'USD':
        return `$${price.toFixed(2)}`;
      case 'JPY':
        return `¥${price.toFixed(0)}`;
      case 'CNY':
        return `¥${price.toFixed(2)}`;
      default:
        return price.toString();
    }
  };

  return (
    <div className="space-y-6">
      {!authState.isAuthenticated && (
        <Card className="bg-gradient-to-r from-primary-900/20 to-secondary-900/20">
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Welcome to Sol Analytics</h2>
                <p className="text-default-500">
                  Login to manage your tokens and track your portfolio
                </p>
              </div>
              <Button
                color="primary"
                onPress={login}
                className="bg-gradient-to-tr from-primary-500 to-secondary-500"
              >
                Login with Google
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('home.title')}</h1>
          <Select
            size="sm"
            label={t('home.currency')}
            selectedKeys={[currency]}
            onChange={(e) => setCurrency(e.target.value as any)}
          >
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </Select>
        </CardHeader>
        <CardBody>
          <div
            ref={tableRef}
            className="relative"
            onScroll={handleScroll}
            style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
          >
            <Table aria-label="Market tokens">
              <TableHeader>
                <TableColumn>TOKEN</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>24H CHANGE</TableColumn>
                <TableColumn>MARKET CAP</TableColumn>
                <TableColumn>VOLUME</TableColumn>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.token_address}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image
                          src={token.image}
                          alt={token.name}
                          className="w-6 h-6"
                        />
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-small text-default-500">
                            {token.symbol.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(token.price_usd)}</TableCell>
                    <TableCell>
                      <Chip
                        variant="flat"
                        color={
                          token.price_change_24h >= 0 ? 'success' : 'danger'
                        }
                      >
                        {token.price_change_24h.toFixed(2)}%
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {formatPrice(token.market_cap / 1e6)}M
                    </TableCell>
                    <TableCell>
                      {formatPrice(token.volume_24h / 1e6)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {loading && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
            {!hasMore && (
              <div className="text-center py-4 text-default-500">
                No more tokens
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Home;
