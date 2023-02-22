import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import { CCol } from '@coreui/react';
import CIcon from '@coreui/icons-react';

import LineChart from '../LineChart/LineChart';
import ResetZoomButton from '../reusable/ResetZoomButton';
import ReusableDropdown from '../reusable/ReusableDropdown';
import ReusableDatePicker from '../reusable/ReusableDatepicker';
import ThemeButton from '../reusable/themes/styledComponents/ThemeButton';

import Constants from '../../util/constants';
import { setStoredChartDate } from '../../util/cookies';
import useAnalyticsEventTracker from '../../util/hooks/useAnalyticsEventTracker';

import { setChartsEndDate, setChartsStartDate } from '../../store/reducers/measurements';
import { selectCurrentOrganizationId } from '../../store/reducers/currentUser';

import { getChartDataSets, updateChartData } from './utils';
import { getFilteredDevices } from '../../util/dashboardUtils';
import { DEFAULT_CHART_STATS, translationNamespaces } from './utils/constants';

import { ChartCard, ChartHeader, BtnWrapper } from './DeviceChart.styles';

function DeviceChart({
  chartStat,
  availableStatOptions,
  toggleModal,
  chartInterval,
  chartNumber,
  setChartFetching,
  currentStat,
  isChartFetching,
  oneChartData,
}) {
  const { t } = useTranslation(translationNamespaces);
  const dispatch = useDispatch();
  const [sensitivity, setSensitivity] = useState(1);
  const [isDevicesInOneColumn, setIsDevicesInOneColumn] = useState(null);
  const colorsByDeviceIds = useSelector((state) => state.devices.coloursByDeviceIds);
  const chartsStartDate = useSelector((state) => state.measurements.chartsStartDate);
  const chartsEndDate = useSelector((state) => state.measurements.chartsEndDate);
  const breakpoint = useSelector((state) => state.view.breakpoint);
  const devices = useSelector((state) => state.devices.devices);
  const selectedLocation = useSelector((state) => state.locations.selectedLocation);
  const selectedFloor = useSelector((state) => state.floors.selectedFloor);
  const selectedStatus = useSelector((state) => state.devices.selectedStatus);
  const currentOrganizationId = useSelector(selectCurrentOrganizationId);
  const chartsData = useSelector((state) => state.measurements.chartsData);
  const chartsFetching = useSelector((state) => state.measurements.chartsFetching);
  const userUnits = useSelector((state) => state.currentUser.units);
  const trackGAEvent = useAnalyticsEventTracker('Dashboard');
  const storedStats = JSON.parse(localStorage.getItem('storedExploredStats'));

  const datasets = useMemo(
    () => getChartDataSets(oneChartData, colorsByDeviceIds, devices),
    [oneChartData, colorsByDeviceIds, devices]
  );

  const actualFilteredDevices = useMemo(
    () => getFilteredDevices(selectedFloor, selectedLocation, selectedStatus, devices),
    [selectedFloor, selectedLocation, selectedStatus, devices]
  );

  const currentUnit = useMemo(() => {
    if (Constants.alwaysAvailableStatOptions.includes(currentStat)) {
      return '';
    }
    const { unit } = Constants.measurements.find((m) => m.code === currentStat);
    return unit[userUnits] || unit;
  }, [userUnits, currentStat]);

  const shouldDisplayHint =
    actualFilteredDevices.length >= 1 && Array.from(colorsByDeviceIds.keys()).length === 0;
  const accuracy = Constants.measurements.filter((el) => el.code === chartStat)[0]?.accuracy;

  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 768) {
        setIsDevicesInOneColumn(true);
      } else {
        setIsDevicesInOneColumn(false);
      }
    };
    window.addEventListener('resize', checkScreen);
    return () => {
      window.removeEventListener('resize', checkScreen);
    };
  }, []);

  const dropdownCls = classNames({
    'my-2 ml-2 p-0 simple-flex': true,
    'mr-2': !chartNumber,
    'ss-flex': isDevicesInOneColumn,
  });
  const datePickerCls = classNames({
    'mr-0 ml-2 my-2 p-0 simple-flex': true,
    'ss-flex': isDevicesInOneColumn,
  });

  const optionNamingRule = ({ display, code }) => display || t(`measurements:${code}`);
  const cutSelectedLabelTo =
    breakpoint === 'full' || isDevicesInOneColumn ? 20 : breakpoint === 'large' ? 10 : 6;
  const disabledDropdown = chartsFetching || availableStatOptions.length <= chartNumber;
  const handleSelect = (item) => {
    if (!!Array.from(colorsByDeviceIds.keys()).length) {
      const config = {
        stat: item.code,
        chartNumber,
        coloursByDeviceIds: colorsByDeviceIds,
        chartsStartDate,
        chartsEndDate,
        dispatch,
        currentOrganizationId,
        chartsData,
        setChartFetching,
      };
      updateChartData(config);
    }
    const stats = storedStats || DEFAULT_CHART_STATS;
    stats.splice(chartNumber, 1, item.code);
    localStorage.setItem('storedExploredStats', JSON.stringify(stats));
    trackGAEvent('chart_' + chartNumber);
  };

  return (
    <ChartCard>
      <ChartHeader>
        <CCol style={{ display: 'flex' }}>
          <h2>{t('dashboard:history')}</h2>
        </CCol>
        <CCol sm={4} className={dropdownCls}>
          <ReusableDropdown
            optionNamingRule={optionNamingRule}
            dataArray={availableStatOptions}
            cutSelectedLabelTo={cutSelectedLabelTo}
            updOnDataArrayChange="ifNotInOptions"
            maxDropdownHeight={180}
            withSearch
            keyField="code"
            disabled={disabledDropdown}
            filterDefaultSelected={({ code }) => code === currentStat}
            onSelect={handleSelect}
          />
          {!!datasets.length && isDevicesInOneColumn && (
            <ResetZoomButton sensitivity={sensitivity} setSensitivity={setSensitivity} />
          )}
        </CCol>
        {!chartNumber && (
          <CCol sm={4} className={datePickerCls}>
            <ReusableDatePicker
              initialStartDate={chartsStartDate}
              disabled={chartsFetching || Array.from(colorsByDeviceIds.keys()).length === 0}
              initialEndDate={chartsEndDate}
              apply={(start, end) => {
                setStoredChartDate(start, end);
                dispatch(setChartsStartDate(start));
                dispatch(setChartsEndDate(end));
              }}
              wrapperStyle={{ width: '100%' }}
            />
            <BtnWrapper>
              <ThemeButton
                onClick={() => {
                  trackGAEvent('chart_export');
                  toggleModal();
                }}
                disabled={chartsFetching || Array.from(colorsByDeviceIds.keys()).length === 0}
              >
                <CIcon name="cil-cloud-download" size="lg" />
              </ThemeButton>
            </BtnWrapper>
          </CCol>
        )}
        {!!datasets.length && !isDevicesInOneColumn && (
          <ResetZoomButton sensitivity={sensitivity} setSensitivity={setSensitivity} />
        )}
      </ChartHeader>
      <LineChart
        isFetching={isChartFetching}
        shouldDisplayHint={shouldDisplayHint}
        hintText={t('dashboard:widgetHelper')}
        datasets={datasets}
        unit={currentUnit}
        interval={chartInterval}
        chartNumber={chartNumber}
        accuracy={accuracy}
        sensitivity={sensitivity}
      />
    </ChartCard>
  );
}

DeviceChart.propTypes = {
  chartStat: PropTypes.string.isRequired,
  availableStatOptions: PropTypes.array,
  toggleModal: PropTypes.func.isRequired,
  chartNumber: PropTypes.number.isRequired,
  availableDevices: PropTypes.array,
  datasets: PropTypes.array.isRequired,
  chartInterval: PropTypes.string.isRequired,
  setChartFetching: PropTypes.func.isRequired,
  currentStat: PropTypes.string.isRequired,
};

export default React.memo(DeviceChart);