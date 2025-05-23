import React, { useEffect, useState } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import _, { set } from 'lodash';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';

export function AddNewRowComponent({
  hideAddNewRowPopup,
  tableType,
  darkMode,
  mergeToAddNewRowsDetails,
  component,
  setExposedVariables,
  allColumns,
  defaultColumn,
  columns,
  addNewRowsDetails,
  utilityForNestedNewRow,
  tableEvents,
}) {
  const onEvent = useStore((state) => state.eventsSlice.onEvent);

  const getNewRowObject = () => {
    return allColumns.reduce((accumulator, column) => {
      const key = column.key ?? column.exportValue;
      if (column.id !== 'selection') accumulator[key] = '';
      return accumulator;
    }, {});
  };
  const newRow = getNewRowObject();
  const { newRowsChangeSet } = addNewRowsDetails;
  const rowsFromPrevOperationPresent = _.isEmpty(addNewRowsDetails.newRowsDataUpdates) ? false : true;
  const previousRowsData = rowsFromPrevOperationPresent
    ? Object.keys(addNewRowsDetails.newRowsDataUpdates).reduce((accumulator, row) => {
        accumulator[row] = addNewRowsDetails.newRowsDataUpdates[row];
        return accumulator;
      }, [])
    : null;
  const [newRowsState, setNewRowsState] = useState(rowsFromPrevOperationPresent ? previousRowsData : [newRow]);
  const newRowData = useTable(
    {
      columns,
      data: newRowsState,
      defaultColumn,
    },
    useBlockLayout
  );
  useEffect(() => {
    if (!rowsFromPrevOperationPresent) {
      const newRowDataUpdates = newRowsState.reduce((accumulator, row, index) => {
        const nestedData = utilityForNestedNewRow(row);
        accumulator[index] = nestedData;
        return accumulator;
      }, {});
      setExposedVariables({ newRows: newRowsState });
      mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = newRowData;

  return (
    <div className={`table-add-new-row card ${darkMode && 'dark-theme'}`}>
      <div className="card-header row">
        <div className="col">
          <h4 data-cy={`header-filters`} className="font-weight-500 tj-text-lg">
            Add new rows
          </h4>
        </div>
        <div className="col-auto">
          <button data-cy={`button-close-filters`} onClick={hideAddNewRowPopup} className="btn btn-light btn-sm">
            x
          </button>
        </div>
      </div>
      <div className="table-responsive jet-data-table">
        <table
          {...getTableProps()}
          className={`table table-vcenter table-nowrap ${tableType} ${darkMode && 'dark-theme table-dark'}`}
        >
          <thead>
            {headerGroups.map((headerGroup, index) => {
              return (
                <tr className="tr" key={index} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => {
                    return (
                      <th key={index} {...column.getHeaderProps()} className="th">
                        <div className="d-flex custom-gap-4 align-items-center thead-editable-icon-header-text-wrapper">
                          <div>
                            <SolidIcon
                              name="editable"
                              width="16px"
                              height="16px"
                              fill={darkMode ? '#4C5155' : '#C1C8CD'}
                              vievBox="0 0 16 16"
                            />
                          </div>
                          <div className="tj-text-xsm header-text">{column.render('Header')}</div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, index) => {
              prepareRow(row);
              return (
                <tr key={index} className="table-row" {...row.getRowProps()}>
                  {row.cells.map((cell, index) => {
                    let cellProps = cell.getCellProps();
                    const isEditable = true;
                    return (
                      <td
                        key={index}
                        {...cellProps}
                        style={{ ...cellProps.style, backgroundColor: 'inherit' }}
                        className={cx(`table-text-align-${cell.column.horizontalAlignment}  td`, {
                          'has-actions': cell.column.id === 'rightActions' || cell.column.id === 'leftActions',
                          'has-left-actions': cell.column.id === 'leftActions',
                          'has-right-actions': cell.column.id === 'rightActions',
                          'has-text': cell.column.columnType === 'text' || isEditable,
                          'has-dropdown': cell.column.columnType === 'dropdown',
                          'has-multiselect': cell.column.columnType === 'multiselect',
                          'has-datepicker': cell.column.columnType === 'datepicker',
                          'align-items-center flex-column': cell.column.columnType === 'selector',
                          // [cellSize]: true,
                          'selector-column': cell.column.columnType === 'selector' && cell.column.id === 'selection',
                          'has-select': ['select', 'newMultiSelect'].includes(cell.column.columnType),
                          isEditable: isEditable,
                        })}
                      >
                        <div
                          className={`td-container ${cell.column.columnType === 'image' && 'jet-table-image-column'} ${
                            cell.column.columnType !== 'image' && 'w-100 h-100'
                          }`}
                        >
                          {cell.render('Cell', { cell, isEditable, newRowsChangeSet })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          className="btn btn-light btn-sm m-2"
          onClick={() => {
            const rowData = deepClone(newRowsState);
            const index = rowData.length;
            let newRow = getNewRowObject();
            newRow = utilityForNestedNewRow(newRow);
            rowData.push(newRow);
            let newRowDataUpdates = addNewRowsDetails.newRowsDataUpdates;
            newRowDataUpdates[index] = newRow;
            let newRowAddedExposedVar = Object.keys(newRowDataUpdates).reduce((accumulator, row) => {
              accumulator.push(newRowDataUpdates[row]);
              return accumulator;
            }, []);
            setExposedVariables({ newRows: newRowAddedExposedVar });
            mergeToAddNewRowsDetails({ newRowsDataUpdates: newRowDataUpdates });
            setNewRowsState(rowData);
          }}
          data-tooltip-id="tooltip-for-add-new-row"
          data-tooltip-content="Add another row"
        >
          +
        </button>
        <Tooltip id="tooltip-for-add-new-row" className="tooltip" />
      </div>
      <div className="card-footer d-flex custom-gap-4">
        <ButtonSolid
          variant="primary"
          className={`tj-text-xsm`}
          onClick={async () => {
            await onEvent('onNewRowsAdded', tableEvents, { component });
            mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
            setNewRowsState([]);
          }}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
        >
          <span>Save</span>
        </ButtonSolid>
        <ButtonSolid
          variant="tertiary"
          className={`tj-text-xsm`}
          onClick={() => {
            setExposedVariables({ newRows: [] });
            mergeToAddNewRowsDetails({ newRowsDataUpdates: {}, newRowsChangeSet: {}, addingNewRows: false });
            setNewRowsState([]);
          }}
          size="sm"
          customStyles={{ padding: '10px 20px' }}
        >
          <span>Discard</span>
        </ButtonSolid>
      </div>
    </div>
  );
}
