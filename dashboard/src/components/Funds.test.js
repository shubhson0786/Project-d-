import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Funds from './Funds';
import api from '../api';

jest.mock('../api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => {
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'test-request-12345' } });
  api.get.mockResolvedValue({ data: { balance: 0, realizedProfit: 0, paymentMode: 'razorpay_test', transactions: [] } });
  api.post.mockResolvedValue({ data: { reconciled: 0 } });
});

test('demo QR does not create a Razorpay order or credit funds', async () => {
  await act(async () => { render(<Funds />); });
  fireEvent.click(await screen.findByRole('button', { name: /add funds/i }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '250' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Show demo QR' }));

  expect(within(dialog).getByText('Demo QR — not payable')).toBeInTheDocument();
  expect(within(dialog).getByTitle('Stashflow demo QR, not a payment request')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Continue to Razorpay Test' })).toBeInTheDocument();
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/razorpay-reconcile'));
  expect(api.post).not.toHaveBeenCalledWith('/api/razorpay-order', expect.anything());
  expect(screen.getAllByText('₹0.00').length).toBeGreaterThan(0);
});
