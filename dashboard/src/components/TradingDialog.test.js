import React from 'react';
import { render, screen, fireEvent, waitFor, within, act, cleanup } from '@testing-library/react';
import { GeneralContextProvider } from './GeneralContext';
import WatchList from './WatchList';
import api from '../api';
jest.mock('./DoughnoutChart', () => ({ DoughnutChart: () => null }));
jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
let balance;
let holdings;
beforeEach(() => {
  jest.useFakeTimers();
  balance = 10000; holdings = [];
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'test-request-12345' } });
  api.get.mockImplementation(path => Promise.resolve({ data: path === '/api/quotes' ? { quotes: [{ name: 'WIPRO', price: 577, percent: '0%', isDown: false }] } : path === '/api/funds' ? { balance } : holdings }));
  api.post.mockReset(); api.post.mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); jest.useRealTimers(); });
async function open(side) {
  await act(async () => { render(<GeneralContextProvider><WatchList /></GeneralContextProvider>); });
  const trigger = await screen.findByRole('button', { name: `${side} WIPRO` });
  await act(async () => { fireEvent.click(trigger); });
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByText(/Available cash:.*10,000|Available cash:.*0.00/);
  return { dialog, button: within(dialog).getByRole('button', { name: `${side} WIPRO` }) };
}
test('funded watchlist buy opens and submits the selected stock', async () => {
  const { button } = await open('Buy');
  await waitFor(() => expect(button.disabled).toBe(false));
  await act(async () => { fireEvent.click(button); });
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/orders', { name: 'WIPRO', qty: 1, mode: 'BUY', orderType: 'MARKET', requestId: 'test-request-12345' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
test('a funded account can sell shares it owns', async () => {
  holdings = [{ name: 'WIPRO', qty: 2 }];
  const { button } = await open('Sell');
  await waitFor(() => expect(button.disabled).toBe(false));
});
test('buy remains blocked without funds', async () => {
  balance = 0;
  const { dialog, button } = await open('Buy');
  await within(dialog).findByText('Add funds to buy this quantity.');
  expect(button.disabled).toBe(true);
});
test('sell remains blocked without owned shares', async () => {
  const { dialog, button } = await open('Sell');
  await within(dialog).findByText('You cannot sell more shares than you own.');
  expect(button.disabled).toBe(true);
});
