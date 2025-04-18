import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { QueryManagerHeader } from './Components/QueryManagerHeader';
import { QueryManagerBody } from './Components/QueryManagerBody';
import { runQuery } from '@/_helpers/appUtils';
import { defaultSources } from './constants';
import {
  useDataSources,
  useGlobalDataSources,
  useLoadingDataSources,
  useSampleDataSource,
} from '@/_stores/dataSourcesStore';
import { useQueryToBeRun, useSelectedQuery, useQueryPanelActions } from '@/_stores/queryPanelStore';
import { CodeHinterContext } from '@/Editor/CodeBuilder/CodeHinterContext';
import { resolveReferences } from '@/_helpers/utils';

const QueryManager = ({ mode, appId, darkMode, apps, allComponents, appDefinition, editorRef }) => {
  const loadingDataSources = useLoadingDataSources();
  const dataSources = useDataSources();
  const sampleDataSource = useSampleDataSource();
  const globalDataSources = useGlobalDataSources();
  const queryToBeRun = useQueryToBeRun();
  const selectedQuery = useSelectedQuery();
  const { setSelectedDataSource, setQueryToBeRun } = useQueryPanelActions();
  const [options, setOptions] = useState({});
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (selectedQuery?.kind == 'runjs' || selectedQuery?.kind == 'runpy' || selectedQuery?.kind == 'workflows') {
      setActiveTab(1);
    }
  }, [selectedQuery?.id]);

  useEffect(() => {
    setOptions(selectedQuery?.options || {});
  }, [selectedQuery?.options]);

  useEffect(() => {
    if (queryToBeRun !== null) {
      runQuery(editorRef, queryToBeRun.id, queryToBeRun.name);
      setQueryToBeRun(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef, queryToBeRun]);

  useEffect(() => {
    if (selectedQuery) {
      const selectedDS = [...dataSources, ...globalDataSources, !!sampleDataSource && sampleDataSource]
        .filter(Boolean)
        .find((datasource) => datasource.id === selectedQuery?.data_source_id);
      //TODO: currently type is not taken into account. May create issues in importing REST apis. to be revamped when import app is revamped
      if (
        selectedQuery?.kind in defaultSources &&
        (!selectedQuery?.data_source_id || ['runjs', 'runpy'].includes(selectedQuery?.data_source_id) || !selectedDS)
      ) {
        return setSelectedDataSource(defaultSources[selectedQuery?.kind]);
      }
      setSelectedDataSource(selectedDS || null);
    } else if (selectedQuery === null) {
      setSelectedDataSource(null);
    }
  }, [selectedQuery, dataSources, globalDataSources, setSelectedDataSource, mode]);

  return (
    <div
      className={cx(`query-manager ${darkMode ? 'theme-dark' : ''}`, {
        'd-none': loadingDataSources,
      })}
    >
      <QueryManagerHeader
        darkMode={darkMode}
        options={options}
        editorRef={editorRef}
        appId={appId}
        setOptions={setOptions}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />
      <CodeHinterContext.Provider
        value={{
          parameters: selectedQuery?.options?.parameters?.reduce(
            (parameters, parameter) => ({
              ...parameters,
              [parameter.name]: resolveReferences(parameter.defaultValue, undefined),
            }),
            {}
          ),
        }}
      >
        <QueryManagerBody
          darkMode={darkMode}
          options={options}
          allComponents={allComponents}
          apps={apps}
          appId={appId}
          appDefinition={appDefinition}
          setOptions={setOptions}
          activeTab={activeTab}
        />
      </CodeHinterContext.Provider>
    </div>
  );
};

export default QueryManager;
