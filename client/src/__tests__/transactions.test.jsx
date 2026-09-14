import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TransactionsPage from '../pages/TransactionsPage.jsx';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-redux', () => ({ useSelector: () => 'INR' }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/api.js', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/accounts') return Promise.resolve({ data: { data: [{ _id: 'a1', name: 'Cash' }] } });
      if (url === '/categories') return Promise.resolve({ data: { data: [{ _id: 'c1', name: 'Food', type: 'Expense' }] } });
      if (url === '/transactions') return Promise.resolve({ data: { data: { items: [{ _id: 't1', amount: 450, type: 'Expense', note: 'Lunch with team', date: '2026-09-14', category: { _id: 'c1', name: 'Food' }, account: { _id: 'a1', name: 'Cash' } }], pagination: { page: 1, pages: 1, total: 1, hasNextPage: false, hasPrevPage: false } } } });
      return Promise.resolve({ data: { data: [] } });
    }),
    post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  },
}));

describe('TransactionsPage', () => {
  it('loads and renders transaction data from the API', async () => {
    render(<MemoryRouter><TransactionsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByText(/Lunch with team/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Food/i).length).toBeGreaterThan(0);
  });

  it('renders filter controls and CSV export', async () => {
    render(<MemoryRouter><TransactionsPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/Search note/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
  });
});
