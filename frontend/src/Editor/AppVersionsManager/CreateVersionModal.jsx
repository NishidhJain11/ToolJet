import React, { useEffect, useState } from 'react';
import { appVersionService, authenticationService, gitSyncService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { Alert } from '@/_ui/Alert';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { useEditorState } from '@/_stores/editorStore';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';

export const CreateVersion = ({
  appId,
  setAppDefinitionFromVersion,
  showCreateAppVersion,
  setShowCreateAppVersion,
}) => {
  const { featureAccess } = useEditorState();
  const { current_organization_id } = authenticationService.currentSessionValue;

  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [fetchingOrgGit, setFetchingOrgGit] = useState(false);
  const [cancommit, setCommitEnabled] = useState(false);
  const [orgGit, setOrgGit] = useState(null);
  const { createNewVersionAction, selectedEnvironment, fetchDevelopmentVersions, developmentVersions } =
    useEnvironmentsAndVersionsStore(
      (state) => ({
        appVersionsLazyLoaded: state.appVersionsLazyLoaded,
        developmentVersions: state.developmentVersions,
        lazyLoadAppVersions: state.actions.lazyLoadAppVersions,
        createNewVersionAction: state.actions.createNewVersionAction,
        selectedEnvironment: state.selectedEnvironment,
        fetchDevelopmentVersions: state.actions.fetchDevelopmentVersions,
      }),
      shallow
    );

  useEffect(() => {
    fetchDevelopmentVersions(appId);
  }, []);

  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (developmentVersions?.length && editingVersion) {
      const selected = developmentVersions.find((version) => version?.id === editingVersion?.id) || null;
      setSelectedVersion(selected);
    }
  }, [developmentVersions]);

  const { t } = useTranslation();

  const { editingVersion } = useAppVersionStore(
    (state) => ({
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  const options = developmentVersions.map((version) => {
    return { label: version.name, value: version };
  });

  const createVersion = () => {
    if (versionName.trim().length > 25) {
      toast.error('Version name should not be longer than 25 characters');
      return;
    }
    if (versionName.trim() == '') {
      toast.error('Version name should not be empty');
      return;
    }

    if (selectedVersion === undefined) {
      toast.error('Please select a version from.');
      return;
    }

    setIsCreatingVersion(true);

    //TODO: pass environmentId to the func
    createNewVersionAction(
      appId,
      versionName,
      selectedVersion.id,
      (newVersion) => {
        toast.success('Version Created');
        setVersionName('');
        setIsCreatingVersion(false);
        setShowCreateAppVersion(false);
        appVersionService
          .getAppVersionData(appId, newVersion.id)
          .then((data) => {
            const developmentEnv = { id: newVersion.current_environment_id, name: 'development' };
            const environmentChanged = selectedEnvironment?.id !== newVersion?.current_environment_id;
            setAppDefinitionFromVersion(data, developmentEnv, environmentChanged);
            if (cancommit) {
              const body = {
                gitAppName: orgGit?.git_app_name,
                versionId: data?.editing_version?.id,
                lastCommitMessage: `Version ${data?.editing_version?.name} created of app ${orgGit?.git_app_name}`,
                gitVersionName: data?.editing_version?.name,
              };
              gitSyncService
                .gitPush(body, orgGit?.id, data?.editing_version?.id)
                .then(() => {
                  toast.success('Changes commited successfully');
                })
                .catch((error) => {
                  toast.error(error?.error, {
                    style: {
                      width: 'auto',
                      maxWidth: '339px',
                    },
                  });
                });
            }
          })
          .catch((error) => {
            toast.error(error);
          });
      },
      (error) => {
        toast.error(error?.error);
        setIsCreatingVersion(false);
      }
    );
  };

  const fetchOrgGit = () => {
    setFetchingOrgGit(true);
    gitSyncService
      .getAppConfig(current_organization_id, editingVersion?.id)
      .then((data) => {
        setOrgGit(data?.app_git);
      })
      .finally(() => {
        setFetchingOrgGit(false);
      });
  };

  const handleCommitEnableChange = (e) => setCommitEnabled(e.target.checked);

  useEffect(() => {
    if (featureAccess?.gitSync) fetchOrgGit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlertDialog
      show={showCreateAppVersion}
      closeModal={() => {
        setVersionName('');
        setShowCreateAppVersion(false);
      }}
      title={t('editor.appVersionManager.createVersion', 'Create new version')}
      customClassName="git-sync-modal"
    >
      {fetchingOrgGit ? (
        <div className="loader-container">
          <div className="primary-spin-loader"></div>
        </div>
      ) : (
        <form
          className="commit-form"
          onSubmit={(e) => {
            e.preventDefault();
            createVersion();
          }}
        >
          <div className="mb-3 pb-2">
            <div className="col">
              <label className="form-label" data-cy="version-name-label">
                {t('editor.appVersionManager.versionName', 'Version Name')}
              </label>
              <input
                type="text"
                onChange={(e) => setVersionName(e.target.value)}
                className="form-control"
                data-cy="version-name-input-field"
                placeholder={t('editor.appVersionManager.enterVersionName', 'Enter version name')}
                disabled={isCreatingVersion}
                value={versionName}
                autoFocus={true}
                minLength="1"
                maxLength="25"
              />
            </div>
          </div>

          <div className="mb-4 pb-2 version-select">
            <label className="form-label" data-cy="create-version-from-label">
              {t('editor.appVersionManager.createVersionFrom', 'Create version from')}
            </label>
            <div className="ts-control" data-cy="create-version-from-input-field">
              <Select
                options={options}
                value={selectedVersion}
                onChange={(version) => {
                  // onSelectVersion(version.id);
                  setSelectedVersion(version);
                }}
                useMenuPortal={false}
                width="100%"
                maxMenuHeight={100}
              />
            </div>
          </div>

          {orgGit?.org_git?.is_enabled && (
            <div className="commit-changes" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
              <div>
                <input
                  className="form-check-input"
                  checked={cancommit}
                  type="checkbox"
                  onChange={handleCommitEnableChange}
                  data-cy="git-commit-input"
                />
              </div>
              <div>
                <div className="tj-text tj-text-xsm" data-cy="commit-changes-label">
                  Commit changes
                </div>
                <div className="tj-text-xxsm" data-cy="commit-helper-text">
                  This will commit the creation of the new version to the git repo
                </div>
              </div>
            </div>
          )}

          <Alert svg="tj-info">
            <div
              className="d-flex align-items-center"
              style={{
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              <div className="" data-cy="workspace-constant-helper-text">
                The new version will be created in development environment
              </div>
            </div>
          </Alert>

          <div className="mb-3">
            <div className="col d-flex justify-content-end">
              <button
                className="btn mx-2"
                data-cy="cancel-button"
                onClick={() => {
                  setVersionName('');
                  setShowCreateAppVersion(false);
                }}
                type="button"
              >
                {t('globals.cancel', 'Cancel')}
              </button>
              <button
                className={`btn btn-primary ${isCreatingVersion ? 'btn-loading' : ''}`}
                data-cy="create-new-version-button"
                type="submit"
              >
                <svg
                  className="icon"
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.34375 4.42643C5.88351 4.42643 5.51042 4.79953 5.51042 5.25977C5.51042 5.72 5.88351 6.0931 6.34375 6.0931C6.80399 6.0931 7.17708 5.72 7.17708 5.25977C7.17708 4.79953 6.80399 4.42643 6.34375 4.42643ZM3.84375 5.25977C3.84375 3.87905 4.96304 2.75977 6.34375 2.75977C7.72446 2.75977 8.84375 3.87905 8.84375 5.25977C8.84375 6.34828 8.14808 7.27431 7.17708 7.61751V12.902C7.88743 13.1531 8.45042 13.7161 8.7015 14.4264H13.0104C13.2314 14.4264 13.4434 14.3386 13.5997 14.1824C13.756 14.0261 13.8438 13.8141 13.8438 13.5931V11.4383L12.7663 12.5157C12.4409 12.8411 11.9133 12.8411 11.5878 12.5157C11.2624 12.1903 11.2624 11.6626 11.5878 11.3372L14.0878 8.83718C14.4133 8.51174 14.9409 8.51174 15.2663 8.83718L17.7663 11.3372C18.0918 11.6626 18.0918 12.1903 17.7663 12.5157C17.4409 12.8411 16.9133 12.8411 16.5878 12.5157L15.5104 11.4383V13.5931C15.5104 14.2561 15.247 14.892 14.7782 15.3609C14.3093 15.8297 13.6735 16.0931 13.0104 16.0931H8.7015C8.3583 17.0641 7.43227 17.7598 6.34375 17.7598C4.96304 17.7598 3.84375 16.6405 3.84375 15.2598C3.84375 14.1712 4.53942 13.2452 5.51042 12.902V7.61751C4.53942 7.27431 3.84375 6.34828 3.84375 5.25977ZM14.6771 4.42643C14.2168 4.42643 13.8438 4.79953 13.8438 5.25977C13.8438 5.72 14.2168 6.0931 14.6771 6.0931C15.1373 6.0931 15.5104 5.72 15.5104 5.25977C15.5104 4.79953 15.1373 4.42643 14.6771 4.42643ZM12.1771 5.25977C12.1771 3.87905 13.2964 2.75977 14.6771 2.75977C16.0578 2.75977 17.1771 3.87905 17.1771 5.25977C17.1771 6.64048 16.0578 7.75977 14.6771 7.75977C13.2964 7.75977 12.1771 6.64048 12.1771 5.25977ZM6.34375 14.4264C5.88351 14.4264 5.51042 14.7995 5.51042 15.2598C5.51042 15.72 5.88351 16.0931 6.34375 16.0931C6.80399 16.0931 7.17708 15.72 7.17708 15.2598C7.17708 14.7995 6.80399 14.4264 6.34375 14.4264Z"
                    fill="#FDFDFE"
                  />
                </svg>

                {t('editor.appVersionManager.createVersion', 'Create Version')}
              </button>
            </div>
          </div>
        </form>
      )}
    </AlertDialog>
  );
};
