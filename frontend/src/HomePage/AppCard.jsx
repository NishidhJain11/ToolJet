import React, { useState, useCallback, useEffect } from 'react';
import cx from 'classnames';
import { AppMenu } from './AppMenu';
import moment from 'moment';
import { ToolTip } from '@/_components/index';
import useHover from '@/_hooks/useHover';
import configs from './Configs/AppIcon.json';
import { Link, useNavigate } from 'react-router-dom';
import urlJoin from 'url-join';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import BulkIcon from '@/_ui/Icon/BulkIcons';

import { getPrivateRoute, getSubpath } from '@/_helpers/routes';
import { validateName, decodeEntities } from '@/_helpers/utils';
const { defaultIcon } = configs;

export default function AppCard({
  app,
  canCreateApp,
  canDeleteApp,
  deleteApp,
  exportApp,
  appActionModal,
  canUpdateApp,
  currentFolder,
  appType,
}) {
  const canUpdate = canUpdateApp(app);
  const [hoverRef, isHovered] = useHover();
  const [focused, setFocused] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onMenuToggle = useCallback(
    (status) => {
      setMenuOpen(!!status);
      !status && !isHovered && setFocused(false);
    },
    [isHovered]
  );

  const appActionModalCallBack = useCallback(
    (action) => {
      appActionModal(app, currentFolder, action);
    },
    [app, appActionModal, currentFolder]
  );

  const isValidSlug = (slug) => {
    const validate = validateName(slug, 'slug', true, false, false, false);
    return validate.status;
  };

  useEffect(() => {
    !isMenuOpen && setFocused(!!isHovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const updated_at = app?.editing_version?.updated_at || app?.updated_at;
  const updated = moment(updated_at).fromNow(true);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  let AppIcon;
  try {
    AppIcon = <BulkIcon fill={'#3E63DD'} name={app?.icon || defaultIcon} />;
  } catch (e) {
    console.error('App icon not found', app.icon);
  }

  const LaunchButton =
    appType === 'workflow' ? (
      <div>
        <ToolTip
          message={t(
            'homePage.appCard.launchingWorkflowNotAvailable',
            'Launching workflows is not currently available'
          )}
        >
          <button
            type="button"
            className={cx(`launch-button tj-text-xsm tj-disabled-btn`)}
            disabled
            data-cy="launch-button"
          >
            <SolidIcon name="rightarrrow" width="14" fill="#4C5155" />
            {t('homePage.appCard.launch', 'Launch')}
          </button>
        </ToolTip>
      </div>
    ) : (
      <div>
        <ToolTip
          message={
            app?.current_version_id === null
              ? t('homePage.appCard.noDeployedVersion', 'App does not have a deployed version')
              : t('homePage.appCard.openInAppViewer', 'Open in app viewer')
          }
        >
          <button
            type="button"
            className={cx(
              ` launch-button tj-text-xsm ${
                app?.current_version_id === null || app?.is_maintenance_on ? 'tj-disabled-btn ' : 'tj-tertiary-btn'
              }`
            )}
            onClick={() => {
              if (app?.current_version_id) {
                window.open(
                  urlJoin(window.public_config?.TOOLJET_HOST, getSubpath() ?? '', `/applications/${app.slug}`)
                );
              } else {
                navigate(app?.current_version_id ? `/applications/${app.slug}` : '');
              }
            }}
            data-cy="launch-button"
          >
            <SolidIcon
              name="rightarrrow"
              width="14"
              fill={
                app?.current_version_id === null || app?.is_maintenance_on
                  ? '#4C5155'
                  : darkMode
                  ? '#FDFDFE'
                  : '#11181C'
              }
            />

            {app?.is_maintenance_on
              ? t('homePage.appCard.maintenance', 'Maintenance')
              : t('homePage.appCard.launch', 'Launch')}
          </button>
        </ToolTip>
      </div>
    );

  return (
    <div className="card homepage-app-card">
      <div key={app?.id} ref={hoverRef} data-cy={`${app?.name.toLowerCase().replace(/\s+/g, '-')}-card`}>
        <div className="row home-app-card-header">
          <div className="col-12 d-flex justify-content-between">
            <div>
              <div className="app-icon-main">
                <div className="app-icon d-flex" data-cy={`app-card-${app?.icon}-icon`}>
                  {AppIcon && AppIcon}
                </div>
              </div>
            </div>
            <div visible={focused ? true : undefined}>
              {(canCreateApp(app) || canDeleteApp(app) || canUpdateApp(app)) && (
                <AppMenu
                  onMenuOpen={onMenuToggle}
                  openAppActionModal={appActionModalCallBack}
                  canCreateApp={canCreateApp()}
                  canDeleteApp={canDeleteApp(app)}
                  canUpdateApp={canUpdateApp(app)}
                  deleteApp={() => deleteApp(app)}
                  exportApp={() => exportApp(app)}
                  isMenuOpen={isMenuOpen}
                  darkMode={darkMode}
                  currentFolder={currentFolder}
                  appType={appType}
                  appCreationMode={app?.creation_mode || app?.creationMode}
                />
              )}
            </div>
          </div>
        </div>
        <div>
          <ToolTip trigger={['hover']} message={app.name}>
            <h3
              className="app-card-name font-weight-500 tj-text-md"
              data-cy={`${app.name.toLowerCase().replace(/\s+/g, '-')}-title`}
            >
              {decodeEntities(app.name)}
            </h3>
          </ToolTip>
        </div>
        <div className="app-creation-time-container" style={{ marginBottom: '12px' }}>
          {canUpdate && (
            <div className="app-creation-time tj-text-xsm" data-cy="app-creation-details">
              <ToolTip message={app.created_at && moment(app.created_at).format('dddd, MMMM Do YYYY, h:mm:ss a')}>
                <span>{updated === 'just now' ? `Edited ${updated}` : `Edited ${updated} ago`}</span>
              </ToolTip>
            </div>
          )}
        </div>
        <div className="appcard-buttons-wrap">
          {canUpdate && (
            <div>
              <ToolTip message={`Open in ${appType !== 'workflow' ? 'app builder' : 'workflow editor'}`}>
                <Link
                  to={getPrivateRoute('editor', {
                    slug: isValidSlug(app.slug) ? app.slug : app.id,
                  })}
                  reloadDocument
                >
                  <button
                    type="button"
                    className="tj-primary-btn tj-text-xsm edit-button"
                    style={{ color: darkMode ? '#11181C' : '#FDFDFE' }}
                    data-cy="edit-button"
                  >
                    <SolidIcon name="editrectangle" width="14" fill={darkMode ? '#11181C' : '#FDFDFE'} />
                    &nbsp;{t('globals.edit', 'Edit')}
                  </button>
                </Link>
              </ToolTip>
            </div>
          )}
          {LaunchButton}
        </div>
      </div>
    </div>
  );
}
