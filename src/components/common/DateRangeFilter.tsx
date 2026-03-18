import React from 'react';
import { RangeType } from '../../api/generated/apiClient';
import { FormField, Input, Select } from './Form';

export interface DateRangeValue {
  rangeType: RangeType;
  startDate?: string;
  endDate?: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white rounded-[24px] p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormField label="Range">
        <Select
          value={value.rangeType}
          onChange={(e) => onChange({ ...value, rangeType: e.target.value as RangeType })}
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
              value={value.startDate || ''}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End Date">
            <Input
              type="date"
              value={value.endDate || ''}
              onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              required
            />
          </FormField>
        </>
      )}
    </div>
  );
};
