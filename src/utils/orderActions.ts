import { OrderStatus } from '../repositories/ordersRepository';

export const canMarkAsReady = (status: OrderStatus): boolean => {
  return status === 'Pending';
};

export const canComplete = (status: OrderStatus): boolean => {
  return status === 'ReadyForPickup';
};

export const canMarkAsUnable = (status: OrderStatus): boolean => {
  return status === 'Pending' || status === 'ReadyForPickup';
};

export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'Pending':
      return 'text-amber-600 bg-amber-50';
    case 'ReadyForPickup':
      return 'text-blue-600 bg-blue-50';
    case 'Completed':
      return 'text-emerald-600 bg-emerald-50';
    case 'Cancelled':
      return 'text-red-600 bg-red-50';
    case 'UnableToFulfill':
      return 'text-gray-600 bg-[var(--bg-surface-variant)]';
    default:
      return 'text-gray-600 bg-[var(--bg-surface-variant)]';
  }
};
