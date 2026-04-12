import React from 'react';
import { FormField, Input, Select } from './Form';
import { DateRangeState } from '../../utils/dateRange';

interface DateRangeFilterProps {
  value: DateRangeState;
  onChange: (value: DateRangeState) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="bg-[var(--bg-surface)] p-4 rounded-[24px] border border-[var(--border-subtle)] mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Range">
          <Select
            value={value.rangeType}
            onChange={(e) => onChange({ ...value, rangeType: e.target.value as DateRangeState['rangeType'] })}
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Custom">Custom</option>
          </Select>
        </FormField>

        {value.rangeType === 'Custom' && (
          <>
            <FormField label="Start Date">
              <Input
                type="date"
                value={value.startDate}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              />
            </FormField>
          </>
        )}
      </div>
    </div>
  );
};
