import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../components/TransactionForm.jsx';

const accounts = [{ _id: 'a1', name: 'Cash' }];
const categories = [
  { _id: 'e1', name: 'Food', type: 'Expense' },
  { _id: 'i1', name: 'Salary', type: 'Income' },
];

describe('TransactionForm', () => {
  it('renders transaction fields', () => {
    render(<TransactionForm accounts={accounts} categories={categories} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
  });

  it('rejects zero amount', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TransactionForm accounts={accounts} categories={categories} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/amount/i), '0');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(await screen.findByText(/greater than zero/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('switches category choices by type', async () => {
    const user = userEvent.setup();
    render(<TransactionForm accounts={accounts} categories={categories} onSubmit={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/type/i), 'Income');
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Food' })).not.toBeInTheDocument();
  });
});
