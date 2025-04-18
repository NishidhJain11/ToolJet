import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FilterPreview } from '@/_components';
import PropTypes from 'prop-types';
import Select from 'react-select-search';
import '@/_styles/widgets/multi-select.scss';

function MultiSelectUser({
  onSelect,
  onSearch,
  selectedValues = [],
  onReset,
  placeholder = 'Select',
  isLoading,
  className,
  searchLabel,
  options,
  allowCustomRender = true,
}) {
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setOptions] = useState([]);
  const listOfOptions = useRef([]);

  useEffect(() => {
    // setOptions(filterOptions(listOfOptions.current));
    options ? setOptions(filterOptions(options)) : setOptions(filterOptions(listOfOptions.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedValues), listOfOptions.current, options?.length]);

  const searchFunction = useCallback(
    async (query) => {
      setSearchText(query);
      const options = await onSearch(query);
      listOfOptions.current = filterOptions(options);
      return listOfOptions.current;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchText, onSearch, selectedValues]
  );

  function renderCustom(props, option) {
    const valuePresent = selectedValues.some((item) => item.value === option.value);
    return (
      <div className={`item-renderer`}>
        <div>
          <input
            type="checkbox"
            checked={valuePresent}
            onClick={(e) => {
              if (!valuePresent) {
                onSelect([...selectedValues, option]);
              } else {
                onSelect([...selectedValues.filter((item) => item.value !== option.value)]);
              }
            }}
          />
          <div className="d-flex flex-column" style={{ marginLeft: '12px' }}>
            <p style={{ marginBottom: '0px' }}>
              {option?.first_name} {option?.last_name}
            </p>
            <span>{option?.email}</span>
          </div>
        </div>
        <div className="avatar">
          {option?.first_name?.[0]}
          {option?.last_name?.[0]}
        </div>
      </div>
    );
  }

  const filterOptions = useCallback(
    (options) => {
      return options?.filter((data) => !selectedValues.some((selected) => selected.value === data.value));
    },
    [selectedValues]
  );
  return (
    <div className="tj-ms tj-ms-count" style={{ width: '100%', paddingRight: '0px' }}>
      <FilterPreview text={`${selectedValues.length} selected`} onClose={selectedValues.length ? onReset : undefined} />
      <Select
        className={className}
        getOptions={onSearch ? searchFunction : undefined}
        options={filteredOptions}
        closeOnSelect={false}
        search={true}
        multiple
        value={selectedValues}
        onChange={(id, value) => onSelect([...selectedValues, ...value])}
        placeholder={placeholder}
        debounce={onSearch ? 300 : undefined}
        printOptions="on-focus"
        emptyMessage={
          filteredOptions?.length > 0
            ? 'Not Found'
            : searchText
            ? 'Not found'
            : searchLabel
            ? searchLabel
            : 'Please enter some text'
        }
        disabled={isLoading}
        fuzzySearch
        renderOption={allowCustomRender && renderCustom}
        customWrap={true}
      />
    </div>
  );
}

MultiSelectUser.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  onSearch: PropTypes.func,
  selectedValues: PropTypes.array,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  isLoading: PropTypes.bool,
  searchLabel: PropTypes.string,
};

export { MultiSelectUser };
