import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import styles from './DateRangePicker.module.css';

const DateRangePicker = ({ onChange, initialStartDate, initialEndDate }) => {
  const [state, setState] = useState([
    {
      startDate: initialStartDate,
      endDate: initialEndDate,
      key: 'selection'
    }
  ]);

  const handleChange = (item) => {
    setState([item.selection]);
    onChange({
      startDate: item.selection.startDate,
      endDate: item.selection.endDate
    });
  };

  return (
    <div className={styles.dateRangeContainer}>
      <DateRange
        editableDateInputs={true}
        onChange={handleChange}
        moveRangeOnFirstSelection={false}
        ranges={state}
        maxDate={new Date()}
        className={styles.dateRange}
      />
    </div>
  );
};

export default DateRangePicker;