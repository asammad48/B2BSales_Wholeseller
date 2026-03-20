import { RangeType } from '../api/generated/apiClient';

export interface DateRangeState {
  rangeType: RangeType;
  startDate: string;
  endDate: string;
}

export const defaultDateRangeState: DateRangeState = {
  rangeType: 'Day',
  startDate: '',
  endDate: '',
};

export const toDateRangeParams = (state: DateRangeState) => ({
  rangeType: state.rangeType,
  startDate: state.rangeType === 'Custom' && state.startDate ? new Date(state.startDate) : undefined,
  endDate: state.rangeType === 'Custom' && state.endDate ? new Date(state.endDate) : undefined,
});
