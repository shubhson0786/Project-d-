import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Funds from './Funds';
import api from '../api';

jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

let balance;
beforeEach(() => {
  balance = 0;
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'test-request-12345' } });
  api.get.mockImplementation(() => Promise.resolve({ data: { balance, realizedProfit: 0, paymentMode: 'razorpay_test', transactions: [] } }));
  api.post.mockImplementation((path, body) => {
    if (path === '/api/funds') {
      balance += body.amount;
      return Promise.resolve({ data: { balance, realizedProfit: 0, paymentMode: 'razorpay_test', transactions: [] } });
    }
    return Promise.resolve({ data: { reconciled: 0 } });
  });
});
afterEach(() => cleanup());

test('demo QR does not create a Razorpay order or credit funds', async () => {
  await act(async () => { render(<Funds />); });
  fireEvent.click(await screen.findByRole('button', { name: /add funds/i }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '250' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Show demo QR' }));

  expect(within(dialog).getByText('Demo QR — not payable')).toBeInTheDocument();
  expect(within(dialog).getByTitle('Stashflow demo QR, not a payment request')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Add virtual funds' })).toBeInTheDocument();
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/razorpay-reconcile'));
  expect(api.post).not.toHaveBeenCalledWith('/api/razorpay-order', expect.anything());
  expect(screen.getAllByText('₹0.00').length).toBeGreaterThan(0);
});

test('confirming the demo QR adds virtual funds without a Razorpay order', async () => {
  await act(async () => { render(<Funds />); });
  fireEvent.click(await screen.findByRole('button', { name: /add funds/i }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '250' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Show demo QR' }));
  await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'Add virtual funds' })); });

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/funds', {
    type: 'ADD', amount: 250, requestId: 'test-request-12345', method: 'DEMO_QR',
  }));
  await waitFor(() => expect(screen.getByText('Demo deposit of ₹250.00 completed.')).toBeInTheDocument());
  expect(api.post).not.toHaveBeenCalledWith('/api/razorpay-order', expect.anything());
});
