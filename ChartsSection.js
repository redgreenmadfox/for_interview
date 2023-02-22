import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentOrganizationId } from '../../../../store/reducers/currentUser';
import { setChartsEndDate, setChartsStartDate } from '../../../../store/reducers/measurements';
import { getStoredPeriod } from '../../../../util/cookies';
import { getAvaliableStat, getChartsDataArray } from '../helpers/chartsFeatures';
import 'react-datepicker/dist/react-datepicker.css';
import DeviceChart from '../../../DeviceChart/DeviceChart';

const ChartsSection = ({ availableStatOptions, toggleModal, setChartFetching, fetchingState }) => {
  const dispatch = useDispatch();
  const chartsData = useSelector((state) => state.measurements.chartsData);
  const currentOrganizationId = useSelector(selectCurrentOrganizationId);
  const coloursByDeviceIds = useSelector((state) => state.devices.coloursByDeviceIds);
  const storedPeriod = getStoredPeriod();
  const chartsStartDate = useSelector((state) => state.measurements.chartsStartDate);
  const chartsEndDate = useSelector((state) => state.measurements.chartsEndDate);

  useEffect(() => {
    if (!!storedPeriod) {
      dispatch(setChartsStartDate(storedPeriod?.[0]));
      dispatch(setChartsEndDate(storedPeriod?.[1]));
    }
  }, []);

  useEffect(() => {
    const getChartsDataConfig = {
      dispatch,
      coloursByDeviceIds,
      chartsStartDate,
      chartsEndDate,
      currentOrganizationId,
      setChartFetching,
    };
    getChartsDataArray(getChartsDataConfig);
  }, [currentOrganizationId, coloursByDeviceIds, chartsStartDate, chartsEndDate]);

  return (
    <>
      {chartsData?.map((oneChartData, chartNumber) => {
        const currentStat = getAvaliableStat(oneChartData.stat, chartNumber, availableStatOptions);
        const stat = oneChartData.stat;
        const interval = oneChartData.interval;
        const isChartFetching = fetchingState.charts[chartNumber];

        return (
          <DeviceChart
            key={chartNumber}
            chartNumber={chartNumber}
            toggleModal={toggleModal}
            chartInterval={interval}
            chartStat={stat}
            availableStatOptions={availableStatOptions}
            setChartFetching={setChartFetching}
            currentStat={currentStat}
            isChartFetching={isChartFetching}
            oneChartData={oneChartData}
          />
        );
      })}
    </>
  );
};

export default React.memo(ChartsSection);